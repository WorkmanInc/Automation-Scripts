
const dotenv = require("dotenv");
const axios = require('axios');
const sleep = require("util").promisify(setTimeout);
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require('bignumber.js');
const keeper = require("./abis/keeper.json")
const lotteryabi = require("./abis/lottery.json")
const tokenabi = require("./abis/token.json")


const channel = "-1001435750887"
const thread = "106637"
const token = process.env.BOT_TOKEN  // testing

const PRIVATE_KEY='af5b1f35d2ff08ac13746155fc3401aba64d8456a62655fec3d5b8e23a53c6c8'  // FARM

const GLOBAL_CONFIG = {
  CHAIN:[
    {
      NAME: "CIC",
      KEEPER: "0x86D0c640E9B208acB39b04Bf5aAB1C41070632E3",
      RPC: "https://xapi.cicscan.com/",
    },
    {
      NAME: "BSC",
      KEEPER: "0x1Bf307E0E5520eD98274BF9270167DA2acc8f044",
      RPC: "https://bsc-dataseed1.binance.org/"
    }
  ]

};

const sendNotificationToChannel = async (message) => {
  var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&parse_mode=HTML&text=${message}&disable_web_page_preview=true&message_thread_id=${thread}`
  axios.get(url).catch((error) => {
    console.log("Error Sending to Channel")
  }); 
}


// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const getKeeperContract = (index) => {
  const RPC = GLOBAL_CONFIG.CHAIN[index].RPC
  const signer = new Wallet(
    PRIVATE_KEY,
    new JsonRpcProvider(RPC)
  );
  
  let contract = new Contract(
    GLOBAL_CONFIG.CHAIN[index].KEEPER,
    keeper,
    signer
  );
  
  const keeperContract = contract.connect(signer);
  return keeperContract
}

const getLotteryContract = (index, address) => {
  const RPC = GLOBAL_CONFIG.CHAIN[index].RPC
  const signer = new Wallet(
    PRIVATE_KEY,
    new JsonRpcProvider(RPC)
  );
  
  let contract = new Contract(
    address,
    lotteryabi,
    signer
  );
  
  const keeperContract = contract.connect(signer);
  return keeperContract
}

const getTokenContract = (index, address) => {
  const RPC = GLOBAL_CONFIG.CHAIN[index].RPC
  const signer = new Wallet(
    PRIVATE_KEY,
    new JsonRpcProvider(RPC)
  );
  
  let contract = new Contract(
    address,
    tokenabi,
    signer
  );
  
  const keeperContract = contract.connect(signer);
  return keeperContract
}

const checkIfReady = async (index) => {
    const keeperContract = await getKeeperContract(index)
    let l = "0x0"
    let u = false
try {
    const {lottery, upkeepNeeded } = await keeperContract.upKeepDue()
    l = lottery
    u = upkeepNeeded
} catch (err){ 
      console.log("Failed to get UpkeepDue", err)
}
    return { l, u }
}   

const runKeeper = async (index, lottery) => {
  try {
    
    const keeperContract= await getKeeperContract(index)
    
    console.log("performing upkeep")
    try {
      await keeperContract.manualUpkeep()
    }catch{
      console.log("Failed to perform")
      return
    }
    
    await sleep(6000);
    
    const { step } = await keeperContract.lotteries(lottery)
    if(new BigNumber(step.toString()).eq(3)){
      // get Token Name 
      const lotteryContract = await getLotteryContract(index, lottery.toString())
      const token = await lotteryContract.cakeToken()
      const id = await lotteryContract.currentLotteryId()
      const lastID = (id).toString()
      const tokenContract = await getTokenContract(index, token.toString())
      // get tickets sold and winner count
      const lotteryInfo = await lotteryContract.viewLottery(lastID)

      const name = await tokenContract.name()
      const finalNumber = lotteryInfo.finalNumber - 1000000
      const ticketsSold = new BigNumber(lotteryInfo.firstTicketIdNextLottery.toString()).minus(lotteryInfo.firstTicketId.toString()).toString()
      // send msg to bot
      const msg = `<b><u>${name}</u></b> Lottery Drawn!` + "%0A" +
        `%0A<b>1 Matched</b>: ${lotteryInfo.countWinnersPerBracket[0].toString()} Winners` +
        `%0A<b>2 Matched</b>: ${lotteryInfo.countWinnersPerBracket[1].toString()} Winners` +
        `%0A<b>3 Matched</b>: ${lotteryInfo.countWinnersPerBracket[2].toString()} Winners` + 
        `%0A<b>4 Matched</b>: ${lotteryInfo.countWinnersPerBracket[3].toString()} Winners` + 
        `%0A<b>5 Matched</b>: ${lotteryInfo.countWinnersPerBracket[4].toString()} Winners` + 
        `%0A<b>6 Matched</b>: ${lotteryInfo.countWinnersPerBracket[5].toString()} Winners` + 
        "%0A" +
        `%0A<b>Tickets Sold</b>: ${ticketsSold}` +
        `%0A<b>Drawn Numbers</b>: ${finalNumber}`
      sendNotificationToChannel(msg)

    }
  } catch {
    console.log("Error sending info");
  }
}

const start = async () => {
  for(let c=0; c<GLOBAL_CONFIG.CHAIN.length; c++){
    const { l, u } = await checkIfReady(c)
    if(u) {
      console.log(`${GLOBAL_CONFIG.CHAIN[c].NAME} is Ready!`)
      runKeeper(c, l.toString())
    }
   
  }
}


module.exports = {
    start,
}


