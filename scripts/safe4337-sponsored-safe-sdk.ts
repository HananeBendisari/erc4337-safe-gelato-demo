/**
 * Sponsored UserOperation using deployed Safe 1/1 with Gelato Smart Wallet SDK
 * Safe 1/1 sends UserOperation, Gelato pays for gas (1Balance)
 */

import "dotenv/config";
import {
  type GelatoTaskStatus,
  createGelatoSmartWalletClient,
  sponsored,
} from "@gelatonetwork/smartwallet";
import { safe } from "@gelatonetwork/smartwallet/accounts";
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
  console.log("=== Safe 1/1 Sponsored UserOperation with Gelato SDK ===");
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
    console.log("Creating Sponsored UserOperation with Safe 1/1...");
    
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

    console.log("Creating Safe account with Gelato SDK...");
    
    // Create Safe account using Gelato SDK
    const account = await safe({
      client: publicClient,
      owners: [owner],
      version: "1.4.1",
    });

    console.log("Safe account address:", account.address);
    console.log("Expected Safe address:", addresses.safe);
    console.log("");

    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    console.log("Creating Gelato Smart Wallet Client...");
    
    const swc = await createGelatoSmartWalletClient(client, {
      apiKey: process.env.GELATO_API_KEY,
    });

    console.log("Executing Sponsored UserOperation...");
    
    const response = await swc.execute({
      payment: sponsored(process.env.GELATO_API_KEY!),
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
      console.log("SUCCESS: Safe 1/1 Sponsored UserOperation completed!");
      console.log("Safe 1/1 sent the UserOperation, Gelato paid for gas via 1Balance");
      process.exit(0);
    });

    response.on("error", (error: Error) => {
      console.error(`❌ Transaction failed: ${error.message}`);
      process.exit(1);
    });

  } catch (error) {
    console.log(`Error during Safe 1/1 Sponsored UserOperation: ${(error as Error).message}`);
    console.log("");
    console.log("Debugging information:");
    console.log("  - Safe 1/1 address:", addresses.safe);
    console.log("  - Counter address:", addresses.counter);
  }

  console.log("");
  console.log("Status:");
  console.log("  Safe 1/1 Sponsored UserOperation in progress");
  console.log("  Safe 1/1 sent the UserOperation");
  console.log("  Gelato 1Balance integration");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 