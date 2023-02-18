
const dotenv = require("dotenv");
const axios = require('axios');
const fs = require("fs");
const fetch = require("cross-fetch");
const sleep = require("util").promisify(setTimeout);
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require('bignumber.js');
const telegramBot = require('node-telegram-bot-api');
const {
  chain,
  exchange,
  ads
} = require("./config/chainConfig");


const token = "6131657839:AAHwkVz6Oy8OJL0sa3KuvERVCZZdRBgbMiY"   // PRODUCTION
// const token = "5721237869:AAE2ChqcZnjo8e18JaL7XmsvrbbSpFh8H04"   // testing
const bot = new telegramBot(token, {polling: true})

const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls

const lpabi = require("./abis/lp.json");
const factoryABI = require("./abis/factorcy.json");
const uniswapABI = require("./abis/uni-Factory.json");
const uniLPABI = require("./abis/uniLP.json");

const getAdLink = () => {
  const index = Math.floor((Math.random() * ads.length));
  return  `\nad: <a href="${ads[index].TGLINK}"><u>${ads[index].NAME}</u></a>`
}

bot.onText(/^\/fgbot/, async function(message, match) {   
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
     
      sendNotificationToChannel(
       "<b><u> FG Bot Commands </u></b>\n" +
       "<b>/addtoken</b> [tokenAddress] [dex]\n"+
       "Adds Token to BuyBot List for DEX\n" +
        "\n" +
       "<b>/removetoken</b> [tokenAddress]\n" +
       "Removes Token from BuyBot list\n" +
       "\n" +
       "<b>/minbuy</b> [tokenAddress ] [amount]\n" + 
       "Set Min $ Buy for Token\n" +
       "\n" +
       "<b>/perdot</b> [tokenAddress ] [amount]\n" + 
       "Set $ Per Dot for Token\n" +
       "\n" +
       "<b>/[Coin Symbol]</b> Checks price of Coin\n" +
       "\n" +
       "<b>/price</b> [tokenAddress] [dex]\n" +
       "Checks price of Token on DEX\n" +
       "\n" +
       "<b>/price</b> [token Symbol]\n" +
       "Checks price of Token by Symbol\n" +
       "<b>IF ERROR USE FIRST METHOD</b>\n" +
       "\n" +
       "<b><u>Channel Commands</u></b>\n" +
       "<b>/blockprice</b> Block Price Commands\n" +
       "<b>/allowprice</b> Allows Price Commands\n" +
       "\n" +
       "<b><u>LISTS</u></b>\n" +
       "<b>/tokenlist</b>: List of Tokens in group\n" +
       "<b>/dexlist</b>: List of all Dex's\n" +
       "<b>/dexlist</b> [chain]: Dex list by Chain\n" +
       "<b>/chainlist</b>: List of Chains available\n" +
       getAdLink() +
        `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
       
        , cid, thread)
})


bot.onText(/^\/chainlist/, async function(message, match) {   
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    if((data.status == "creator") || (data.status == "administrator")) { 
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  let chainsList = ""
  for(let c=0; c<chain.length; c++){
    chainsList = chainsList + `<b>${chain[c].LONGNAME}:</b> ${chain[c].NAME} \n`
  }
  sendNotificationToChannel(
    "<b><u> Chain List </u></b>\n" +
    chainsList + "\n" +
    getAdLink() +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
    
   , cid, thread)
  } else {
    sendNotificationToChannel("not Admin", cid, thread)
  }
})
})


bot.onText(/^\/dexlist/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
      const chainString = message.text.substring(9)
      let byChain = false
      let cIndex = 0
      let dexList = ""

      for(let c=0; c<exchange.length; c++){
        if(exchange[c].CHAIN.NAME.toLowerCase() === chainString.toLowerCase()){
          byChain = true
          cIndex = c
          break
        }
      }
      if(byChain) {
        for(let c=0; c<exchange.length; c++){
          if(exchange[c].CHAIN.NAME.toLowerCase() === chainString.toLowerCase()){
            dexList = dexList + `<b>${exchange[c].LONGNAME} ${exchange[c].CHAIN.NAME}</b>: ${exchange[c].NAME} \n`
          }
        }
        sendNotificationToChannel(
          `<b><u> Dex List ${exchange[cIndex].LONGNAME} </u></b>\n` +
          dexList + "\n" +
          getAdLink() +
          `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
         
          , cid, thread)
      } else {
        for(let c=0; c<exchange.length; c++){
          dexList = dexList + `<b>${exchange[c].LONGNAME} ${exchange[c].CHAIN.NAME}</b>: ${exchange[c].NAME} \n`
        }
        sendNotificationToChannel(
          `<b><u> Dex List </u></b>\n` +
          dexList + "\n" +
          getAdLink() +
          `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
          , cid, thread)
      }
    }
  })
})

bot.onText(/^\/tokenlist/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      let tokenlist = ""
      for(let c=0; c<configs.length; c++){
        for(let ch =0; ch<configs[c].CHANNEL.length; ch++){
          if(configs[c].CHANNEL[ch].CHATID === cid){
            for(let t=0; t<configs[c].CHANNEL[ch].THREAD.length; t++) {
              if(configs[c].CHANNEL[ch].THREAD[t] === thread){
                const e = configs[c].EXCHANGE
                tokenlist = tokenlist + `<b>${configs[c].SYM}/${configs[c].BSYM}:</b> ${configs[c].TOKEN}\n<b>${exchange[e].CHAIN.NAME} ${exchange[e].NAME}</b>\n`
              }
            }
          }
        }
      }
      sendNotificationToChannel(
        "<b><u> Tokens List </u></b>\n" +
        tokenlist + "\n" +
        getAdLink() +
        `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>` 
        , cid, thread)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})

bot.onText(/^\/minbuy/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    let changed = false
    if((data.status == "creator") || (data.status == "administrator")) {
      const tokenAddress =  message.text.substring(8,50)
      const amountRaw = message.text.substring(51)
      const amount = new BigNumber(amountRaw).toNumber()
      if(amount > 100) return sendNotificationToChannel("Must be between 0 and 100", cid, thread)
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
          for(let c=0; c<configs[i].CHANNEL.length; c++){
            if(configs[i].CHANNEL[c].CHATID === cid) {
              configs[i].CHANNEL[c].MINBUY = amount
              changed = true
            }
          }
        }
      }
     saveNewConfig()
     if(changed)  sendNotificationToChannel(`Changed MinBuy to $${amount}`, cid, thread);
     else sendNotificationToChannel(`Token not setup`, cid, thread);
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})

bot.onText(/^\/perdot/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    let changed = false
    if((data.status == "creator") || (data.status == "administrator")) {
      const tokenAddress =  message.text.substring(8,50)
      const amountRaw = message.text.substring(51)
      const amount = new BigNumber(amountRaw).toNumber()
      if(amount > 100 && amount < .1) return sendNotificationToChannel("Must be between .1 and 100", cid, thread)
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
          for(let c=0; c<configs[i].CHANNEL.length; c++){
            if(configs[i].CHANNEL[c].CHATID === cid) {
              configs[i].CHANNEL[c].PERDOT = amount
              changed = true
            }
          }
        }
      }
     saveNewConfig()
     if(changed) sendNotificationToChannel(`Changed to $${amount} Per Dot`, cid, thread);
     else sendNotificationToChannel(`Token not setup`, cid, thread);
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
 
let configs = []
let blocked = []

const addToken = async (LPAddress, index, ChatId, thread) => {
const signer = await getSigner(index)
const minBuy = 0
const perDot = 5
try {

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
      break
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
  const name = await tcontract.name()
  const sym = await tcontract.symbol()
  const bsym = await bcontract.symbol()
  const tdRaw = await tcontract.decimals()
  const bdRaw = await bcontract.decimals()

  const td = new BigNumber(tdRaw.toString())
  const bd = new BigNumber(bdRaw.toString())

    const newInfo = {
      LPADDRESS: LPAddress,
      TOKEN: newtoken,
      NAME: name,
      BASETOKEN: baseToken,
      SYM: sym,
      TDECIMALS: td,
      BSYM: bsym,
      BDECIMALS: bd,
      BASE0: baseIs0,
      BASEISNATIVE: baseIsNative,
      EXCHANGE: index,
      CHANNEL: [{
        CHATID: ChatId,
        MINBUY: minBuy,
        PERDOT: perDot,
        THREAD: [thread],
      }],
    }

    configs.push(newInfo)

  saveNewConfig()
  startListener(configs.length-1)
  }catch{bot.sendMessage(ChatId,"Error, Check Values")}
}

const removeToken = async (LPAddress, ChatId, thread) => {
 // try {
    let didntExist = true
    for(let i=0; i<configs.length; i++){
      if(configs[i].LPADDRESS === LPAddress){
        for(let c=0; c<configs[i].CHANNEL.length; c++){
          if(configs[i].CHANNEL[c].CHATID === ChatId) {
            for(let t =0; t <configs[i].CHANNEL[c].THREAD.length; t++){
              if(configs[i].CHANNEL[c].THREAD[t] === thread){
                if(configs[i].CHANNEL[c].THREAD.length === 1 && configs[i].CHANNEL.length === 1 ){
                  await stopListener(LPAddress, i)
                  await stopListener(configs[configs.length-1].LPADDRESS, configs.length-1)
                  configs[i] = configs[configs.length-1]
                  configs.pop()
                  if(i !== configs.length) await startListener(i)
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

 // }catch{
 //  bot.sendMessage(ChatId,"Error, Check Values")
// }
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

 const checkIfAllowed = (cid, thread) => {
    for(let b=0; b<blocked.length; b++){
      if(blocked[b].CHANNEL === cid){
        for(let t=0; t<blocked[b].THREADS.length; t++){
          if(blocked[b].THREADS[t] === thread) return false
        }
      }
    }
    return true
 }
 const addToBlocked = (cid, thread) => {
  for(let b=0; b<blocked.length; b++){
    if(blocked[b].CHANNEL === cid){
      blocked[b].push(thread)
      saveNewConfig()
      return
    }
  }
  blocked.push({
    CHANNEL: cid,
    THREADS: [thread]
  })
  saveNewConfig()
 }

bot.onText(/^\/blockprice/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
      if(checkIfAllowed(cid, thread)) {
        addToBlocked(cid, thread)
        sendNotificationToChannel("Blocked Price Commands For This Group/Topic", cid, thread)
      }
      else sendNotificationToChannel("Already blocked", cid, thread)
    }
  })
})

const removeFromBlocked = (cid, thread) => {
  for(let b=0; b<blocked.length; b++){
    if(blocked[b].CHANNEL === cid){
      if(blocked[b].THREADS.length === 1){
        blocked[b] = blocked[blocked.length-1]
        blocked.pop()
        saveNewConfig()
        return
      } else {
        for(let t=0; t<blocked[b].THREADS.length; t++){
          if(blocked[b].THREADS[t] === thread){
            blocked[b].THREADS[t] = blocked[b].THREADS[blocked[b].THREADS.length -1]
            blocked[b].THREADS.POP()
            saveNewConfig()
            return
          }
        }
      }
    }
  }
 }

bot.onText(/^\/allowprice/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
      if(!checkIfAllowed(cid, thread)){
        sendNotificationToChannel("Price Commands Allowed For This Group/Topic", cid, thread)
        removeFromBlocked(cid, thread)
      }
      else sendNotificationToChannel("Not blocked", cid, thread)
    }
  })
})

const sendNotificationToChannel = async (message, cid, thread) => {
    var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${cid}&text=${message}&parse_mode=HTML&disable_web_page_preview=true&message_thread_id=${thread}`
    axios.get(url).catch((error) => {
      console.log("Error Sending to Channel")
    }); 
}

const sendNotificationToChannelPrice = async (message, cid, thread) => {
  if(checkIfAllowed(cid, thread)) {
    var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${cid}&text=${message}&parse_mode=HTML&disable_web_page_preview=true&message_thread_id=${thread}`
    axios.get(url).catch((error) => {
      console.log("Error Sending to Channel")
     });
  }  
}


const getBNBPrice = async (index) => {
  
  const apiUrl = exchange[index].CHAIN.API;
  let cicPrice = 0
  let mc = 0
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      console.log(res.status)
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    if(exchange[index].CHAIN.NAME === "CIC"){
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




bot.onText(/^\/addtoken/, function(message, match) {
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
/*
      if(tokenAddress.toLowerCase() === exchange[index].CHAIN.NATIVE.toLowerCase()) {
        sendNotificationToChannel(`Can't Add Native Token`, cid, thread);
        return; 
      }
   */   
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
                    sendNotificationToChannel(`${tokenAddress} Already added`, cid, thread); 
                    DONE = true
                  }
                }

                if(!DONE){
                  configs[j].CHANNEL[k].THREAD.push(thread); 
                  DONE = true; 
                  sendNotificationToChannel(`${tokenAddress} Added to Topic`, cid, thread); break
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
            sendNotificationToChannel(`${tokenAddress} Added to Channel`, cid, thread); break
          }
        }
      }
      if(!DONE){
        addToken(lps[l], index, cid, thread)
        sendNotificationToChannel(`${tokenAddress} Added New Pair`, cid, thread);
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


bot.onText(/^\/removetoken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const tokenAddress =  message.text.substring(13)
      let lpAddress = tokenAddress
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
          lpAddress = configs[i].LPADDRESS
          
          removeToken(lpAddress, cid, thread)
        }
      }
     
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
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

 sendNotificationToChannelPrice(
  `<b>CIC Price:</b> $${cicPrice}\n` +
  `<b>CIC MC:</b> $${mc}\n` +
  getAdLink() +
  `\n<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)

})
bot.onText(/^\/CIC/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice(0)

  sendNotificationToChannelPrice(
    `<b>CIC Price:</b> $${cicPrice}\n` +
    `<b>CIC MC:</b> $${mc}\n` +
    getAdLink() +
    `\n<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)

})

