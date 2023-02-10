
const dotenv = require("dotenv");
const axios = require('axios');
const fetch = require("cross-fetch");
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require("BigNumber.js");


const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls

const lpabi = require("./lp.json");


// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const signer = new Wallet(
  PRIVATE_KEY,
  new JsonRpcProvider(process.env.CIC_RPC)
);


const cic = "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA"
// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const FRTc = {
  MINBUY: 0,
  LPADDRESS: "0x90E6b9C1e54d00b1766fcbD0Fa83B18349016217",
  TOKEN: "0x9a37bF232466a55B99428479dF22c049cD43c20E", //FRTc
  CHATID: "-1001435750887",
  PERDOT: 5,             // $ value per DOT
  CIC0: true,
};      

const configs = [FRTc]

const addToken = async (LPAddress, ChatId) => {
// getUpdates off /ADDTOKEN command

const minBuy = "0"
// const chatID = "-1001435750887"
const perDot = "5"
// const LPADDRESS = "0x90E6b9C1e54d00b1766fcbD0Fa83B18349016217"

let lpcontract = new Contract(
  LPAddress,
  lpabi,
  signer
);

let cicIs0
let token
const token0 = await lpcontract.token0();
const token1 = await lpcontract.token1();
if(token0 === cic) {
  cicIs0 = true
  token = token1.toString()
} else if (token1 === cic) {
  cicIs0 = false
  token = token0 .toString()
} else return 


  configs.push({
    MINBUY: minBuy,
    LPADDRESS: LPAddress,
    TOKEN: token,
    CHATID: ChatId,
    PERDOT: perDot,
    CIC0: cicIs0
  })
  console.log(configs[configs.length-1])
  startListener(configs.length-1)
}

const init = async () => {

  for(let i=0; i<configs.length;i++){
    startListener(i)
  }
}

const sendNotification = async (message, index) => {
  var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${configs[index].CHATID}&text=${message}`
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
};

const getUpdates = async () => {
  const updatesURL = "https://api.telegram.org/bot6131657839:AAHwkVz6Oy8OJL0sa3KuvERVCZZdRBgbMiY/getUpdates";
  try {
    const res = await fetch(updatesURL);
    if ( res.status >= 400) {
      throw new Error("Bad Response");
    }
    const info = await res.json();
    cid = info.result[info.result.length-1].message.chat.id.toString()
    const msg = info.result[info.result.length-1].message.text.toString()
    if(msg.startsWith("/addToken")) {
      const lpAddress = msg.substring(10)
      const ChatId = info
      addToken(lpAddress, ChatId)
    }
    return 
    } catch (err) { console.error("Unable to connect")}
  };


const calculate = async (cicP, Ain, Aout) => {
 
  const bought = await new BigNumber(Aout.toString())
  const FRTcValue = await  new BigNumber(Ain.toString()).dividedBy(Aout.toString()).multipliedBy(cicP).toFixed(5)
 
  return { bought, FRTcValue }
}

const sym = (cicSpent) => {
  const howMany = new BigNumber(cicSpent).toNumber()
  let dots = "\xF0\x9F\x92\xB2"
  if(howMany > 1){
    for(let i=1; i<howMany; i++){
      dots = dots + "\xF0\x9F\x92\xB2"
    }
  }
  return dots
}


const startListener = async (index) => {
  const isZero = configs[index].CIC0

  let lpcontract = new Contract(
    configs[index].LPADDRESS,
    lpabi,
    signer
  );

  lpcontract.on("Swap", async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
  const cicPrice = await getBNBPrice()
  const inAmount = isZero ? amount0In : amount1In
  const outAmount = isZero ? amount1Out : amount0Out

  const {bought, FRTcValue} = await calculate(cicPrice, inAmount, outAmount)
  const spent = new BigNumber(inAmount.toString()).shiftedBy(-18).multipliedBy(cicPrice).toFixed(2)
  const dots = sym(new BigNumber(spent).dividedBy(configs[index].PERDOT).toFixed(0))
  if( bought.gt(configs[index].MINBUY) ) {
    var message = 
    "FRTc - Purchased!\n" +
    dots +
    `\nSpent: $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(-18).toFixed(2)} CIC)\n` +
    `Received ${bought.shiftedBy(-18).toFixed(2)} FRTc\n` +
    `FRTc Price: $${FRTcValue}\n` +
    `CIC: $${cicPrice}\n`
    
    sendNotification(message);
  }
  
});
console.log(`Loaded For ${configs[index].TOKEN}`)
}



init()
setInterval(() => { getUpdates() }, 2*1000);

