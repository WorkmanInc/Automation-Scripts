
const dotenv = require("dotenv");
const fs = require("fs");
const csvParser = require('csv-parser');
const path = require('path');
// const sleep = require("util").promisify(setTimeout);
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require("bignumber.js");

const abi = require("./token.json");
const aabi = require("./airdropper.json");
const pabi = require("./Dual.json")
const sabi = require('./single.json')

const Web3 = require("web3");

const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const dataArray = [];

const getCSV = () => {
const csvFilePath = path.resolve(__dirname, 'ad.csv'); // Adjust the file name
fs.createReadStream(csvFilePath)
  .pipe(csvParser({ headers: false }))
  .on('data', (row) => {
    // Process each row and push it into the dataArray
    dataArray.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed.');
    // console.log(dataArray); // The array containing parsed CSV data
  });

}
// CHANGE THESE TOP 3 THINGS TO MATCH YOUR NEEDS
const GLOBALS = {
  airdropTokenAddress: "",            
  totalTokensToSend: 20000000000000000000000000,
  holderTokenAddress: "0x9A221E39DD82Eb91c25800bB24d129aEdC76737D", 
  minTokenCount: 2000000000000000000000000,
  howManyToSendTo: 200,
  howManyToCheck: 400,
  PRIVATE_KEY: process.env.PKEY,  // Wallet private key for sending the tokens.  
  LOGGER_RPC: "https://www.shibrpc.com",         // shibarium mainnet
  // LOGGER_RPC: "https://mainnet.infura.io/v3/2228785afa0541e6b5995abaaa99afe7",
  // LOGGER_RPC_OUTPUT: "https://mainnet.infura.io/v3/2228785afa0541e6b5995abaaa99afe7",
  LOGGER_RPC_OUTPUT: "https://www.shibrpc.com",         // shibarium mainnet
  // airDropperAddress: "0xBe0223f65813C7c82E195B48F8AAaAcb304FbAe7",      // ethereum dropper
  airDropperAddress: "0xDE501B2124Af0D4b82210592A2DeDcea248aEf43",
}
  

const poolsToCheck = [
  "0x048cb93e234a65C7da2da20550ef63Be63CDb6F0",
  "0xA60b1f1b6E8e05b65647B6C3701B624093700B57",
  "0xc88f23fABfD264AeE6DF7a98052fBea4E92b7419"
]

// add any other addresses that should be removed from the airdropping.
// mswap exlcusion
/*
const excludedList = [
  "0x929c4F3F7528f64d1ab93554E2497503F233E2D8", // LPTOKEN
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dEaD",
  "0xeaA637D32815b98453c9c9D20d1e2Ec0b5C28334", // POOL
  "0xA60b1f1b6E8e05b65647B6C3701B624093700B57", // POOL
  "0xc88f23fABfD264AeE6DF7a98052fBea4E92b7419", // POOL
  "0x71B5759d73262FBb223956913ecF4ecC51057641", // LOCKER
  "0x6b75d8AF000000e20B7a7DDf000Ba900b4009A80", // MEV BOT
  "0x4027240c1B3b7c39C37b9af6176928a0fD4d8773", // DEPLOYER
  "0x4bE2b2C45b432BA362f198c08094017b61E3BDc6", // token itself
  "0x28C6c06298d514Db089934071355E5743bf21d60", // binance
  "0x46340b20830761efd32832A74d7169B29FEB9758", // crypto.com

]
*/
const excludedList = [
  "0xeaA637D32815b98453c9c9D20d1e2Ec0b5C28334", 
  "0xB3170D501C68f584d3b0E286e17C817233b5a090", // LPTOKEN
]

const w = new Web3(GLOBALS.LOGGER_RPC_OUTPUT);
const senderAddress = w.eth.accounts.privateKeyToAccount(
  GLOBALS.PRIVATE_KEY
).address;

let airdropList = []
let poolList = []
let last = 0



const provider =  new JsonRpcProvider(GLOBALS.LOGGER_RPC)
const bscProvider = new JsonRpcProvider(GLOBALS.LOGGER_RPC_OUTPUT)

const watcher = new Wallet(
  GLOBALS.PRIVATE_KEY,
  provider
);

const outputSigner = new Wallet(
  GLOBALS.PRIVATE_KEY,
  bscProvider
);

let HolderContract = new Contract(
  GLOBALS.holderTokenAddress,
  abi,
  watcher
);

let dropTokenContract = new Contract(
  GLOBALS.airdropTokenAddress,
  abi,
  outputSigner
);

let AirDropper = new Contract(
  GLOBALS.airDropperAddress,
  aabi,
  outputSigner
);

