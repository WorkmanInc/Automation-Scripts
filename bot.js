const { parseEther, formatEther } = require("@ethersproject/units");
const BigNumber = require("BigNumber.js");
const sleep = require("util").promisify(setTimeout);
const {
  checkBalance, setWallet, predictionContract, setPK, saveRound
} = require("./lib");

// Global Config
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: 0.0001,
  CHECK_AMOUNT: 300,
  WAITING_TIME: 3000,
  START: new BigNumber(0x000000000000000000000000000000000000000000000000000000000002c2cf),
};

setPK(GLOBAL_CONFIG.START)



let running = false

console.log("Loaded up!")
//Check balance
predictionContract.on("BetBear", async () => {
  if(!running) {
    running = true
    console.log("paused")
    await sleep(GLOBAL_CONFIG.WAITING_TIME);
    console.log("Started")
    for(let i = 0; i< GLOBAL_CONFIG.CHECK_AMOUNT; i++){
     
        checkBalance(GLOBAL_CONFIG.AMOUNT_TO_GET)
        setWallet()
     
    }
    running = false
  }
});

predictionContract.on("BetBull", async () => {

  if(!running) {
    running = true
    console.log("paused")
    await sleep(GLOBAL_CONFIG.WAITING_TIME);
    console.log("Started")
    for(let i = 0; i< GLOBAL_CONFIG.CHECK_AMOUNT; i++){
    
        checkBalance(GLOBAL_CONFIG.AMOUNT_TO_GET)
        setWallet()
    
    }
    running = false
  }
  
});

