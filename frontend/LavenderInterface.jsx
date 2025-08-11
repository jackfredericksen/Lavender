import React, { useState, useEffect } from 'react';

// Lavender App with Beautiful Flower Theme (Artifact-Compatible)
const LavenderApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [swapAmount, setSwapAmount] = useState('0.1');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [lastTxResult, setLastTxResult] = useState(null);
  
  // Demo mode - simulated results for artifact display
  const [isDemoMode] = useState(true);
  
  // Demo connect wallet function
  const connectWallet = async () => {
    setIsLoading(true);
    setTxStatus('🔄 Connecting to wallet...');
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setUserAddress('0x742d35Cc6532C4532532C4532532C4532C453254');
      setTxStatus('✅ Connected to Sepolia testnet (Demo Mode)');
      setIsLoading(false);
    }, 1500);
  };

  // Demo transaction function
  const executeSwapAndSupply = async () => {
    setIsLoading(true);
    setTxStatus('🔄 Preparing transaction...');
    
    // Simulate transaction steps
    const steps = [
      '💧 Wrapping ETH to WETH...',
      '✅ Approving WETH for Lavender...',
      '🌸 Executing Lavender optimization...',
      '⏳ Waiting for confirmation...'
    ];
    
    forimport React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Lavender App with Beautiful Flower Theme
const LavenderApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lavenderContract, setLavenderContract] = useState(null);
  
  // Transaction state
  const [swapAmount, setSwapAmount] = useState('0.1');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [gasEstimate, setGasEstimate] = useState(null);
  const [lastTxResult, setLastTxResult] = useState(null);
  
  // Contract addresses (Sepolia Testnet)
  const LAVENDER_ADDRESS = "YOUR_DEPLOYED_TESTNET_ADDRESS"; // Update after deployment
  const WETH_SEPOLIA = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const USDC_SEPOLIA = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // Example
  const AAVE_POOL_SEPOLIA = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  
  // Simplified ABI for essential functions
  const LAVENDER_ABI = [
    "function swapAndSupply((address,address,uint24,uint256,uint256,address,uint16)) external returns (uint256)",
    "function estimateGasSavings(uint256) external view returns (uint256)",
    "function calculateFee(uint256,uint256) external view returns (uint256)",
    "function owner() external view returns (address)",
    "function feePercentage() external view returns (uint256)"
  ];

  const WETH_ABI = [
    "function approve(address,uint256) external returns (bool)",
    "function balanceOf(address) external view returns (uint256)",
    "function deposit() external payable"
  ];

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Check if on Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) {
        alert("Please switch to Sepolia testnet!");
        return;
      }
      
      const lavender = new ethers.Contract(LAVENDER_ADDRESS, LAVENDER_ABI, signer);
      
      setProvider(provider);
      setSigner(signer);
      setLavenderContract(lavender);
      setUserAddress(address);
      setIsConnected(true);
      setTxStatus("✅ Connected to Sepolia testnet");
      
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setTxStatus("❌ Failed to connect wallet");
    }
  };

  // Execute optimized swap + supply
  const executeSwapAndSupply = async () => {
    if (!lavenderContract || !signer) return;
    
    setIsLoading(true);
    setTxStatus("🔄 Preparing transaction...");
    
    try {
      const amountIn = ethers.utils.parseEther(swapAmount);
      
      // First get/wrap some WETH for testing
      const wethContract = new ethers.Contract(WETH_SEPOLIA, WETH_ABI, signer);
      
      setTxStatus("💧 Wrapping ETH to WETH...");
      const wrapTx = await wethContract.deposit({ value: amountIn });
      await wrapTx.wait();
      
      setTxStatus("✅ Approving WETH for Lavender...");
      const approveTx = await wethContract.approve(LAVENDER_ADDRESS, amountIn);
      await approveTx.wait();
      
      // Prepare swap and supply parameters
      const params = {
        tokenIn: WETH_SEPOLIA,
        tokenOut: USDC_SEPOLIA,
        fee: 3000, // 0.3%
        amountIn: amountIn,
        amountOutMinimum: 0,
        aavePool: AAVE_POOL_SEPOLIA,
        referralCode: 0
      };
      
      setTxStatus("🌸 Executing Lavender optimization...");
      const tx = await lavenderContract.swapAndSupply(params);
      
      setTxStatus("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Calculate savings
      const baselineGas = 426933;
      const actualGas = receipt.gasUsed.toNumber();
      const gasSaved = baselineGas - actualGas;
      const percentSaved = ((gasSaved / baselineGas) * 100).toFixed(1);
      
      setLastTxResult({
        hash: receipt.transactionHash,
        gasUsed: actualGas,
        gasSaved: gasSaved,
        percentSaved: percentSaved
      });
      
      setTxStatus(`🎉 Success! Saved ${gasSaved.toLocaleString()} gas (${percentSaved}%)`);
      
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxStatus("❌ Transaction failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-violet-100">
      {/* Floating flower decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl animate-pulse opacity-20">🌸</div>
        <div className="absolute top-40 right-20 text-4xl animate-bounce opacity-30">🌺</div>
        <div className="absolute bottom-32 left-1/4 text-5xl animate-pulse opacity-25">🌷</div>
        <div className="absolute bottom-20 right-1/3 text-3xl animate-bounce opacity-20">🌻</div>
        <div className="absolute top-1/3 left-1/2 text-4xl animate-pulse opacity-15">🌹</div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl mr-4">🌸</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-violet-600 bg-clip-text text-transparent">
              Lavender Protocol
            </h1>
            <span className="text-6xl ml-4">🌸</span>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Gas-Optimized DeFi Transaction Batching
          </p>
          <p className="text-sm text-purple-600 font-medium">
            🌺 Save 20-40% on gas costs • Testnet Beta 🌺
          </p>
        </div>

        {/* Main Interface Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-100 p-8">
            
            {/* Connection Status */}
            {!isConnected ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🌸</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect to Sepolia testnet to try Lavender's gas optimization
                </p>
                <button
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🌸 Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Connected Wallet</p>
                      <p className="font-mono text-xs text-gray-600">
                        {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                      </p>
                    </div>
                    <div className="text-2xl">🌸</div>
                  </div>
                </div>

                {/* Gas Savings Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-800">Expected Savings</p>
                      <p className="text-lg font-bold text-green-600">~98,000 gas (23%)</p>
                    </div>
                    <div className="text-2xl">💰</div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌺 ETH Amount to Optimize
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      max="1"
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50"
                      placeholder="0.1"
                    />
                    <div className="absolute right-3 top-3 text-purple-400">ETH</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    🌸 ETH → WETH → USDC → Supply to Aave (all in one transaction!)
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={executeSwapAndSupply}
                  disabled={isLoading || !swapAmount || parseFloat(swapAmount) <= 0}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 text-white py-4 px-6 rounded-2xl font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Optimizing...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>🌸</span>
                      <span>Optimize with Lavender</span>
                      <span>🌸</span>
                    </span>
                  )}
                </button>

                {/* Status Display */}
                {txStatus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <p className="text-sm text-blue-800 text-center">{txStatus}</p>
                  </div>
                )}

                {/* Results Display */}
                {lastTxResult && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                    <h4 className="font-semibold text-green-800 mb-2">🎉 Optimization Results</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Gas Used:</span>
                        <span className="font-mono">{lastTxResult.gasUsed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gas Saved:</span>
                        <span className="font-mono text-green-600">
                          {lastTxResult.gasSaved.toLocaleString()} ({lastTxResult.percentSaved}%)
                        </span>
                      </div>
                      <div className="pt-2">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${lastTxResult.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          🔗 View on Etherscan
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* How It Works */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-200 rounded-2xl p-4">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                    <span className="mr-2">🌺</span>
                    How Lavender Works
                  </h4>
                  <ol className="text-xs text-purple-700 space-y-1">
                    <li>1. 🌸 Wrap ETH → WETH</li>
                    <li>2. 🔄 Swap WETH → USDC on Uniswap V3</li>
                    <li>3. 💰 Supply USDC to Aave V3</li>
                    <li>4. ✨ All in one optimized transaction!</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-purple-100">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-bold text-purple-600">23%</div>
              <div className="text-sm text-gray-600">Average Gas Savings</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-pink-100">
              <div className="text-3xl mb-2">🌸</div>
              <div className="text-2xl font-bold text-pink-600">98k</div>
              <div className="text-sm text-gray-600">Gas Saved Per Transaction</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-violet-100">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-violet-600">$1.70</div>
              <div className="text-sm text-gray-600">Average User Savings</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>🌸 Lavender Protocol • Testnet Beta • Made with 💜 for DeFi users</p>
        </div>
      </div>
    </div>
  );
};

export default LavenderApp;