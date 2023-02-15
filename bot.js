
const dotenv = require("dotenv");
const axios = require('axios');
const fs = require("fs");
const fetch = require("cross-fetch");
const sleep = require("util").promisify(setTimeout);
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require("BigNumber.js");
const telegramBot = require('node-telegram-bot-api');


// const token = "6131657839:AAHwkVz6Oy8OJL0sa3KuvERVCZZdRBgbMiY"   // PRODUCTION
const token = "5721237869:AAE2ChqcZnjo8e18JaL7XmsvrbbSpFh8H04"   // testing
const bot = new telegramBot(token, {polling: true})

const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls

const lpabi = require("./lp.json");
const factoryABI = require("./factorcy.json");
const uniswapABI = require("./uni-Factory.json");
const uniLPABI = require("./uniLP.json");

bot.onText(/^\/commands/, async function(message, match) {   
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) { 
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
     
      sendNotificationToChannel(
      "<b><u> Commands </u></b>\n" +
       "<b>/addToken</b> [tokenAddress] [dex]\n"+
       "Adds Token to BuyBot List for DEX\n" +
        "\n" +
       "<b>/removeToken</b> [tokenAddress]\n" +
       "Removes Token from BuyBot list\n" +
        "\n" +
       "<b>/price</b> [tokenAddress] [dex]\n" +
       "Checks price of Token on DEX\n" +
       "\n" +
       "<b>/price</b> [token Symbol]\n" +
       "Checks price of Token by Symbol\n" +
       "\n<b>IF MULTIPLE OF SAME SYMBOL USE FIRST METHOD</b>\n" +
       "\n" +
       "<b>/tokenlist</b>: List of Tokens in group\n" +
       "<b>/dexlist</b>: List of Dex's available\n" +
       "<b>/chainlist</b>: List of Chains available\n" +
       "\n"+
       "<b>/[Coin Symbol]</b> Checks price of Coin\n" +
        `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
        , cid, thread)
    } else {
          sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})

let chain = [
  {
    LONGNAME: "Crazy Internet Coin",
    NAME: "CIC",
    API: "https://backend.newscan.cicscan.com/coin_price",
    RPC: "https://xapi.cicscan.com/",
    EXP: "https://cicscan.com/",
    NATIVE: "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA",
    BASES: ["0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA"]
  },
  {
    LONGNAME: "Binance",
    NAME: "BNB",
    API: "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
    RPC: "https://rpc.ankr.com/bsc/709f04e966e51d80d11fa585174f074c86d07265220a1892ee0485defed74cf6/",
    EXP: "https://bscscan.com/",
    NATIVE: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    BASES: ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"]
  },
  {
    LONGNAME: "Ethereum",
    NAME: "ETH",
    API: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
    RPC: "https://rpc.ankr.com/eth/a43f07a7be6cc42d81c31ccab2f9a43e71a3713d40c4809cc4a9886839d5cb76",
    EXP: "https://etherscan.io/",
    NATIVE: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    BASES: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xdAC17F958D2ee523a2206206994597C13D831ec7"]
  }
];

bot.onText(/^\/chainlist/, async function(message, match) {   
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) { 
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  let chainsList = ""
  for(let c=0; c<chain.length; c++){
    chainsList = chainsList + `<b>${chain[c].LONGNAME}:</b> ${chain[c].NAME} \n`
  }

  sendNotificationToChannel(
    "<b><u> Chain List </u></b>\n" +
    chainsList +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)
  } else {
    sendNotificationToChannel("not Admin", cid, thread)
  }
})
})

let exchange = [
  {
    LONGNAME: "Farmageddon",
    NAME: "FARM",
    FACTORY: "0xfD35F3f178353572E4357983AD2831fAcd652cC5",
    CHAIN: chain[0],
    DOTS: "\xF0\x9F\x9A\x9C"  // tractor
  },
  {
    LONGNAME: "PancakeSwap",
    NAME: "PCS",
    FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    CHAIN: chain[1],
    DOTS: "\xF0\x9F\x90\xB0" // rabbit
  },
  {
    LONGNAME: "Donk Swap",
    NAME: "DONK",
    FACTORY: "0x04D6b20f805e2bd537DDe84482983AabF59536FF",
    CHAIN: chain[1],
    DOTS: "\xF0\x9F\x90\xB4"
  },
  {
    LONGNAME: "WendDex",
    NAME: "WEN",
    FACTORY: "0x51eD5a1f2EC7516dB92ff5Ae8d76ea4A2B87A6d1",
    CHAIN: chain[0],
    DOTS: "\xF0\x9F\x94\xB5"
  },
  {
    LONGNAME: "UniSwap V3",
    NAME: "UNIV3",
    FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    CHAIN: chain[2],
    FEES: [100, 500, 3000, 10000],
    DOTS: "\xF0\x9F\x92\xB5"
  },
  {
    LONGNAME: "UniSwap V2",
    NAME: "UNIV2",
    FACTORY: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    CHAIN: chain[2],
    DOTS: "\xF0\x9F\x92\xB0"
  },
  {
    LONGNAME: "PancakeSwap ETH",
    NAME: "PCSETH",
    FACTORY: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
    CHAIN: chain[2],
    DOTS:  "\xF0\x9F\x90\xB0"
  },
  {
    LONGNAME: "Ape Swap",
    NAME: "APE",
    FACTORY: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
    CHAIN: chain[1],
    DOTS: "\xF0\x9F\x92\xB5"
  },
  {
    LONGNAME: "BiSwap",
    NAME: "BIS",
    FACTORY: "0x858e3312ed3a876947ea49d572a7c42de08af7ee",
    CHAIN: chain[1],
    DOTS: "\xF0\x9F\x92\xB5"
  }
  
]

bot.onText(/^\/dexlist/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  let dexList = ""
  for(let c=0; c<exchange.length; c++){
    dexList = dexList + `<b>${exchange[c].LONGNAME} ${exchange[c].CHAIN.NAME}</b>: ${exchange[c].NAME} \n`
  }

  sendNotificationToChannel(
    "<b><u> Dex List </u></b>\n" +
    dexList +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)
  } else {
    sendNotificationToChannel("not Admin", cid, thread)
  }
})
})

bot.onText(/^\/tokenlist/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
      let tokenlist = ""
      for(let c=0; c<chain.length; c++){
        for(let ch =0; ch<configs[c].CHANNEL.length; ch++){
          if(configs[c].CHANNEL[ch].CHATID === cid){
            for(let t=0; t<configs[c].CHANNEL[ch].THREAD.length; t++) {
              const e = configs[c].EXCHANGE
              tokenlist = tokenlist + `<b>${configs[c].SYM}:</b> ${configs[c].TOKEN} <b>${exchange[e].CHAIN.NAME} ${exchange[e].NAME}</b>\n`
            }
          }
        }
      }

      sendNotificationToChannel(
        "<b><u> Tokens List </u></b>\n" +
        tokenlist +
        `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
        , cid, thread)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})




// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const getSigner = (index) => {
  const rpc = exchange[index].CHAIN.RPC
  const signer = new Wallet(
    PRIVATE_KEY,
    new JsonRpcProvider(rpc)
  );
  return signer
}

const getFactory = async (index) => {
  const factory = exchange[index].FACTORY
  const abi = exchange[index].NAME === "UNIV3" ? uniswapABI : factoryABI
  const signer = await getSigner(index)
  const factoryContract = new Contract(
    factory,
    abi,
    signer
  );
  return factoryContract
}

      
let configs

const addToken = async (LPAddress, index, ChatId, thread) => {

const signer = await getSigner(index)

const minBuy = 0
const perDot = 5
// try {

  let lpcontract = new Contract(
    LPAddress,
    lpabi,
    signer
  );

  const token0 = await lpcontract.token0();
  const token1 = await lpcontract.token1();
  let baseIs0 = false
  let newtoken = token0.toString()
  let baseToken = token1.toString()

  for(let b=0; b<exchange[index].CHAIN.BASES.length; b++){
    if(token0 === exchange[index].CHAIN.BASES[b]) {
      baseIs0 = true
      newtoken = token1.toString()
      baseToken = token0.toString()
    }
  }

  const baseIsNative = baseToken === exchange[index].CHAIN.NATIVE

  let tcontract = new Contract(
    newtoken,
    lpabi,
    signer
  );
  let bcontract = new Contract(
    baseToken,
    lpabi,
    signer
  );
  const sym = await tcontract.symbol()
  const bsym = await bcontract.symbol()
  const tdRaw = await tcontract.decimals()
  const bdRaw = await bcontract.decimals()

  const td = new BigNumber(tdRaw.toString())
  const bd = new BigNumber(bdRaw.toString())

    const newInfo = {
      LPADDRESS: LPAddress,
      TOKEN: newtoken,
      BASETOKEN: baseToken,
      SYM: sym,
      TDECIMALS: td,
      BSYM: bsym,
      BDECIMALS: bd,
      BASE0: baseIs0,
      BASEISNATIVE: baseIsNative,
      MINBUY: minBuy,
      PERDOT: perDot,
      EXCHANGE: index,
      CHANNEL: [{
        CHATID: ChatId,
        THREAD: [thread],
      }],
    }

    configs.push(newInfo)

  saveNewConfig()
  startListener(configs.length-1)
 // }catch{bot.sendMessage(ChatId,"Error, Check Values")}
}

