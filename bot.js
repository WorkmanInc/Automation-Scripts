const { parseEther } = require("@ethersproject/units");
const sleep = require("util").promisify(setTimeout);
const {
  getStats,
  predictionContract,
  getBNBPrice,
  checkBalance,
  reduceWaitingTimeByTwoBlocks,
  saveRound,
} = require("./lib");
const {
  TradingViewScan,
  SCREENERS_ENUM,
  EXCHANGES_ENUM,
  INTERVALS_ENUM,
} = require("trading-view-recommends-parser-nodejs");
const { Console } = require("console");

// Global Config
const GLOBAL_CONFIG = {
  BET_AMOUNT: 6, // in USD
  DAILY_GOAL: 1000, // in USD,
  WAITING_TIME: 265000, // in Miliseconds (4.3 Minutes)
  THRESHOLD: 40, // Minimum % of certainty of signals (50 - 100)
};

//Bet UP
const betUp = async (amount, epoch) => {
 
  try {
    const tx = await predictionContract.betBull(epoch, {
      value: parseEther(amount.toFixed(18).toString()),
    });
    await tx.wait();
    console.log(`🤞 Successful bet of ${amount} BNB to UP 🍀`);
  } catch (error) {
    console.log("Transaction Error", error);
    GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
      GLOBAL_CONFIG.WAITING_TIME
    );
  }
  checkForClaimable(epoch)
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

//Bet DOWN
const betDown = async (amount, epoch) => {
  try {
    const tx = await predictionContract.betBear(epoch, {
      value: parseEther(amount.toFixed(18).toString()),
    });
    await tx.wait();
    console.log(`🤞 Successful bet of ${amount} BNB to DOWN 🍁`);
  } catch (error) {
    console.log("Transaction Error", error);
    GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
      GLOBAL_CONFIG.WAITING_TIME
    );
  }
  checkForClaimable(epoch)
};

//Check Signals average 1 and 5
const getSignals = async () => {
  //1 Minute signals
  let resultMin = await new TradingViewScan(
    SCREENERS_ENUM["crypto"],
    EXCHANGES_ENUM["BINANCE"],
    "BNBUSDT",
    INTERVALS_ENUM["1m"]
  ).analyze();
  let minObj = JSON.stringify(resultMin.summary);
  let minRecomendation = JSON.parse(minObj);

  //5 Minute signals
  let resultMed = await new TradingViewScan(
    SCREENERS_ENUM["crypto"],
    EXCHANGES_ENUM["BINANCE"],
    "BNBUSDT",
    INTERVALS_ENUM["5m"]
  ).analyze();
  let medObj = JSON.stringify(resultMed.summary);
  let medRecomendation = JSON.parse(medObj);

  //Average signals
  if (minRecomendation && medRecomendation) {
    let averageBuy =
      (parseInt(minRecomendation.BUY) + parseInt(medRecomendation.BUY)) / 2;

    let averageSell =
      (parseInt(minRecomendation.SELL) + parseInt(medRecomendation.SELL)) / 2;
    let averageNeutral =
      (parseInt(minRecomendation.NEUTRAL) +
        parseInt(medRecomendation.NEUTRAL)) /
      2;
    if(averageBuy > averageSell) {
      console.log(percentage(averageBuy, averageSell))
    } else console.log(percentage(averageSell, averageBuy))
    console.log(minRecomendation)
    console.log(medRecomendation)
    return {
      buy: averageBuy,
      sell: averageSell,
      neutral: averageNeutral,
    };
  } else {
    return false;
  }
};


//Percentage difference
const percentage = (a, b) => {
  return parseInt((100 * a) / (a + b));
};

const percentage3 = (a, b, c) => {
  return parseInt((100 * a) / (a + b + c));
};

//Strategy of betting
const strategy = async (minAcurracy, epoch) => {
  let BNBPrice;
  let earnings = await getStats();
  if (earnings.profit_USD >= GLOBAL_CONFIG.DAILY_GOAL) {
    console.log("🧞 Daily goal reached. Shuting down... ✨ ");
    process.exit();
  }
  try {
    BNBPrice = await getBNBPrice();
  } catch (err) {
    return;
  }
  let signals = await getSignals();
  if (signals) {
    if (
      signals.buy > signals.sell &&
      percentage3(signals.buy, signals.sell, signals.neutral) > minAcurracy
    ) {
      console.log(
        `${epoch.toString()} 🔮 Prediction:DOWN 🔴 ${percentage(
          signals.buy,
          signals.sell
        )}%`
      );
      await betDown(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
      await saveRound(epoch.toString(), [
        {
          round: epoch.toString(),
          betAmount: (GLOBAL_CONFIG.BET_AMOUNT / BNBPrice).toString(),
          bet: "bear",
        },
      ]);
    } else if (
      signals.sell > signals.buy &&
      percentage3(signals.sell, signals.buy, signals.neutral) > minAcurracy
    ) {
      console.log(
        `${epoch.toString()} 🔮 Prediction: UP 🟢 ${percentage(
          signals.sell,
          signals.buy
        )}%`
      );
      await betUp(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
      await saveRound(epoch.toString(), [
        {
          round: epoch.toString(),
          betAmount: (GLOBAL_CONFIG.BET_AMOUNT / BNBPrice).toString(),
          bet: "bull",
        },
      ]);
    } else {
      let lowPercentage;
      if (signals.buy > signals.sell) {
        lowPercentage = percentage3(signals.buy, signals.sell, signals.neutral);
      } else {
        lowPercentage = percentage3(signals.sell, signals.buy, signals.neutral);
      }
      console.log("Waiting for next round 🕑", lowPercentage + "%");
    }
  } else {
    console.log("Error obtaining signals");
  }
};

//Check balance
checkBalance(GLOBAL_CONFIG.AMOUNT_TO_BET);
console.log("🤗 Welcome! Waiting for next round...");

//Betting
predictionContract.on("StartRound", async (epoch) => {
  console.log("🥞 Starting round " + epoch.toString());
  console.log(
    "🕑 Waiting " + (GLOBAL_CONFIG.WAITING_TIME / 60000).toFixed(1) + " minutes"
  );
  await sleep(GLOBAL_CONFIG.WAITING_TIME);
  await strategy(GLOBAL_CONFIG.THRESHOLD, epoch);
});

//Show stats
predictionContract.on("EndRound", async (epoch) => {
  await saveRound(epoch);
  let stats = await getStats();
  console.log("--------------------------------");
  console.log(`🍀 Fortune: ${stats.percentage}`);
  console.log(`👍 ${stats.win}|${stats.loss} 👎 `);
  console.log(`💰 Profit: ${stats.profit_USD.toFixed(3)} USD`);
  console.log("--------------------------------");
});
