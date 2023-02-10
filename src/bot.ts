
import dotenv from "dotenv";
import util from "util"
const sleep = util.promisify(setTimeout);
import fetch from 'cross-fetch'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from 'ethers'
import BigNumber from "BigNumber.js"
import abi from "./abi.json"
import { randomBytes} from "crypto";
import Web3 from "web3";


const PRIVATE_KEY='af5b1f35d2ff08ac13746155fc3401aba64d8456a62655fec3d5b8e23a53c6c8'  // FARM


const GLOBAL_CONFIG = {
  CHECKEVERY: 300000,
  TIMEAFTER: 120000,
  KEEPER: "0x86D0c640E9B208acB39b04Bf5aAB1C41070632E3",
};


// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const w = new Web3(process.env.BSC_RPC!!);

w.eth.defaultAccount = w.eth.accounts.privateKeyToAccount(
  PRIVATE_KEY
).address;


const signer = new Wallet(
  PRIVATE_KEY,
  new JsonRpcProvider(process.env.CIC_RPC)
);


let contract = new Contract(
  GLOBAL_CONFIG.KEEPER,
  abi,
  signer
);
const keeperContract = contract.connect(signer);

const checkIfReady = async () => {
  const {upkeepNeeded} = await keeperContract.upKeepDue();
  console.log(upkeepNeeded)
  return upkeepNeeded
}   

const getBNBPrice = async () => {
  const apiUrl = "https://backend.newscan.cicscan.com/coin_price";
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    return parseFloat(price.price);
    
  } catch (err) {
    console.error("Unable to connect to Binance API", err);
  }
  return 0
};

const runKeeper = async () => {
  try {
    const tx = await keeperContract.manualUpkeep();
    await tx.wait();
    console.log(`🤞 Ran 🍁`);
     
  } catch (error) {
    console.log("Maybe Wait Longer??");
   
  }
}

const goIdle = async () => {
  await sleep(GLOBAL_CONFIG.CHECKEVERY)
  start()
}


const start = async () => {
  const isReady = await checkIfReady()
  if(isReady) {
    runKeeper()
  }
  goIdle()
}

console.log("Loaded Up!")
start()

