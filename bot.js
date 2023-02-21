
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

// const bcToken = "5913793705:AAGpxwO1ZTtXyWarfE-Rbs-PJtrnMigqkhY" // testing
const bcToken = "6257861424:AAGpr6cdQw1DIuKJNtjEb3KkrPbNT6Ybcbc"  // prod
const bcbot = new telegramBot(bcToken, {polling: true})

const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls

const lpabi = require("./abis/lp.json");
const factoryABI = require("./abis/factorcy.json");
const uniswapABI = require("./abis/uni-Factory.json");
const uniLPABI = require("./abis/uniLP.json");

bot.onText(/^\/setup/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);

    if((data.status == "creator") || (data.status == "administrator")) {
      SetupMenu(cid, thread)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})


const SetupMenu = (cid, thread) => {
let tokenAddress
let optionChosen

const cancel = [{"text": "CANCEL", "callback_data": "CANCEL"}]

  let tokenlist = []
  const itemlist = []
  for(let c=0; c<configs.length; c++){
    for(let ch =0; ch<configs[c].CHANNEL.length; ch++){
      if(configs[c].CHANNEL[ch].CHATID === cid){
        for(let t=0; t<configs[c].CHANNEL[ch].THREAD.length; t++) {
          if(configs[c].CHANNEL[ch].THREAD[t] === thread){
            let added = false
            for(let i=0; i<tokenlist.length; i++){
              if(configs[c].TOKEN === tokenlist[i]) added = true
            }
            if(!added){
              tokenlist.push(configs[c].TOKEN)
              itemlist.push([{"text": `${configs[c].NAME}: ${configs[c].TOKEN}`,"callback_data": c}])
            }            
          }
        }
      }
    }
  }
  itemlist.push(cancel)

  let reply_markup = {"inline_keyboard": itemlist}
  opts = {
    message_thread_id: thread,
    disable_web_page_preview: true,
    parse_mode: 'Markdown',
    reply_markup: reply_markup
  }

  bot.sendMessage(cid, 'Edit Which Token?', opts)

bot.on('callback_query', function onCallbackQuery(callbackQuery) { 
  const action = callbackQuery.data; 
  const msg = callbackQuery.message;

  if(action === "CANCEL") {
    bot.deleteMessage(cid, msg.message_id);
    bot.off('callback_query')
    return
  }

  // after choosing Token
  if(msg.text === 'Edit Which Token?') {
    tokenAddress = configs[action].TOKEN
    let cMIN
    let cPER
    for(let c=0; c<configs[action].CHANNEL.length; c++) {
      if(configs[action].CHANNEL[c].CHATID === cid) {
        cMIN = configs[action].CHANNEL[c].MINBUY
        cPER = configs[action].CHANNEL[c].PERDOT
        break
      }
    }
    const settings = [`MINBUY ($${cMIN})`, `PERDOT ($${cPER})`, 'REMOVE']
   const il = []
    for(let i=0; i<settings.length; i++){
      il.push([{"text": `${settings[i]}`, "callback_data": settings[i]}])
    }
    il.push(cancel)
    reply_markup = {"inline_keyboard": il}

    const opts1 = { 
      chat_id: msg.chat.id, 
      message_id: msg.message_id,
      reply_markup: reply_markup 
    }; 
 
    bot.editMessageText('Change What?', opts1); 
  }

  if(msg.text === 'Change What?') {
    optionChosen = action
  if(optionChosen === "REMOVE") {
    removeStep2(tokenAddress, cid, thread)
    bot.deleteMessage(cid, msg.message_id);
    return
  } else {  
    const options = [ 0,5,10,25,50,100]
    let il2 = []
    for(let m=0; m<options.length; m++){
      il2.push([{"text": `$${options[m]}.00`, "callback_data": options[m]}])
    }
    il2.push(cancel)
    reply_markup = {"inline_keyboard": il2}
    const opts2 = { 
      chat_id: msg.chat.id, 
      message_id: msg.message_id,
      reply_markup: reply_markup 
    }; 
    bot.editMessageText('New Dollar Amount?', opts2); 
  }
  }

  // after chooseing amount
  if(msg.text === 'New Dollar Amount?') {
    bot.deleteMessage(cid, msg.message_id);
     if(optionChosen === "MINBUY") minBuy(tokenAddress, cid, thread, action)
     if(optionChosen === "PERDOT") perdot(tokenAddress, cid, thread, action)
    
    bot.off('callback_query')
    return
  }
 
  
}); 

}
const getAdLink = () => {
  const index = Math.floor((Math.random() * ads.length));
  return  `\nad: [${ads[index].NAME}](${ads[index].TGLINK})`
}



