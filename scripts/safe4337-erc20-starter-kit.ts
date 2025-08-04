import "dotenv/config";
import { createSafeClient } from '@safe-global/sdk-starter-kit';
import { http, type Hex, encodeFunctionData, createPublicClient, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const privateKey = process.env.PRIVATE_KEY as Hex;
if (!privateKey) {
  throw new Error("PRIVATE_KEY is not set");
}

const GELATO_API_KEY = process.env.GELATO_API_KEY;
if (!GELATO_API_KEY) {
  throw new Error("GELATO_API_KEY is not set");
}

// Sepolia Chain Config
const chainConfig = {
  chain: sepolia,
  tokenContract: "0x0566F0CD850220DF2806E3100cc6029144af7041", // Our TestToken address
  targetContract: "0x23f47e4f855b2e4f1bbd8815b333702c706318e0", // Counter contract
  blockExplorer: "https://sepolia.etherscan.io"
};

const signer = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({
  chain: chainConfig.chain,
  transport: http(process.env.RPC_URL),
});

console.log("=== ERC20 UserOperation with Safe Starter Kit ===");
console.log("Chain:", chainConfig.chain.name);
console.log("Token address:", chainConfig.tokenContract);
console.log("Target contract:", chainConfig.targetContract);
console.log("Using account:", signer.address);
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

(async () => {
  try {
    console.log("1. Initializing Safe Starter Kit client...");
    
    // Initialize Safe Starter Kit client
    const safeClient = await createSafeClient({
      provider: process.env.RPC_URL!,
      signer: privateKey,
      safeOptions: {
        owners: [signer.address],
        threshold: 1
      },
      // Use custom transaction service URL to avoid API key requirement
      txServiceUrl: 'https://safe-transaction-sepolia.safe.global'
    });

    console.log("Safe client initialized successfully");
    console.log("Safe address:", safeClient.getAddress());
    console.log("");

    console.log("2. Creating ERC20 UserOperation...");
    
    // Create Safe transaction with ERC20 payment
    const transactions = [{
      to: chainConfig.targetContract as `0x${string}`,
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
        token: chainConfig.tokenContract as `0x${string}`
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
      console.log("View on Etherscan:", `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`);
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
})(); 