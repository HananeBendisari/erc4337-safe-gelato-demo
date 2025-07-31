/**
 * Deploys a 1/1 Safe smart account using Safe ProtocolKit.
 * Uses Ethers v5 + Safe-ethers-lib to deploy the Safe to Sepolia.
 */

import { ethers } from "ethers"; // Ethers v5
import * as dotenv from "dotenv";
import { writeFileSync } from "fs";

dotenv.config();

// Safe contract addresses for Sepolia (official addresses from Safe docs)
const SAFE_PROXY_FACTORY_ADDRESS = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
const SAFE_SINGLETON_ADDRESS = "0x69f4D1788e39c87893C980c06EdF4b7f686e2938";

// Safe Proxy Factory ABI (minimal)
const SAFE_PROXY_FACTORY_ABI = [
  "function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (SafeProxy proxy)",
  "event ProxyCreation(SafeProxy proxy)"
];

// Safe Singleton ABI (minimal)
const SAFE_SINGLETON_ABI = [
  "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external"
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
  
  console.log("Owner address:", ownerAddress);
  console.log("Network:", await provider.getNetwork().then(net => net.name));

  // Create contract instances
  const safeProxyFactory = new ethers.Contract(
    SAFE_PROXY_FACTORY_ADDRESS,
    SAFE_PROXY_FACTORY_ABI,
    signer
  );

  const safeSingleton = new ethers.Contract(
    SAFE_SINGLETON_ADDRESS,
    SAFE_SINGLETON_ABI,
    signer
  );

  // Prepare setup data
  const setupData = safeSingleton.interface.encodeFunctionData("setup", [
    [ownerAddress], // owners
    1, // threshold
    "0x0000000000000000000000000000000000000000", // to
    "0x", // data
    "0x0000000000000000000000000000000000000000", // fallbackHandler
    "0x0000000000000000000000000000000000000000", // paymentToken
    0, // payment
    "0x0000000000000000000000000000000000000000" // paymentReceiver
  ]);

  // Use a unique salt nonce to avoid conflicts
  const saltNonce = ethers.utils.hexZeroPad(ethers.utils.hexlify(Date.now()), 32);

  console.log("Deploying Safe...");
  console.log("Setup data:", setupData);
  console.log("Salt nonce:", saltNonce);

  // Deploy the Safe with explicit gas limit
  const deployTx = await safeProxyFactory.createProxyWithNonce(
    SAFE_SINGLETON_ADDRESS,
    setupData,
    saltNonce,
    {
      gasLimit: 800000 // Increased gas limit
    }
  );

  console.log("Waiting for transaction confirmation...");
  const receipt = await deployTx.wait();
  
  // Extract the Safe address from the event
  const proxyCreatedEvent = receipt.logs.find((log: any) => 
    log.topics[0] === ethers.utils.id("ProxyCreation(SafeProxy)")
  );

  let safeAddress: string | undefined;

  if (proxyCreatedEvent) {
    // Extract address from event data
    safeAddress = ethers.utils.defaultAbiCoder.decode(
      ["address"],
      proxyCreatedEvent.data
    )[0];
    console.log("Safe address extracted from ProxyCreation event:", safeAddress);
  } else {
    // Fallback: try to extract from all logs with better validation
    console.log("Could not find ProxyCreation event, trying alternative method...");
    
    // Look for any event that might contain an address
    for (const log of receipt.logs) {
      try {
        const decoded = ethers.utils.defaultAbiCoder.decode(
          ["address"],
          log.data
        );
        const potentialAddress = decoded[0];
        
        // Validate the extracted address
        if (potentialAddress && 
            potentialAddress !== ethers.constants.AddressZero &&
            ethers.utils.isAddress(potentialAddress) &&
            !potentialAddress.startsWith("0x00000000000000000000000000000000000000")) {
          safeAddress = potentialAddress;
          console.log("Found potential Safe address in log:", safeAddress);
          break;
        }
      } catch (e) {
        // Continue to next log
      }
    }
    
    if (!safeAddress) {
      // Last resort: use the transaction receipt to get the deployed address
      console.log("Using transaction receipt to determine Safe address...");
      
      // For proxy deployments, we need to calculate the expected address
      // using the same method as the Safe Proxy Factory (CREATE2)
      const initCode = ethers.utils.solidityPack(
        ["bytes20", "bytes"],
        [SAFE_SINGLETON_ADDRESS, setupData]
      );
      
      const initCodeHash = ethers.utils.keccak256(initCode);
      const expectedAddress = ethers.utils.getCreate2Address(
        SAFE_PROXY_FACTORY_ADDRESS,
        saltNonce,
        initCodeHash
      );
      
      safeAddress = expectedAddress;
      console.log("Calculated expected Safe address:", safeAddress);
    }
  }

  // Final validation of the Safe address
  if (!safeAddress || 
      !ethers.utils.isAddress(safeAddress) ||
      safeAddress === ethers.constants.AddressZero ||
      safeAddress.startsWith("0x00000000000000000000000000000000000000")) {
    throw new Error("Invalid Safe address extracted. Please check the transaction manually.");
  }

  console.log("Safe deployed successfully!");
  console.log("Transaction hash:", receipt.transactionHash);
  console.log("Safe address:", safeAddress);

  // Save the deployed Safe address
  writeFileSync("deployed-safe.txt", safeAddress);
  console.log("Safe address saved to deployed-safe.txt");
}

main().catch((err) => {
  console.error("Safe deployment failed:", err);
  process.exit(1);
});
