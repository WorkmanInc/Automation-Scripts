const {
  predictionContract,
  getBNBPrice,
  checkBalance,
  // nextNugget,
} = require("./lib");

const { Console } = require("console");

// Global Config
const GLOBAL_CONFIG = {
  COST: 300000000000000000,
  NUGGETS: [290, 455,594,844,982,1335,1693,1728,1977,2147],
  TO_BUY: 2,  // how many to buy in order to get NFT of choice
};

//Buy NFTs
const buyNFT = async () => {
  
  
  try {
    const tx = await predictionContract.buyNFT(GLOBAL_CONFIG.TO_BUY, {
      value: (GLOBAL_CONFIG.COST * GLOBAL_CONFIG.TO_BUY).toString(),
    });
    await tx.wait();
    console.log(`🤞 Successful Mint`);
  } catch (error) {
    console.log("Transaction Error", error);
  }
};

const nextNugget = (id) => {
  for(i = 0; i < GLOBAL_CONFIG.NUGGETS.length; i++) {
    if(GLOBAL_CONFIG.NUGGETS[i] > id){
      return GLOBAL_CONFIG.NUGGETS[i];
    } 
  }
  return 0;
}


const checkForMint = async () => {
 const currentId = await predictionContract.totalSupply();
 const nextGold = nextNugget(currentId.toString());
 console.log(`Current Id: ${currentId.toString()} `);
 console.log(`Next Nugget at: ${nextGold.toString()}`);
 console.log(`🤗 ${(nextGold-currentId).toString()} Left to Go 🤗`);
 if(currentId < nextGold && currentId >= nextGold - GLOBAL_CONFIG.TO_BUY) return true;
 else return false;
}

//Check balance

checkBalance(GLOBAL_CONFIG.COST * GLOBAL_CONFIG.TO_BUY);
checkForMint();
console.log("🤗 Welcome! Waiting for next mint...");



//Betting
predictionContract.on("Transfer", async (from, to, tokenId) => {
  let canMint = false;
  if(from === address(0) ) {
    console.log(" New Mint Detected");
    console.log(`Token Id ${tokenId.toString()} has been minted`);
    canMint = checkForMint();
    console.log(canMint.toString());
  }
  if(cantMint) {
    buyNFT();
    console.log("Minting");
  } 
});


