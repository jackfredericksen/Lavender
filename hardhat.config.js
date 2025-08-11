require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
// require("@tenderly/hardhat-tenderly"); // Temporarily disabled
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
      // Removed viaIR for now to avoid warnings
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
        blockNumber: 18800000, // Pin to recent block for consistency
      },
      accounts: {
        accountsBalance: "10000000000000000000000" // 10k ETH per account
      },
      // Fix gas issues on forked network
      initialBaseFeePerGas: 0,
      gas: 30000000,
      gasPrice: 1000000000 // 1 gwei
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 20000000000 // 20 gwei
    },
    mainnet: {
      url: process.env.RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 ? [process.env.PRIVATE_KEY] : []
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 20, // gwei
    // coinmarketcap: process.env.CMC_API_KEY, // Commented out to avoid API errors
    showTimeSpent: true,
    showMethodSig: true,
    offline: true // Suppress price API warnings
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  // tenderly: {
  //   username: process.env.TENDERLY_USERNAME,
  //   project: process.env.TENDERLY_PROJECT
  // }
};