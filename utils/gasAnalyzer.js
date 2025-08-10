// utils/gasAnalyzer.js
const { ethers } = require("hardhat");

class GasAnalyzer {
  constructor() {
    this.measurements = [];
  }

  async measureTransaction(name, txPromise, description = "") {
    console.log(`\n🔍 Analyzing: ${name}`);
    
    const tx = await txPromise;
    const receipt = await tx.wait();
    
    const measurement = {
      name,
      description,
      gasUsed: receipt.gasUsed.toNumber(),
      gasPrice: tx.gasPrice ? tx.gasPrice.toNumber() : 0,
      gasCost: receipt.gasUsed.mul(tx.gasPrice || 0),
      txHash: receipt.transactionHash
    };
    
    this.measurements.push(measurement);
    
    console.log(`⛽ Gas Used: ${measurement.gasUsed.toLocaleString()}`);
    console.log(`💰 Gas Cost: ${ethers.utils.formatEther(measurement.gasCost)} ETH`);
    
    return measurement;
  }

  async measureFunction(contractInstance, functionName, args = [], description = "") {
    const name = `${contractInstance.constructor.name}.${functionName}`;
    
    // Estimate gas first
    try {
      const estimatedGas = await contractInstance.estimateGas[functionName](...args);
      console.log(`📊 Estimated Gas: ${estimatedGas.toNumber().toLocaleString()}`);
    } catch (error) {
      console.log(`⚠️  Gas estimation failed: ${error.message}`);
    }

    // Execute and measure
    const txPromise = contractInstance[functionName](...args);
    return await this.measureTransaction(name, txPromise, description);
  }

  compareMeasurements(baseline, optimized) {
    const gasSaved = baseline.gasUsed - optimized.gasUsed;
    const percentSaved = ((gasSaved / baseline.gasUsed) * 100).toFixed(2);
    const costSaved = baseline.gasCost.sub(optimized.gasCost);

    console.log(`\n📈 OPTIMIZATION RESULTS:`);
    console.log(`Original Gas: ${baseline.gasUsed.toLocaleString()}`);
    console.log(`Optimized Gas: ${optimized.gasUsed.toLocaleString()}`);
    console.log(`Gas Saved: ${gasSaved.toLocaleString()} (${percentSaved}%)`);
    console.log(`Cost Saved: ${ethers.utils.formatEther(costSaved)} ETH`);

    return {
      gasSaved,
      percentSaved: parseFloat(percentSaved),
      costSaved
    };
  }

  generateReport() {
    console.log(`\n📋 GAS ANALYSIS REPORT`);
    console.log(`${'='.repeat(50)}`);
    
    this.measurements.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}`);
      console.log(`   Gas: ${m.gasUsed.toLocaleString()}`);
      console.log(`   Cost: ${ethers.utils.formatEther(m.gasCost)} ETH`);
      if (m.description) console.log(`   Note: ${m.description}`);
      console.log();
    });

    return this.measurements;
  }

  // Analyze gas usage of popular DeFi actions on mainnet
  async analyzeMainnetTransaction(txHash) {
    const provider = ethers.provider;
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    console.log(`\n🔍 Analyzing Mainnet TX: ${txHash}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toNumber().toLocaleString()}`);
    console.log(`💰 Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, 'gwei')} gwei`);
    console.log(`💵 Total Cost: ${ethers.utils.formatEther(receipt.gasUsed.mul(tx.gasPrice))} ETH`);

    return {
      gasUsed: receipt.gasUsed.toNumber(),
      gasPrice: tx.gasPrice.toNumber(),
      totalCost: receipt.gasUsed.mul(tx.gasPrice)
    };
  }
}

module.exports = GasAnalyzer;