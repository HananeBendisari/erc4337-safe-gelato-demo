/**
 * ERC20 UserOperation using Safe Starter Kit with deployed Safe 1/1
 * Attempts to use our deployed Safe instead of creating a new one
 */

import "dotenv/config";
import { createSafeClient } from '@safe-global/sdk-starter-kit';
import { http, type Hex, encodeFunctionData, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  getDeployedAddresses,
  getCurrentCounterValue,
  logContractInfo,
  logNetworkInfo,
} from "../src/utils/common";

const privateKey = process.env.PRIVATE_KEY as Hex;
if (!privateKey) {
  throw new Error("PRIVATE_KEY is not set");
}

const GELATO_API_KEY = process.env.GELATO_API_KEY;
if (!GELATO_API_KEY) {
  throw new Error("GELATO_API_KEY is not set");
}

async function main() {
  console.log("=== ERC20 UserOperation with Safe Starter Kit (Deployed Safe) ===");
  logNetworkInfo();

  // Get deployed addresses
  const addresses = getDeployedAddresses();
  
  // Check counter value
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  });
  const counterValue = await getCurrentCounterValue(publicClient, addresses.counter);
  
  logContractInfo(addresses, counterValue);

  const signer = privateKeyToAccount(privateKey);
  console.log("Using account:", signer.address);
  console.log("Target Safe address:", addresses.safe);
  console.log("");

  // Create the encoded function data for increment
  const incrementAbi = [{
    name: "increment",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }] as const;

  const incrementData = encodeFunctionData({
    abi: incrementAbi,
    functionName: "increment"
  });

  console.log("Encoded increment() function data:", incrementData);
  console.log("");

  try {
    console.log("1. Initializing Safe Starter Kit client...");
    
    // Try to initialize Safe Starter Kit with our deployed Safe address
    const safeClient = await createSafeClient({
      provider: process.env.RPC_URL!,
      signer: privateKey,
      safeOptions: {
        owners: [signer.address],
        threshold: 1,
        // Try to specify the deployed Safe address
        safeAddress: addresses.safe
      },
      txServiceUrl: 'https://safe-transaction-sepolia.safe.global'
    });

    console.log("Safe client initialized successfully");
    console.log("Safe address:", await safeClient.getAddress());
    console.log("");

    // Check if the Safe address matches our deployed Safe
    const safeAddress = await safeClient.getAddress();
    if (safeAddress.toLowerCase() !== addresses.safe.toLowerCase()) {
      console.log("⚠️  Warning: Safe Starter Kit created a new Safe instead of using our deployed Safe");
      console.log("  - Expected Safe:", addresses.safe);
      console.log("  - Actual Safe:", safeAddress);
      console.log("  - This is a limitation of the Safe Starter Kit SDK");
      console.log("");
    } else {
      console.log("✅ Success: Using our deployed Safe 1/1");
      console.log("");
    }

    console.log("2. Creating ERC20 UserOperation...");
    
    // Create Safe transaction with ERC20 payment
    const transactions = [{
      to: addresses.counter as `0x${string}`,
      data: incrementData,
      value: "0"
    }];

    console.log("Transaction details:");
    console.log("- To:", transactions[0].to);
    console.log("- Data:", transactions[0].data);
    console.log("- Value:", transactions[0].value);
    console.log("");

    console.log("3. Sending ERC20 UserOperation...");
    
    // Send transaction with ERC20 payment
    const txResult = await safeClient.send({ 
      transactions,
      payment: {
        type: 'erc20',
        token: addresses.token as `0x${string}`
      }
    });

    console.log("✅ UserOperation submitted successfully!");
    console.log("Safe transaction hash:", txResult.transactions?.safeTxHash);
    console.log("Transaction result:", txResult);
    console.log("");

    if (txResult.transactions?.safeTxHash) {
      console.log("4. Waiting for transaction confirmation...");
      
      // Wait for transaction confirmation
      const receipt = await safeClient.waitForTransaction(txResult.transactions.safeTxHash);
      
      console.log("🎉 Transaction successful!");
      console.log("Transaction hash:", receipt.transactionHash);
      console.log("View on Etherscan:", `https://sepolia.etherscan.io/tx/${receipt.transactionHash}`);
      console.log("");
      console.log("✅ ERC20 UserOperation completed successfully!");
      console.log("Payment was made using TEST tokens via Safe Starter Kit");
    }

  } catch (error) {
    console.error("❌ Error during ERC20 UserOperation:", error);
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