let chain = [
    {
      LONGNAME: "Crazy Internet Coin",
      NAME: "CIC",
      RPC: "https://xapi.cicscan.com/",
      EXP: "https://cicscan.com/",
      NATIVE: "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA",
      BASES: [
          "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA", // WCIC
          "0xa058C1e4813cf433B0A0c7736f71bD7A73FFA513" // CUSD
      ]
    },
    {
      LONGNAME: "Binance",
      NAME: "BNB",
      RPC: "https://rpc.ankr.com/bsc/709f04e966e51d80d11fa585174f074c86d07265220a1892ee0485defed74cf6/",
      EXP: "https://bscscan.com/",
      NATIVE: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      BASES: [
        "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",     // wbnb
        "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",     // busd
        "0x524bC91Dc82d6b90EF29F76A3ECAaBAffFD490Bc",     // usdt
        "0xB04906e95AB5D797aDA81508115611fee694c2b3",     // USDC
        "0xE68b79e51bf826534Ff37AA9CeE71a3842ee9c70"      // czusd
      ]
    },
    {
      LONGNAME: "Ethereum",
      NAME: "ETH",
      RPC: "https://rpc.ankr.com/eth/a43f07a7be6cc42d81c31ccab2f9a43e71a3713d40c4809cc4a9886839d5cb76/",
      EXP: "https://etherscan.io/",
      NATIVE: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      BASES: [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",     // eth
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",     // USDC
        "0x4Fabb145d64652a948d72533023f6E7A623C7C53",     // busd
        "0xdAC17F958D2ee523a2206206994597C13D831ec7"      // usdt
      ]
    },
    {
      LONGNAME: "Cronos",
      NAME: "CRO",
      RPC: "https://evm.cronos.org/",
      EXP: "https://cronoscan.com/",
      NATIVE: "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23",
      BASES: [
        "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23" ,   // cro
        "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",   // usdc
        "0x66e428c3f67a68878562e79A0234c1F83c208770"      // usdt
      ]
    },
    {
      LONGNAME: "Shibarium",
      NAME: "BONE",
      RPC: "https://www.shibrpc.com",
      EXP: "https://shibariumscan.io/",
      NATIVE: "0xC76F4c819D820369Fb2d7C1531aB3Bb18e6fE8d8",
      BASES: [
          "0x6c19A35875217b134e963ca9e61b005b855CAD21", // WBONE - MARS
          "0x8ed7d143Ef452316Ab1123d28Ab302dC3b80d3ce", // WETH
          "0xC76F4c819D820369Fb2d7C1531aB3Bb18e6fE8d8", // WBONE - SHIB
      ]
    },
    
  ];

const baseCheckers = {
  WETH: [
    "0x8ed7d143Ef452316Ab1123d28Ab302dC3b80d3ce",
  ],
  WBONE: [
    "0x6c19A35875217b134e963ca9e61b005b855CAD21",
  ],
  USD: [
    "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
    "0x66e428c3f67a68878562e79A0234c1F83c208770",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    "0x524bC91Dc82d6b90EF29F76A3ECAaBAffFD490Bc",
    "0xB04906e95AB5D797aDA81508115611fee694c2b3",
    "0xE68b79e51bf826534Ff37AA9CeE71a3842ee9c70",
    "0xa058C1e4813cf433B0A0c7736f71bD7A73FFA513"
  ]
}


  
let exchange = [
    {
        LONGNAME: "WendDex",
        NAME: "WEN",
        FACTORY: "0x51eD5a1f2EC7516dB92ff5Ae8d76ea4A2B87A6d1",
        CHAIN: chain[0],
        DOTS: "💶"
    },
    {
      LONGNAME: "PancakeSwap",
      NAME: "PCS",
      FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
      CHAIN: chain[1],
      DOTS: "💶"
    },
    {
      LONGNAME: "Ape Swap",
      NAME: "APE",
      FACTORY: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
      CHAIN: chain[1],
      DOTS: "💶"
    },
    {
      LONGNAME: "BiSwap",
      NAME: "BIS",
      FACTORY: "0x858e3312ed3a876947ea49d572a7c42de08af7ee",
      CHAIN: chain[1],
      DOTS: "💶"
    },
    {
      LONGNAME: "Donk Swap",
      NAME: "DONK",
      FACTORY: "0x04D6b20f805e2bd537DDe84482983AabF59536FF",
      CHAIN: chain[1],
      DOTS: "💶"
    },
    {
      LONGNAME: "UniSwap V3",
      NAME: "UNIV3",
      FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      CHAIN: chain[2],
      FEES: [100, 500, 3000, 10000],
      DOTS: "💶"
    },
    {
      LONGNAME: "UniSwap V2",
      NAME: "UNIV2",
      FACTORY: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      CHAIN: chain[2],
      DOTS: "💶"
    },
    {
      LONGNAME: "PancakeSwap ETH",
      NAME: "PCSETH",
      FACTORY: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
      CHAIN: chain[2],
      DOTS:  "💶"
    },
    {
      LONGNAME: "ShibaSwap",
      NAME: "SHIB",
      FACTORY: "0x115934131916C8b277DD010Ee02de363c09d037c",
      CHAIN: chain[2],
      DOTS: "💶"
    },
    {
      LONGNAME: "CRODEX",
      NAME: "CRO",
      FACTORY: "0xe9c29cB475C0ADe80bE0319B74AD112F1e80058F",
      CHAIN: chain[3],
      DOTS:  "💶"
    },
    {
      LONGNAME: "Mad Meerkat Finance",
      NAME: "MMF",
      FACTORY: "0xd590cc180601aecd6eeadd9b7f2b7611519544f4",
      CHAIN: chain[3],
      DOTS: "💶"
      
    },
    {
      LONGNAME: "MarSwap",
      NAME: "MSWAP",
      FACTORY: "0xBe0223f65813C7c82E195B48F8AAaAcb304FbAe7",
      CHAIN: chain[4],
      DOTS: "💶"
    },
    
    
  ]

  const ads = 
  [
    {
      NAME: "Crolon Mars",
      TGLINK: "https://t.me/crolon_mars"
    }
  ]

  


  module.exports = {
    chain,
    exchange,
    ads,
    baseCheckers
  }
