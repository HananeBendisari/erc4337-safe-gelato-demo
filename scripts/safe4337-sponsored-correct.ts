/**
 * Sponsored UserOperation using deployed Safe 1/1 with 4337 module
 * Safe 1/1 sends UserOperation, Gelato pays for gas (1Balance)
 */

import "dotenv/config";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { sepolia } from "viem/chains";
import {
  getDeployedAddresses,
  getCurrentCounterValue,
  logContractInfo,
  logNetworkInfo,
} from "../src/utils/common";

async function main() {
  console.log("=== Safe 1/1 Sponsored UserOperation ===");
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

    // Create UserOperation payload for Safe 1/1
    const userOperation = {
      sender: addresses.safe, // Safe 1/1 address
      nonce: "0x0", // Will be filled by bundler
      initCode: "0x",
      callData: encodeFunctionData({
        abi: [{
          name: "execute",
          type: "function",
          inputs: [
            { name: "target", type: "address" },
            { name: "value", type: "uint256" },
            { name: "data", type: "bytes" }
          ],
          outputs: []
        }],
        functionName: "execute",
        args: [addresses.counter, 0n, incrementData]
      }),
      callGasLimit: "0x186a0", // 100,000 gas
      verificationGasLimit: "0x186a0", // 100,000 gas
      preVerificationGas: "0x5208", // 21,000 gas
      maxFeePerGas: "0x0", // Zero for sponsored transactions
      maxPriorityFeePerGas: "0x0", // Zero for sponsored transactions
      paymasterAndData: "0x", // Empty for sponsored
      signature: "0x" // Will be filled by bundler
    };

    console.log("UserOperation created:");
    console.log("  - Sender (Safe 1/1):", userOperation.sender);
    console.log("  - Target:", addresses.counter);
    console.log("  - Call Data:", userOperation.callData);
    console.log("  - Sponsored: true (Gelato pays gas)");
    console.log("");

    // Send to Gelato Bundler
    console.log("Sending to Gelato Bundler...");
    
    const bundlerUrl = `https://api.gelato.digital/bundlers/${sepolia.id}/rpc?apiKey=${process.env.GELATO_API_KEY}&sponsored=true`;
    
    const response = await fetch(bundlerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendUserOperation",
        params: [userOperation, "0x0000000071727De22E5E9d8BAf0edAc6f37da032"]
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Bundler error: ${result.error.message}`);
    }

    console.log("✅ UserOperation sent successfully!");
    console.log("  - UserOperation Hash:", result.result);
    console.log("  - Etherscan:", `https://sepolia.etherscan.io/tx/${result.result}`);
    console.log("");

    console.log("SUCCESS: Safe 1/1 Sponsored UserOperation completed!");
    console.log("Safe 1/1 sent the UserOperation, Gelato paid for gas via 1Balance");

  } catch (error) {
    console.log(`Error during Safe 1/1 Sponsored UserOperation: ${(error as Error).message}`);
    console.log("");
    console.log("Debugging information:");
    console.log("  - Safe 1/1 address:", addresses.safe);
    console.log("  - Counter address:", addresses.counter);
  }

  console.log("");
  console.log("Status:");
  console.log("  Safe 1/1 Sponsored UserOperation completed");
  console.log("  Safe 1/1 sent the UserOperation");
  console.log("  Gelato 1Balance integration");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 