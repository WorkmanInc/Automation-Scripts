
import dotenv from "dotenv";
import axios from "axios";
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


// const fetch = require("cross-fetch");
// const { JsonRpcProvider } = require("@ethersproject/providers");
// const { Wallet } = require("@ethersproject/wallet");
// const { Contract } = require("ethers");
// const BigNumber = require("BigNumber.js");


const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls
// const abi = require("./abi.json");
// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  MINBUY: 0,
  LP: "0x90E6b9C1e54d00b1766fcbD0Fa83B18349016217",
  TOKEN0: "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA", //CIC
  TOKEN1: "0x9a37bF232466a55B99428479dF22c049cD43c20E", //FRTc
  CHATID: "-1001435750887",
  PERDOT: 5 // $ value per DOT
};


// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}


const signer = new Wallet(
  PRIVATE_KEY,
  new JsonRpcProvider(process.env.CIC_RPC)
);


let contract = new Contract(
  GLOBAL_CONFIG.LP,
  abi,
  signer
);


      


const sendNotification = async (message: string) => {
  var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${GLOBAL_CONFIG.CHATID}&text=${message}`
  axios.get(url);
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

const calculate = async (cicP: number, Ain: BigNumber, Aout: BigNumber) => {
 
  const bought = await new BigNumber(Aout.toString())
  const FRTcValue = await  new BigNumber(Ain.toString()).dividedBy(Aout.toString()).multipliedBy(cicP).toFixed(5)
 
  return { bought, FRTcValue }
}

const sym = (cicSpent: string | number) => {
  const howMany = new BigNumber(cicSpent).toNumber()
  let dots = "\xF0\x9F\x92\xB2"
  if(howMany > 1){
    for(let i=1; i<howMany; i++){
      dots = dots + "\xF0\x9F\x92\xB2"
    }
  }
  return dots
}

console.log("Loaded Up!")

contract.on("Swap", async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
  const cicPrice = await getBNBPrice()
  const {bought, FRTcValue} = await calculate(cicPrice, amount0In, amount1Out)
  const spent = new BigNumber(amount0In.toString()).shiftedBy(-18).multipliedBy(cicPrice).toFixed(2)
  const dots = sym(new BigNumber(spent).dividedBy(GLOBAL_CONFIG.PERDOT).toFixed(0))
  if( bought.gt(0) ) {
    var message = 
    "FRTc - Purchased!\n" +
    dots +
    `\nSpent: $${spent} - (${new BigNumber(amount0In.toString()).shiftedBy(-18).toFixed(2)} CIC)\n` +
    `Received ${bought.shiftedBy(-18).toFixed(2)} FRTc\n` +
    `FRTc Price: $${FRTcValue}\n` +
    `CIC: $${cicPrice}\n`
    
    sendNotification(message);
  }

});