bot.onText(/^\/grouplist/, async function(message, match) {   
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
    if(message.chat.type === "private") {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      let groups = []
      for(let g=0; g<configs.length; g++){
        for(let d=0; d<configs[g].CHANNEL.length; d++) {
          // check if in groups
          let duplicate = false
          for(let gd=0; gd<groups.length; gd++){
            if(configs[g].CHANNEL[d].CHATID === groups[gd]) {
              duplicate = true
              break
            } 
          }
          if(!duplicate) groups.push(configs[g].CHANNEL[d].CHATID)
        }
      }
      let grouplist = "Group List!\n\n"
      for(let c=0; c<groups.length; c++){
        
        const apiUrl = `https://api.telegram.org/bot${token}/getChat?chat_id=${groups[c]}`
        const res = await fetch(apiUrl);
        const info = await res.json();
        if(info.ok) {
          const titleRaw = info.result.title
          const title = titleRaw.substring(0,38)
          const invitelink = info.result.invite_link

          grouplist = grouplist + `[${title}](${invitelink})\n`
        }
      }
      sendNotificationToChannel(grouplist, cid, 0)
    }
  })
})

bot.onText(/^\/fgbot/, async function(message, match) {   
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
      bot.deleteMessage(cid, message.message_id);
     
      sendNotificationToChannel(
       "*FG Bot Commands*\n" +
       "*/addtoken* <tokenAddress>\n"+
       "Adds Token to BuyBot List\n" +
        "\n" +
        "*/setup*: To Modify Listed Tokens\n"+
        "\n" +
       "*/removetoken* <tokenAddress>\n" +
       "Removes Token from BuyBot list\n" +
       "\n" +
       "*/minbuy* <tokenAddress> <amount>\n" + 
       "Set Min $ Buy for Token\n" +
       "\n" +
       "*/perdot* <tokenAddress > <amount>\n" + 
       "Set $ Per Dot for Token\n" +
       "\n" +
       "*/changedot* <emoji>\n" + 
       "Change the Emoji!\n" +
       "\n" +
       "*/<Coin Symbol>* Checks price of Coin\n" +
       "\n" +
       "*/price* <tokenAddress> <dex>\n" +
       "Checks price of Token on DEX\n" +
       "\n" +
       "*/price* <token Symbol>\n" +
       "Checks price of Token by Symbol\n" +
       "*IF ERROR USE FIRST METHOD*\n" +
       "\n" +
       `*/bcprice* <ticker>\n` +
       "Bitcointry Market Info for Ticker\n" +
       "\n" +
       "*Channel Commands*\n" +
       "*/blockprice* Block Price Commands\n" +
       "*/allowprice* Allows Price Commands\n" +
       "\n" +
       "*LISTS*\n" +
       "*/tokenlist*: List of Tokens in group\n" +
       "*/dexlist*: List of all Dex's\n" +
       "*/dexlist* <chain>: Dex list by Chain\n" +
       "*/chainlist*: List of Chains available\n" +
       getAdLink() +
       "\n" + getLink(1)
       
        , cid, thread)
})


bot.onText(/^\/chainlist/, async function(message, match) {   
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
    if((data.status == "creator") || (data.status == "administrator")) { 
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  let chainsList = ""
  for(let c=0; c<chain.length; c++){
    chainsList = chainsList + `*${chain[c].LONGNAME}:* ${chain[c].NAME} \n`
  }
  sendNotificationToChannel(
    "* Chain List *\n" +
    chainsList + "\n" +
    getAdLink() +
   "\n" + getLink(1)
    
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
      bot.deleteMessage(cid, message.message_id);
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
            dexList = dexList + `*${exchange[c].LONGNAME} ${exchange[c].CHAIN.NAME}*: ${exchange[c].NAME} \n`
          }
        }
        sendNotificationToChannel(
          `* Dex List ${exchange[cIndex].LONGNAME} *\n` +
          dexList + "\n" +
          getAdLink() +
         "\n" + getLink(1)
         
          , cid, thread)
      } else {
        for(let c=0; c<exchange.length; c++){
          dexList = dexList + `*${exchange[c].LONGNAME} ${exchange[c].CHAIN.NAME}*: ${exchange[c].NAME} \n`
        }
        sendNotificationToChannel(
          `* Dex List *\n` +
          dexList + "\n" +
          getAdLink() +
         "\n" + getLink(1)
          , cid, thread)
      }
    }
  })
})

