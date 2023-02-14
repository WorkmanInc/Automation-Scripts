
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


const token = "6131657839:AAHwkVz6Oy8OJL0sa3KuvERVCZZdRBgbMiY"
const bot = new telegramBot(token, {polling: true})

const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls

const lpabi = require("./lp.json");
const factoryABI = require("./factorcy.json");

let chain = [
  {
    NAME: "CIC",
    API: "https://backend.newscan.cicscan.com/coin_price",
    RPC: "https://xapi.cicscan.com/",
    NATIVE: "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA"
  },
  {
    NAME: "BNB",
    API: "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
    RPC: "https://rpc.ankr.com/bsc/709f04e966e51d80d11fa585174f074c86d07265220a1892ee0485defed74cf6/",
    NATIVE: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
  }
];

let exchange = [
  {
    NAME: "FARM",
    FACTORY: "0xfD35F3f178353572E4357983AD2831fAcd652cC5",
    CHAIN: chain[0]
  },
  {
    NAME: "PCS",
    FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    CHAIN: chain[1]
  },
  {
    NAME: "DONK",
    FACTORY: "0x04D6b20f805e2bd537DDe84482983AabF59536FF",
    CHAIN: chain[1]
  },{
    NAME: "WEN",
    FACTORY: "0x51eD5a1f2EC7516dB92ff5Ae8d76ea4A2B87A6d1",
    CHAIN: chain[0]
  }
]

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


// const cic = "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA"

const getFactory = async (index) => {
  const factory = exchange[index].FACTORY
  const signer = await getSigner(index)
  const factoryContract = new Contract(
    factory,
    factoryABI,
    signer
  );
  return factoryContract
}
// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
      
let configs

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

  let cicIs0
  let newtoken
  const token0 = await lpcontract.token0();
  const token1 = await lpcontract.token1();
  if(token0 === exchange[index].CHAIN.NATIVE) {
    cicIs0 = true
    newtoken = token1.toString()
  } else if (token1 === exchange[index].CHAIN.NATIVE) {
    cicIs0 = false
    newtoken = token0 .toString()
  } else return

  let tcontract = new Contract(
    newtoken,
    lpabi,
    signer
  );
  const sym = await tcontract.symbol()

    const newInfo = {
      LPADDRESS: LPAddress,
      TOKEN: newtoken,
      SYM: sym,
      CIC0: cicIs0,
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
}catch{bot.sendMessage(ChatId,"Error, Check Values")}
}

const removeToken = async (LPAddress, ChatId, threadRaw) => {
  let thread = null
  // try {
    if(threadRaw !== undefined) thread = threadRaw
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
                  bot.sendMessage(ChatId,"Removed Token")
                  didntExist = false
                  saveNewConfig(); return
                } else if(configs[i].CHANNEL[c].THREAD.length === 1){
                  configs[i].CHANNEL[c] = configs[i].CHANNEL[configs[i].CHANNEL.length-1]
                  configs[i].CHANNEL.pop()
                  bot.sendMessage(ChatId,"Removed From Channel!")
                  didntExist = false
                  saveNewConfig(); return
                } else {
                  configs[i].CHANNEL[c].THREAD[t]  = configs[i].CHANNEL[c].THREAD[configs[i].CHANNEL[c].THREAD-1]
                  configs[i].CHANNEL[c].THREAD.pop()
                  bot.sendMessage(ChatId,"Removed From Topic")
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
 //   bot.sendMessage(ChatId,"Error, Check Values")
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

const sendNotificationToChannel = async (message, cid, thread) => {
    var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${cid}&text=${message}&parse_mode=HTML&disable_web_page_preview=true&message_thread_id=${thread}`
    axios.get(url);
}

const sendNotification = async (message, index) => {
  const c = configs[index].CHANNEL
  for(let i=0; i<c.length; i++){
    for(let t=0; t<c[i].THREAD.length; t++){
      const thread = c[i].THREAD[t]
      var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${c[i].CHATID}&text=${message}&parse_mode=HTML&disable_web_page_preview=true&message_thread_id=${thread}`
      axios.get(url);
    }
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
    cicPrice = parseFloat(price.price);
    mc = parseFloat(price.market_cap)
    
    
  } catch (err) {
    console.error("Unable to connect to Binance API", err);
  }
  return { cicPrice, mc }
};

