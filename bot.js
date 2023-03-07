
const dotenv = require("dotenv");
// const axios = require('axios');
const fetch = require("cross-fetch");
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require("BigNumber.js");


const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls
const abi = require("./abi.json");
const fabi = require("./factory.json");
const cabi = require("./checker.json");
const checkerAddress = "0x63A1875D5C951433f3de633D319b61bce0A7ecd2";
BSC_RPC="https://rpc.ankr.com/bsc/709f04e966e51d80d11fa585174f074c86d07265220a1892ee0485defed74cf6"
const spendingAmount="3000000000000000000"


// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const signer = new Wallet(
  PRIVATE_KEY,
  new JsonRpcProvider(BSC_RPC)
);

let checker = new Contract(
  checkerAddress,
  cabi,
  signer
);


const factories = [
        "0x04D6b20f805e2bd537DDe84482983AabF59536FF", // donk
        "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6", // ape
        "0xe759Dd4B9f99392Be64f1050a6A8018f73B53a13", // autoshark
        "0x858E3312ed3A876947EA49d572A7C42DE08af7EE", // biswap
        "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", // pancake
        "0x86407bEa2078ea5f5EB5A52B2caA963bC1F889Da", // baby
        "0x632F04bd6c9516246c2df373032ABb14159537cd", // corgi
       
];

    

/*
const sendNotification = async (message) => {
  var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${GLOBAL_CONFIG.CHATID}&text=${message}`
  axios.get(url);
}
*/

const getBNBPrice = async () => {
  const apiUrl = "https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD"
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    return parseFloat(price.USD);
    
  } catch (err) {
    console.error("Unable to connect to Binance API", err);
  }
};





console.log("Loaded Up!")

const init = async () => {
  for(let i=0; i<factories.length-1; i++){
    let factory = new Contract(
      factories[i],
      fabi,
      signer
    );
    const lpsCount = await factory.allPairsLength()

    for(let l=lpsCount-1; l>=0; l--){
      const newPair = await factory.allPairs(l)
      const bnbPriceRaw = await getBNBPrice();
      const bnbPrice = bnbPriceRaw.toFixed(0)
      const initCheck = await checker.checkForProfit(spendingAmount, newPair, bnbPrice).catch((err) => {
        console.log(err)
      });
      if(new BigNumber(initCheck.pairCount.toString()).gt(0)) {
        startListener(newPair)
        console.log(newPair.toString())
      }
      if(new BigNumber(initCheck.profit.toString()).gt(0)) console.log(initCheck)
    }
    console.log("Loaded entire Factory")
  }
}

const startListener = async(pair) => {

    let contract = new Contract(
      pair,
      abi,
      signer
    );

    contract.on("Swap", async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
      try {
        const bnbPriceRaw = getBNBPrice();
        const bnbPrice = bnbPriceRaw.toFixed(0)
        const profit = await checker.checkForProfit(spendingAmount, pair, bnbPrice).catch((err) => {
          console.log(err)
        });
        console.log("check")
        if(new BigNumber(profit.toString()).gt(0)) console.log(profit.toString());
      } catch {
        console.log("Failed check")
      }
    });

}

init()