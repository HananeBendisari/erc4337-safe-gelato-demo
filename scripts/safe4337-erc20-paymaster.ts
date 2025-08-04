/**
 * ERC20 UserOperation using deployed Safe 1/1 with Gelato Paymaster
 * Safe 1/1 sends UserOperation and pays for gas using ERC20 tokens via Gelato Paymaster
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
  console.log("=== Safe 1/1 ERC20 UserOperation with Gelato Paymaster ===");
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
    console.log("Creating ERC20 UserOperation with Safe 1/1 and Gelato Paymaster...");
    
    // Encode the increment function
    const incrementData = encodeFunctionData({
      abi: [{ name: "increment", type: "function", inputs: [], outputs: [] }],
      functionName: "increment"
    });

    console.log("Function data encoded:", incrementData);
    console.log("");

    // First, get paymaster data from Gelato
    console.log("Getting paymaster data from Gelato...");
    
    const paymasterUrl = `https://api.gelato.digital/paymasters/${sepolia.id}/rpc?apiKey=${process.env.GELATO_API_KEY}`;
    
    const paymasterRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "pm_sponsorUserOperation",
      params: [
        {
          sender: addresses.safe,
          nonce: "0x0",
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
          callGasLimit: "0x186a0",
          verificationGasLimit: "0x186a0",
          preVerificationGas: "0x5208",
          maxFeePerGas: "0x0",
          maxPriorityFeePerGas: "0x0",
          paymasterAndData: "0x",
          signature: "0x"
        },
        "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // EntryPoint
        {
          type: "erc20",
          token: addresses.token
        }
      ]
    };

    const paymasterResponse = await fetch(paymasterUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymasterRequest)
    });

    const paymasterResult = await paymasterResponse.json();
    
    if (paymasterResult.error) {
      throw new Error(`Paymaster error: ${paymasterResult.error.message}`);
    }

    console.log("Paymaster data received successfully");
    console.log("");

    // Create UserOperation with paymaster data
    const userOperation = {
      sender: addresses.safe,
      nonce: "0x0",
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
      callGasLimit: paymasterResult.result.callGasLimit,
      verificationGasLimit: paymasterResult.result.verificationGasLimit,
      preVerificationGas: paymasterResult.result.preVerificationGas,
      maxFeePerGas: paymasterResult.result.maxFeePerGas,
      maxPriorityFeePerGas: paymasterResult.result.maxPriorityFeePerGas,
      paymasterAndData: paymasterResult.result.paymasterAndData,
      signature: "0x"
    };

    console.log("UserOperation created with paymaster data:");
    console.log("  - Sender (Safe 1/1):", userOperation.sender);
    console.log("  - Target:", addresses.counter);
    console.log("  - Call Data:", userOperation.callData);
    console.log("  - Paymaster Data:", userOperation.paymasterAndData);
    console.log("  - ERC20: true (Safe 1/1 pays with tokens via Gelato Paymaster)");
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

    console.log("SUCCESS: Safe 1/1 ERC20 UserOperation completed!");
    console.log("Safe 1/1 sent the UserOperation and paid for gas using ERC20 tokens via Gelato Paymaster");

  } catch (error) {
    console.log(`Error during Safe 1/1 ERC20 UserOperation: ${(error as Error).message}`);
    console.log("");
    console.log("Debugging information:");
    console.log("  - Safe 1/1 address:", addresses.safe);
    console.log("  - Counter address:", addresses.counter);
    console.log("  - Token address:", addresses.token);
  }

  console.log("");
  console.log("Status:");
  console.log("  Safe 1/1 ERC20 UserOperation completed");
  console.log("  Safe 1/1 sent the UserOperation");
  console.log("  Safe 1/1 paid gas with ERC20 tokens via Gelato Paymaster");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 