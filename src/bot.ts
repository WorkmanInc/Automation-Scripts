
import dotenv from "dotenv";
import util from "util";
import axios from "axios";
const sleep = util.promisify(setTimeout);
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from 'ethers'
import abi from "./abi.json"
import lotteryabi from "./lottery.json"
import tokenabi from "./token.json"
import BigNumber from "bignumber.js"

// import Web3 from "web3";

const token = "6131657839:AAHwkVz6Oy8OJL0sa3KuvERVCZZdRBgbMiY"   // PRODUCTION
// const token = "5721237869:AAE2ChqcZnjo8e18JaL7XmsvrbbSpFh8H04"   // testing
const channel = "-1001435750887"
const thread = "106637"


const PRIVATE_KEY='af5b1f35d2ff08ac13746155fc3401aba64d8456a62655fec3d5b8e23a53c6c8'  // FARM

const GLOBAL_CONFIG = {
  CHECKEVERY: 360000,
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

const sendNotificationToChannel = async (message: string) => {
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
/*
const w = new Web3(CIC_RPC);

w.eth.defaultAccount = w.eth.accounts.privateKeyToAccount(
  PRIVATE_KEY
).address;
*/

const getKeeperContract = (index: number) => {
  const RPC = GLOBAL_CONFIG.CHAIN[index].RPC
  const signer = new Wallet(
    PRIVATE_KEY,
    new JsonRpcProvider(RPC)
  );
  
  let contract = new Contract(
    GLOBAL_CONFIG.CHAIN[index].KEEPER,
    abi,
    signer
  );
  
  const keeperContract = contract.connect(signer);
  return keeperContract
}

const getLotteryContract = (index: number, address: string) => {
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

const getTokenContract = (index: number, address: string) => {
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

const checkIfReady = async (index: number) => {
    const keeperContract = await getKeeperContract(index)

    const {lottery, upkeepNeeded } = await keeperContract.upKeepDue();
    return { lottery, upkeepNeeded }
}   

const runKeeper = async (index: number, lottery: string) => {
  try {
    
    const keeperContract= await getKeeperContract(index)
    const { step } = await keeperContract.lotteries(lottery)
    console.log("performing upkeep")
    await keeperContract.manualUpkeep();
    
    
    if(new BigNumber(step.toString()).eq(2)){
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
  } catch (error) {
    console.log("Maybe Wait Longer??");
  }
}

const goIdle = async () => {
  await sleep(GLOBAL_CONFIG.CHECKEVERY)
  start()
}


const start = async () => {
  for(let c=0; c<GLOBAL_CONFIG.CHAIN.length; c++){
    const { lottery, upkeepNeeded } = await checkIfReady(c)
    if(upkeepNeeded) {
      console.log(`${GLOBAL_CONFIG.CHAIN[c].NAME} is Ready!`)
      runKeeper(c, lottery.toString())
    }
    goIdle()
  }
}

process.on('SIGINT', async () => {
  sendNotificationToChannel("Lottery Keeper Died!")
  await sleep(1000);
  process.exit();
});

console.log("Loaded Up!")
start()


