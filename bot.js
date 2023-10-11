
const dotenv = require("dotenv");
const fs = require("fs");
const fetch = require("cross-fetch");
const sleep = require("util").promisify(setTimeout);
const { JsonRpcProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const { Contract } = require("ethers");
const BigNumber = require('bignumber.js');
const telegramBot = require('node-telegram-bot-api');
const axios = require(`axios`);
const {
  chain,
  exchange,
  ads,
  baseCheckers
} = require("./config/chainConfig");

const result = dotenv.config();
if (result.error) {
}

const token = process.env.BOT_TOKEN  // testing
const bot = new telegramBot(token, {polling: true})

const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls

const lpabi = require("./abis/lp.json");
const tokenabi = require("./abis/token.json")
const factoryABI = require("./abis/factorcy.json");
const uniswapABI = require("./abis/uni-Factory.json");
const uniLPABI = require("./abis/uniLP.json");


bot.onText(/^\/setup/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
    const cid = message.chat.id.toString()
    bot.deleteMessage(cid, message.message_id);

    if((data.status == "creator") || (data.status == "administrator")) {
      SetupMenu(cid, thread, false)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})


const SetupMenu = (cid, thread, isPrice) => {
let tokenAddress
let optionChosen

const cancel = [{"text": "CANCEL", "callback_data": "CANCEL"}]

  let tokenlist = []
  let dexlist = []
  let firstIndex

  const itemlist = []
  for(let c=0; c<configs.length; c++){
    for(let ch =0; ch<configs[c].CHANNEL.length; ch++){
      if(configs[c].CHANNEL[ch].CHATID === cid){
        for(let t=0; t<configs[c].CHANNEL[ch].THREAD.length; t++) {
          if(configs[c].CHANNEL[ch].THREAD[t] === thread){
            let added = false
            for(let i=0; i<tokenlist.length; i++){
              if(configs[c].TOKEN === tokenlist[i] && configs[c].EXCHANGE === dexlist[i]) added = true
            }
            if(!added){
              tokenlist.push(configs[c].TOKEN)
              dexlist.push(configs[c].EXCHANGE)
              firstIndex = c
              itemlist.push([{"text": `${configs[c].NAME}| ${exchange[configs[c].EXCHANGE].NAME}: ${configs[c].TOKEN}`,"callback_data": c}])
            }            
          }
        }
      }
    }
  }
  if (tokenlist.length === 1 && isPrice){
    const lpAddress = configs[firstIndex].LPADDRESS
    getPrices(cid, thread, lpAddress, firstIndex , true)
  } else if(itemlist.length > 0) {
    itemlist.push(cancel)

    let reply_markup = {"inline_keyboard": itemlist}
    opts = {
      message_thread_id: thread,
      disable_web_page_preview: true,
      parse_mode: 'Markdown',
      reply_markup: reply_markup
    }

    bot.sendMessage(cid, 'Choose Token?', opts)
    
  }
let fCID
bot.on('callback_query', fCID = function onCallbackQuery(callbackQuery) { 
  const action = callbackQuery.data; 
  const msg = callbackQuery.message;
if(msg.chat.id == cid){

  if(action === "CANCEL") {
    bot.deleteMessage(cid, msg.message_id);
    bot.off('callback_query', fCID)
    return
  }

  // after choosing Token
  if(msg.text === 'Choose Token?') {

    if(isPrice){
      tokenAddress = configs[action].LPADDRESS
      bot.deleteMessage(cid, msg.message_id);
      getPrices(cid, thread, tokenAddress, action, true)
     bot.off('callback_query', fCID)
    }else {
      tokenAddress = configs[action].TOKEN
      let cMIN
      let cPER
      let cDOT
      for(let c=0; c<configs[action].CHANNEL.length; c++) {
        if(configs[action].CHANNEL[c].CHATID === cid) {
          cMIN = configs[action].CHANNEL[c].MINBUY
          cPER = configs[action].CHANNEL[c].PERDOT
          cDOT = configs[action].CHANNEL[c].DOTIMAGE
          break
        }
      }

    const il=[
      [{"text": `MINBUY ($${cMIN})`, "callback_data": "MINBUY"},{"text": `PERDOT ($${cPER})`, "callback_data": "PERDOT"}],
      [{"text": `CHGDOT (${cDOT})`, "callback_data": "CHGDOT"}],
      [{"text": "REMOVE", "callback_data": "REMOVE"}] 
    ]
    
      il.push(cancel)
      reply_markup = {"inline_keyboard": il}

      const opts1 = { 
        chat_id: msg.chat.id, 
        message_id: msg.message_id,
        reply_markup: reply_markup 
      }; 
 
      bot.editMessageText('Change What?', opts1); 
    }
  }
  
  if(msg.text === 'Change What?') {
    optionChosen = action.substring(0,6)
  if(optionChosen === "REMOVE") {
    removeStep2(tokenAddress, cid, thread)
    bot.deleteMessage(cid, msg.message_id);
    bot.off('callback_query', fCID)
    return
  } else if(optionChosen === "CHGDOT"){
    const options = [ "🟢","🔵","🚜","💶","💰","🤑","💩","🟩"] // multiples of 2!
    let il4 = []
    for(let d=0; d<options.length; d=d+2){
      il4.push([{"text": `${options[d]}`, "callback_data": options[d]},{"text": `${options[d+1]}`, "callback_data": options[d+1]}])
    }
    il4.push(cancel)
    reply_markup = {"inline_keyboard": il4}
    const opts4 = { 
      chat_id: msg.chat.id, 
      message_id: msg.message_id,
      reply_markup: reply_markup 
    }; 
    bot.editMessageText('New Symbol for DOTs', opts4);
  } else {  
    const options = [ 0,5,10,25,50,100,250,500,1000,2000] // multiples of 2!
    let il2 = []
    for(let m=0; m<options.length; m=m+2){
      il2.push([{"text": `$${options[m]}.00`, "callback_data": options[m]},{"text": `$${options[m+1]}.00`, "callback_data": options[m+1]}])
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

  if(msg.text === 'New Symbol for DOTs') {
    bot.deleteMessage(cid, msg.message_id);
    chgDot(tokenAddress, cid, thread, action)
    bot.off('callback_query', fCID)

  }

  // after chooseing amount
  if(msg.text === 'New Dollar Amount?') {
    bot.deleteMessage(cid, msg.message_id);
     if(optionChosen === `MINBUY`) minBuy(tokenAddress, cid, thread, action)
     if(optionChosen === `PERDOT`) perdot(tokenAddress, cid, thread, action)
     bot.off('callback_query', fCID)
    
  }
 
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

bot.onText(/^\?help/, async function(message, match) {   
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id
      const cid = message.chat.id.toString()
      bot.deleteMessage(cid, message.message_id);
     
      sendNotificationToChannel(
       "*MarsBot Commands*\n" +
       "*/addtoken* <tokenAddress>\n"+
       "Adds Token to BuyBot List\n" +
        "\n" +
        "*/setup*: To Modify Listed Tokens\n"+
        "\n" + 
       // "*/removetoken* <tokenAddress>\n" +
       // "Removes Token from BuyBot list\n" +
       // "\n" +
       // "*/minbuy* <tokenAddress> <amount>\n" + 
       // "Set Min $ Buy for Token\n" +
       // "\n" +
       // "*/perdot* <tokenAddress > <amount>\n" + 
       // "Set $ Per Dot for Token\n" +
       // "\n" +
       "*/changedot* <emoji>\n" + 
       "Change the Emoji!\n" +
       "\n" +
       "*??<symbol>* Checks price of Asset\n" +
       "\n" +
       "*??*<tokenAddress> <dex>\n" +
       "Checks price of Asset on DEX\n" +
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
       "\n" + getLink()
       
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
   "\n" + getLink()
    
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
         "\n" + getLink()
         
          , cid, thread)
      } else {
        for(let c=0; c<exchange.length; c++){
          dexList = dexList + `*${exchange[c].LONGNAME} ${exchange[c].CHAIN.NAME}*: ${exchange[c].NAME} \n`
        }
        sendNotificationToChannel(
          `* Dex List *\n` +
          dexList + "\n" +
          getAdLink() +
         "\n" + getLink()
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
       "\n" + getLink() 
        , cid, thread)
    } else {
      sendNotificationToChannel("not Admin", cid, thread)
    }
  })
})

const minBuy = (tokenAddress, cid, thread, amount) => {
  let changed = false
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
  let changed = false
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


const chgDot = (tokenAddress, cid, thread, image) => {
  let changed = false
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN === tokenAddress){
          for(let c=0; c<configs[i].CHANNEL.length; c++){
            if(configs[i].CHANNEL[c].CHATID === cid) {
              configs[i].CHANNEL[c].DOTIMAGE = image
              changed = true
            }
          }
        }
      }
     saveNewConfig()
     if(changed) {
     sendNotificationToChannel(`*Changed* Dot to` + image , cid, thread)
     }
     else sendNotificationToChannel(`Dot Image not setup`, cid, thread);
}

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


const getSigner = (index) => {
  const rpc = exchange[index].CHAIN.RPC

  const signer = new Wallet(
    PRIVATE_KEY,
    new JsonRpcProvider(rpc)
  )
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
  try {

  const signer = await getSigner(index)
  const minBuy = 0
  const perDot = 5


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
                if(configs[i].CHANNEL[c].THREAD.length === 1){
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
    console.log(`Error Sending Msg to Channel ${cid}, ${thread}`)
  });
}

const sendNotificationToChannelPrice = async (message, cid, thread) => {
  if(checkIfAllowed(cid, thread)) {
    bot.sendMessage(cid, message, {parse_mode: 'Markdown', disable_web_page_preview: true, message_thread_id: thread }).catch(() => {
      console.log(`Error Sending Price to Channel ${cid}, ${thread}`)
    });
  }  
}

const getSymPrice = async (symbol) => {
  
  const apiUrl = "https://min-api.cryptocompare.com/data/price?fsym="+symbol+"&tsyms=USD"
  
  let symPrice = 0
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      console.log(res.status)
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    
    symPrice = parseFloat(price.USD)
     
   } catch (err) {
    console.error("Unable to connect to API", err);
   }
  return symPrice
};

const API_KEY = '7c863d8e-2668-489d-9d3b-531210cd2016';
// CoinMarketCap API URL for Bitcoin (BTC
const getCMCInfo = async (symbol) => {
  const BIGSYMBOL = symbol.toUpperCase()
  const API_URL = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${BIGSYMBOL}`;
  try {
    const response = await axios.get(API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
      },
    });

   
    const bitcoinDataRaw = response.data.data[BIGSYMBOL];

    return bitcoinDataRaw

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}



const chooseDex = (cid, thread,tokenAddress, isPrice) => {
  let selectedChain
  let selectedDex
  let opts

  const cancel = [{"text": "CANCEL", "callback_data": "CANCEL"}]

  const ch = []
  for(let c=0; c<chain.length; c=c+2) {
    if(c+1 >= chain.length){
      ch.push([{"text": chain[c].LONGNAME ,"callback_data": c}])
    } else {
      ch.push([{"text": chain[c].LONGNAME ,"callback_data": c},{"text": chain[c+1].LONGNAME ,"callback_data": c+1}])
    }
  }
  ch.push(cancel)
  let reply_markup = {"inline_keyboard": ch}
  opts = {
    message_thread_id: thread,
    disable_web_page_preview: true,
    parse_mode: 'Markdown',
    reply_markup: reply_markup
  }

  bot.sendMessage(cid, 'Choose Chain', opts)
let fCID
bot.on('callback_query' , fCID = function onCallbackQuery(callbackQuery){ 
  const action = callbackQuery.data; 
  const msg = callbackQuery.message;
  if(msg.chat.id == cid){

  if(action === "CANCEL") {
    bot.deleteMessage(cid, msg.message_id);
    bot.off('callback_query', fCID)
    return
  }
  let tmp = []
  // after choosing Chain
  if(msg.text === 'Choose Chain') {
    selectedChain = action
    for(let d=0; d<exchange.length; d++) {
      if(exchange[d].CHAIN === chain[selectedChain]){
        tmp.push(d)
      }
    }

    let ex = []
    for(let k=0; k<tmp.length; k=k+2) {
      if(k+1 >= tmp.length) {
        ex.push([{"text": exchange[tmp[k]].LONGNAME ,"callback_data": tmp[k]}])
      } else {
        ex.push([{"text": exchange[tmp[k]].LONGNAME ,"callback_data": tmp[k]},{"text": exchange[tmp[k+1]].LONGNAME ,"callback_data": tmp[k+1]}])
      }
      
    }
    ex.push(cancel)
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
    selectedDex = parseInt(action)
   
    bot.deleteMessage(cid, msg.message_id);
    try {
      if(isPrice){
        getPrices(cid, thread, tokenAddress, selectedDex, false)
        bot.off('callback_query', fCID)
      } else {
        addStep2(cid, thread, tokenAddress, selectedDex)
        bot.off('callback_query', fCID)
      }
    } catch {
      sendNotificationToChannel("ERROR", cid, thread)
      bot.off('callback_query', fCID)
    }
    
    bot.off('callback_query', fCID)

  }
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
    if(tokenAddress.length < 42) {
      sendNotificationToChannel("Must enter a Token Address", cid, thread)
      return
    }
    if((data.status == "creator") || (data.status == "administrator")) {
      chooseDex(cid, thread, tokenAddress, false)
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
            if(configs[j].CHANNEL.length === 0) await startListener(j)
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
  for(let i=configs.length-1; i>=0; i--) {
    if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
      lpAddress = configs[i].LPADDRESS
      await removeToken(lpAddress, cid, thread)
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
      for(let i=configs.length-1; i>=0; i--) {
        if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) {
          lpAddress = configs[i].LPADDRESS
          await removeToken(lpAddress, cid, thread)
         
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
  let name

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
    name = configs[Index].NAME
    
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
    name = await tContract.name()
    
    tDecimals = new BigNumber(tdRaw.toString())
    bDecimals = new BigNumber(bdRaw.toString())
    
  }

  const dec = new BigNumber(bDecimals - tDecimals)
  const baseIsNative = baseToken === exchange[cIndex].CHAIN.NATIVE
  const basePrice = baseIsNative ? cicPrice : isWETH(baseToken) ? await getSymPrice("ETH") : isBONE(baseToken) ? await getSymPrice("BONE") : 1

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

  return { sym, price, mc, bsym, name }
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


bot.onText(/^\?{2}(.+)/, async function(message, match) { 
   
      const cid = message.chat.id.toString()
      bot.deleteMessage(cid, message.message_id);
      const thread = message.message_thread_id === undefined ? 0 : message.message_thread_id

      const command = message.text.substring(2,44)
      const tExchange = message.text.substring(45)
      

      let cIndex =  undefined
      let LP = command

      const cLower = LP.toLowerCase()
      let index

   if(command.length === 0){
     SetupMenu(cid, thread, true)
   }else{
        for(let c=0; c<exchange.length; c++){
           if(tExchange.toLowerCase() === exchange[c].NAME.toLowerCase()) cIndex = c
        }
    let gotOne = false
        for(let i=0; i<configs.length; i++) {
          
          if(cLower == configs[i].SYM.toLowerCase()) {
            LP = configs[i].LPADDRESS;
            cIndex=configs[i].EXCHANGE;
            index = i
            gotOne = true
            break
          } else if(cLower == configs[i].TOKEN.toLowerCase() && cIndex !== undefined && exchange[cIndex].NAME === exchange[configs[i].EXCHANGE].NAME) {
            LP = configs[i].LPADDRESS; 
            cIndex=configs[i].EXCHANGE;
            index = i
            gotOne = true
            break
          } else if (cLower == configs[i].TOKEN.toLowerCase()) {
            LP = configs[i].LPADDRESS; 
            cIndex=configs[i].EXCHANGE;
            index = i
            gotOne = true
            break
          }
        }

        let sent = false
      if(gotOne){
        getPrices(cid, thread, LP, index, gotOne)
        sent = true
        return
      } else if(!gotOne && cIndex === undefined && LP.length === 42){
        chooseDex(cid, thread, LP, true)
        sent = true
        return
      } else if(!gotOne && cIndex !== undefined && LP.length === 42){
        getPrices(cid, thread, LP, cIndex, gotOne)
        sent = true
        return
      } 
      if(!sent){
        // const symbol =  message.text.substring(2)
        const bitcoinData = await getCMCInfo(command)

        const itemlist = []
        if (bitcoinData.length > 1 ){
            itemlist.push([{"text": `Other Tokens`, "callback_data": "OTHERTOKENS"}])
        }
          const reply = {"inline_keyboard": itemlist}
          opts = {
            message_thread_id: thread,
            disable_web_page_preview: true,
            parse_mode: 'Markdown',
            reply_markup: reply
          }
         
        const tokenData = command.toUpperCase() === "MSWAP" ? bitcoinData[1] : bitcoinData[0]  
        setAndDeliverPrice(cid, thread, opts, tokenData, false)
        

          let fCID
          bot.on('callback_query', fCID = function onCallbackQuery(callbackQuery) { 
            const action = callbackQuery.data; 
            const msg = callbackQuery.message;
            
            if(msg.chat.id === cid && msg.message_id === mID ){

              if(action === "OTHERTOKENS") {
                const itemlist2 = []
                for(let i=0; i<bitcoinData.length; i++) {
                  itemlist2.push([{"text": `${bitcoinData[i].name}`, "callback_data": i}])
                }
                const reply2 = {"inline_keyboard": itemlist2}
                const opts2 = { 
                  chat_id: msg.chat.id, 
                  message_id: msg.message_id,
                  reply_markup: reply2 
                }; 
           
                bot.editMessageText('Choose Other:', opts2); 

              }

              if(msg.text === "Choose Other:"){
                tokenIndex = parseInt(action)
                const tokenData2 = bitcoinData[tokenIndex]
                const opts3 = {
                  chat_id: msg.chat.id, 
                  message_id: msg.message_id,
                  message_thread_id: thread,
                  disable_web_page_preview: true,
                  parse_mode: 'Markdown',
                  reply_markup: reply
                }
                setAndDeliverPrice(cid, thread, opts3, tokenData2, true)
              }
              
            }
          })

     
      }
    }
    
  })

  const setAndDeliverPrice = async(cid, thread, opts, bitcoinData, isEdit) => {
    try {

      const { name, symbol, quote } = bitcoinData
      const { USD } = quote;

      if(new BigNumber(USD.price).gt(0)){
        const message = 
          `*${name}* (${symbol})\n` +
          `*Price*: $${USD.price.toFixed(10)} USD\n` +
          `*1hr Change:* ${USD.percent_change_1h.toFixed(2)}%\n` +
          `*24hr Change:* ${USD.percent_change_24h.toFixed(2)}%\n` +
          `*7d Change:* ${USD.percent_change_7d.toFixed(2)}%\n` +
          `*24hr Volume:* ${USD.volume_24h.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4})}\n` +
          `*FD MC:* ${USD.fully_diluted_market_cap.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4})}\n` +
          getAdLink() +
          "\n" + getLink()
          
        if(isEdit){
          const test = bot.editMessageText(message, opts)
          console.log(test)
        } else { 
          const test = bot.sendMessage(cid, message, opts).catch(() => {
            console.log(`Error Sending Price to Channel ${cid}, ${thread}`)})
            console.log(test)
        }

      } else sendNotificationToChannelPrice("No Price", cid, thread)
      } catch {
        sendNotificationToChannelPrice("Failed", cid, thread)
      }
  }

  const getPrices = async(cid, thread, address, index, gotOne) =>{
    let cIndex 
    let LP = address 

    if(gotOne) {
      cIndex=configs[index].EXCHANGE;
    } else {
      cIndex = index
    }
          
            if(!gotOne){
              LP = await getLPToken(cIndex, address)
              if(LP === "0x0000000000000000000000000000000000000000"){
                sendNotificationToChannelPrice("error", cid, thread)
                return
              }
            }
            const coinSym = exchange[cIndex].CHAIN.NAME
            const dextools = exchange[cIndex].CHAIN.DEXTOOLS
            const  cicPrice  = await getSymPrice(coinSym)
            const {sym, price, mc, bsym, name } = await getPrice(LP,cIndex, cicPrice, gotOne, index)
            const link = getLink()

            sendNotificationToChannelPrice(
              `*${name}: ${sym}*\n` +
              `*${sym} / ${bsym}*\n` +
              `*${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].LONGNAME} LP*\n` +
              `*Price:* $${price}\n` +
              `*MCap:* $${new BigNumber(mc).toNumber().toLocaleString("en-US", {maximumFractionDigits: 14})}\n` +
              `*${exchange[cIndex].CHAIN.NAME} Price:* $${cicPrice}\n` +
              `[ DexTools ](https://www.dextools.io/app/en/${dextools}/pair-explorer/${LP})\n` +
              getAdLink() + "\n" +
              link
              ,cid, thread);
    
}