const removeToken = async (LPAddress, ChatId, thread) => {
  try {
    let didntExist = true
    for(let i=0; i<configs.length; i++){
      if(configs[i].LPADDRESS === LPAddress){
        for(let c=0; c<configs[i].CHANNEL.length; c++){
          if(configs[i].CHANNEL[c].CHATID === ChatId) {
            for(let t =0; t <configs[i].CHANNEL[c].THREAD.length; t++){
              if(configs[i].CHANNEL[c].THREAD[t] === thread){
                if(configs[i].CHANNEL[c].THREAD.length === 1 && configs[i].CHANNEL.length === 1 ){
                  configs[i] = configs[configs.length-1]
                  await stopListener(LPAddress, i)
                  configs.pop()
                  sendNotificationToChannel("Removed Token", ChatId, thread)
                  didntExist = false
                  saveNewConfig(); return
                } else if(configs[i].CHANNEL[c].THREAD.length === 1){
                  configs[i].CHANNEL[c] = configs[i].CHANNEL[configs[i].CHANNEL.length-1]
                  configs[i].CHANNEL.pop()
                  sendNotificationToChannel("Removed From Channel", ChatId, thread)
                  didntExist = false
                  saveNewConfig(); return
                } else {
                  
                  configs[i].CHANNEL[c].THREAD[t]  = configs[i].CHANNEL[c].THREAD[configs[i].CHANNEL[c].THREAD.length-1]
                  configs[i].CHANNEL[c].THREAD.pop()
                  sendNotificationToChannel("Removed From Topic", ChatId, thread)
                  didntExist = false
                  saveNewConfig(); return
                }
              }
            }
          }
        }
      }
    }
    if(didntExist) bot.sendMessage(ChatId,"Token Not In List")

 }catch{
   bot.sendMessage(ChatId,"Error, Check Values")
 }
}

const init = async () => {
  await loadConfig()
  for(let i=0; i<configs.length;i++){
    startListener(i)
  }
 // sendKillMsg("FG Bot Started Up!")
}

const sendKillMsg = async (message) => {
  let channels = []
  for(let i=0; i<configs.length; i++){
    let canAdd = true
    
    for(let c=0; c<configs[i].CHANNEL.length; c++) {
      for(let cc=0; cc<channels.length; cc++){
        if(configs[i].CHANNEL[c].CHATID === channels[cc])canAdd = false
      }
      if(canAdd) channels.push(configs[i].CHANNEL[c].CHATID)
    }
  }
  
  if(channels.length > 0){
    for(let s=0; s<channels.length; s++){
      sendNotificationToChannel(message, channels[s])
    }
  }
  
}

bot.onText(/^\/test/, async function(message, match) {
  signer = getSigner(4)
  let lpcontract = new Contract(
    "0x96E9089595C83F3EA933A84cF82b6415dF4Df9D2",
    uniLPABI,
    signer
  );
  const { cicPrice } = await getBNBPrice(4)
  const pool_balance = await lpcontract.slot0();
  const sqrtPriceX96 = pool_balance.sqrtPriceX96;
  // const number_1 = JSBI.BigInt(sqrtPriceX96 *sqrtPriceX96* (1eTOKEN0-dec)/(1etoken1-dec)/JSBI.BigInt(2) ** (JSBI.BigInt(192)));
  const number_1 = new BigNumber(sqrtPriceX96 * sqrtPriceX96 * (1e18)/(1e18)).dividedBy(new BigNumber(2) ** (new BigNumber(192)));
  const dollar = number_1.multipliedBy(cicPrice)
  console.log(dollar.toFixed(8), number_1, cicPrice)
 } )

const sendNotificationToChannel = async (message, cid, thread) => {
    var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${cid}&text=${message}&parse_mode=HTML&disable_web_page_preview=true&message_thread_id=${thread}`
    axios.get(url)
    // .catch((error) => {
    //  console.log("Error Sending to Channel")
    // });
}

const sendNotification = async (message, index) => {
  const c = configs[index].CHANNEL
  let toDelete = []
  for(let i=0; i<c.length; i++){
    for(let t=0; t<c[i].THREAD.length; t++){
      const thread = c[i].THREAD[t]
      var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${c[i].CHATID}&text=${message}&parse_mode=HTML&disable_web_page_preview=true&message_thread_id=${thread}`
    
        await axios.get(url).catch(() => {
          add = true
          for(let c =0; c<toDelete.length; c++){
            if(i === toDelete[c]) add = false
          }
          if(add) {
            toDelete.push([configs[index].LPADDRESS,c[i].CHATID, thread])
          }
        })
    }
  }

  if(toDelete.length > 0) {
    for(let d=0; d<toDelete.length; d++){
     removeToken(toDelete[d][0],toDelete[d][1],toDelete[d][2])
    }
    saveNewConfig()
  }
}

const getBNBPrice = async (index) => {
  
  const apiUrl = exchange[index].CHAIN.API;
  let cicPrice = 0
  let mc = 0
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    if(exchange[index].CHAIN.NAME !== "ETH"){
      cicPrice = parseFloat(price.price);
      mc = parseFloat(price.market_cap)
    } else {
      cicPrice = parseFloat(price.USD)
    }    
  } catch (err) {
    console.error("Unable to connect to Binance API", err);
  }
  return { cicPrice, mc }
};




bot.onText(/^\/addToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    const cid = message.chat.id.toString()
    if((data.status == "creator") || (data.status == "administrator")) {
      const tokenAddress = message.text.substring(10, 52)
      let index = 0
      const exchangeString = message.text.substring(53)

      for(let e=0; e<exchange.length; e++){
        if(exchangeString.toLowerCase() === exchange[e].NAME.toLowerCase()) index = e
      }
      
    let lps = []
    let bases = []
    for(let b=0; b<exchange[index].CHAIN.BASES.length; b++){
        const factoryContract = await getFactory(index)
        let lpRaw
        if(exchange[index].NAME === "UNIV3"){
          for(let f=0; f<exchange[index].FEES.length;f++){
            lpRaw = await factoryContract.getPool(tokenAddress, exchange[index].CHAIN.BASES[b], exchange[index].FEES[f])
            lpString = lpRaw.toString()
            if(lpString !== "0x0000000000000000000000000000000000000000") {lps.push(lpString); bases.push(exchange[index].CHAIN.BASES[b])}
          }
        } else {
          lpRaw = await factoryContract.getPair(tokenAddress, exchange[index].CHAIN.BASES[b])
          lpString = lpRaw.toString()
          if(lpString !== "0x0000000000000000000000000000000000000000")  {lps.push(lpString); bases.push(exchange[index].CHAIN.BASES[b])}
        }
    }
    for(let l=0; l<lps.length; l++) {
      let DONE = false
      // check if LPTOKEN exists, then if CHANNEL is already added to LPTOKEN
      for(let j=0;j<configs.length; j++){
        if(lps[l] === configs[j].LPADDRESS){
          for(let k=0; k<configs[j].CHANNEL.length; k++){
            if(cid === configs[j].CHANNEL[k].CHATID) {
                // checking for TOPICS
                for(let t=0; t<configs[j].CHANNEL[k].THREAD.length; t++) {
                  if(configs[j].CHANNEL[k].THREAD[t] === thread) { 
                    sendNotificationToChannel(`${bases[l]} Already added`, cid, thread); 
                    DONE = true
                  }
                }

                if(!DONE){
                  configs[j].CHANNEL[k].THREAD.push(thread); 
                  DONE = true; 
                  sendNotificationToChannel(`${bases[l]} Added to Topic`, cid, thread); break
                }
            }
          }
          if(!DONE) {
            // setting CHANNEL if LP EXists but NOT Channel
            configs[j].CHANNEL.push({
              CHATID: cid,
              THREAD: [thread],
            }); 
            DONE = true;  
            sendNotificationToChannel(`${bases[l]} Added to Channel`, cid, thread); break
          }
        }
      }
      if(!DONE){
        addToken(lps[l], index, cid, thread)
        sendNotificationToChannel(`${bases[l]} Added New Pair`, cid, thread);
      }
      
    }
    if(lps.length > 0) {
      saveNewConfig()
    } else sendNotificationToChannel(` Dont Exist - Wrong Dex?`, cid, thread); 

    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }

  })
  
})