bot.onText(/^\/bnb/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(3)
 sendNotificationToChannelPrice(
  `<b>BNB Price:</b> $${cicPrice}\n` +
  getAdLink() +
  `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)
})
bot.onText(/^\/BNB/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(3)
  sendNotificationToChannelPrice(
    `<b>BNB Price:</b> $${cicPrice}\n` +
    getAdLink() +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
    , cid, thread)
})
bot.onText(/^\/eth/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(7)
 sendNotificationToChannelPrice(
  `<b>ETHERUEM Price:</b> $${cicPrice}\n` +
  getAdLink() +
  `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)
})
bot.onText(/^\/ETH/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(7)
  sendNotificationToChannelPrice(
    `<b>ETHEREUM Price:</b> $${cicPrice}\n` +
    getAdLink() +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)
})
bot.onText(/^\/cro/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(10)
 sendNotificationToChannelPrice(
  `<b>CRO Price:</b> $${cicPrice}\n` +
  getAdLink() +
  `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)
})
bot.onText(/^\/CRO/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(10)
  sendNotificationToChannelPrice(
    `<b>CRO Price:</b> $${cicPrice}\n` +
    getAdLink() +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
   , cid, thread)
})
bot.onText(/^\/dxt/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(11)
 sendNotificationToChannelPrice(
  `<b>DXT Price:</b> $${cicPrice}\n` +
  getAdLink() +
  `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
 , cid, thread)
})
bot.onText(/^\/DXT/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(11)
  sendNotificationToChannelPrice(
    `<b>DXT Price:</b> $${cicPrice}\n` +
    getAdLink() +
    `\n<a href="https://farmageddon.farm/"><u>Farmageddon</u></a> <b>|</b> <a href="https://t.me/FARMAGEDDON_TOKEN"><u>Telegram</u></a>`
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

            sendNotificationToChannelPrice(
              `${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP\n` +
              `<b>${sym} / ${bsym}</b>\n` +
              `<b>Price:</b> $${price}\n` +
              `<b>MCap:</b> $${mc}\n` +
              `<b>${exchange[cIndex].CHAIN.NAME} Price:</b> $${cicPrice}\n` +
              getAdLink() + "\n" +
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
  let path = `./config/tokenConfig.json`
  fs.writeFileSync(path, JSON.stringify(configs, null, 2))
  let path2 = `./config/blocked.json`
  fs.writeFileSync(path2, JSON.stringify(blocked, null, 2))
};

const loadConfig = async () => {
  let path = `./config/tokenConfig.json`
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
    }
  } catch (err) {
    console.error(err);
  }
  let path2 = `./config/blocked.json`
  try {
    if (fs.existsSync(path2)) {
      let history2, historyParsed2;
      try {
        history2 = fs.readFileSync(path2);
        historyParsed2 = JSON.parse(history2);
      } catch (e) {
        console.log("Error reading history:", e);
        return;
      }
      blocked =  historyParsed2
    }
  } catch (err) {
    console.error(err);
  }
};