/*
bot.onText(/^\/addLPToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(function(data) {
    const thread = message.message_thread_id
    const cid = message.chat.id.toString()

    if((data.status == "creator") || (data.status == "administrator")) {
      
      let index = 0
      const exchangeString = message.text.substring(55)
      for(let e=0; e<exchange.length; e++){
        if(exchangeString.toLowerCase().includes(exchange[e].NAME.toLowerCase())) index = e
      }
      
      const lpAddress = message.text.substring(12, 54)
      let DONE = false
      // check if LPTOKEN exists, then if CHANNEL is already added to LPTOKEN
      for(let j=0;j<configs.length; j++){
        if(lpAddress === configs[j].LPADDRESS){
          for(let k=0; k<configs[j].CHANNEL.length; k++){
            if(cid === configs[j].CHANNEL[k].CHATID) {
                // checking for TOPICS
                for(let t=0; t<configs[j].CHANNEL[k].THREAD.length; t++) {
                  if(configs[j].CHANNEL[k].THREAD[t] === thread) { 
                    sendNotificationToChannel("Already Added", cid, thread); 
                    DONE = true
                  }
                }

                if(!DONE){
                  configs[j].CHANNEL[k].THREAD.push(thread); 
                  DONE = true; 
                  sendNotificationToChannel("Added Topic!", cid, thread); break
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
            sendNotificationToChannel("Added Channel", cid, thread); break
          }
        }
      }
      if(!DONE){
        addToken(lpAddress, index, cid, thread)
        sendNotificationToChannel("Added new Token", cid, thread);
      }
      saveNewConfig()

    } else {
      sendNotificationToChannel("now Admin", cid, thread)
    }

  })
})
*/

bot.onText(/^\/addToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const thread = message.message_thread_id
    const cid = message.chat.id.toString()
    if((data.status == "creator") || (data.status == "administrator")) {
      const tokenAddress = message.text.substring(10, 52)
      let index = 0
      let lpAddress
      const exchangeString = message.text.substring(53)

      for(let e=0; e<exchange.length; e++){
        if(exchangeString.toLowerCase().includes(exchange[e].NAME.toLowerCase())) index = e
      }
      
        const factoryContract = await getFactory(index)
        const lpRaw = await factoryContract.getPair(tokenAddress, exchange[index].CHAIN.NATIVE)
        lpAddress = lpRaw.toString()
     
      if(lpAddress === "0x0000000000000000000000000000000000000000") sendNotificationToChannel("Bad Exchange Name", cid, thread); 
      else{
      let DONE = false
      // check if LPTOKEN exists, then if CHANNEL is already added to LPTOKEN
      for(let j=0;j<configs.length; j++){
        if(lpAddress === configs[j].LPADDRESS){
          for(let k=0; k<configs[j].CHANNEL.length; k++){
            if(cid === configs[j].CHANNEL[k].CHATID) {
                // checking for TOPICS
                for(let t=0; t<configs[j].CHANNEL[k].THREAD.length; t++) {
                  if(configs[j].CHANNEL[k].THREAD[t] === thread) { 
                    sendNotificationToChannel("Already Added", cid, thread); 
                    DONE = true
                  }
                }

                if(!DONE){
                  configs[j].CHANNEL[k].THREAD.push(thread); 
                  DONE = true; 
                  sendNotificationToChannel("Added Topic!", cid, thread); break
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
            sendNotificationToChannel("Added Channel", cid, thread); break
          }
        }
      }
      if(!DONE){
        addToken(lpAddress, index, cid, thread)
        sendNotificationToChannel("Added new Token", cid, thread);
      }
      saveNewConfig()
    }
    } else {
      sendNotificationToChannel("now Admin", cid, thread)
    }

  })
  
})


bot.onText(/^\/removeToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      const thread = message.message_thread_id
      const tokenAddress =  message.text.substring(13)
      let lpAddress = tokenAddress
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN.toLowerCase() === tokenAddress.toLowerCase()) lpAddress = configs[i].LPADDRESS
      }
      const cid = message.chat.id.toString()
      removeToken(lpAddress, cid, thread)
    } else {
      bot.sendMessage(messaage.chat.id, "not admin");
    }
  })
})

const getPrice = async (lp, index) => {

  const signer = getSigner(index)
  let lpcontract = new Contract(
    lp,
    lpabi,
    signer
  );
  let cicIs0
  const token0 = await lpcontract.token0();
  const token1 = await lpcontract.token1();
  const {_reserve0, _reserve1 } = await lpcontract.getReserves()

  if(token0 === exchange[index].CHAIN.NATIVE) {
    cicIs0 = true
  } else if (token1 === exchange[index].CHAIN.NATIVE) {
    cicIs0 = false
  } else return

  
  const cicR = new BigNumber(cicIs0 ? _reserve0.toString() : _reserve1.toString())
  const tR = new BigNumber(cicIs0 ? _reserve1.toString() : _reserve0.toString())
  const { cicPrice } = await getBNBPrice(index)

  
  let tContract = new Contract(
    cicIs0 ? token1.toString() : token0.toString(),
    lpabi,
    signer
  );
  const tdRaw = await tContract.decimals()
  const tsRaw = await tContract.totalSupply()
  const bRaw = await tContract.balanceOf("0x000000000000000000000000000000000000dEaD")
  const sym = await tContract.symbol()

  const tDecimals = new BigNumber(tdRaw.toString())
  const totalSupply = new BigNumber(tsRaw.toString())
 
  const burned = new BigNumber(bRaw.toString())
  const dec = new BigNumber(18 - tDecimals)
 
  const price = cicR.multipliedBy(cicPrice).dividedBy(tR).shiftedBy(dec.multipliedBy(-1).toNumber()).toFixed(14)
  const mc = totalSupply.minus(burned).shiftedBy(-tDecimals).multipliedBy(price).toFixed(2)
  return { sym, price, mc }
}

