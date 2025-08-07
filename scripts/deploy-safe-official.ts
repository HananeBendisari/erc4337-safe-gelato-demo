/**
 * Deploy Safe 1/1 with ERC-4337 Module - Official Safe SDK
 * Using @safe-global/relay-kit Safe4337Pack
 */

import "dotenv/config";
import { Safe4337Pack } from '@safe-global/relay-kit';

async function main() {
  console.log("=== Deploy Safe 1/1 with ERC-4337 Module (Official SDK) ===");
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment");
  }

  const SIGNER_PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPC_URL = process.env.RPC_URL || "https://rpc.ankr.com/eth_sepolia";
  
  // Get signer address from private key
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(SIGNER_PRIVATE_KEY as `0x${string}`);
  const SIGNER_ADDRESS = account.address;
  
  console.log("Signer Address:", SIGNER_ADDRESS);
  console.log("RPC URL:", RPC_URL);
  console.log("");

  try {
    console.log("1. Initializing Safe4337Pack...");
    
    // Initialize Safe4337Pack with Safe 1/1 configuration
    const safe4337Pack = await Safe4337Pack.init({
      provider: RPC_URL,
      signer: SIGNER_PRIVATE_KEY,
      bundlerUrl: `https://api.gelato.digital/bundlers/11155111/rpc?apiKey=${process.env.GELATO_API_KEY || "demo"}`,
      safeModulesVersion: '0.3.0', // Use v0.3.0 for EntryPoint v0.7 compatibility
      options: {
        owners: [SIGNER_ADDRESS],
        threshold: 1
      }
    });

    console.log("✅ Safe4337Pack initialized successfully");
    console.log("");

    console.log("2. Creating a test transaction to deploy Safe...");
    
    // Create a simple transaction to trigger Safe deployment
    // We'll call a simple contract function (like increment on our Counter)
    const counterAddress = "0x23f47e4f855b2e4f1bbd8815b333702c706318e0"; // Our deployed Counter
    
    const transaction = {
      to: counterAddress,
      data: "0xd09de08a", // increment() function selector
      value: "0x0"
    };

    console.log("Transaction details:");
    console.log("- To:", transaction.to);
    console.log("- Data:", transaction.data);
    console.log("- Value:", transaction.value);
    console.log("");

    console.log("3. Creating Safe operation...");
    
    // Create the SafeOperation with the transaction
    const safeOperation = await safe4337Pack.createTransaction({ 
      transactions: [transaction] 
    });

    console.log("✅ Safe operation created");
    console.log("");

    console.log("4. Signing Safe operation...");
    
    // Sign the SafeOperation
    const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation);
    
    console.log("✅ Safe operation signed");
    console.log("");

    console.log("5. Executing transaction (this will deploy the Safe)...");
    
    // Execute the transaction - this will deploy the Safe if it doesn't exist
    const userOperationHash = await safe4337Pack.executeTransaction({
      executable: signedSafeOperation
    });

    console.log("✅ User operation submitted");
    console.log("User Operation Hash:", userOperationHash);
    console.log("");

    console.log("6. Waiting for transaction confirmation...");
    
    // Wait for the transaction to be confirmed
    let userOperationReceipt = null;
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max wait

    while (!userOperationReceipt && attempts < maxAttempts) {
      attempts++;
      console.log(`Checking status... (attempt ${attempts}/${maxAttempts})`);
      
      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      try {
        userOperationReceipt = await safe4337Pack.getUserOperationReceipt(userOperationHash);
      } catch (error) {
        // Continue waiting if not found yet
        console.log("Transaction not confirmed yet, waiting...");
      }
    }

    if (userOperationReceipt) {
      console.log("✅ Transaction confirmed!");
      console.log("Block Number:", userOperationReceipt.blockNumber);
      console.log("Transaction Hash:", userOperationReceipt.receipt.transactionHash);
      console.log("");

      // Get the Safe address from the receipt
      const safeAddress = userOperationReceipt.receipt.logs.find(log => 
        log.topics[0] === "0x3d0ce9bfc3ed7d6862dbb28b2dea94561fe714a1b4d019aa8af39730d1ad7c3d" // Safe deployment event
      );

      if (safeAddress) {
        console.log("🎉 Safe 1/1 with ERC-4337 deployed successfully!");
        console.log("Safe Address:", safeAddress.address);
        console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress.address}`);
        console.log("");

        // Save to file
        const fs = require("fs");
        fs.writeFileSync("docs/deployed-safe-official.txt", safeAddress.address);
        console.log("✅ Safe address saved to docs/deployed-safe-official.txt");
        
      } else {
        console.log("⚠️ Safe deployed but address not found in logs");
        console.log("You can find the Safe address in the transaction logs on Etherscan");
      }

    } else {
      console.log("❌ Transaction not confirmed within timeout");
      console.log("User Operation Hash:", userOperationHash);
      console.log("Check status manually on Etherscan or bundler API");
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