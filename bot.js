const { parseEther } = require("@ethersproject/units");
const sleep = require("util").promisify(setTimeout);
const {
  predictionContract,
  getBNBPrice,
  checkBalance,
  nextNugget,
} = require("./lib");

const { Console } = require("console");

// Global Config
const GLOBAL_CONFIG = {
  TO_BUY: 2,  // how many to buy in order to get NFT of choice
};

//Buy NFTs
const buyNFT = async () => {
  const cost = await predictionContract.nftPrice();
  checkBalance(cost * GLOBAL_CONFIG.TO_BUY)
  try {
    const tx = await predictionContract.buyNFT(GLOBAL_CONFIG.TO_BUY, {
      value: cost.toString(),
    });
    await tx.wait();
    console.log(`🤞 Successful Mint`);
  } catch (error) {
    console.log("Transaction Error", error);
  }
};

const checkForMint = () => {
 const currentId = await predictionContract.totalSupply();
 const nextGold = nextNugget(currentId);
 if(currentId < nextGold && currentId >= nextGold - GLOBAL_CONFIG.TO_BUY) return true;
 else return false;
}

//Betting
predictionContract.on("Transfer", async (from, to, tokenId) => {
  let canMint = false;
  if(from === address(0) ) {
    console.log(" New Mint Detected");
    console.log(`Token Id ${tokenId.toString()} has been minted`);
    canMint = checkForMint();
  }
  if(cantMint) {
    buyNFT();
    console.log("Minting");
  } 
});


