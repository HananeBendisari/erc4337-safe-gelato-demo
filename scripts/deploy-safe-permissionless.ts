/**
 * Deploy Safe 1/1 with ERC-4337 Module - Permissionless.js
 * Using signerToSafeSmartAccount from permissionless library
 */

import 'dotenv/config';
import { ENTRYPOINT_ADDRESS_V06, createSmartAccountClient } from 'permissionless';
import { signerToSafeSmartAccount } from 'permissionless/accounts/safe';
import { createPublicClient, http, Hex, encodeFunctionData, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

async function main() {
  console.log("=== Deploy Safe 1/1 with ERC-4337 Module (Permissionless.js) ===");
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment");
  }

  // Network configuration
  const chain = sepolia;
  const chainName = 'sepolia';
  
  // Keys
  const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
  
  console.log("Chain:", chain.name);
  console.log("Chain ID:", chain.id);
  console.log("");

  try {
    console.log("1. Creating signer...");
    
    // Create the signer
    const signer = privateKeyToAccount(PRIVATE_KEY);
    console.log("Signer address:", signer.address);
    console.log("");

    console.log("2. Initializing clients...");
    
    // Create public client
    const publicClient = createPublicClient({
      transport: http(process.env.RPC_URL || `https://rpc.ankr.com/${chainName}`)
    });

    // Create bundler client (using Gelato)
    const bundlerClient = createPublicClient({
      transport: http(`https://api.gelato.digital/bundlers/${chain.id}/rpc?apiKey=${process.env.GELATO_API_KEY || "demo"}`)
    });

    console.log("✅ Clients initialized");
    console.log("");

    console.log("3. Creating Safe account...");
    
    // Create Safe account with ERC-4337
    const safeAccount = await signerToSafeSmartAccount(publicClient, {
      entryPoint: ENTRYPOINT_ADDRESS_V06,
      signer: signer,
      saltNonce: 0n, // Optional
      safeVersion: '1.4.1'
    });

    console.log("✅ Safe account created");
    console.log("Safe address:", safeAccount.address);
    console.log("");

    console.log("4. Creating Safe account client...");
    
    // Create smart account client
    const safeAccountClient = createSmartAccountClient({
      account: safeAccount,
      entryPoint: ENTRYPOINT_ADDRESS_V06,
      chain: chain,
      bundlerTransport: http(`https://api.gelato.digital/bundlers/${chain.id}/rpc?apiKey=${process.env.GELATO_API_KEY || "demo"}`),
      middleware: {
        gasPrice: async () => {
          // Get gas price from bundler
          const gasPrice = await bundlerClient.request({
            method: 'eth_gasPrice',
            params: []
          });
          return gasPrice;
        }
      }
    });

    console.log("✅ Safe account client created");
    console.log("");

    console.log("5. Creating test transaction...");
    
    // Create a simple transaction to test the Safe
    // We'll call increment() on our Counter contract
    const counterAddress = "0x23f47e4f855b2e4f1bbd8815b333702c706318e0"; // Our deployed Counter
    
    const transaction = {
      to: counterAddress,
      value: parseEther('0'),
      data: encodeFunctionData({
        abi: [{
          inputs: [],
          name: "increment",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: "increment",
        args: []
      })
    };

    console.log("Transaction details:");
    console.log("- To:", transaction.to);
    console.log("- Value:", transaction.value.toString());
    console.log("- Data:", transaction.data);
    console.log("");

    console.log("6. Submitting transaction (this will deploy the Safe)...");
    
    // Submit the transaction - this will deploy the Safe if it doesn't exist
    const txHash = await safeAccountClient.sendTransaction(transaction);

    console.log("✅ Transaction submitted!");
    console.log("Transaction hash:", txHash);
    console.log("");

    console.log("7. Waiting for confirmation...");
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("");

    console.log("🎉 Safe 1/1 with ERC-4337 deployed successfully!");
    console.log("Safe Address:", safeAccount.address);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAccount.address}`);
    console.log("Transaction:", `https://sepolia.etherscan.io/tx/${txHash}`);
    console.log("");

    // Save to file
    const fs = require("fs");
    fs.writeFileSync("docs/deployed-safe-permissionless.txt", safeAccount.address);
    console.log("✅ Safe address saved to docs/deployed-safe-permissionless.txt");

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