const calculate = async (cicP, Ain, Aout, index) => {
  const tdec = configs[index].TDECIMALS
  const bdec = configs[index].BDECIMALS
  const bought = await new BigNumber(Aout.toString()).shiftedBy(-tdec)
  const paid = await new BigNumber(Ain.toString()).shiftedBy(-bdec)
  const FRTcValue = await  new BigNumber(paid).dividedBy(bought).multipliedBy(cicP).toFixed(12)
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
  console.log(`Stopped For ${configs[index].TOKEN}`)
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

    const {bought, FRTcValue} = await calculate(basePrice, inAmount, outAmount, index)
    const spent = new BigNumber(inAmount.toString()).shiftedBy(-configs[index].BDECIMALS).multipliedBy(basePrice).toFixed(2)
  

    sendBuyBotMessage(index, bought, FRTcValue, spent, txhash, receiver, buyer, inAmount, cicPrice);
  
  });
  console.log(`Loaded For ${configs[index].TOKEN} | In ${configs[index].CHANNEL.length} Channels`)
}

const sendBuyBotMessage = async (index, bought, FRTcValue, spent, txhash, receiver, buyer, inAmount, cicPrice) => {
  const c = configs[index].CHANNEL
  let toDelete = []
  
  const cIndex = configs[index].EXCHANGE
  const link = getLink(cIndex)

  for(let i=0; i<c.length; i++){
    for(let t=0; t<c[i].THREAD.length; t++){
      const thread = c[i].THREAD[t]

      if( new BigNumber(spent).gt(configs[index].CHANNEL[i].MINBUY) ) {
        const dots = sym(new BigNumber(spent).dividedBy(configs[index].CHANNEL[i].PERDOT).toFixed(0), cIndex)
        var message =
        `<b>${configs[index].NAME}</b> Bought!!\n` +
        `<b>${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP</b>\n` +
        dots +
        `\n<b>Spent:</b> $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(configs[index].BDECIMALS).toFixed(4)} ${configs[index].BSYM})\n` +
        `<b>Received:</b> ${new BigNumber(bought).toFixed(2)} ${configs[index].SYM}\n` +
        `<b>${configs[index].SYM} Price:</b> $${FRTcValue}\n` +
        `<b>${exchange[cIndex].CHAIN.NAME}:</b> $${cicPrice}\n` +
        `<a href="${exchange[cIndex].CHAIN.EXP}tx/${txhash}"> TX  </a> <b>|</b>`+ 
        `<a href="${exchange[cIndex].CHAIN.EXP}address/${buyer}"><u> Buyer </u></a> <b>|</b>` +
        `<a href="${exchange[cIndex].CHAIN.EXP}address/${receiver}"><u> Receiver </u></a>\n` +
         getAdLink() +
        `\n` +
        link
        
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
  }
  if(toDelete.length > 0) {
    for(let d=0; d<toDelete.length; d++){
     removeToken(toDelete[d][0],toDelete[d][1],toDelete[d][2])
    }
    saveNewConfig()
  }
}


process.on('SIGINT', async () => {
  const cid = "-1001435750887"
  const thread = "0"
  sendNotificationToChannel("BuyBot Died!", cid, thread)
  await sleep(1000);
  process.exit();
});


init()

