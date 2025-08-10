// test/lavender-baseline-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const GasAnalyzer = require("../utils/gasAnalyzer");

describe("Lavender Baseline Gas Analysis", function() {
  let analyzer;
  let signer;
  
  // Mainnet contract addresses
  const UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const AAVE_POOL = "0x87870Bcd3e6b1f57c7F0cf58b7dB86b6b52c7d4a";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86a33E6417c8ee86d89C6E9f1e35C1DB4D0A3";

  beforeEach(async function() {
    analyzer = new GasAnalyzer();
    [signer] = await ethers.getSigners();
    
    // Get some WETH for testing
    const weth = await ethers.getContractAt("IWETH", WETH);
    await weth.deposit({ value: ethers.parseEther("10") });
  });

  it("Should measure Uniswap V3 swap gas usage", async function() {
    const router = await ethers.getContractAt("ISwapRouter", UNISWAP_ROUTER);
    const weth = await ethers.getContractAt("IERC20", WETH);
    
    // Approve WETH for router
    await analyzer.measureFunction(
      weth, 
      "approve", 
      [UNISWAP_ROUTER, ethers.parseEther("1")],
      "WETH approval for Uniswap"
    );

    // Perform swap: 1 WETH -> USDC
    const swapParams = {
      tokenIn: WETH,
      tokenOut: USDC,
      fee: 3000, // 0.3%
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      amountIn: ethers.utils.parseEther("1"),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };

    await analyzer.measureFunction(
      router,
      "exactInputSingle",
      [swapParams],
      "WETH -> USDC swap on Uniswap V3"
    );
  });

  it("Should measure Aave supply gas usage", async function() {
    const pool = await ethers.getContractAt("IPool", AAVE_POOL);
    const weth = await ethers.getContractAt("IERC20", WETH);
    
    // Approve WETH for Aave
    await analyzer.measureFunction(
      weth,
      "approve",
      [AAVE_POOL, ethers.utils.parseEther("1")],
      "WETH approval for Aave"
    );

    // Supply WETH to Aave
    await analyzer.measureFunction(
      pool,
      "supply",
      [WETH, ethers.utils.parseEther("1"), signer.address, 0],
      "Supply 1 WETH to Aave V3"
    );
  });

  it("Should measure combined swap + supply (separate transactions)", async function() {
    const router = await ethers.getContractAt("ISwapRouter", UNISWAP_ROUTER);
    const pool = await ethers.getContractAt("IPool", AAVE_POOL);
    const weth = await ethers.getContractAt("IERC20", WETH);
    const usdc = await ethers.getContractAt("IERC20", USDC);

    console.log("\n🔄 Measuring SEPARATE transactions (current user experience):");
    
    // Step 1: Approve WETH for Uniswap
    const approval1 = await analyzer.measureFunction(
      weth,
      "approve",
      [UNISWAP_ROUTER, ethers.utils.parseEther("1")],
      "WETH approval for Uniswap"
    );

    // Step 2: Swap WETH -> USDC
    const swapParams = {
      tokenIn: WETH,
      tokenOut: USDC,
      fee: 3000,
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: ethers.utils.parseEther("1"),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };

    const swap = await analyzer.measureFunction(
      router,
      "exactInputSingle",
      [swapParams],
      "WETH -> USDC swap"
    );

    // Step 3: Check USDC balance and approve for Aave
    const usdcBalance = await usdc.balanceOf(signer.address);
    console.log(`💰 Received USDC: ${ethers.utils.formatUnits(usdcBalance, 6)}`);

    const approval2 = await analyzer.measureFunction(
      usdc,
      "approve",
      [AAVE_POOL, usdcBalance],
      "USDC approval for Aave"
    );

    // Step 4: Supply USDC to Aave
    const supply = await analyzer.measureFunction(
      pool,
      "supply",
      [USDC, usdcBalance, signer.address, 0],
      "Supply USDC to Aave"
    );

    // Calculate total gas for the flow
    const totalGas = approval1.gasUsed + swap.gasUsed + approval2.gasUsed + supply.gasUsed;
    console.log(`\n📊 TOTAL GAS FOR SEPARATE TRANSACTIONS: ${totalGas.toLocaleString()}`);
    console.log(`💡 This is your optimization target!`);

    analyzer.generateReport();
  });

  it("Should analyze real mainnet transactions", async function() {
    // Analyze some real expensive DeFi transactions
    const expensiveTxs = [
      "0x8c72b0d82e8c0d39babe1ecd5c073c4b9a6ba66f2b98b30d1b6c1b5c7b2e8a5f", // Example - replace with real tx
    ];

    for (const txHash of expensiveTxs) {
      try {
        await analyzer.analyzeMainnetTransaction(txHash);
      } catch (error) {
        console.log(`⚠️ Could not analyze ${txHash}: ${error.message}`);
      }
    }
  });
});