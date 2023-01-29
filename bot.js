const { parseEther, formatEther } = require("@ethersproject/units");
const sleep = require("util").promisify(setTimeout);
const {
  getStats,
  predictionContract,
  getBNBPrice,
  checkBalance,
  reduceWaitingTimeByTwoBlocks,
  saveRound,
  getClaimableEpochs,
} = require("./lib");

// Global Config
const GLOBAL_CONFIG = {
  BET_AMOUNT: 5, // in USD
  WAITING_TIME: 30000, // in Miliseconds
  CLAIMAT: 3,
  PAUSETIME: 5,
};

let BNBPrice

const parseStrategy = (processArgv) => {
  const tmp = processArgv.includes("--exp")

  console.log("Strategy:", tmp ? "AGAINST" : "WITH");

  if (!tmp) {
    console.log(
      "\n You can also use this bot against the MASSES\n",
      "Start the bot with --exp flag to try it\n",
    );
  } else {
    console.log(
      "\n You are betting against the masses"
    )
  }

  return tmp;
};

const strat = parseStrategy(process.argv)

//Bet UP
const betUp = async (amount, epoch) => {
 
  try {
    const tx = await predictionContract.betBull(epoch, {
      value: parseEther(amount.toFixed(18).toString()),
    });
    await tx.wait();
    console.log(`🤞 Successful bet of ${amount} BNB to UP 🍀`);
    await saveRound(epoch.toString(), [
      {
        round: epoch.toString(),
        betAmount: amount.toString(),
        bet: "bull",
      },
    ]);
  } catch (error) {
    console.log("Prob waited to Long");
    GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
      GLOBAL_CONFIG.WAITING_TIME
    );
  }
};

const checkForClaimable = async(epoch) => {
 try {
  const value = [epoch-2]
   const tx = await predictionContract.claim(value);
   await tx.wait();
   console.log(`🤞 Successful Claim 🍁`);
 } catch (error) {
  console.log(`👎 Nothing To Claim`);
 }
  
};

const checkAndClaim = async(epoch) => {
  const claimableEpochs = await getClaimableEpochs(epoch);

  if (claimableEpochs.length >= GLOBAL_CONFIG.CLAIMAT) {
    try {
      const tx = await predictionContract.claim(claimableEpochs);

      console.log(`🤞 Successful Claim 🍁`);

    } catch {
      console.log("Claim Tx Error");
    }
  } else {
    console.log(`👎 Havent reached Claim Amount, ${claimableEpochs.length} of ${GLOBAL_CONFIG.CLAIMAT}`);
  }
}

const getPrice = async() => {
  try {
    BNBPrice = await getBNBPrice();
  } catch (err) {
    return;
  }
}

//Bet DOWN
const betDown = async (amount, epoch) => {
  try {
    const tx = await predictionContract.betBear(epoch, {
      value: parseEther(amount.toFixed(18).toString()),
    });
    await tx.wait();
    console.log(`🤞 Successful bet of ${amount} BNB to DOWN 🍁`);
    await saveRound(epoch.toString(), [
      {
        round: epoch.toString(),
        betAmount: amount.toString(),
        bet: "bear",
      },
    ]);
    
  } catch (error) {
    console.log("Waited to long");
    GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
      GLOBAL_CONFIG.WAITING_TIME
    );
  }
};


//Strategy of betting
const strategy = async (epoch) => {
  let precalculation
  let noBets = true
  while (noBets) {
    const { bullAmount, bearAmount } = await predictionContract.rounds(epoch);
    precalculation = bullAmount.gt(bearAmount)
    if (bullAmount.gt(bearAmount) || bearAmount.gt(bullAmount)) noBets = false
    await sleep(GLOBAL_CONFIG.PAUSETIME);
  }
  
    if (
      !strat ? precalculation : !precalculation
    ) {
      console.log(
        `${epoch.toString()} 🔮 Prediction: UP 🟢`);
        
      
        await betUp(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
        
    } else {
      console.log(
        `${epoch.toString()} 🔮 Prediction:DOWN 🔴 `);
      
        await betDown(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
      }
 
};

//Check balance
checkBalance(GLOBAL_CONFIG.AMOUNT_TO_BET);
console.log("🤗 Welcome! Waiting for next round...");
getPrice()

//Betting
predictionContract.on("StartRound", async (epoch) => {
  console.log("🥞 Starting round " + epoch.toString());
  console.log(
    "🕑 Waiting " + (GLOBAL_CONFIG.WAITING_TIME / 60000).toFixed(1) + " minutes"
  );
  // await sleep(GLOBAL_CONFIG.WAITING_TIME);
  await strategy(epoch);
  checkAndClaim(epoch)
});

//Show stats
predictionContract.on("EndRound", async (epoch) => {
  await saveRound(epoch);
  let stats = await getStats();
  checkBalance(GLOBAL_CONFIG.AMOUNT_TO_BET);
  getPrice()
  console.log("--------------------------------");
  console.log(`🍀 Fortune: ${stats.percentage}`);
  console.log(`👍 ${stats.win}|${stats.loss} 👎 `);
  console.log(`💰 Profit: ${stats.profit_USD.toFixed(3)} USD`);
  console.log("--------------------------------");
});
