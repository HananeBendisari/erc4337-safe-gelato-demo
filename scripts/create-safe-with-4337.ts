/**
 * Create Safe with 4337 module enabled
 * Uses deployed Safe4337Module and SafeModuleSetup
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { writeFileSync, readFileSync } from "fs";

dotenv.config();

// EntryPoint v0.7 address
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// Safe v1.4.1+ contract addresses for Sepolia
const SAFE_PROXY_FACTORY_ADDRESS = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const SAFE_SINGLETON_ADDRESS = "0x41675C099F32341bf84BFc5382aF534df5C7461a";

// Safe Proxy Factory ABI
const SAFE_PROXY_FACTORY_ABI = [
  "function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (SafeProxy proxy)",
  "event ProxyCreation(SafeProxy proxy)"
];

// Safe Singleton ABI
const SAFE_SINGLETON_ABI = [
  "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external"
];

// SafeModuleSetup ABI
const SAFE_MODULE_SETUP_ABI = [
  "function enableModules(address[] calldata modules) external"
];

async function main() {
  const privateKey = process.env.PRIVATE_KEY!;
  const rpcUrl = process.env.RPC_URL!;

  if (!privateKey || !rpcUrl) {
    throw new Error("Missing PRIVATE_KEY or RPC_URL in environment variables");
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const ownerAddress = await signer.getAddress();
  
  console.log("=== Create Safe with 4337 Module ===");
  console.log("Owner address:", ownerAddress);
  console.log("Network:", await provider.getNetwork().then(net => net.name));

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

    const saltNonce = ethers.utils.hexZeroPad(ethers.utils.hexlify(Date.now()), 32);
    
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

    // Deploy Safe
    const safeProxyFactory = new ethers.Contract(SAFE_PROXY_FACTORY_ADDRESS, SAFE_PROXY_FACTORY_ABI, signer);
    const deployTx = await safeProxyFactory.createProxyWithNonce(
      SAFE_SINGLETON_ADDRESS,
      setupData,
      saltNonce,
      { gasLimit: 1000000 }
    );

    console.log("Waiting for Safe deployment...");
    const receipt = await deployTx.wait();
    
    console.log("Safe with 4337 module deployed successfully!");
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
    writeFileSync("docs/deployed-safe-with-4337.txt", expectedSafeAddress);
    
    console.log("\nSafe with 4337 module created successfully!");
    console.log("Safe address:", expectedSafeAddress);
    console.log("Version: v1.4.1+ with 4337 module");
    console.log("Ready for EIP-4337 UserOperations!");
    console.log("\nNext steps:");
    console.log("1. Test with Safe4337Pack SDK");
    console.log("2. Send UserOperations through Gelato Bundler");

  } catch (error) {
    console.error("Safe creation failed:", error);
    process.exit(1);
  }
}

main(); 