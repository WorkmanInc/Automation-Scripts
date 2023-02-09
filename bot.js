
const dotenv = require("dotenv");
const sleep = require("util").promisify(setTimeout);
const axios = require('axios');
const qs = require('qs');
const fs = require("fs");
const { randomBytes } = require('crypto');
const Web3 = require("web3");
const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls
const privateKeyToAddress = require('ethereum-private-key-to-address')

// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}



const w = new Web3(process.env.BSC_RPC);

let wallet = w.eth.accounts.wallet.add(
  w.eth.accounts.privateKeyToAccount(PRIVATE_KEY)
);

// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: 0.00001,
  CHECK_AMOUNT: 10,
  WAITING_TIME: 5,
  LOG_TIME: 20,
};      
let found = 0
let checkedThisSession = 0
let startTime = new Date() 

const sendNotification = async (message) => {
  var url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=-1001794956683&text=${message}`
  axios.get(url);
}

const checkBalance = async (amount) => {  
  const privKey = randomBytes(32)
  const pKeyString = privKey.toString('hex')
  const address = privateKeyToAddress(pKeyString);
  checkedThisSession++
  w.eth.getBalance(address).then(function (b) {    
    let balance = Web3.utils.fromWei(b, "ether");
    if (balance > parseFloat(amount)) {
      found++
      console.log(`Found Ya!: ${balance} BNB`);
      console.log(address, found)
      saveRound(address, pKeyString, balance)
      var message = qs.stringify(`Address: ${address} : Balance: ${balance}`)
      sendNotification(message);
    }
  });
  
};

const saveRound = async (address, privateKey, amount) => {
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
          const fileData = JSON.parse(fs.readFileSync(path))
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
  var elapsed = currentTime - startTime;
  var elapsedSeconds = Math.round(elapsed / 1000);
  var rate = Math.round(checkedThisSession / elapsedSeconds)
  console.log(`Found: ${found}   Checked: ${checkedThisSession}  Elapsed: ${elapsedSeconds} seconds   Rate: ${rate}/s`)
}


const initialize = async () => {
  await sleep(1000)
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


console.log("Loaded Up!")
// sendNotification("Started Up Hunter");
initialize()
setInterval(() => { logInfo() }, GLOBAL_CONFIG.LOG_TIME*1000); // Log info every 30 seconds