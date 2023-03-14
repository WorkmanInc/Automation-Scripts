
const dotenv = require("dotenv");
const fs = require("fs");
// const sleep = require("util").promisify(setTimeout);
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require("bignumber.js");

const abi = require("./token.json");
const aabi = require("./airdropper.json");

const Web3 = require("web3");




// CHANGE THESE TOP 3 THINGS TO MATCH YOUR NEEDS
const GLOBALS = {
  howManyToSendTo: 250,
  howManyToCheck: 400,
  // CIC CHAIN STUFF
  PRIVATE_KEY: '1ff4a78ea7460e706cdff2389c24b76d9c66dffe4d6fc60375134ccc25981a68',  // Wallet private key for sending the tokens.
  holderTokenAddress: "0x1bace27Eac668840c9B347990D971260CC221Af8",                 // token to get holder list from
  airdropTokenAddress: "0xe14c5cA49EC3F549eB8d82FaBDF415EBaBC8a9c8",                // token to be airdropped
  // LOGGER_RPC: "https://xapi.cicscan.com",
  LOGGER_RPC: "http://95.217.153.149:22000",
  airDropperAddress: "0x3194218f0de32DdC1EeBb4FC946105D6298737dF",

  // ENTERCOIN STUFF
  // LOGGER_RPC: "https://tapi.entercoin.net",
  // PRIVATE_KEY: 'af5b1f35d2ff08ac13746155fc3401aba64d8456a62655fec3d5b8e23a53c6c8', // farm
  // airDropperAddress: "0xb7E6C8EDBdbFACEAe1cC162bd92d595BB29ad90A",
  // holderTokenAddress: "0x281291c6C9E0Cd3d1fdeA76070Cbd4C892087864",
  // airdropTokenAddress: "0xe59dD025Ac02ba5Af07f91362024F7933FE14641",

  // BSC
  // PRIVATE_KEY: 'af5b1f35d2ff08ac13746155fc3401aba64d8456a62655fec3d5b8e23a53c6c8',  // farm
  // airDropperAddress: "0x0e6130BD48fc621370A48c10A5a129c0680f1cF0",
 // LOGGER_RPC: "https://rpc.ankr.com/bsc/709f04e966e51d80d11fa585174f074c86d07265220a1892ee0485defed74cf6",
}

// add any other addresses that should be removed from the airdropping.
const excludedList = [
  "0xf7C562aE3063305fE40077ad78319ccDE4724582", // Owner / dev wallet
  "0x1bace27Eac668840c9B347990D971260CC221Af8", // old token itself
  "0x9725802F4Bc039267C15938fD6DfEF437B45A6aF", // LP TOKEN
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dEaD"
]

const w = new Web3(GLOBALS.LOGGER_RPC);
const senderAddress = w.eth.accounts.privateKeyToAccount(
  GLOBALS.PRIVATE_KEY
).address;

let airdropList = []
let last

const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const provider =  new JsonRpcProvider(GLOBALS.LOGGER_RPC)
const bscProvider = new JsonRpcProvider(GLOBALS.LOGGER_RPC)

const watcher = new Wallet(
  GLOBALS.PRIVATE_KEY,
  provider
);

const bscsigner = new Wallet(
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
  watcher
);

let AirDropper = new Contract(
  GLOBALS.airDropperAddress,
  aabi,
  bscsigner
);



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

  console.log(holderList.length)

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
        airdropList.push([checkList[d], data1[d].toString()])
      }
    }

    start = start + GLOBALS.howManyToCheck
    end = end + GLOBALS.howManyToCheck
    end = end > holderList.length ? holderList.length : end
  }
  

  console.log(airdropList.length)
  saveNewConfig()
}

const setAllowanceTo = "999999999999999999999999999999999999999999999999"

const sendTokens = async() => {
  const allow = await dropTokenContract.allowance(senderAddress, GLOBALS.airDropperAddress).catch((err) => {
    console.log( err, "failed to get allowance")
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
  const final = airdropList.length
  const leftToSend = final - last
  let start = last
  let end = last + GLOBALS.howManyToSendTo
  end = end > final ? final : end
  const runs = leftToSend / GLOBALS.howManyToSendTo
  for(let a=0; a<runs; a++){
    let holdersToSendTo = []
    let amountsToSend = []
    for(let i=start; i<end; i++){
      holdersToSendTo.push(airdropList[i][0])
      // amountsToSend.push(airdropList[i][1])
      amountsToSend.push(new BigNumber(airdropList[i][1]).dividedBy(100000).toFixed(0))
    }

    
    // for gas estimating
    const estimation = await AirDropper.estimateGas.sendAirdrop(GLOBALS.airdropTokenAddress, holdersToSendTo, amountsToSend).catch(() => {
      console.log("Failed to Estimate gas")
      process.exit()
    })
    console.log("estimate:", estimation.toString())
    totalGas = totalGas.plus(new BigNumber(estimation.toString()))
    
    /*
    const gas = await provider.getGasPrice()
    const gasCost =new BigNumber(gas.toString()).multipliedBy(1.01).toFixed(0)
    const limit = new BigNumber(estimation.toString()).multipliedBy(1.25).toFixed(0)
    */

    // to Send out!

      const tx = await AirDropper.sendAirdrop(GLOBALS.airdropTokenAddress, holdersToSendTo, amountsToSend).catch(() => {
        console.log("Failed to use AirDropper")
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
  last = 0
  saveLastSent()
  // fs.renameSync(`./list.json`, `./${GLOBALS.airdropTokenAddress}-Dropped.json`)
  console.log("Sent To All Addresses")
  console.log(new BigNumber(totalGas.toString()).shiftedBy(-9).toFixed(5))
}


const saveNewConfig = async () => {
  let path = `./list.json`
  fs.writeFileSync(path, JSON.stringify(airdropList, null, 2))
};
const saveLastSent = async () => {
  let path = `./last.json`
  fs.writeFileSync(path, JSON.stringify(last, null, 2))
};

const loadConfig = async () => {
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

const getTotalToSend = async() => {
  let total = new BigNumber(0)
  for(let i=0; i<airdropList.length; i++){
    total = total.plus(new BigNumber(airdropList[i][1]))
  }
  return total.toString()
}

const doesFileExist = () => {
  let path = `./list.json`
  if (fs.existsSync(path)) return true
  return false
}

const init = async() => {
  if(!doesFileExist()) await  getEvents()
  else await loadConfig()

  console.log(new BigNumber(await getTotalToSend()).shiftedBy(-18).toFixed(4))

  await loadLast()
  
  await sendTokens()

  
}

init()
