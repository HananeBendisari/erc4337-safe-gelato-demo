/**
 * Deploy Real Safe with ERC-4337
 * This script deploys a real Safe with ERC-4337 module
 */

import "dotenv/config";
import { 
  createPublicClient, 
  createWalletClient,
  http, 
  type Hex,
  parseEther,
  encodeFunctionData,
  getAddress
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { writeFileSync } from "fs";

// Safe Factory ABI (simplified)
const SAFE_FACTORY_ABI = [
  {
    inputs: [
      { name: "singleton", type: "address" },
      { name: "initializer", type: "bytes" },
      { name: "saltNonce", type: "uint256" }
    ],
    name: "createProxyWithNonce",
    outputs: [{ name: "proxy", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// Safe ABI (simplified)
const SAFE_ABI = [
  {
    inputs: [
      { name: "owners", type: "address[]" },
      { name: "threshold", type: "uint256" },
      { name: "to", type: "address" },
      { name: "data", type: "bytes" },
      { name: "fallbackHandler", type: "address" },
      { name: "paymentToken", type: "address" },
      { name: "payment", type: "uint256" },
      { name: "paymentReceiver", type: "address" }
    ],
    name: "setup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

const chain = sepolia;
const chainID = chain.id;

async function main() {
  console.log("=== Deploy Real Safe with ERC-4337 ===");
  console.log("Chain:", chain.name);
  console.log("Chain ID:", chainID);
  console.log("");

  const privateKey = process.env.PRIVATE_KEY as Hex;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set");
  }

  const account = privateKeyToAccount(privateKey);
  console.log("Deploying with account:", account.address);
  console.log("");

  // Create clients
  const publicClient = createPublicClient({
    chain,
    transport: http(process.env.RPC_URL)
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(process.env.RPC_URL)
  });

  try {
    console.log("1. Getting Safe addresses for Sepolia...");
    
    // These are the REAL Safe addresses for Sepolia
    const safeFactoryAddress = getAddress("0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67");
    const safeSingletonAddress = getAddress("0x41675C099F32341bf84BFc5382aF534df5C3341a");
    const safe4337ModuleAddress = getAddress("0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4");
    
    console.log("Safe Factory:", safeFactoryAddress);
    console.log("Safe Singleton:", safeSingletonAddress);
    console.log("Safe4337Module:", safe4337ModuleAddress);
    console.log("");

    console.log("2. Verifying addresses exist...");
    
    // Check if addresses exist
    const factoryCode = await publicClient.getBytecode({ address: safeFactoryAddress });
    const singletonCode = await publicClient.getBytecode({ address: safeSingletonAddress });
    const moduleCode = await publicClient.getBytecode({ address: safe4337ModuleAddress });
    
    if (!factoryCode || factoryCode === "0x") {
      throw new Error("Safe Factory not found at " + safeFactoryAddress);
    }
    if (!singletonCode || singletonCode === "0x") {
      throw new Error("Safe Singleton not found at " + safeSingletonAddress);
    }
    if (!moduleCode || moduleCode === "0x") {
      throw new Error("Safe4337Module not found at " + safe4337ModuleAddress);
    }
    
    console.log("✅ All Safe addresses verified!");
    console.log("");

    console.log("3. Creating Safe initialization data...");
    
    // Create initialization data for Safe setup
    const safeSetupData = encodeFunctionData({
      abi: SAFE_ABI,
      functionName: "setup",
      args: [
        [account.address], // owners
        1n, // threshold
        getAddress("0x0000000000000000000000000000000000000000"), // to (no contract call)
        "0x", // data (empty)
        safe4337ModuleAddress, // fallbackHandler (Safe4337Module)
        getAddress("0x0000000000000000000000000000000000000000"), // paymentToken (none)
        0n, // payment (0)
        getAddress("0x0000000000000000000000000000000000000000") // paymentReceiver (none)
      ]
    });

    console.log("Setup data created:", safeSetupData);
    console.log("");

    console.log("4. Deploying Safe...");
    
    // Generate salt nonce
    const saltNonce = BigInt(Math.floor(Math.random() * 1000000));
    
    // Create proxy with nonce
    const createProxyData = encodeFunctionData({
      abi: SAFE_FACTORY_ABI,
      functionName: "createProxyWithNonce",
      args: [
        safeSingletonAddress,
        safeSetupData,
        saltNonce
      ]
    });

    console.log("Deploying Safe with salt nonce:", saltNonce.toString());
    console.log("");

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: safeFactoryAddress,
      data: createProxyData,
      value: 0n
    });

    console.log("✅ Safe deployment transaction sent!");
    console.log("Transaction hash:", hash);
    console.log("Etherscan:", `https://sepolia.etherscan.io/tx/${hash}`);
    console.log("");

    console.log("5. Waiting for confirmation...");
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log("✅ Safe deployment confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("");

    console.log("6. Extracting Safe address...");
    
    // Get the Safe address from the transaction receipt
    // The Safe address is typically the first log address
    const safeAddress = receipt.logs[0]?.address;
    
    if (!safeAddress) {
      throw new Error("Could not extract Safe address from transaction receipt");
    }

    console.log("✅ Safe deployed successfully!");
    console.log("Safe Address:", safeAddress);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
    console.log("");

    console.log("7. Saving deployment info...");
    
    // Save deployment info
    const deploymentInfo = {
      safeAddress,
      owner: account.address,
      chainId: chainID,
      chainName: chain.name,
      deploymentTime: new Date().toISOString(),
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      safeVersion: "1.4.1",
      erc4337Module: safe4337ModuleAddress,
      fallbackHandler: safe4337ModuleAddress,
      saltNonce: saltNonce.toString()
    };

    writeFileSync(
      'docs/deployed-safe-with-4337-real.json', 
      JSON.stringify(deploymentInfo, null, 2)
    );

    writeFileSync(
      'docs/deployed-safe-with-4337-real.txt', 
      safeAddress
    );

    console.log("✅ Deployment info saved!");
    console.log("  - JSON:", 'docs/deployed-safe-with-4337-real.json');
    console.log("  - Address:", 'docs/deployed-safe-with-4337-real.txt');
    console.log("");

    console.log("🎉 Real Safe with ERC-4337 deployed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Fund the Safe with 0.01 ETH");
    console.log("2. Test UserOperations with the new Safe");
    console.log("3. Update scripts to use the new Safe address");

  } catch (error) {
    console.error("❌ Error during Safe deployment:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 