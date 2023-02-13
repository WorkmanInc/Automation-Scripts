
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

const factory = "0xfD35F3f178353572E4357983AD2831fAcd652cC5"
const factoryContract = new Contract(
  factory,
  factoryABI,
  signer
);
// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
      
let configs

const addToken = async (LPAddress, ChatId, thread) => {

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
  if(token0 === cic) {
    cicIs0 = true
    newtoken = token1.toString()
  } else if (token1 === cic) {
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

const removeToken = async (LPAddress, ChatId) => {
  try {
    let didntExist = true
    for(let i=0; i<configs.length; i++){
      if(configs[i].LPADDRESS === LPAddress){
        for(let c=0; c<configs[i].CHANNEL.length; c++){
          if(configs[i].CHANNEL[c].CHATID === ChatId) {
            if(configs[i].CHANNEL.length === 1) {
              configs[i] = configs[configs.length-1]
              await stopListener(LPAddress)
              configs.pop()
              bot.sendMessage(ChatId,"Removed Token")
              didntExist = false
              saveNewConfig(); break;
            } else {
              configs[i].CHANNEL[c] = configs[i].CHANNEL[configs[i].CHANNEL.length -1]
              configs[i].CHANNEL.pop()
              bot.sendMessage(ChatId,"Removed Token")
              didntExist = false
              saveNewConfig(); break;
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

const getBNBPrice = async () => {
  const apiUrl = "https://backend.newscan.cicscan.com/coin_price";
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


bot.onText(/^\/addLPToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(function(data) {
    const thread = message.message_thread_id
    const cid = message.chat.id.toString()

    if((data.status == "creator") || (data.status == "administrator")) {
      
      const lpAddress = message.text.substring(12)
    
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
        addToken(lpAddress, cid, thread)
        sendNotificationToChannel("Added new Token", cid, thread);
      }
      saveNewConfig()

    } else {
      sendNotificationToChannel("now Admin", cid, thread)
    }

  })
})

bot.onText(/^\/addToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    const thread = message.message_thread_id
    const cid = message.chat.id.toString()
    if((data.status == "creator") || (data.status == "administrator")) {
      const tokenAddress =  message.text.substring(10)
      const lpAddress = await factoryContract.getPair(tokenAddress, cic)

      
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
        addToken(lpAddress, cid, thread)
        sendNotificationToChannel("Added new Token", cid, thread);
      }
      saveNewConfig()

    } else {
      sendNotificationToChannel("now Admin", cid, thread)
    }

  })
  
})


bot.onText(/^\/removeToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      
      const tokenAddress =  message.text.substring(13)
      let lpAddress = tokenAddress
      for(let i=0; i<configs.length; i++) {
        if(configs[i].TOKEN === tokenAddress) lpAddress = configs[i].LPADDRESS
      }
      const cid = message.chat.id.toString()
      removeToken(lpAddress, cid)
    } else {
      bot.sendMessage(messaage.chat.id, "not admin");
    }
  })
})

const getPrice = async (lp) => {

  let lpcontract = new Contract(
    lp,
    lpabi,
    signer
  );
  let cicIs0
  const token0 = await lpcontract.token0();
  const token1 = await lpcontract.token1();
  const {_reserve0, _reserve1 } = await lpcontract.getReserves()

  if(token0 === cic) {
    cicIs0 = true
  } else if (token1 === cic) {
    cicIs0 = false
  } else return

  
  const cicR = new BigNumber(cicIs0 ? _reserve0.toString() : _reserve1.toString())
  const tR = new BigNumber(cicIs0 ? _reserve1.toString() : _reserve0.toString())
  const { cicPrice } = await getBNBPrice()

  
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
 
  const price = cicR.multipliedBy(cicPrice).dividedBy(tR).shiftedBy(dec.multipliedBy(-1).toNumber()).toFixed(10)
  const mc = totalSupply.minus(burned).shiftedBy(-tDecimals).multipliedBy(price).toFixed(2)
  return { sym, price, mc }
}

bot.onText(/^\/cic/, async function(message, match) {     
  const thread = message.message_thread_id
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice()

 sendNotificationToChannel(
  `<b>CIC Price:</b> $${cicPrice}\n` +
  `<b>CIC MC:</b> $${mc}\n` +
  `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
 , cid, thread)

})
bot.onText(/^\/CIC/, async function(message, match) {    
  
  const thread = message.message_thread_id
  console.log(thread)
  const cid = message.chat.id.toString()
  const { cicPrice, mc } = await getBNBPrice()

  sendNotificationToChannel(
    `<b>CIC Price:</b> $${cicPrice}\n` +
    `<b>CIC MC:</b> $${mc}\n` +
    `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
   , cid, thread)

})


bot.onText(/^\/price/, async function(message, match) { 
      const thread = message.message_thread_id    
      const cid = message.chat.id.toString()
      const command = message.text.substring(7)
      let LP = command
      const { cicPrice, mc } = await getBNBPrice()


    if(command.toLowerCase() === 'cic') sendNotificationToChannel(
      `<b>CIC Price:</b> $${cicPrice}\n` +
      `<b>CIC MC:</b> $${mc}\n` +
      `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
     , cid,thread)
    else {
    try {
        for(let i=0; i<configs.length; i++) {
          if(configs[i].SYM.toLowerCase() === command.toLowerCase()) {
            LP = configs[i].LPADDRESS; break}
          else if(configs[i].TOKEN === command ) {LP = configs[i].LPADDRESS; break}
          else {
            try {
              const raw = await factoryContract.getPair(command, cic)
              LP = raw.toString(); break;
            } catch {
              LP = command
            }
          }
        }  
            const {sym, price, mc } = await getPrice(LP)

            sendNotificationToChannel(
              `<b>${sym} / CIC</b>\n` +
              `<b>Price:</b> $${price}\n` +
              `<b>MCap:</b> $${mc}\n` +
              `<b>CIC Price:</b> $${cicPrice}\n` + 
              `\n` +
              `<a href="https://cic.farmageddon.farm/"><u>Farmageddon</u></a>`
              ,cid);
        
      } catch {
        bot.sendMessage(cid, "Not Valid TOKEN");
     }
    }
})

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

const stopListener = async (lp) => {
  let lpcontract = new Contract(
    lp,
    lpabi,
    signer
  );
  lpcontract.off("Swap")
}

const startListener = async (index) => {
  const isZero = configs[index].CIC0

  let lpcontract = new Contract(
    configs[index].LPADDRESS,
    lpabi,
    signer
  );

  lpcontract.on("Swap", async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
  const { cicPrice } = await getBNBPrice()
  const inAmount = isZero ? amount0In : amount1In
  const outAmount = isZero ? amount1Out : amount0Out

  const {bought, FRTcValue} = await calculate(cicPrice, inAmount, outAmount)
  const spent = new BigNumber(inAmount.toString()).shiftedBy(-18).multipliedBy(cicPrice).toFixed(2)
  const dots = sym(new BigNumber(spent).dividedBy(configs[index].PERDOT).toFixed(0))

  if( bought.gt(configs[index].MINBUY) ) {
    var message = 
    `${configs[index].SYM} - Purchased!\n` +
    dots +
    `\nSpent: $${spent} - (${new BigNumber(inAmount.toString()).shiftedBy(-18).toFixed(2)} CIC)\n` +
    `Received ${bought.shiftedBy(-18).toFixed(2)} ${configs[index].SYM}\n` +
    `${configs[index].SYM} Price: $${FRTcValue}\n` +
    `CIC: $${cicPrice}\n` +
    `\n` +
    `cic.farmageddon.farm\n` 
    
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