bot.onText(/^\/removeToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const tokenAddress =  message.text.substring(13)
      let lpAddress = tokenAddress
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
          lpAddress = configs[i].LPADDRESS
          const cid = message.chat.id.toString()
          removeToken(lpAddress, cid, thread)
        }
      }
     
    } else {
      bot.sendMessage(messaage.chat.id, "not admin");
    }
  })
})

const getPrice = async (lp, cIndex, cicPrice, gotOne, Index) => {
  const isUNIV3 = exchange[cIndex].NAME === "UNIV3"
  const signer = getSigner(cIndex)
  let lpcontract = new Contract(
    lp,
    isUNIV3 ? uniLPABI : lpabi,
    signer
  );

  let token0
  let token1
  let baseIs0
  let baseToken

  let sym
  let bsym
  let tDecimals
  let bDecimals

  let tContract

  if(gotOne){
    baseIs0 = configs[Index].BASE0
    token0 = baseIs0 ? configs[Index].BASETOKEN : configs[Index].TOKEN
    token1 = baseIs0 ? configs[Index].TOKEN : configs[Index].BASETOKEN
    baseToken = configs[Index].BASETOKEN
    sym = configs[Index].SYM
    bsym = configs[Index].BSYM
    tDecimals = new BigNumber(configs[Index].TDECIMALS)
    bDecimals = new BigNumber(configs[Index].BDECIMALS)
    tContract = new Contract(
      configs[Index].TOKEN,
      lpabi,
      signer
    );
  } else {
    token0 = await lpcontract.token0();
    token1 = await lpcontract.token1();
    baseIs0 = false
    baseToken = token1.toString()
    for(let b=0; b<exchange[cIndex].CHAIN.BASES.length; b++){
      if(token0 === exchange[cIndex].CHAIN.BASES[b]) {
        baseIs0 = true
        baseToken = token0.toString()
      }
    }

    tContract = new Contract(
      baseIs0 ? token1.toString() : token0.toString(),
      lpabi,
      signer
    );
    let bContract = new Contract(
      baseIs0 ? token0.toString() : token1.toString(),
      lpabi,
      signer
    );
    const tdRaw = await tContract.decimals()
    const bdRaw = await bContract.decimals()
    sym = await tContract.symbol()
    bsym = await bContract.symbol()
    
    tDecimals = new BigNumber(tdRaw.toString())
    bDecimals = new BigNumber(bdRaw.toString())
    
  }

  const dec = new BigNumber(bDecimals - tDecimals)
  const baseIsNative = baseToken === exchange[cIndex].CHAIN.NATIVE
  const basePrice = baseIsNative ? cicPrice : 1

  const tsRaw = await tContract.totalSupply()
  const bRaw = await tContract.balanceOf("0x000000000000000000000000000000000000dEaD")
  const totalSupply = new BigNumber(tsRaw.toString())
  const burned = new BigNumber(bRaw.toString())
 
 
  let price
  if(!isUNIV3) { 
  
    const {_reserve0, _reserve1 } = await lpcontract.getReserves()
    const cicR = new BigNumber(baseIs0 ? _reserve0.toString() : _reserve1.toString())
    const tR = new BigNumber(baseIs0 ? _reserve1.toString() : _reserve0.toString())
    price = cicR.multipliedBy(basePrice).dividedBy(tR).shiftedBy(dec.multipliedBy(-1).toNumber()).toFixed(14)
  
  } else {
    const pool_balance = await lpcontract.slot0();
    const sqrtPriceX96 = pool_balance.sqrtPriceX96;
    const bd = new BigNumber(1).shiftedBy(bDecimals.toNumber()).toNumber()
    const td = new BigNumber(1).shiftedBy(tDecimals.toNumber()).toNumber()
    // const number_1 = JSBI.BigInt(sqrtPriceX96 *sqrtPriceX96* (1eTOKEN0-dec)/(1etoken1-dec)/JSBI.BigInt(2) ** (JSBI.BigInt(192)));
    const number_1 = new BigNumber(sqrtPriceX96 * sqrtPriceX96 * (bd)/(td)).dividedBy(new BigNumber(2) ** (new BigNumber(192)));
    price = number_1.multipliedBy(cicPrice).toFixed(14)
  }


  const mc = totalSupply.minus(burned).shiftedBy(-tDecimals).multipliedBy(price).toFixed(2)

  return { sym, price, mc, bsym }
}