const getLink = () => {
  return  `[Marswap](https://dex.marswap.exchange/) | [Telegram](https://t.me/MSWAP_LAUNCHPAD)`
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

  for(let i=configs.length-1; i>=0; i--) {
    if(configs[i].CHANNEL.length === 0) {
      configs[i] = configs[configs.length-1]
      configs.pop()
    }
  }
  saveNewConfig()


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

/*
const startBurnBot = async () => {
  const signer = getSigner(2)
  const deadW = "0x000000000000000000000000000000000000dEaD"
  const marswap = "0x4bE2b2C45b432BA362f198c08094017b61E3BDc6"
  
  let tokenContract = new Contract(
    "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    lpabi,
    signer
  );
// 0x4bE2b2C45b432BA362f198c08094017b61E3BDc6
  tokenContract.on("Transfer", async( from, to, amount, event) => {
    
    if(to.toString().toUpperCase() === deadW.toUpperCase() &&
      from.toString().toUpperCase() === marswap.toUpperCase()
      ) {
    const cicPrice = await getSymPrice("ETH")
    const burned = new BigNumber(amount.toString()).shiftedBy(-18)
    const burnedDollars = burned.multipliedBy(cicPrice).toFixed(2)
    const cid = "-1001971600482"
    const thread = "0"
    var message =
        `*${Burned}* SHIB Burned!!\n` +
        `*$${burnedDollars}* has been burned!!\n`
    sendNotificationToChannel(message, cid, thread)
    console.log("burned SHIB Happend")
    }
  });
}
*/

const startListener = async (index) => {
  const TConfig = configs[index]
  const dex = exchange[TConfig.EXCHANGE]
  const signer = getSigner(TConfig.EXCHANGE)
  const baseIs0 = TConfig.BASE0
  const baseIsNative = TConfig.BASEISNATIVE

  let lpcontract = new Contract(
    TConfig.LPADDRESS,
    lpabi,
    signer
  );


  lpcontract.on("Swap", async( sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
    let rawPrice
    try {
     const cicPrice = await getSymPrice(dex.CHAIN.NAME)
     rawPrice = cicPrice
    

    const txhash = event.transactionHash.toString()
    const receiver = to.toString()
    const buyer = sender.toString()

    const basePrice = baseIsNative ? rawPrice : isWETH(TConfig.BASETOKEN) ? await getSymPrice("ETH") : isBONE(baseToken) ? await getSymPrice("BONE") : 1

    const inAmount = baseIs0 ? amount0In : amount1In
    const outAmount = baseIs0 ? amount1Out : amount0Out

    const {bought, FRTcValue} = await calculate(basePrice, inAmount, outAmount, index)
    const spent = new BigNumber(inAmount.toString()).shiftedBy(-TConfig.BDECIMALS).multipliedBy(basePrice).toFixed(4)
    const mc = await getMC(TConfig.TOKEN, FRTcValue, TConfig.EXCHANGE )

    sendBuyBotMessage(index, bought, FRTcValue, spent, txhash, receiver, buyer, inAmount, rawPrice, mc);
  } catch{
    return console.log("failed During buy effect.")
  }
  });
  console.log(`Loaded For ${TConfig.TOKEN} | In ${TConfig.CHANNEL.length} Channels`)
}

const isWETH = async(checkThis) => {
  for(let i=0; i<baseCheckers.WETH.length; i++) {
    if(checkThis = baseCheckers.WETH[i]) return true
  }
  return false
}
const isBONE = async(checkThis) => {
  for(let i=0; i<baseCheckers.WBONE.length; i++) {
    if(checkThis = baseCheckers.WBONE[i]) return true
  }
  return false
}

const sendBuyBotMessage = async (index, bought, FRTcValue, spent, txhash, receiver, buyer, inAmount, cicPrice, mc) => {
  const TConfig = configs[index]
  const c = TConfig.CHANNEL
  let toDelete = []
  
  const cIndex = TConfig.EXCHANGE
  const dex = exchange[cIndex]
  const link = getLink()

  for(let i=0; i<c.length; i++){
    for(let t=0; t<c[i].THREAD.length; t++){
      const thread = c[i].THREAD[t]
      const bdec = new BigNumber(TConfig.BDECIMALS).toNumber()

      
        const dots = sym(new BigNumber(spent).dividedBy(c[i].PERDOT).toFixed(0), cIndex, c[i])
        var message =
        `*${TConfig.NAME}* Bought!!\n` +
        `*${dex.CHAIN.NAME} Chain : ${dex.LONGNAME} LP*\n` +
        dots +
        `\n*Spent:* $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(-bdec).toFixed(4)} ${TConfig.BSYM})\n` +
        `*Received:* ${new BigNumber(bought).toNumber().toLocaleString("en-US", {maximumFractionDigits: 14})} ${TConfig.SYM}\n` +
        `*${TConfig.SYM} Price:* $${FRTcValue}\n` +
        `*${TConfig.SYM} MC:* $${new BigNumber(mc).toNumber().toLocaleString("en-US", {maximumFractionDigits: 14})}\n` +
        `*${dex.CHAIN.NAME}:* $${cicPrice}\n` +
        `[ TX  ](${dex.CHAIN.EXP}tx/${txhash})` +
        ` | ` + 
        `[ Buyer ](${dex.CHAIN.EXP}address/${buyer})` + ` | ` +
        `[ Receiver ](${dex.CHAIN.EXP}address/${receiver})` + `|` +
        `[ DexTools ](https://www.dextools.io/app/en/${dex.CHAIN.DEXTOOLS}/pair-explorer/${TConfig.LPADDRESS})\n` +
         getAdLink() +
        `\n` +
        link

        if( new BigNumber(spent).gt(c[i].MINBUY) ) {
       
         bot.sendMessage(c[i].CHATID, message, { message_thread_id: thread, disable_web_page_preview: true, parse_mode: 'Markdown' } )
          
          .catch(() => {
          add = true
          for(let c =0; c<toDelete.length; c++){
            if(i === toDelete[c]) add = false
          }
          if(add) {
            toDelete.push([TConfig.LPADDRESS,c[i].CHATID, thread])
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

['SIGTERM', 'SIGQUIT']
  .forEach(signal => process.on(signal, async() => {
    const cid = "-1001971600482"
    const thread = "0"
    sendNotificationToChannel("BuyBot Died!", cid, thread)
    await sleep(1000);
    sendNotificationToChannel("Restarted", cid, thread)
  }));

process.on('SIGINT', async () => {
  const cid = "-1001971600482"
  const thread = "0"
  // sendNotificationToChannel("BuyBot Turned Off", cid, thread)
  await sleep(1000);
  process.exit();
});


const init = async () => {
  await loadConfig()
  for(let i=0; i<configs.length;i++){
    if(configs[i].CHANNEL.length >0) startListener(i)
  }
  // startBurnBot()
}








console.log("Loading up!")
init()