bot.onText(/^\/tokenlist/, async function(message, match) {    
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      let tokenlist = ""
      for(let c=0; c<configs.length; c++){
        for(let ch =0; ch<configs[c].CHANNEL.length; ch++){
          if(configs[c].CHANNEL[ch].CHATID === cid){
            for(let t=0; t<configs[c].CHANNEL[ch].THREAD.length; t++) {
              if(configs[c].CHANNEL[ch].THREAD[t] === thread){
                const e = configs[c].EXCHANGE
                tokenlist = tokenlist + `*${configs[c].SYM}/${configs[c].BSYM}: ${exchange[e].CHAIN.NAME} ${exchange[e].NAME}*\n ${configs[c].TOKEN}\n`
              }
            }
          }
        }
      }
      sendNotificationToChannel(
        "* Tokens List *\n" +
        tokenlist + "\n" +
        getAdLink() +
       "\n" + getLink(1) 
        , cid, thread)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})

const minBuy = (tokenAddress, cid, thread, amount) => {
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
}

bot.onText(/^\/minbuy/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
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
const perdot = (tokenAddress, cid, thread, amount) => {
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
}

bot.onText(/^\/perdot/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
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


bot.onText(/^\/changedot/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    let changed = false
    if((data.status == "creator") || (data.status == "administrator")) {
      const image = message.text.substring(11)

      for(let i=0; i<configs.length; i++) {
          for(let c=0; c<configs[i].CHANNEL.length; c++){
            if(configs[i].CHANNEL[c].CHATID === cid) {
              configs[i].CHANNEL[c].DOTIMAGE = image
              changed = true
            }
          }
      }
     saveNewConfig()
     if(changed) {
     sendNotificationToChannel(`*Changed* Dot to` + image , cid, thread)
     }
     else sendNotificationToChannel(`Dot Image not setup`, cid, thread);
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
  }catch{sendNotificationToChannel("Error, Check Values", ChatId, thread)}
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
    if(didntExist) sendNotificationToChannel("Token Not In List", ChatId, thread)

  }catch{
    sendNotificationToChannel("Error Checking Values", ChatId, thread)
 }
}

const init = async () => {
  await loadConfig()
  for(let i=0; i<configs.length;i++){
    startListener(i)
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
      bot.deleteMessage(cid, message.message_id);
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
      bot.deleteMessage(cid, message.message_id);
      if(!checkIfAllowed(cid, thread)){
        sendNotificationToChannel("Price Commands Allowed For This Group/Topic", cid, thread)
        removeFromBlocked(cid, thread)
      }
      else sendNotificationToChannel("Not blocked", cid, thread)
    }
  })
})

const sendNotificationToChannel = async (message, cid, thread) => {
  bot.sendMessage(cid, message, {parse_mode: 'Markdown', disable_web_page_preview: true, message_thread_id: thread}).catch(() => {
    console.log("Error Sending to Channel")
  });
}