bot.onText(/^\/cic/, async function(message, match) {     
  const thread = message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice(0)

 sendNotificationToChannel(
  `<b>CIC Price:</b> $${cicPrice}\n` +
  `<b>CIC MC:</b> $${mc}\n` +
  `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
 , cid, thread)

})
bot.onText(/^\/CIC/, async function(message, match) {    
  const thread = message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice(0)

  sendNotificationToChannel(
    `<b>CIC Price:</b> $${cicPrice}\n` +
    `<b>CIC MC:</b> $${mc}\n` +
    `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
   , cid, thread)

})

bot.onText(/^\/bnb/, async function(message, match) {     
  const thread = message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(1)

 sendNotificationToChannel(
  `<b>BNB Price:</b> $${cicPrice}\n` +
  `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a>`
 , cid, thread)

})
bot.onText(/^\/BNB/, async function(message, match) {    
  const thread = message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice } = await getBNBPrice(1)

  sendNotificationToChannel(
    `<b>BNB Price:</b> $${cicPrice}\n` +
    `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a>`
   , cid, thread)

})


bot.onText(/^\/price/, async function(message, match) { 
      const cid = message.chat.id.toString()
      const thread = message.message_thread_id
      const command = message.text.substring(7,49)
      const tExchange = message.text.substring(50)
      let cIndex = 0
      let LP = command
      
      const cLower = command.toLowerCase()
     try {
        for(let i=0; i<configs.length; i++) {
          
          if(cLower.includes(configs[i].SYM.toLowerCase())) {
            LP = configs[i].LPADDRESS;
            cIndex=configs[i].EXCHANGE;
            break}
          else if(cLower.includes(configs[i].TOKEN.toLowerCase())) {
            LP = configs[i].LPADDRESS; 
            cIndex=configs[i].EXCHANGE;
            break
          }

          else {
              for(let c=0; c<exchange.length; c++){
                if(tExchange.toLowerCase().includes(exchange[c].NAME.toLowerCase())) cIndex = c
              }
            try {
              const factoryContract = await getFactory(cIndex)
              const raw = await factoryContract.getPair(command, exchange[cIndex].CHAIN.NATIVE)
              LP = raw.toString(); 
              break;
             
            } catch {
              LP = command
            }
          }
        }  
            const { cicPrice } = await getBNBPrice(cIndex)
            const {sym, price, mc } = await getPrice(LP,cIndex)
            const link = getLink(cIndex)

            sendNotificationToChannel(
              `${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP\n` +
              `<b>${sym} / ${exchange[cIndex].CHAIN.NAME}</b>\n` +
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
  if(exchange[index].CHAIN.NAME === "CIC") return  `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
  return  `<a href="https://farmageddon.farm/"><u>Farmageddon</u></a>`
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
  const isZero = configs[index].CIC0

  let lpcontract = new Contract(
    configs[index].LPADDRESS,
    lpabi,
    signer
  );

  lpcontract.on("Swap", async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
  const { cicPrice } = await getBNBPrice(configs[index].EXCHANGE)
  const inAmount = isZero ? amount0In : amount1In
  const outAmount = isZero ? amount1Out : amount0Out

  const {bought, FRTcValue} = await calculate(cicPrice, inAmount, outAmount)
  const spent = new BigNumber(inAmount.toString()).shiftedBy(-18).multipliedBy(cicPrice).toFixed(2)
  const dots = sym(new BigNumber(spent).dividedBy(configs[index].PERDOT).toFixed(0))
  const cIndex = configs[index].EXCHANGE
  const link = getLink(cIndex)

  if( bought.gt(configs[index].MINBUY) ) {
    var message =
    `${exchange[cIndex].CHAIN.NAME} Chain : ${exchange[cIndex].NAME} LP\n` +
    `${configs[index].SYM} - Purchased!\n` +
    dots +
    `\nSpent: $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(-18).toFixed(4)} ${exchange[cIndex].CHAIN.NAME})\n` +
    `Received ${bought.shiftedBy(-18).toFixed(2)} ${configs[index].SYM}\n` +
    `${configs[index].SYM} Price: $${FRTcValue}\n` +
    `${exchange[cIndex].CHAIN.NAME}: $${cicPrice}\n` +
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

