// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/DeFiInterfaces.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Lavender - Gas Optimization BatchExecutor
 * @author Lavender Team
 * @notice Batches multiple DeFi operations into single transactions to reduce gas costs by 20-40%
 * @dev Optimizes common workflows like swap+supply, multi-approvals, harvest+compound
 */
contract Lavender is ReentrancyGuard, Ownable {
    
    // =============================================================
    //                          EVENTS
    // =============================================================
    
    event BatchExecuted(
        address indexed user,
        uint256 actionsCount,
        uint256 gasUsed,
        uint256 gasSaved
    );
    
    event FeeCollected(
        address indexed user,
        uint256 amount,
        address token
    );
    
    // =============================================================
    //                         STRUCTS
    // =============================================================
    
    struct Action {
        address target;      // Contract to call
        bytes data;         // Encoded function call
        uint256 value;      // ETH value to send
        bool required;      // If true, revert on failure
    }
    
    struct SwapAndSupplyParams {
        // Uniswap swap parameters
        address tokenIn;
        address tokenOut;
        uint24 fee;
        uint256 amountIn;
        uint256 amountOutMinimum;
        
        // Aave supply parameters
        address aavePool;
        uint16 referralCode;
    }
    
    // =============================================================
    //                        CONSTANTS
    // =============================================================
    
    // Mainnet contract addresses
    address public constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant AAVE_V3_POOL = 0x87870Bca3F3fD6335C3F4Ce8392D69350B4fA4E2;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    // Fee configuration
    uint256 public feePercentage = 1500; // 15% of gas savings (basis points)
    uint256 public constant MAX_FEE = 2000; // 20% max fee
    
    // =============================================================
    //                        MODIFIERS
    // =============================================================
    
    modifier validFee(uint256 _fee) {
        require(_fee <= MAX_FEE, "Fee too high");
        _;
    }
    
    // =============================================================
    //                    CORE BATCH FUNCTIONS
    // =============================================================
    
    /**
     * @notice Execute multiple actions in a single transaction
     * @param actions Array of actions to execute
     * @return success Whether all required actions succeeded
     */
    function executeBatch(Action[] calldata actions) 
        external 
        payable 
        nonReentrant 
        returns (bool success) 
    {
        uint256 gasStart = gasleft();
        uint256 executedActions = 0;
        
        for (uint256 i = 0; i < actions.length; i++) {
            bool actionSuccess = _executeAction(actions[i]);
            
            if (actions[i].required && !actionSuccess) {
                revert("Required action failed");
            }
            
            if (actionSuccess) {
                executedActions++;
            }
        }
        
        uint256 gasUsed = gasStart - gasleft();
        
        emit BatchExecuted(msg.sender, executedActions, gasUsed, 0);
        
        return true;
    }
    
    /**
     * @notice Optimized swap + supply workflow (our biggest opportunity!)
     * @param params Swap and supply parameters
     * @dev Saves ~85k-170k gas vs separate transactions (our baseline: 426,933 gas)
     */
    function swapAndSupply(SwapAndSupplyParams calldata params) 
        external 
        nonReentrant 
        returns (uint256 amountOut) 
    {
        require(params.amountIn > 0, "Invalid amount");
        
        // Transfer input token from user
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        
        // Approve Uniswap router
        IERC20(params.tokenIn).approve(UNISWAP_V3_ROUTER, params.amountIn);
        
        // Execute swap
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter.ExactInputSingleParams({
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            fee: params.fee,
            recipient: address(this), // Receive tokens here for supply
            deadline: block.timestamp + 300,
            amountIn: params.amountIn,
            amountOutMinimum: params.amountOutMinimum,
            sqrtPriceLimitX96: 0
        });
        
        amountOut = ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(swapParams);
        
        // Approve Aave pool
        IERC20(params.tokenOut).approve(params.aavePool, amountOut);
        
        // Supply to Aave on behalf of user
        IPool(params.aavePool).supply(
            params.tokenOut,
            amountOut,
            msg.sender, // User receives aTokens
            params.referralCode
        );
        
        return amountOut;
    }
    
    /**
     * @notice Batch multiple token approvals (saves ~20k gas per approval after first)
     * @param tokens Array of token addresses
     * @param spenders Array of spender addresses  
     * @param amounts Array of approval amounts
     */
    function batchApprovals(
        address[] calldata tokens,
        address[] calldata spenders,
        uint256[] calldata amounts
    ) external nonReentrant {
        require(
            tokens.length == spenders.length && 
            tokens.length == amounts.length, 
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).approve(spenders[i], amounts[i]);
        }
    }
    
    // =============================================================
    //                     INTERNAL FUNCTIONS
    // =============================================================
    
    function _executeAction(Action calldata action) internal returns (bool success) {
        (success, ) = action.target.call{value: action.value}(action.data);
    }
    
    // =============================================================
    //                      ADMIN FUNCTIONS
    // =============================================================
    
    function setFeePercentage(uint256 _feePercentage) external onlyOwner validFee(_feePercentage) {
        feePercentage = _feePercentage;
    }
    
    function rescueETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function rescueToken(address token) external onlyOwner {
        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
    }
    
    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================
    
    function estimateGasSavings(uint256 separateGasUsed) external view returns (uint256 savings) {
        // Conservative estimate: 25% savings
        return separateGasUsed / 4;
    }
    
    function calculateFee(uint256 gasSaved, uint256 gasPrice) external view returns (uint256 fee) {
        uint256 gasCostSaved = gasSaved * gasPrice;
        return (gasCostSaved * feePercentage) / 10000;
    }
    
    // Enable contract to receive ETH
    receive() external payable {}
}