const sendNotificationToChannelPrice = async (message, cid, thread) => {
  if(checkIfAllowed(cid, thread)) {
    bot.sendMessage(cid, message, {parse_mode: 'Markdown', disable_web_page_preview: true, message_thread_id: thread}).catch(() => {
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


const chooseDex = (cid, thread,tokenAddress) => {
  let selectedChain
  let selectedDex
  let opts

  const ch = []
  for(let c=0; c<chain.length; c++) {
    ch.push([{"text": chain[c].LONGNAME ,"callback_data": c}])
  }
  let reply_markup = {"inline_keyboard": ch}
  opts = {
    message_thread_id: thread,
    disable_web_page_preview: true,
    parse_mode: 'Markdown',
    reply_markup: reply_markup
  }

  bot.sendMessage(cid, 'Choose Chain', opts)

bot.on('callback_query', function onCallbackQuery(callbackQuery) { 
  const action = callbackQuery.data; 
  const msg = callbackQuery.message;

  // after choosing Chain
  if(msg.text === 'Choose Chain') {
    selectedChain = action
    let ex = []
    for(let k=0; k<exchange.length; k++) {
      if(exchange[k].CHAIN === chain[selectedChain]){
        ex.push([{"text": exchange[k].NAME ,"callback_data": k}])
      }
    }
    reply_markup = {"inline_keyboard": ex}
    const opts = { 
      chat_id: msg.chat.id, 
      message_id: msg.message_id,
      reply_markup: reply_markup 
    }; 
 
    bot.editMessageText('Choose Dex', opts); 
  }

  // after chooseing Dex
  if(msg.text === 'Choose Dex') {
    selectedDex = action
   
    bot.deleteMessage(cid, msg.message_id);
    
      addStep2(cid, thread, tokenAddress, selectedDex)
    
    bot.off('callback_query')
  }
  
}); 

}
bot.on("polling_error", console.log);

bot.onText(/^\/addtoken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
    const tokenAddress = message.text.substring(10, 52)

    if((data.status == "creator") || (data.status == "administrator")) {
      chooseDex(cid, thread, tokenAddress)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})
    

const addStep2 = async(cid, thread, tokenAddress, index) => {

    if(tokenAddress.toLowerCase() === exchange[index].CHAIN.NATIVE.toLowerCase()) {
      sendNotificationToChannel(`Can't Add Native Token`, cid, thread);
      return; 
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
              MINBUY: 0,
              PERDOT: 5,
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
  }
  
  
const removeStep2 = async(tokenAddress, cid, thread) => {
  let lpAddress = tokenAddress
  for(let i=0; i<configs.length; i++) {
    if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
      lpAddress = configs[i].LPADDRESS
      
      removeToken(lpAddress, cid, thread)
    }
  }
}
  
bot.onText(/^\/removetoken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);
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
    const number_1 = new BigNumber(sqrtPriceX96 * sqrtPriceX96 * (bd)/(td)).dividedBy(new BigNumber(2) ** (new BigNumber(192)));
    price = number_1.multipliedBy(cicPrice).toFixed(14)
  }

  const mc = totalSupply.minus(burned).shiftedBy(-tDecimals).multipliedBy(price).toFixed(2)

  return { sym, price, mc, bsym }
}

const getMC = async(tokenAddress, price, cIndex) => {
  const signer = getSigner(cIndex)
  tContract = new Contract(
    tokenAddress,
    lpabi,
    signer
  );

  const tdRaw = await tContract.decimals()
  const tsRaw = await tContract.totalSupply()
  const bRaw = await tContract.balanceOf("0x000000000000000000000000000000000000dEaD")

  const tDecimals = new BigNumber(tdRaw.toString())
  const totalSupply = new BigNumber(tsRaw.toString())
  const burned = new BigNumber(bRaw.toString())

  const mc = totalSupply.minus(burned).shiftedBy(-tDecimals).multipliedBy(price).toFixed(2)
  return mc
}

bot.onText(/^\/cic/, async function(message, match) {   
    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice, mc } = await getBNBPrice(0)

 sendNotificationToChannelPrice(
  `*CIC Price:* $${cicPrice}\n` +
  `*CIC MC:* $${mc}\n` +
  getAdLink() +
 "\n" + getLink(0)
 , cid, thread)

})
bot.onText(/^\/CIC/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice, mc } = await getBNBPrice(0)

  sendNotificationToChannelPrice(
    `*CIC Price:* $${cicPrice}\n` +
    `*CIC MC:* $${mc}\n` +
    getAdLink() +
   "\n" + getLink(0)
   , cid, thread)

})