bot.onText(/^\/cic/, async function(message, match) {   
    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice(0)

 sendNotificationToChannel(
  `<b>CIC Price:</b> $${cicPrice}\n` +
  `<b>CIC MC:</b> $${mc}\n` +
  `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)

})
bot.onText(/^\/CIC/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice(0)

  sendNotificationToChannel(
    `<b>CIC Price:</b> $${cicPrice}\n` +
    `<b>CIC MC:</b> $${mc}\n` +
    `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)

})

bot.onText(/^\/bnb/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(1)

 sendNotificationToChannel(
  `<b>BNB Price:</b> $${cicPrice}\n` +
  `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)

})
bot.onText(/^\/BNB/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(1)

  sendNotificationToChannel(
    `<b>BNB Price:</b> $${cicPrice}\n` +
    `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)

})

bot.onText(/^\/eth/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(4)

 sendNotificationToChannel(
  `<b>ETHERUEM Price:</b> $${cicPrice}\n` +
  `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)

})
bot.onText(/^\/ETH/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(4)

  sendNotificationToChannel(
    `<b>ETHEREUM Price:</b> $${cicPrice}\n` +
    `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)

})

const getLPToken = async (cIndex, command) => {
  try {
    for(let b=0; b<exchange[cIndex].CHAIN.BASES.length;b++){
      const factoryContract = await getFactory(cIndex)
      if(exchange[cIndex].NAME === "UNIV3"){
          for(let f=0; f<exchange[cIndex].FEES.length;f++){
            const raw = await factoryContract.getPool(command, exchange[cIndex].CHAIN.BASES[b], exchange[cIndex].FEES[f])
            LP = raw.toString()
            if(LP !== "0x0000000000000000000000000000000000000000") return LP
          }
        } else {
          const raw = await factoryContract.getPair(command, exchange[cIndex].CHAIN.BASES[b])
          LP = raw.toString()
          if(LP !== "0x0000000000000000000000000000000000000000") return LP
        }
    }
    
  } catch {
    LP = command
  }
  return LP
}




bot.onText(/^\/price/, async function(message, match) { 
      const cid = message.chat.id.toString()
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const command = message.text.substring(7,49)
      const tExchange = message.text.substring(50)
      let cIndex = 0
      let LP = command
      let index
      const cLower = command.toLowerCase()
      
      for(let c=0; c<exchange.length; c++){
        if(tExchange.toLowerCase() === exchange[c].NAME.toLowerCase()) cIndex = c
      }

    try {
    let gotOne = false
        for(let i=0; i<configs.length; i++) {
          
          if(cLower == configs[i].SYM.toLowerCase()) {
            LP = configs[i].LPADDRESS;
            cIndex=configs[i].EXCHANGE;
            index = i
            gotOne = true
            break
          } else if(cLower == configs[i].TOKEN.toLowerCase() && tExchange === exchange[configs[i].EXCHANGE].NAME) {
            LP = configs[i].LPADDRESS; 
            cIndex=configs[i].EXCHANGE;
            index = i
            gotOne = true
            break
          }
        }
           if(!gotOne){
            LP = getLPToken(cIndex, command)
           }
        
            const { cicPrice } = await getBNBPrice(cIndex)
            const {sym, price, mc, bsym } = await getPrice(LP,cIndex, cicPrice, gotOne, index)
            const link = getLink(cIndex)

            sendNotificationToChannel(
              `${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP\n` +
              `<b>${sym} / ${bsym}</b>\n` +
              `<b>Price:</b> $${price}\n` +
              `<b>MCap:</b> $${mc}\n` +
              `<b>${exchange[cIndex].CHAIN.NAME} Price:</b> $${cicPrice}\n` + 
              `\n` +
              link
              ,cid, thread);
        
      } catch {
       bot.sendMessage(cid, "Not Valid TOKEN");
     }
    
})