const getStakedInPoolList = async () => {
  for(let i=0; i<poolsToCheck.length; i++){

    let PoolContract = new Contract(
      poolsToCheck[i],
      pabi,
      watcher
    ); 

    let SingleContract = new Contract(
      poolsToCheck[i],
      sabi,
      watcher
    );

    let eventFilter = PoolContract.filters.StakeStart()
    let events = await PoolContract.queryFilter(eventFilter)
    let stakedList = []
    // extract users    
    for(let i=0; i<events.length; i++){
      let newStaker = true
      staker = events[i].args.user.toString()

      // check if new or not
      for(let c=0; c<stakedList.length; c++){
        if(staker === stakedList[c]) newStaker = false
      }
      // if new add to list
      if(newStaker){
        stakedList.push(staker)
      }
      
    }
   console.log("users staked:", stakedList.length)

    for(let i=0; i<stakedList.length; i++) {
      let totalAmount = new BigNumber(0);
      // check how many stakes
      const lengthRaw = await PoolContract.ledger_length(stakedList[i])
      const length = new BigNumber(lengthRaw.toString()).toNumber()
      // check  if ended and amounts per ledger
      for(let a=0; a<length; a++) {
        let ledger = []
        try { 
          ledger = await PoolContract.ledger(stakedList[i], a) 
        } catch {
          ledger = await SingleContract.ledger(stakedList[i], a)
        }
        if(!ledger.ended) {
          // const interest = await PoolContract.get_gains(stakedList[i], a)
          totalAmount = new BigNumber(totalAmount).plus(ledger.amount.toString()) // .plus(interest.toString())
        }
      }
      
      // set StakerOnly List
      let isNew1 = true
      for(let b=0; b<poolList.length; b++){
        if(poolList[b] == stakedList[i]) {
          poolList[b][1] =  new BigNumber(poolList[b][1]).plus(totalAmount).toFixed(0)
          isNew1 = false
        } 
      }
      if(isNew1){
        poolList.push([stakedList[i], totalAmount.toFixed(0)])
      }

      let isNew = true
      // add to holders amount or add holder to list
      for(let b=0; b<airdropList.length; b++){
        // if in list add
        if(stakedList[i] == airdropList[b][0]) {
          airdropList[b][1] = new BigNumber(airdropList[b][1]).plus(totalAmount).toFixed(0)
          isNew = false
        } 
      }
        // add new holder to list
      if(isNew){
        airdropList.push([stakedList[i], totalAmount.toFixed(0)])
      }
    }
  }

  let path = `./slist.json`
  fs.writeFileSync(path, JSON.stringify(poolList, null, 2))
  console.log("users From Pools:", poolList.length)
  saveNewFullConfig()
}

const getEvents = async () => {
  let holderList = []

  let eventFilter = HolderContract.filters.Transfer()
  let events = await HolderContract.queryFilter(eventFilter)
  for(let a=0; a<2; a++){  
    for(let i=0; i<events.length; i++){
      const holder = a === 0 ? events[i].args.to : events[i].args.from
      let newHolder = true
      for(let b=0; b<excludedList.length; b++){
        if(holder === excludedList[b]) newHolder = false
      }
      for(let c=0; c<holderList.length; c++){
        if(holder === holderList[c]) newHolder = false
      }
      if(newHolder){
        holderList.push(holder.toString())
      }
    }
  }

  const runs2 = holderList.length / GLOBALS.howManyToCheck
  let start = 0
  let end = start + GLOBALS.howManyToCheck
  end = end > holderList.length ? holderList.length : end
  for(let m=0; m<runs2; m++ ){
    const checkList = []
    for(z=start; z<end; z++){
      checkList.push(holderList[z])
    }
    console.log("collecting balances")
    const data1 = await Promise.all(
      checkList.map(async (g) => {
          const t = HolderContract.balanceOf(g)
          return t
      })
    )
    for(let d=data1.length-1; d>=0;d--){
      if(new BigNumber(data1[d].toString()).gt(0)) {
        airdropList.push([checkList[d], new BigNumber(data1[d].toString()).toFixed(0)])
      }
    }
    start = start + GLOBALS.howManyToCheck
    end = end + GLOBALS.howManyToCheck
    end = end > holderList.length ? holderList.length : end
  }
  console.log("Holders:", airdropList.length)
  saveNewHConfig()
}

const setAllowanceTo = "999999999999999999999999999999999999999999999999999999999999"

