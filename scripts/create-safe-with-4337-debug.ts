/**
 * Debug version of Safe deployment with 4337 module
 * Enhanced error handling and gas estimation
 */

import "dotenv/config";
import { ethers } from "ethers";
import { writeFileSync } from "fs";

// Safe addresses for Sepolia (corrected checksums)
const SAFE_PROXY_FACTORY_ADDRESS = "0x4E1dcf7Ad4E760cf9a9c9B3a4E0e4547406245f6";
const SAFE_SINGLETON_ADDRESS = "0x41675C099f32341bf84BFC5382AF534dF5c3341a";

// Safe ABI (minimal)
const SAFE_SINGLETON_ABI = [
  "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external"
];

const SAFE_PROXY_FACTORY_ABI = [
  "function createProxyWithNonce(address _singleton, bytes calldata initializer, uint256 saltNonce) external returns (SafeProxy proxy)"
];

const SAFE_MODULE_SETUP_ABI = [
  "function enableModules(address[] calldata modules) external"
];

async function main() {
  console.log("=== Debug Safe Deployment with 4337 Module ===");
  
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const ownerAddress = await signer.getAddress();
  
  console.log("Owner address:", ownerAddress);
  console.log("Network:", (await provider.getNetwork()).name);
  
  // Check balance
  const balance = await provider.getBalance(ownerAddress);
  console.log("Current balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(ethers.utils.parseEther("0.02"))) {
    console.log("Insufficient funds for Safe creation");
    console.log("Need at least 0.02 ETH for Safe deployment");
    return;
  }

  try {
    // Use deployed module addresses from Safe modules repository
    const safe4337ModuleAddress = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226";
    const safeModuleSetupAddress = "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47";
    
    console.log("Using deployed modules:");
    console.log("  Safe4337Module:", safe4337ModuleAddress);
    console.log("  SafeModuleSetup:", safeModuleSetupAddress);

    // Create Safe with 4337 module enabled
    console.log("\n1. Creating Safe with 4337 module...");
    
    const safeSingleton = new ethers.Contract(SAFE_SINGLETON_ADDRESS, SAFE_SINGLETON_ABI, signer);
    const safeModuleSetup = new ethers.Contract(safeModuleSetupAddress, SAFE_MODULE_SETUP_ABI, signer);
    
    // Prepare setup data to enable the 4337 module
    const enableModulesData = safeModuleSetup.interface.encodeFunctionData("enableModules", [[safe4337ModuleAddress]]);
    
    console.log("Enable modules data:", enableModulesData);
    
    const setupData = safeSingleton.interface.encodeFunctionData("setup", [
      [ownerAddress], // owners
      1, // threshold
      safeModuleSetupAddress, // to (SafeModuleSetup)
      enableModulesData, // data (enable 4337 module)
      safe4337ModuleAddress, // fallbackHandler (Safe4337Module)
      "0x0000000000000000000000000000000000000000", // paymentToken
      0, // payment
      "0x0000000000000000000000000000000000000000" // paymentReceiver
    ]);

    console.log("Setup data:", setupData);
    
    const saltNonce = ethers.utils.hexZeroPad(ethers.utils.hexlify(Date.now()), 32);
    console.log("Salt nonce:", saltNonce);
    
    // Calculate expected Safe address
    const initCode = ethers.utils.solidityPack(
      ["bytes20", "bytes"],
      [SAFE_SINGLETON_ADDRESS, setupData]
    );
    const initCodeHash = ethers.utils.keccak256(initCode);
    const expectedSafeAddress = ethers.utils.getCreate2Address(
      SAFE_PROXY_FACTORY_ADDRESS,
      saltNonce,
      initCodeHash
    );
    
    console.log("Expected Safe address:", expectedSafeAddress);

    // Deploy Safe with higher gas limit and error handling
    const safeProxyFactory = new ethers.Contract(SAFE_PROXY_FACTORY_ADDRESS, SAFE_PROXY_FACTORY_ABI, signer);
    
    console.log("Estimating gas...");
    try {
      const gasEstimate = await safeProxyFactory.estimateGas.createProxyWithNonce(
        SAFE_SINGLETON_ADDRESS,
        setupData,
        saltNonce
      );
      console.log("Estimated gas:", gasEstimate.toString());
    } catch (error) {
      console.log("Gas estimation failed:", error.message);
    }
    
    console.log("Deploying Safe with 2M gas limit...");
    const deployTx = await safeProxyFactory.createProxyWithNonce(
      SAFE_SINGLETON_ADDRESS,
      setupData,
      saltNonce,
      { gasLimit: 2000000 }
    );

    console.log("Deployment transaction hash:", deployTx.hash);
    console.log("Waiting for Safe deployment...");
    
    const receipt = await deployTx.wait();
    
    if (receipt.status === 0) {
      console.log("❌ Safe deployment failed!");
      console.log("Transaction hash:", receipt.transactionHash);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Try to get more error details
      try {
        const tx = await provider.getTransaction(receipt.transactionHash);
        const result = await provider.call(tx, receipt.blockNumber);
        console.log("Call result:", result);
      } catch (error) {
        console.log("Error getting call result:", error.message);
      }
      
      return;
    }
    
    console.log("✅ Safe with 4337 module deployed successfully!");
    console.log("Transaction hash:", receipt.transactionHash);
    console.log("Safe address:", expectedSafeAddress);

    // Fund the Safe
    console.log("\n2. Funding Safe...");
    const fundTx = await signer.sendTransaction({
      to: expectedSafeAddress,
      value: ethers.utils.parseEther("0.01"),
      gasLimit: 21000
    });
    await fundTx.wait();
    console.log("Safe funded!");

    // Save address
    writeFileSync("deployed-safe-with-4337.txt", expectedSafeAddress);
    
    console.log("\nSafe with 4337 module created successfully!");
    console.log("Safe address:", expectedSafeAddress);
    console.log("Version: v1.4.1+ with 4337 module");
    console.log("Ready for EIP-4337 UserOperations!");

  } catch (error) {
    console.error("Safe creation failed:", error);
    console.error("Error details:", error.message);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
    process.exit(1);
  }
}

main(); 