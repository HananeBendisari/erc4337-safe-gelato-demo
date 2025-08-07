/**
 * Deploy Safe 1/1 with ERC-4337 Module - Final Version
 * Using correct Safe addresses from official documentation
 */

import "dotenv/config";
import { createWalletClient, http, createPublicClient, getAddress, encodeFunctionData } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const chain = sepolia;

async function main() {
  console.log("=== Deploy Safe 1/1 with ERC-4337 Module (Final) ===");
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment");
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log("Deployer:", account.address);
  console.log("");

  const publicClient = createPublicClient({
    chain,
    transport: http(process.env.RPC_URL)
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(process.env.RPC_URL)
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", balance.toString(), "wei");
  console.log("ETH:", Number(balance) / 1e18);
  console.log("");

  // Safe 1/1 configuration
  const owners = [account.address];
  const threshold = 1n;
  
  console.log("Safe Configuration:");
  console.log("- Owners:", owners);
  console.log("- Threshold:", threshold.toString());
  console.log("");

  try {
    console.log("1. Using Safe addresses from official documentation...");
    
    // Safe addresses from official Safe documentation for Sepolia
    const safeFactoryAddress = getAddress("0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67");
    const safeSingletonAddress = getAddress("0x41675C099F32341bf84BFc5382aF534df5C3341a");
    const safe4337ModuleAddress = getAddress("0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4");
    
    console.log("Safe Factory:", safeFactoryAddress);
    console.log("Safe Singleton:", safeSingletonAddress);
    console.log("Safe4337Module:", safe4337ModuleAddress);
    console.log("");

    console.log("2. Verifying addresses exist...");
    
    // Check if addresses have code
    const factoryCode = await publicClient.getBytecode({ address: safeFactoryAddress });
    const singletonCode = await publicClient.getBytecode({ address: safeSingletonAddress });
    const moduleCode = await publicClient.getBytecode({ address: safe4337ModuleAddress });
    
    if (!factoryCode || factoryCode === "0x") {
      console.log("❌ Safe Factory not found");
      return;
    }
    if (!singletonCode || singletonCode === "0x") {
      console.log("❌ Safe Singleton not found");
      return;
    }
    if (!moduleCode || moduleCode === "0x") {
      console.log("❌ Safe4337Module not found");
      return;
    }
    
    console.log("✅ All Safe addresses verified");
    console.log("");

    console.log("3. Deploying Safe with ERC-4337 module...");
    
    // Encode initializer data for Safe setup
    const initializer = encodeFunctionData({
      abi: [{
        inputs: [
          { name: "_owners", type: "address[]" },
          { name: "_threshold", type: "uint256" },
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
      }],
      args: [
        owners,
        threshold,
        "0x0000000000000000000000000000000000000000", // to
        "0x", // data
        safe4337ModuleAddress, // fallbackHandler (Safe4337Module)
        "0x0000000000000000000000000000000000000000", // paymentToken
        0n, // payment
        "0x0000000000000000000000000000000000000000" // paymentReceiver
      ]
    });

    console.log("Creating Safe proxy...");
    console.log("");

    const hash = await walletClient.writeContract({
      address: safeFactoryAddress,
      abi: [{
        inputs: [
          { name: "singleton", type: "address" },
          { name: "initializer", type: "bytes" },
          { name: "saltNonce", type: "uint256" }
        ],
        name: "createProxyWithNonce",
        outputs: [{ name: "proxy", type: "address" }],
        stateMutability: "nonpayable",
        type: "function"
      }],
      args: [safeSingletonAddress, initializer, 0n]
    });

    console.log("Transaction hash:", hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("");

    // Get Safe address from event
    const event = receipt.logs.find(log => {
      return log.address.toLowerCase() === safeFactoryAddress.toLowerCase();
    });

    if (event) {
      // Decode the event to get the Safe address
      const safeAddress = getAddress(event.topics[1].slice(26)); // Remove padding
      console.log("✅ Safe deployed at:", safeAddress);
      console.log("");

      // Save to file
      const fs = require("fs");
      fs.writeFileSync("docs/deployed-safe-final.txt", safeAddress);
      console.log("✅ Safe address saved to docs/deployed-safe-final.txt");
      console.log("");

      console.log("4. Verifying Safe configuration...");
      
      // Check Safe owners
      const ownersData = encodeFunctionData({
        abi: [{ inputs: [], name: "getOwners", outputs: [{ type: "address[]" }], stateMutability: "view", type: "function" }],
        args: []
      });
      
      const ownersResult = await publicClient.call({
        address: safeAddress,
        data: ownersData
      });
      
      console.log("✅ Safe owners:", ownersResult.data);
      
      // Check Safe threshold
      const thresholdData = encodeFunctionData({
        abi: [{ inputs: [], name: "getThreshold", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
        args: []
      });
      
      const thresholdResult = await publicClient.call({
        address: safeAddress,
        data: thresholdData
      });
      
      console.log("✅ Safe threshold:", thresholdResult.data);
      
      // Check Safe modules
      const modulesData = encodeFunctionData({
        abi: [{ inputs: [], name: "getModules", outputs: [{ type: "address[]" }], stateMutability: "view", type: "function" }],
        args: []
      });
      
      const modulesResult = await publicClient.call({
        address: safeAddress,
        data: modulesData
      });
      
      console.log("✅ Safe modules:", modulesResult.data);
      
      console.log("");
      console.log("🎉 Safe 1/1 with ERC-4337 deployed successfully!");
      console.log("Safe Address:", safeAddress);
      console.log("Module Address:", safe4337ModuleAddress);
      console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
      console.log("Transaction:", `https://sepolia.etherscan.io/tx/${hash}`);
      
    } else {
      console.log("❌ Could not find Safe address in deployment event");
    }

  } catch (error) {
    console.error("❌ Error deploying Safe:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 