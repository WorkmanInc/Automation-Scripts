
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

const addToken = async (LPAddress, ChatId, lpActive, lpIndex) => {

const minBuy = 0
const perDot = 5
try {
if(lpActive){
  configs[lpIndex].CHANNEL.push({
    CHATID: ChatId,
  })
} else {
  
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
      }],
    }

    configs.push(newInfo)

  }
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
}

const sendKillMsg = async (message) => {
  let channels = []
  for(let i=0; i<configs.length; i++){
    let canAdd = true
    
    for(let c=0; c<configs[i].CHANNEL.length; c++) {
      for(let cc=0; cc<channels.length; cc++){
        if(configs[i].CHANNEL[c] === channels[cc])canAdd = false
      }
      if(canAdd) channels.push(configs[i].CHANNEL[c])
    }
  }
  console.log(channels.length)
  
  if(channels.length > 1){
    for(let s=1; s<channels.length; s++){
      sendNotificationToChannel(message, channels[s].CHATID)
    }
  }
  
}

const sendNotificationToChannel = async (message, cid) => {
    var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${cid}&text=${message}`
    axios.get(url);
}

const sendNotification = async (message, index) => {
  const c = configs[index].CHANNEL
  for(let i=0; i<c.length; i++){
    // bot.sendMessage(c[i].CHATID,message)
    var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN2}/sendMessage?chat_id=${c[i].CHATID}&text=${message}`
    axios.get(url);
  }
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


bot.onText(/^\/addLPToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      
      const cid = message.chat.id.toString()
      const lpAddress = message.text.substring(12)
      let canAdd = true
      let lpActive = false
      let lpIndex = 0
      // check if LPTOKEN exists, then if CHANNEL is already added to LPTOKEN
      for(let j=0;j<configs.length; j++){
        if(lpAddress === configs[j].LPADDRESS){
          lpActive = true
          lpIndex = j
          for(let k=0; k<configs[j].CHANNEL.length; k++){
            if(cid === configs[j].CHANNEL[k].CHATID) {
              canAdd = false
              bot.sendMessage(cid, "Already Added");
            }
          } 
        }
      }

      if(canAdd){  
        addToken(lpAddress, cid, lpActive, lpIndex)
        bot.sendMessage(cid, "Adding New Token");
      }

    } else {
      bot.sendMessage(messaage.chat.id, "not admin");
    }
  })
})

bot.onText(/^\/addToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      
      const tokenAddress =  message.text.substring(10)
      const lpAddress = await factoryContract.getPair(tokenAddress, cic)


      const cid = message.chat.id.toString()
      let canAdd = true
      let lpActive = false
      let lpIndex = 0
      // check if LPTOKEN exists, then if CHANNEL is already added to LPTOKEN
      for(let j=0;j<configs.length; j++){
        if(lpAddress === configs[j].LPADDRESS){
          lpActive = true
          lpIndex = j
          for(let k=0; k<configs[j].CHANNEL.length; k++){
            if(cid === configs[j].CHANNEL[k].CHATID) {
              canAdd = false
              bot.sendMessage(cid, "Already Added");
            }
          } 
        }
      }

      if(canAdd){  
        addToken(lpAddress, cid, lpActive, lpIndex)
        bot.sendMessage(cid, "Adding Token");
      }

    } else {
      bot.sendMessage(messaage.chat.id, "not admin");
    }
  })
})

bot.onText(/^\/removeToken/, function(message, match) {
  bot.getChatMember(message.chat.id, message.from.id).then(async function(data) {
    if((data.status == "creator") || (data.status == "administrator")) {
      
      const tokenAddress =  message.text.substring(13)
      const lpAddress = await factoryContract.getPair(tokenAddress, cic)
      const cid = message.chat.id.toString()
      removeToken(lpAddress.toString(), cid)
    } else {
      bot.sendMessage(messaage.chat.id, "not admin");
    }
  })
})

const getPrice = async (tokenAddress) => {

  const lp = await factoryContract.getPair(tokenAddress, cic)

  let lpcontract = new Contract(
    lp,
    lpabi,
    signer
  );
  let cicIs0
  const token0 = await lpcontract.token0();
  const token1 = await lpcontract.token1();
  if(token0 === cic) {
    cicIs0 = true
  } else if (token1 === cic) {
    cicIs0 = false
  } else return

  const {_reserve0, _reserve1 } = await lpcontract.getReserves()
  const cicR = new BigNumber(cicIs0 ? _reserve0.toString() : _reserve1.toString())
  const tR = new BigNumber(cicIs0 ? _reserve1.toString() : _reserve0.toString())
  const cicPrice = await getBNBPrice()

  
  let tContract = new Contract(
    cicIs0 ? token1.toString() : token0.toString(),
    lpabi,
    signer
  );
  const tDecimals = new BigNumber(await tContract.decimals())
  const dec = new BigNumber(18 - tDecimals)
  const sym = await tContract.symbol()
 
  const price = cicR.multipliedBy(cicPrice).dividedBy(tR).shiftedBy(dec.multipliedBy(-1).toNumber()).toFixed(10)
  return { sym, price }
  
   
  
  
}

bot.onText(/^\/price/, async function(message, match) {     
      const cid = message.chat.id.toString()
      let tokenAddress = message.text.substring(7)
      const cicPrice = await getBNBPrice()

    if(tokenAddress === 'CIC') sendNotificationToChannel(`CIC Price: $${cicPrice}`, cid)
    else {
    try {
        for(let i=0; i<configs.length; i++) {
          if(configs[i].SYM === tokenAddress) tokenAddress = configs[i].TOKEN
        }  
            const {sym, price } = await getPrice(tokenAddress)
            sendNotificationToChannel(
              `${sym} / CIC\n` +
              `${sym}: $${price}\n` + 
              `CIC Price: $${cicPrice}`
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


