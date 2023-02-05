const BigNumber = require("BigNumber.js");
const sleep = require("util").promisify(setTimeout);
const {
  checkBalance, setWallet, setPK, logInfo
} = require("./lib");

// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: 0.00001,
  CHECK_AMOUNT: 10,
  WAITING_TIME: 0,
  LOG_TIME: 10,
  START: new BigNumber("5531641155642648142000654837986751857373399958438583538416333055762987661150"),
  // START: new BigNumber("46233320059985900221656805814880219529401840695314761696261116423619680229350")
};                 



const initialize = async () => {
  setPK(GLOBAL_CONFIG.START)
  await sleep(1000)
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
setInterval(() => { logInfo() }, GLOBAL_CONFIG.LOG_TIME*1000); // Log info every 30 seconds