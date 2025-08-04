/**
 * Native UserOperation using Gelato Smart Wallet SDK
 * Safe pays for gas directly
 */

import "dotenv/config";
import {
  type GelatoTaskStatus,
  createGelatoSmartWalletClient,
  native,
} from "@gelatonetwork/smartwallet";
import { gelato } from "@gelatonetwork/smartwallet/accounts";
import {
  http,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  getDeployedAddresses,
  getCurrentCounterValue,
  logContractInfo,
  logNetworkInfo,
} from "../src/utils/common";

async function main() {
  console.log("=== Native UserOperation with Gelato Smart Wallet SDK ===");
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

  try {
    console.log("Creating Native UserOperation...");
    
    // Encode the increment function
    const incrementData = encodeFunctionData({
      abi: [{ name: "increment", type: "function", inputs: [], outputs: [] }],
      functionName: "increment"
    });

    console.log("Function data encoded:", incrementData);
    console.log("");

    const privateKey = process.env.PRIVATE_KEY as Hex;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY is not set");
    }

    const owner = privateKeyToAccount(privateKey);

    console.log("Creating Gelato account...");
    
    // Create Gelato account
    const account = await gelato({
      owner,
      client: publicClient,
    });

    console.log("Gelato account address:", account.address);
    console.log("");

    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    console.log("Creating Gelato Smart Wallet Client...");
    
    const swc = await createGelatoSmartWalletClient(client);

    console.log("Executing Native UserOperation...");
    
    const response = await swc.execute({
      payment: native(),
      calls: [
        {
          to: addresses.counter,
          data: incrementData,
          value: 0n,
        },
      ],
    });

    console.log(`✅ UserOperation sent successfully!`);
    console.log(`  - Gelato Task ID: ${response.id}`);
    console.log(`  - Status URL: https://api.gelato.digital/tasks/status/${response.id}`);
    console.log("");

    console.log("Waiting for transaction confirmation...");

    // Listen for events
    response.on("success", (status: GelatoTaskStatus) => {
      console.log(`✅ Transaction successful!`);
      console.log(`  - Transaction Hash: ${status.transactionHash}`);
      console.log(`  - Etherscan: https://sepolia.etherscan.io/tx/${status.transactionHash}`);
      console.log("");
      console.log("SUCCESS: Native UserOperation completed!");
      console.log("Safe paid for gas directly");
      process.exit(0);
    });

    response.on("error", (error: Error) => {
      console.error(`❌ Transaction failed: ${error.message}`);
      process.exit(1);
    });

  } catch (error) {
    console.log(`Error during Native UserOperation: ${(error as Error).message}`);
    console.log("");
    console.log("Debugging information:");
    console.log("  - Safe address:", addresses.safe);
    console.log("  - Counter address:", addresses.counter);
  }

  console.log("");
  console.log("Status:");
  console.log("  Native UserOperation in progress");
  console.log("  Uses Gelato Smart Wallet SDK");
  console.log("  Safe pays gas directly");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 