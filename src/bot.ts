
import dotenv from "dotenv";
import util from "util"
const sleep = util.promisify(setTimeout);
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from 'ethers'
import abi from "./abi.json"
// import Web3 from "web3";


const PRIVATE_KEY='af5b1f35d2ff08ac13746155fc3401aba64d8456a62655fec3d5b8e23a53c6c8'  // FARM

const GLOBAL_CONFIG = {
  CHECKEVERY: 60000,
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

const getContract = (index: number) => {
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



const checkIfReady = async (index: number) => {
    const keeperContract = await getContract(index)
    const {upkeepNeeded} = await keeperContract.upKeepDue();
    return upkeepNeeded
}   

const runKeeper = async (index: number) => {
  try {
    const keeperContract = await getContract(index)
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
  for(let c=0; c<GLOBAL_CONFIG.CHAIN.length; c++){
    const isReady = await checkIfReady(c)
    if(isReady) {
      console.log(`${GLOBAL_CONFIG.CHAIN[c].NAME} is Ready!`)
      runKeeper(c)
    }
    goIdle()
  }
}

console.log("Loaded Up!")
start()

