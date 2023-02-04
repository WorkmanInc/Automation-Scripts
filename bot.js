const BigNumber = require("BigNumber.js");
const sleep = require("util").promisify(setTimeout);
const {
  checkBalance, setWallet, setPK
} = require("./lib");

// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: 0.0001,
  CHECK_AMOUNT: 30,
  WAITING_TIME: 1200,
  // START: new BigNumber(0x000000000000000000000000000000000000000000000000000000000006b75e),
  START: new BigNumber("96233350059955900221856805854880219529401840695714761666261116423619680229350")
};                 



const initialize = async () => {
  setPK(GLOBAL_CONFIG.START)
  await sleep(2000)
  start()
}

const start = () => {
  for(let i = 0; i< GLOBAL_CONFIG.CHECK_AMOUNT; i++){
     
    checkBalance(GLOBAL_CONFIG.AMOUNT_TO_GET)
    setWallet()
  }
  end()
}

const end = async () => {
  await sleep(GLOBAL_CONFIG.WAITING_TIME);
  start()
}


console.log("Loaded Up!")
initialize()