const getLink = (index) => {
  if(exchange[index].CHAIN.NAME === "CIC") return  `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
  return  `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
}

const saveNewConfig = async () => {
  let path = `./tokenConfig.json`
      fs.writeFileSync(path, JSON.stringify(configs, null, 2))
};

const loadConfig = async () => {
  let path = `./tokenConfig.json`
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
      configs =  historyParsed
      return
      
    }
  } catch (err) {
    console.error(err);
  }
};

const calculate = async (cicP, Ain, Aout) => {
  const bought = await new BigNumber(Aout.toString())
  const FRTcValue = await  new BigNumber(Ain.toString()).dividedBy(Aout.toString()).multipliedBy(cicP).toFixed(12)
  return { bought, FRTcValue }
}

const sym = (cicSpent, cIndex) => {
  const howMany = new BigNumber(cicSpent).toNumber()
  let dots = exchange[cIndex].DOTS
  if(howMany > 1){
    for(let i=1; i<howMany; i++){
      dots = dots + exchange[cIndex].DOTS
    }
  }
  return dots
}

const stopListener = async (lp, index) => {
  const signer = getSigner(configs[index].EXCHANGE)
  let lpcontract = new Contract(
    lp,
    lpabi,
    signer
  );
  lpcontract.off("Swap")
}

const startListener = async (index) => {
  const signer = getSigner(configs[index].EXCHANGE)
  const baseIs0 = configs[index].BASE0
  const baseIsNative = configs[index].BASEISNATIVE

  let lpcontract = new Contract(
    configs[index].LPADDRESS,
    lpabi,
    signer
  );

  lpcontract.on("Swap", async ( sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
  const { cicPrice } = await getBNBPrice(configs[index].EXCHANGE)

  const txhash = event.transactionHash.toString()
  const receiver = to.toString()
  const buyer = sender.toString()

  const basePrice = baseIsNative ? cicPrice : 1

  const inAmount = baseIs0 ? amount0In : amount1In
  const outAmount = baseIs0 ? amount1Out : amount0Out

  const {bought, FRTcValue} = await calculate(basePrice, inAmount, outAmount)
  const spent = new BigNumber(inAmount.toString()).shiftedBy(-18).multipliedBy(basePrice).toFixed(2)
  const cIndex = configs[index].EXCHANGE
  const dots = sym(new BigNumber(spent).dividedBy(configs[index].PERDOT).toFixed(0), cIndex)
  const link = getLink(cIndex)

  if( bought.gt(configs[index].MINBUY) ) {
    var message =
    `<b>${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP</b>\n` +
    `<b>${configs[index].SYM}</b> - Purchased!\n` +
    dots +
    `\n<b>Spent:</b> $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(-18).toFixed(4)} ${exchange[cIndex].CHAIN.NAME})\n` +
    `<b>Received:</b> ${bought.shiftedBy(-18).toFixed(2)} ${configs[index].SYM}\n` +
    `<b>${configs[index].SYM} Price:</b> $${FRTcValue}\n` +
    `<b>${exchange[cIndex].CHAIN.NAME}:</b> $${cicPrice}\n` +
    `<a href="${exchange[cIndex].CHAIN.EXP}tx/${txhash}"> TX  </a> <b>|</b>`+ 
    `<a href="${exchange[cIndex].CHAIN.EXP}address/${buyer}"><u> Buyer </u></a> <b>|</b>` +
    `<a href="${exchange[cIndex].CHAIN.EXP}address/${receiver}"><u> Receiver </u></a>\n` +
    `\n` +
    link 
    
    sendNotification(message,index);
  }
  
});
// sendNotification(`BuyBot Running for ${configs[index].TOKEN}`, index)
console.log(`Loaded For ${configs[index].TOKEN} | In ${configs[index].CHANNEL.length} Channels`)
}


process.on('SIGINT', async () => {
  // await sendKillMsg("FG Bot Shutting Down!")
  await sleep(1000);
  process.exit();
});




init()

