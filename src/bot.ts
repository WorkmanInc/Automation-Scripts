
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
  CHECKEVERY: 150000,
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
  return upkeepNeeded
}   

const runKeeper = async () => {
  try {
    await keeperContract.manualUpkeep();
    console.log("performing upkeep")
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
  console.log(isReady)
  if(isReady) {
    runKeeper()
  }
  goIdle()
}

console.log("Loaded Up!")
start()