const sendTokens = async() => {
  // const totalTokenCount= await getTotalTokenCount()
  
  const allow = await dropTokenContract.allowance(senderAddress, GLOBALS.airDropperAddress).catch((err) => {
    console.log(err, "failed to get allowance")
    process.exit()
  })
  const allowed = new BigNumber(allow.toString()).gte(new BigNumber(setAllowanceTo))
  if(!allowed) {
    await dropTokenContract.approve(GLOBALS.airDropperAddress ,setAllowanceTo).catch(() => {
      console.log("failed approval"); 
      process.exit()
    })
    console.log("approved")
    
  } else {
    console.log("approval Good", allowed)
  }

  let totalGas = new BigNumber(0)

  let sentTo = 0
  let totalSent = new BigNumber(0)

  const final = dataArray.length
  const leftToSend = final - last
  let start = last
  let end = last + GLOBALS.howManyToSendTo
  end = end > final ? final : end
  const runs = leftToSend / GLOBALS.howManyToSendTo

  let finalList = []
  for(let a=0; a<runs; a++){
    let holdersToSendTo = []
    let amountsToSend = []
    for(let i=start; i<end; i++){
        holdersToSendTo.push(dataArray[i][0])
        // calculate amount to send based on holdings of HOLDERTOKEN (MSWAP)
        // const newTokensToSend = (new BigNumber(GLOBALS.totalTokensToSend).multipliedBy(dataArray[i][1])).dividedBy(totalTokenCount)
        const sendAmount = new BigNumber(dataArray[i][1])
        console.log(sendAmount)
        amountsToSend.push(sendAmount)
        sentTo ++
        totalSent = new BigNumber(totalSent).plus(sendAmount)

        finalList.push([dataArray[i][0], sendAmount])
      
    }

    // for gas estimating
    const estimation = await AirDropper.estimateGas.sendAirdrop(GLOBALS.airdropTokenAddress, holdersToSendTo, amountsToSend).catch((err) => {
      console.log(err, "Failed to Estimate gas")
      process.exit()
    })
    console.log("estimate:", estimation.toString())
    totalGas = totalGas.plus(new BigNumber(estimation.toString()))

     
    // to Send out!

      const tx = await AirDropper.sendAirdrop(GLOBALS.airdropTokenAddress, holdersToSendTo, amountsToSend).catch((err) => {
        console.log(err, "Failed to use AirDropper")
        process.exit()
      })
      const receipt = await tx.wait()
      if (receipt.status) {
        console.log('Transaction Success', receipt.status)
      }
      
    
     last = end
     saveLastSent()
     start = start + GLOBALS.howManyToSendTo
     end = end + GLOBALS.howManyToSendTo
     end = end > final ? final : end
  }

  let path = `./finalList.json`
  fs.writeFileSync(path, JSON.stringify(finalList, null, 2))

  last = 0
  saveLastSent()
  console.log("Sent To All Addresses:", sentTo.toString())
  console.log("gas used:", new BigNumber(totalGas.toString()).shiftedBy(-9).toFixed(5))
  console.log("tokens sent:", new BigNumber(totalSent).shiftedBy(-18).toFixed(20))
}


const saveNewHConfig = async () => {
  let path = `./hlist.json`
  fs.writeFileSync(path, JSON.stringify(airdropList, null, 2))
};
const saveNewFullConfig = async () => {
  let path = `./list.json`
  fs.writeFileSync(path, JSON.stringify(airdropList, null, 2))
};
const saveLastSent = async () => {
  let path = `./last.json`
  fs.writeFileSync(path, JSON.stringify(last, null, 2))
};


const loadHConfig = async () => {
  let path = `./hlist.json`
  try {
    if (fs.existsSync(path)) {
      let history, historyParsed;
      try {
        history = fs.readFileSync(path);
        historyParsed = JSON.parse(history);
      } catch (e) {
        console.log("Error reading history:", e);
        return;
      }
      airdropList = historyParsed
    }
  } catch (err) {
    console.error(err);
  }
}

const loadFullConfig = async () => {
  let path = `./list.json`
  try {
    if (fs.existsSync(path)) {
      let history, historyParsed;
      try {
        history = fs.readFileSync(path);
        historyParsed = JSON.parse(history);
      } catch (e) {
        console.log("Error reading history:", e);
        return;
      }
      airdropList = historyParsed
    }
  } catch (err) {
    console.error(err);
  }
}
  
const loadLast = async () => {
  let path2 = `./last.json`
  try {
    if (fs.existsSync(path2)) {
      let history, historyParsed;
      try {
        history = fs.readFileSync(path2);
        historyParsed = JSON.parse(history);
      } catch (e) {
        console.log("Error reading history:", e);
        return;
      }
      last =  historyParsed
    } else {
      last = 0
      saveLastSent()
    }
  } catch (err) {
    console.error(err);
  }
  
};

const getTotalTokenCount = async() => {
  let total = new BigNumber(0)
  for(let i=0; i<airdropList.length; i++){
    if(new BigNumber(airdropList[i][1]).gte(GLOBALS.minTokenCount)){
      total = total.plus(new BigNumber(airdropList[i][1]))
    }
  }
  return total.toString()
}

const doesHolderListExist = () => {
  let path = `./hlist.json`
  if (fs.existsSync(path)) return true
  return false
}

const doesFullListExist = () => {
  let path = `./list.json`
  if (fs.existsSync(path)) return true
  return false
}

const init = async() => {

 const preBal =  await  w.eth.getBalance(senderAddress)
 console.log(preBal)
 const gasPriceWei = await w.eth.getGasPrice();

    console.log('Gas Price in Wei:', gasPriceWei);
    if(!doesHolderListExist()) await  getEvents()
    else await loadHConfig()

   // if(!doesFullListExist()) await  getStakedInPoolList()
   // else loadFullConfig()

   await loadLast()
  
 //  await sendTokens()
  const postBal = await w.eth.getBalance(senderAddress)

  console.log("Spent:", new BigNumber(preBal).minus(postBal).shiftedBy(-18).toFixed(8))
 //  await getCSV()

}

init()
