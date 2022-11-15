const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract, utils } = require("ethers");
const dotenv = require("dotenv");
const Big = require("big.js");
const abi = require("./abi.json");
const fs = require("fs");
const _ = require("lodash");
const fetch = require("cross-fetch");
let prediction = 0;


const result = dotenv.config();
if (result.error) {
  throw result.error;
}

const Web3 = require("web3");
const w = new Web3(process.env.BSC_RPC);

const wallet = w.eth.accounts.wallet.add(
  w.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
);
w.eth.defaultAccount = w.eth.accounts.privateKeyToAccount(
  process.env.PRIVATE_KEY
).address;

const signer = new Wallet(
  process.env.PRIVATE_KEY,
  new JsonRpcProvider(process.env.BSC_RPC)
);

let contract = new Contract(
  process.env.PCS_ADDRESS.toString(),
  JSON.parse(abi.result),
  signer
);



const nextNugget = (id) => {
  for(i = 0; i < process.env.NUGGETS.length; i++) {
    console.log(process.env.NUGGETS.length)
    console.log(id);
    console.log(process.env.NUGGETS[i]);
    if(process.env.NUGGETS[i] > id){
      return process.env.NUGGETS[i];
    } 
  }
  return 0;
}

const predictionContract = contract.connect(signer);

const checkBalance = (amount) => {
  w.eth.getBalance(wallet.address).then(function (b) {
    let balance = Web3.utils.fromWei(b, "ether");
    if (balance < parseFloat(amount)) {
      console.log(
        "You don't have enough balance :",
        amount,
        "BNB",
        "|",
        "Actual Balance:",
        balance,
        "BNB"
      );
    } else {
      console.log(`Your balance is enough: ${balance} BNB`);
    }
  });
};


module.exports = {
  predictionContract,
  checkBalance,
  nextNugget,
};
