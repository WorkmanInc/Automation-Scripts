let chain = [
    {
      LONGNAME: "Crazy Internet Coin",
      NAME: "CIC",
      API: "https://backend.newscan.cicscan.com/coin_price",
      RPC: "https://xapi.cicscan.com/",
      EXP: "https://cicscan.com/",
      NATIVE: "0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA",
      BASES: ["0x4130A6f00bb48ABBcAA8B7a04D00Ab29504AD9dA"]
    },
    {
      LONGNAME: "Binance",
      NAME: "BNB",
      API: "https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD",
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
      API: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
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
      API: "https://min-api.cryptocompare.com/data/price?fsym=CRO&tsyms=USD",
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
      LONGNAME: "DEXIT",
      NAME: "DXT",
      API: "https://min-api.cryptocompare.com/data/price?fsym=DXT&tsyms=USD",
      RPC: "https://dxt.dexit.network",
      EXP: "https://dxtscan.com/",
      NATIVE: "0x414b8BAf9950C87804cf7E23BB43a58AE7e1E202",
      BASES: [
        "0x414b8BAf9950C87804cf7E23BB43a58AE7e1E202",   // dxt
        "0x10Be3d7eE0f77409E0A37e075083d43667Ef1eD1",   // busd
       "0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D",    // usdt
       "0x765277EebeCA2e31912C9946eAe1021199B39C61",    // usdc 
      ]
      
    }
  ];

  
let exchange = [
    {
      LONGNAME: "Farmageddon",
      NAME: "FARM",
      FACTORY: "0xfD35F3f178353572E4357983AD2831fAcd652cC5",
      CHAIN: chain[0],
      DOTS: "\xF0\x9F\x9A\x9C"  // tractor
    },
    {
        LONGNAME: "WendDex",
        NAME: "WEN",
        FACTORY: "0x51eD5a1f2EC7516dB92ff5Ae8d76ea4A2B87A6d1",
        CHAIN: chain[0],
        DOTS: "\xF0\x9F\x94\xB5"
    },
    {
      LONGNAME: "PancakeSwap",
      NAME: "PCS",
      FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
      CHAIN: chain[1],
      DOTS: "\xF0\x9F\x92\xB5" // rabbit
    },
    {
      LONGNAME: "Ape Swap",
      NAME: "APE",
      FACTORY: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
      CHAIN: chain[1],
      DOTS: "\xF0\x9F\x92\xB5"
    },
    {
      LONGNAME: "BiSwap",
      NAME: "BIS",
      FACTORY: "0x858e3312ed3a876947ea49d572a7c42de08af7ee",
      CHAIN: chain[1],
      DOTS: "\xF0\x9F\x92\xB5"
    },
    {
      LONGNAME: "Donk Swap",
      NAME: "DONK",
      FACTORY: "0x04D6b20f805e2bd537DDe84482983AabF59536FF",
      CHAIN: chain[1],
      DOTS: "\xF0\x9F\x90\xB4"
    },
    {
      LONGNAME: "UniSwap V3",
      NAME: "UNIV3",
      FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      CHAIN: chain[2],
      FEES: [100, 500, 3000, 10000],
      DOTS: "\xF0\x9F\x92\xB5"
    },
    {
      LONGNAME: "UniSwap V2",
      NAME: "UNIV2",
      FACTORY: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      CHAIN: chain[2],
      DOTS: "\xF0\x9F\x92\xB0"
    },
    {
      LONGNAME: "PancakeSwap ETH",
      NAME: "PCSETH",
      FACTORY: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
      CHAIN: chain[2],
      DOTS:  "\xF0\x9F\x92\xB5"
    },
    {
      LONGNAME: "CRODEX",
      NAME: "CRO",
      FACTORY: "0xe9c29cB475C0ADe80bE0319B74AD112F1e80058F",
      CHAIN: chain[3],
      DOTS:  "\xF0\x9F\x92\xB5"
    },
    {
      LONGNAME: "Mad Meerkat Finance",
      NAME: "MMF",
      FACTORY: "0xd590cc180601aecd6eeadd9b7f2b7611519544f4",
      CHAIN: chain[3],
      DOTS:  "\xF0\x9F\x92\xB5"
      
    },
    {
      LONGNAME: "Dexit Network",
      NAME: "DXT",
      FACTORY: "0xed7e00862c73eF3a53f33d785c62d312Cc8827d2",
      CHAIN: chain[4],
      DOTS:  "U+1F7E2"
      
    }
    
  ]

  const ads = 
  [
    {
      NAME: "Apocalypse",
      TGLINK: "https://t.me/ApocalypseP2E"
    },
    {
      NAME: "Donkey King Casino",
      TGLINK: "https://t.me/donkeykingegofficial"
    }
  ]

  


  module.exports = {
    chain,
    exchange,
    ads
  }