
const dotenv = require("dotenv");
const axios = require('axios');
const fs = require("fs");
const sleep = require("util").promisify(setTimeout);
const fetch = require("cross-fetch");
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require("bignumber.js");

let lpList = []
let last = []
let bnbPrice

BOT_TOKEN="6213624319:AAHJTY7IGktO6kNcy_c-g6_7xWCi6Wfpik0"
const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls
const abi = require("./abi.json");
const fabi = require("./factory.json");
const cabi = require("./checker.json");
const checkerAddress = "0xcBe551E8bA268d558bD227B41C7a0A5675EFaee2";
BSC_RPC="https://rpc.ankr.com/bsc/709f04e966e51d80d11fa585174f074c86d07265220a1892ee0485defed74cf6"
TEST_RPC="https://bsc-dataseed1.defibit.io"
TEST2_RPC="https://bsc.nodereal.io"

const dollarRisk="1000000000000000000000"


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

const bases = [
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", //bnb
  "0x55d398326f99059ff775485246999027b3197955", // usdt -- 6 decimals
  "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // busd
  "0xB04906e95AB5D797aDA81508115611fee694c2b3", // usdc
  "0xE68b79e51bf826534Ff37AA9CeE71a3842ee9c70" // czusd
];

const factories = [
        "0x04D6b20f805e2bd537DDe84482983AabF59536FF", // donk
        "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6", // ape
        "0xe759Dd4B9f99392Be64f1050a6A8018f73B53a13", // autoshark
        "0x858E3312ed3A876947EA49d572A7C42DE08af7EE", // biswap
        "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", // pancake
        "0x86407bEa2078ea5f5EB5A52B2caA963bC1F889Da", // baby
        "0x632F04bd6c9516246c2df373032ABb14159537cd", // corgi 
];

    


const sendNotification = async (message) => {
  var url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=-1001794956683&text=${message}`
  axios.get(url);
}


const getBNBPrice = async () => {
  const apiUrl = "https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD"
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    bnbPriceRaw =  parseFloat(price.USD);
    bnbPrice = bnbPriceRaw.toFixed(0)
  } catch (err) {
    console.error("Unable to connect to Binance API", err);
  }
};

let running = true

const init = async() => {
  await loadConfig()
  for(let i=0; i<lpList.length; i++){
    startListener(lpList[i])
  }
  findNew()
}



const findNew = async () => {
  let count = 0
  console.log("starting")
try {
  for(let i=last[0]; i<factories.length; i++){
    let factory = new Contract(
      factories[i],
      fabi,
      signer
    );
    const lpsCount = await factory.allPairsLength()
    const start = last[1] === null ? lpsCount -1 : last[1]
    for(let l=start; l>=0; l--){
      const newPair = await factory.allPairs(l)
      let lp = new Contract(
        newPair,
        abi,
        signer
      );
      const token0Raw = await lp.token0();
      const token1Raw = await lp.token1();
      const token0 = token0Raw.toString()
      const token1 = token1Raw.toString()
      for(let t=0; t<2; t++){
        const tokenToCheck = t === 0 ? token0 : token1
        const { pairs } = await checker.getPairs(tokenToCheck)

        for(let l=0; l<pairs.length; l++){
          const checkPair = pairs[l].toString()
          let alreadyAdded = false
          for(let j=0; j<lpList.length; j++){
            if(lpList[j] === checkPair.toString()) { alreadyAdded = true; break }
          }
          if(!alreadyAdded){
            lpList.push(checkPair.toString())
            saveNewConfig()
            startListener(checkPair.toString())
          }
        }
      }

    last = [i,l]
    let path2 = `./last.json`
    fs.writeFileSync(path2, JSON.stringify(last, null, 2))
    count++
    if(count >= 10) {
      console.log("halting")
      running = false
      return
    }
  }

    console.log("Loaded entire Factory")
    last[1] = null
  }
 } catch {
  running = false
  console.log("Failed to Get New Pair")
 }
  let path2 = `./last.json`
  fs.writeFileSync(path2, JSON.stringify(last, null, 2))
  running = false
}


const startListener = async(pair) => {

    let contract = new Contract(
      pair,
      abi,
      signer
    );
    
    contract.on("Swap", async () => {
       try {
        
        let best = new BigNumber(0);
        let info;
        for(let i=0; i<factories.length; i++){
          const { profit, factorys, route } = await checker.checkForProfit(dollarRisk, pair, factories[i], bnbPrice).catch(() => console.log("checkProfitError",dollarRisk, bnbPrice, pair))
  
          if(new BigNumber(profit.toString()).gt(best)) {
            info = [profit, factorys, route];
            best = new BigNumber(profit.toString())
          }

          if(new BigNumber(best).gt(0)) {
            console.log(info, pair, spendAmount)
            sendNotification(`Profit Found: ${new BigNumber(info.profit.toString()).shiftedBy(-18).toString()}, Pair: ${pair}`)
          }
          
        }
       } catch {
        console.log("Failed check")
       }
    });
}


const saveNewConfig = async () => {
  let path = `./list.json`
  fs.writeFileSync(path, JSON.stringify(lpList, null, 2))
  
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
      lpList =  historyParsed
    }
  } catch (err) {
    console.error(err);
  }
  
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
      if(historyParsed[0] === undefined || historyParsed[1] === undefined) historyParsed = [0,null]
      last =  historyParsed
    }
  } catch (err) {
    console.error(err);
  }
  
};

getBNBPrice()
init()
setInterval(() => { getBNBPrice() }, 60*1000);
setInterval(() => { if(!running) findNew() }, 660*1000);