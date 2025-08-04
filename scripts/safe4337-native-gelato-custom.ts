/**
 * Native UserOperation using Gelato SDK with custom Safe configuration
 * Attempts to use our deployed Safe 1/1 instead of creating a new one
 */

import "dotenv/config";
import { createGelatoSmartWalletClient, native } from "@gelatonetwork/smartwallet";
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
  console.log("=== Native UserOperation with Gelato SDK (Custom Safe) ===");
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
    console.log("1. Initializing Gelato Smart Wallet client...");
    
    // Create public client
    const client = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL),
    });

    // Try to create a custom account configuration
    console.log("2. Creating custom account configuration...");
    
    // Note: This is an attempt to use our deployed Safe
    // The Gelato SDK might not support this directly
    const swc = await createGelatoSmartWalletClient(client, {
      apiKey: GELATO_API_KEY,
      // Try to specify custom account configuration
      account: {
        address: addresses.safe,
        type: "safe",
        version: "1.4.1"
      }
    });

    console.log("Gelato Smart Wallet client initialized");
    console.log("");

    console.log("3. Sending Native UserOperation...");
    
    // Send transaction with native payment
    const response = await swc.execute({
      payment: native(),
      calls: [
        {
          to: addresses.counter as `0x${string}`,
          data: incrementData,
          value: 0n,
        },
      ],
    });

    console.log("✅ UserOperation submitted successfully!");
    console.log("Gelato task ID:", response.id);
    console.log("Check status:", `https://api.gelato.digital/tasks/status/${response.id}`);
    console.log("");

    console.log("4. Waiting for transaction confirmation...");
    
    // Listen for events
    response.on("success", (status) => {
      console.log("🎉 Transaction successful!");
      console.log("Transaction hash:", status.transactionHash);
      console.log("View on Etherscan:", `https://sepolia.etherscan.io/tx/${status.transactionHash}`);
      console.log("");
      console.log("✅ Native UserOperation completed successfully!");
      console.log("Safe 1/1 sent the UserOperation and paid for gas directly");
      process.exit(0);
    });

    response.on("error", (error) => {
      console.error("❌ Transaction failed:", error.message);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Error during Native UserOperation:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    console.log("");
    console.log("This error suggests that the Gelato SDK cannot use our deployed Safe directly.");
    console.log("The SDK is designed to create new accounts rather than use existing ones.");
    console.log("");
    console.log("Alternative approaches:");
    console.log("1. Use direct API calls with our deployed Safe (current approach)");
    console.log("2. Accept that SDK examples create new accounts (violates exercise requirements)");
    console.log("3. Find a way to configure the SDK to use existing accounts");
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 