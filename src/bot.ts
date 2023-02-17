
import dotenv from "dotenv";
import util from "util"
const sleep = util.promisify(setTimeout);
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { Contract } from 'ethers'
import abi from "./abi.json"
import lotteryabi from "./lottery.json"
import tokenabi from "./token.json"
import BigNumber from "bignumber.js"
import telegramBot from "node-telegram-bot-api"
// import Web3 from "web3";

// const token = "6131657839:AAHwkVz6Oy8OJL0sa3KuvERVCZZdRBgbMiY"   // PRODUCTION
const token = "5721237869:AAE2ChqcZnjo8e18JaL7XmsvrbbSpFh8H04"   // testing
const bot = new telegramBot(token, {polling: true})


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

const runKeeper = async (index: number) => {
  try {
    const {lottery, keeperContract } = await getKeeperContract(index)
    const { step } = await keeperContract.lotteries(lottery.toString())
    await keeperContract.manualUpkeep();
    console.log("performing upkeep")
    if(step === 2){
      // get Token Name 
      const lotteryContract = await getLotteryContract(index, lottery.toString())
      const token = await lotteryContract.cakeToken()
      const id = await lotteryContract.currentLotteryId()
      const lastID = (id-1).toString()
      const tokenContract = getTokenContract(index, token.toString())
      // get tickets sold and winner count
      const lotteryInfo = await lotteryContract.viewLottery(lastID)

      const name = await tokenContract.name()
      const finalNumber = lotteryInfo.finalNumber - 1000000
      const ticketsSold = new BigNumber(lotteryInfo.firstTicketIdNextLottery.toString()).minus(lotteryInfo.firstTicketId.toString()).toString()
      // send msg to bot
      console.log(name, 
        `\n1 Number ${lotteryInfo.countWinnersPerBracket[0].toString()}`,
        `\n2 Number ${lotteryInfo.countWinnersPerBracket[1].toString()}`, 
        `\n3 Number ${lotteryInfo.countWinnersPerBracket[2].toString()}`, 
        `\n4 Number ${lotteryInfo.countWinnersPerBracket[3].toString()}`, 
        `\n5 Number ${lotteryInfo.countWinnersPerBracket[4].toString()}`, 
        `\n6 Number ${lotteryInfo.countWinnersPerBracket[5].toString()}`, 
        `\n Tickets sold${ticketsSold}\n`, 
        finalNumber)
      // send msg to bot

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
    const isReady = await checkIfReady(c)
    if(isReady) {
      console.log(`${GLOBAL_CONFIG.CHAIN[c].NAME} is Ready!`)
      runKeeper(c)
    }
    goIdle()
  }
}

const test = async () => {

      const address = "0x91Ac29535d3Fc4a2E288A767c2570c83917b32cc"   
      const lotteryContract = await getLotteryContract(1, address)
      const token = await lotteryContract.cakeToken()
      const id = await lotteryContract.currentLotteryId()
      const lastID = (id-1).toString()
      const tokenContract = getTokenContract(1, token.toString())
      // get tickets sold and winner count
      const lotteryInfo = await lotteryContract.viewLottery(lastID)

      const name = await tokenContract.name()
      const finalNumber = lotteryInfo.finalNumber - 1000000
      const ticketsSold = new BigNumber(lotteryInfo.firstTicketIdNextLottery.toString()).minus(lotteryInfo.firstTicketId.toString()).toString()
      // send msg to bot
      console.log(name, 
        `\n1 Number ${lotteryInfo.countWinnersPerBracket[0].toString()}`,
        `\n2 Number ${lotteryInfo.countWinnersPerBracket[1].toString()}`, 
        `\n3 Number ${lotteryInfo.countWinnersPerBracket[2].toString()}`, 
        `\n4 Number ${lotteryInfo.countWinnersPerBracket[3].toString()}`, 
        `\n5 Number ${lotteryInfo.countWinnersPerBracket[4].toString()}`, 
        `\n6 Number ${lotteryInfo.countWinnersPerBracket[5].toString()}`, 
        `\n Tickets sold${ticketsSold}\n`, 
        finalNumber)
      
    
  
}

console.log("Loaded Up!")
// start()
test()

