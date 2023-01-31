const { parseEther, formatEther } = require("@ethersproject/units");
const BigNumber = require("BigNumber.js");
const sleep = require("util").promisify(setTimeout);
const {
  checkBalance, setWallet, predictionContract, setPK, getStartPoint
} = require("./lib");

// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: 0.0001,
  CHECK_AMOUNT: 30,
  WAITING_TIME: 1200,
  START: new BigNumber(0x0000000000000000000000000000000000000000000000000000000000041cfb),
};

const initialize = async () => {
  setPK(GLOBAL_CONFIG.START)
  await sleep(2000)
  start()
}



const start = () => {
  console.log("Rolling")
  for(let i = 0; i< GLOBAL_CONFIG.CHECK_AMOUNT; i++){
     
    checkBalance(GLOBAL_CONFIG.AMOUNT_TO_GET)
    setWallet()
    
  }
  end()
}

const end = async () => {
  console.log("Waiting")
  await sleep(GLOBAL_CONFIG.WAITING_TIME);
  start()
}

console.log("Loaded Up!")
initialize()

/*
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
*/