bot.onText(/^\/bnb/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(3)
 sendNotificationToChannelPrice(
  `*BNB Price:* $${cicPrice}\n` +
  getAdLink() +
 "\n" + getLink(1)
 , cid, thread)
})
bot.onText(/^\/BNB/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(3)
  sendNotificationToChannelPrice(
    `*BNB Price:* $${cicPrice}\n` +
    getAdLink() +
   "\n" + getLink(1)
    , cid, thread)
})
bot.onText(/^\/eth/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(7)
 sendNotificationToChannelPrice(
  `*ETHERUEM Price:* $${cicPrice}\n` +
  getAdLink() +
 "\n" + getLink(1)
 , cid, thread)
})
bot.onText(/^\/ETH/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(7)
  sendNotificationToChannelPrice(
    `*ETHEREUM Price:* $${cicPrice}\n` +
    getAdLink() +
   "\n" + getLink(1)
   , cid, thread)
})
bot.onText(/^\/cro/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(10)
 sendNotificationToChannelPrice(
  `*CRO Price:* $${cicPrice}\n` +
  getAdLink() +
 "\n" + getLink(1)
 , cid, thread)
})
bot.onText(/^\/CRO/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(10)
  sendNotificationToChannelPrice(
    `*CRO Price:* $${cicPrice}\n` +
    getAdLink() +
   "\n" + getLink(1)
   , cid, thread)
})
bot.onText(/^\/dxt/, async function(message, match) {     
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(11)
 sendNotificationToChannelPrice(
  `*DXT Price:* $${cicPrice}\n` +
  getAdLink() +
 "\n" + getLink(1)
 , cid, thread)
})
bot.onText(/^\/DXT/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const { cicPrice } = await getBNBPrice(11)
  sendNotificationToChannelPrice(
    `*DXT Price:* $${cicPrice}\n` +
    getAdLink() +
   "\n" + getLink(1)
   , cid, thread)
})

bcbot.onText(/^\/price/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const pairRaw =  message.text.substring(7)
  const pair = pairRaw.toUpperCase()
  let sym
  const info = await getBCInfo(pair)
  if(!info.status) {
    sendNotificationToChannel("Error, Check Spelling", cid, thread)
    return
  }
  const symRaw = info.pairs
  // find _ in pair name
  let index
  for(let i=0; i<symRaw.length; i++){
    if(symRaw[i] === "_"){ index = i; break}
  }
  sym = symRaw.substring(0,index)
  const lastPrice = info.lastPrice
  const change = info.percentChange
  const high = info.high24hr
  const low = info.low24hr
  const volume = new BigNumber(info.quoteVolume).toFixed(2)

  sendNotificationToBCBot(
    `[Bitcointry](https://bitcointry.com/en/market) Market Info!\n` +
    `*${sym} Price:* $${lastPrice}\n` +
    "\n" +
    `*24hr Volume:* $${volume}\n` +
    `*24hr Low:* $${low}\n` +
    `*24hr High:* $${high}\n` +
    `*24hr Change:* ${change}%\n` +
    `[Buy ${sym}](https://bitcointry.com/en/exchange/${symRaw})\n` +
    getAdLink()
   , cid, thread)
   
})
const sendNotificationToBCBot = async (message, cid, thread) => {
  bcbot.sendMessage(cid, message, {disable_web_page_preview: true, message_thread_id: thread, parse_mode: 'Markdown'})
}

bot.onText(/^\/bcprice/, async function(message, match) {    
  const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
  const cid = message.chat.id.toString()
  bot.deleteMessage(cid, message.message_id);
  const pairRaw =  message.text.substring(9)
  const pair = pairRaw.toUpperCase()
  let sym
  const info = await getBCInfo(pair)
  if(!info.status) {
    sendNotificationToChannel("Error, Check Spelling", cid, thread)
    return
  }
  const symRaw = info.pairs
  // find _ in pair name
  let index
  for(let i=0; i<symRaw.length; i++){
    if(symRaw[i] === "_"){ index = i; break}
  }
  sym = symRaw.substring(0,index)
  const lastPrice = info.lastPrice
  const change = info.percentChange
  const high = info.high24hr
  const low = info.low24hr
  const volume = new BigNumber(info.quoteVolume).toFixed(2)

  sendNotificationToChannelPrice(
    `[Bitcointry](https://bitcointry.com/en/market) Market Info!\n` +
    `*${sym} Price:* $${lastPrice}\n` +
    "\n" +
    `*24hr Volume:* $${volume}\n` +
    `*24hr Low:* $${low}\n` +
    `*24hr High:* $${high}\n` +
    `*24hr Change:* ${change}%\n` +
    `[Buy ${sym}](https://bitcointry.com/en/exchange/${symRaw})\n` +
    getAdLink() +
   "\n" + getLink(1)
   , cid, thread)
   
})

