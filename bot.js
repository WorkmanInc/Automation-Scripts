const sleep = require("util").promisify(setTimeout);
const {
  checkBalance, logInfo, setWallet, sendNotification
} = require("./lib");

// Global Config  MAX for BSC is apparantly 33 / Second. --- 10,000 per 5 min.
const GLOBAL_CONFIG = {
  AMOUNT_TO_GET: 0.00001,
  CHECK_AMOUNT: 10,
  WAITING_TIME: 5,
  LOG_TIME: 20,
};                 



const initialize = async () => {
  await sleep(1000)
  start()
}

const start = () => {
  for(let i = 0; i< GLOBAL_CONFIG.CHECK_AMOUNT; i++){
    
    setWallet()
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