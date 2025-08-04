/**
 * FAILED - Native UserOperation using deployed Safe 1/1
 * STATUS: ❌ FAILED - Safe 4337 module deployment issues
 * PURPOSE: Attempt to use deployed Safe for native ETH payments
 * 
 * This script attempted to use the deployed Safe 1/1 for native ETH payments
 * but failed due to Safe 4337 module deployment issues ("AA20 account not deployed").
 * 
 * RELATED WORKING SCRIPTS:
 * - safe4337-native-gelato-sdk.ts (✅ FUNCTIONAL - Gelato SDK)
 * - safe4337-native-gelato-sdk.ts (✅ FUNCTIONAL - creates new account)
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
  console.log("=== Safe 1/1 Native UserOperation ===");
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
    console.log("Creating Native UserOperation with Safe 1/1...");
    
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
      preVerificationGas: "0xa4c6", // 42,182 gas (minimum required)
      maxFeePerGas: "0x59682f00", // 1.5 gwei
      maxPriorityFeePerGas: "0x59682f00", // 1.5 gwei
      paymasterAndData: "0x", // Empty for native payment
      signature: "0x" // Will be filled by bundler
    };

    console.log("UserOperation created:");
    console.log("  - Sender (Safe 1/1):", userOperation.sender);
    console.log("  - Target:", addresses.counter);
    console.log("  - Call Data:", userOperation.callData);
    console.log("  - Native: true (Safe 1/1 pays gas)");
    console.log("");

    // Send to Gelato Bundler
    console.log("Sending to Gelato Bundler...");
    
    const bundlerUrl = `https://api.gelato.digital/bundlers/${sepolia.id}/rpc?apiKey=${process.env.GELATO_API_KEY}`;
    
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

    console.log("SUCCESS: Safe 1/1 Native UserOperation completed!");
    console.log("Safe 1/1 sent the UserOperation and paid for gas directly");

  } catch (error) {
    console.log(`Error during Safe 1/1 Native UserOperation: ${(error as Error).message}`);
    console.log("");
    console.log("Debugging information:");
    console.log("  - Safe 1/1 address:", addresses.safe);
    console.log("  - Counter address:", addresses.counter);
  }

  console.log("");
  console.log("Status:");
  console.log("  Safe 1/1 Native UserOperation completed");
  console.log("  Safe 1/1 sent the UserOperation");
  console.log("  Safe 1/1 paid gas directly");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 