const getBCInfo = async (pair) => {
  const apiUrl = `https://api.bitcointry.com/api/v1/ticker?symbol=${pair}USDT`
  let info
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      console.log(res.status)
      throw new Error("Bad response from server");
    }
    info = await res.json();
    } catch (err) {
    console.error("Unable to connect to Binance API", err);
   }
  return  info
};




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
      bot.deleteMessage(cid, message.message_id);
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
              `*${sym} / ${bsym}*\n` +
              `*Price:* $${price}\n` +
              `*MCap:* $${mc}\n` +
              `*${exchange[cIndex].CHAIN.NAME} Price:* $${cicPrice}\n` +
              getAdLink() + "\n" +
              link
              ,cid, thread);
        
      } catch {
        sendNotificationToChannelPrice( "Not Valid TOKEN", cid, thread);
     }
    
})


const getLink = (index) => {
  if(exchange[index].CHAIN.NAME === "CIC") return  `[Farmageddon](https://cic.farmageddon.farm/) | [Telegram](https://t.me/FARMAGEDDON_TOKEN)`
  return  `[Farmageddon](https://farmageddon.farm/) | [Telegram](https://t.me/FARMAGEDDON_TOKEN)`
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

const sym = (cicSpent, cIndex, channel) => {
  const image = channel.DOTIMAGE ?? exchange[cIndex].DOTS
  
  const howMany = new BigNumber(cicSpent).toNumber()
  let dots = image
  if(howMany > 1){
    for(let i=1; i<howMany; i++){
      dots = dots + image
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
    const mc = await getMC(configs[index].TOKEN, FRTcValue, configs[index].EXCHANGE )

    sendBuyBotMessage(index, bought, FRTcValue, spent, txhash, receiver, buyer, inAmount, cicPrice, mc);
  
  });
  console.log(`Loaded For ${configs[index].TOKEN} | In ${configs[index].CHANNEL.length} Channels`)
}

const sendBuyBotMessage = async (index, bought, FRTcValue, spent, txhash, receiver, buyer, inAmount, cicPrice, mc) => {
  const c = configs[index].CHANNEL
  let toDelete = []
  
  const cIndex = configs[index].EXCHANGE
  const link = getLink(cIndex)

  for(let i=0; i<c.length; i++){
    for(let t=0; t<c[i].THREAD.length; t++){
      const thread = c[i].THREAD[t]
      const bdec = new BigNumber(configs[index].BDECIMALS).toNumber()

      
        const dots = sym(new BigNumber(spent).dividedBy(configs[index].CHANNEL[i].PERDOT).toFixed(0), cIndex, configs[index].CHANNEL[i])
        var message =
        `*${configs[index].NAME}* Bought!!\n` +
        `*${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP*\n` +
        dots +
        `\n*Spent:* $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(-bdec).toFixed(4)} ${configs[index].BSYM})\n` +
        `*Received:* ${new BigNumber(bought).toFixed(2)} ${configs[index].SYM}\n` +
        `*${configs[index].SYM} Price:* $${FRTcValue}\n` +
        `*${configs[index].SYM} MC:* $${mc}\n` +
        `*${exchange[cIndex].CHAIN.NAME}:* $${cicPrice}\n` +
        `[ TX  ](${exchange[cIndex].CHAIN.EXP}tx/${txhash})` +
        ` | ` + 
        `[ Buyer ](${exchange[cIndex].CHAIN.EXP}address/${buyer})` + ` | ` +
        `[ Receiver ](${exchange[cIndex].CHAIN.EXP}address/${receiver})\n` +
         getAdLink() +
        `\n` +
        link

        if( new BigNumber(spent).gt(configs[index].CHANNEL[i].MINBUY) ) {
       
         bot.sendMessage(c[i].CHATID, message, { message_thread_id: thread, disable_web_page_preview: true, parse_mode: 'Markdown' } )
          
          .catch(() => {
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

