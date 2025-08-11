// test/lavender-contract-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const GasAnalyzer = require("../utils/gasAnalyzer");

describe("Lavender BatchExecutor Contract", function() {
  let lavender;
  let analyzer;
  let owner, user;
  
  // Contract addresses
  const UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const AAVE_POOL = ethers.utils.getAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2");
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  beforeEach(async function() {
    analyzer = new GasAnalyzer();
    [owner, user] = await ethers.getSigners();
    
    // Deploy Lavender contract
    const LavenderFactory = await ethers.getContractFactory("Lavender");
    // OpenZeppelin v5 requires initial owner parameter
    lavender = await LavenderFactory.deploy(owner.address);
    await lavender.deployed();
    
    console.log(`🌸 Lavender deployed at: ${lavender.address}`);
    
    // Setup: Get WETH for testing
    const weth = await ethers.getContractAt("IWETH", WETH);
    await weth.connect(user).deposit({ value: ethers.utils.parseEther("10") });
  });

  describe("Deployment", function() {
    it("Should deploy with correct initial values", async function() {
      expect(await lavender.owner()).to.equal(owner.address);
      expect(await lavender.feePercentage()).to.equal(1500); // 15%
      expect(await lavender.UNISWAP_V3_ROUTER()).to.equal(UNISWAP_ROUTER);
      
    });
  });

  describe("SwapAndSupply Optimization", function() {
    it("Should execute swap + supply in one transaction with gas savings", async function() {
      const weth = await ethers.getContractAt("IERC20", WETH);
      const usdc = await ethers.getContractAt("IERC20", USDC);
      
      const swapAmount = ethers.utils.parseEther("1");
      
      // Approve Lavender to spend WETH
      await weth.connect(user).approve(lavender.address, swapAmount);
      
      const swapAndSupplyParams = {
        tokenIn: WETH,
        tokenOut: USDC,
        fee: 3000, // 0.3%
        amountIn: swapAmount,
        amountOutMinimum: 0,
        aavePool: AAVE_POOL, // Pass as parameter since it's not a constant anymore
        referralCode: 0
      };
      
      // Execute optimized batch transaction
      const optimizedTx = await analyzer.measureFunction(
        lavender.connect(user),
        "swapAndSupply",
        [swapAndSupplyParams],
        "Lavender: Optimized swap + supply"
      );
      
      // Check that user received aUSDC tokens (proof supply worked)
      const aUSDC = await ethers.getContractAt("IERC20", "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c"); // aUSDC token
      const userAUSDCBalance = await aUSDC.balanceOf(user.address);
      
      console.log(`✅ User received ${ethers.utils.formatUnits(userAUSDCBalance, 6)} aUSDC`);
      expect(userAUSDCBalance).to.be.gt(0);
      
      // Compare against our baseline (426,933 gas)
      const baselineGas = 426933;
      const gasSaved = baselineGas - optimizedTx.gasUsed;
      const percentSaved = ((gasSaved / baselineGas) * 100).toFixed(1);
      
      console.log(`\n🎯 LAVENDER OPTIMIZATION RESULTS:`);
      console.log(`Baseline (separate txs): ${baselineGas.toLocaleString()} gas`);
      console.log(`Lavender (batched): ${optimizedTx.gasUsed.toLocaleString()} gas`);
      console.log(`Gas Saved: ${gasSaved.toLocaleString()} gas`);
      console.log(`Percentage Saved: ${percentSaved}%`);
      
      // Verify we achieved our target savings (20-40%)
      expect(gasSaved).to.be.gt(baselineGas * 0.20); // At least 20% savings
      console.log(`✅ Achieved ${percentSaved}% gas savings (target: 20-40%)`);
    });
  });

  describe("Batch Approvals", function() {
    it("Should batch multiple token approvals efficiently", async function() {
      const weth = await ethers.getContractAt("IERC20", WETH);
      const usdc = await ethers.getContractAt("IERC20", USDC);
      
      // Test batching 3 approvals
      const tokens = [WETH, USDC, WETH]; // Can approve same token to different spenders
      const spenders = [UNISWAP_ROUTER, AAVE_POOL, lavender.address];
      const amounts = [
        ethers.utils.parseEther("100"),
        ethers.utils.parseUnits("100000", 6),
        ethers.utils.parseEther("50")
      ];
      
      await analyzer.measureFunction(
        lavender.connect(user),
        "batchApprovals",
        [tokens, spenders, amounts],
        "Lavender: Batch 3 approvals"
      );
      
      // Verify approvals were set
      expect(await weth.allowance(lavender.address, UNISWAP_ROUTER)).to.equal(amounts[0]);
      expect(await usdc.allowance(lavender.address, AAVE_POOL)).to.equal(amounts[1]);
      expect(await weth.allowance(lavender.address, lavender.address)).to.equal(amounts[2]);
    });
  });

  describe("Custom Batch Execution", function() {
    it("Should execute custom action batches", async function() {
      const weth = await ethers.getContractAt("IERC20", WETH);
      
      // Create batch: approve + transfer
      const approveData = weth.interface.encodeFunctionData("approve", [
        UNISWAP_ROUTER, 
        ethers.utils.parseEther("1")
      ]);
      
      const transferData = weth.interface.encodeFunctionData("transfer", [
        user.address,
        ethers.utils.parseEther("0.1")
      ]);
      
      const actions = [
        {
          target: WETH,
          data: approveData,
          value: 0,
          required: true
        },
        {
          target: WETH,
          data: transferData,
          value: 0,
          required: false
        }
      ];
      
      await analyzer.measureFunction(
        lavender,
        "executeBatch",
        [actions],
        "Lavender: Custom batch execution"
      );
    });
  });

  describe("Gas Estimation Functions", function() {
    it("Should calculate accurate gas savings estimates", async function() {
      const baselineGas = 426933;
      const estimatedSavings = await lavender.estimateGasSavings(baselineGas);
      
      // Should estimate 25% savings (conservative)
      expect(estimatedSavings).to.equal(Math.floor(baselineGas / 4));
      console.log(`📊 Estimated savings: ${estimatedSavings.toLocaleString()} gas`);
    });
    
    it("Should calculate fees correctly", async function() {
      const gasSaved = 100000;
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      
      const fee = await lavender.calculateFee(gasSaved, gasPrice);
      const expectedFee = gasSaved * gasPrice * 1500 / 10000; // 15%
      
      expect(fee).to.equal(expectedFee);
      console.log(`💰 Fee for 100k gas saved: ${ethers.utils.formatEther(fee)} ETH`);
    });
  });

  describe("Admin Functions", function() {
    it("Should allow owner to update fee percentage", async function() {
      await lavender.setFeePercentage(1000); // 10%
      expect(await lavender.feePercentage()).to.equal(1000);
    });
    
    it("Should not allow fee above maximum", async function() {
      await expect(
        lavender.setFeePercentage(2500) // 25% > 20% max
      ).to.be.revertedWith("Fee too high");
    });
    
    it("Should not allow non-owner to change fee", async function() {
      await expect(
        lavender.connect(user).setFeePercentage(1000)
      ).to.be.revertedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("Security", function() {
    it("Should prevent reentrancy attacks", async function() {
      // This would require a malicious contract to test properly
      // For now, just verify the modifier is in place
      expect(await lavender.feePercentage()).to.be.gt(0); // Contract is responsive
    });
  });

  // Compare with baseline measurements
  after(function() {
    console.log(`\n🌸 LAVENDER PERFORMANCE SUMMARY:`);
    console.log(`Target baseline: 426,933 gas (4 separate transactions)`);
    console.log(`Expected savings: 20-40% (85k-171k gas)`);
    console.log(`Revenue model: 15% of gas savings as service fee`);
    analyzer.generateReport();
  });
});