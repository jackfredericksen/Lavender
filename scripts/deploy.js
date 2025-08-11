// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🌸 Deploying Lavender BatchExecutor...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

  // Deploy Lavender contract
  const LavenderFactory = await ethers.getContractFactory("Lavender");
  
  console.log("📦 Deploying Lavender contract...");
  const lavender = await LavenderFactory.deploy();
  await lavender.deployed();

  console.log("✅ Lavender deployed successfully!");
  console.log("📍 Contract address:", lavender.address);
  console.log("🔗 Deployment transaction:", lavender.deployTransaction.hash);
  
  // Verify initial configuration
  console.log("\n🔧 Initial Configuration:");
  console.log("Owner:", await lavender.owner());
  console.log("Fee percentage:", await lavender.feePercentage(), "basis points (15%)");
  console.log("Uniswap V3 Router:", await lavender.UNISWAP_V3_ROUTER());
  console.log("Aave V3 Pool:", await lavender.AAVE_V3_POOL());
  console.log("WETH address:", await lavender.WETH());

  // Gas usage report
  const deploymentReceipt = await lavender.deployTransaction.wait();
  console.log("\n⛽ Gas Usage:");
  console.log("Deployment gas used:", deploymentReceipt.gasUsed.toNumber().toLocaleString());
  console.log("Gas price:", ethers.utils.formatUnits(lavender.deployTransaction.gasPrice, "gwei"), "gwei");
  
  const deploymentCost = deploymentReceipt.gasUsed.mul(lavender.deployTransaction.gasPrice);
  console.log("Total deployment cost:", ethers.utils.formatEther(deploymentCost), "ETH");

  // Contract verification info (for mainnet)
  if (network.name !== "hardhat") {
    console.log("\n📋 Contract Verification:");
    console.log("Run this command to verify on Etherscan:");
    console.log(`npx hardhat verify --network ${network.name} ${lavender.address}`);
  }

  // Integration examples
  console.log("\n🚀 Integration Examples:");
  console.log("Frontend integration:");
  console.log(`const lavenderAddress = "${lavender.address}";`);
  console.log("const lavenderABI = [...]; // Import from artifacts");
  
  console.log("\nSwap + Supply example:");
  console.log("const params = {");
  console.log("  tokenIn: WETH_ADDRESS,");
  console.log("  tokenOut: USDC_ADDRESS,");
  console.log("  fee: 3000,");
  console.log("  amountIn: ethers.utils.parseEther('1'),");
  console.log("  amountOutMinimum: 0,");
  console.log("  aavePool: AAVE_V3_POOL,");
  console.log("  referralCode: 0");
  console.log("};");
  console.log("await lavender.swapAndSupply(params);");

  // Business metrics
  console.log("\n📊 Business Projections:");
  console.log("Target gas savings: 20-40% (85k-170k gas per transaction)");
  console.log("Service fee: 15% of gas savings");
  console.log("Revenue per transaction: $1-2 USD (at 20 gwei)");
  console.log("Monthly target: 1000 transactions = $1k-2k revenue");
  
  console.log("\n🌸 Lavender deployment complete! Ready to optimize DeFi gas usage.");
  
  return lavender.address;
}

// Handle deployment
main()
  .then((address) => {
    console.log(`\n✅ Deployment successful: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });