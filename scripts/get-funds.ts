/**
 * Get Sepolia testnet funds for Safe v1.4.1+ deployment
 * Provides faucet links and balance checking
 */

import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const chain = sepolia;

async function main() {
  console.log("=== Get Sepolia Testnet Funds ===");
  
  const publicClient = createPublicClient({
    chain,
    transport: http()
  });
  
  const address = "0xc7Fbbc191Ce9Be67A352B1F2EcBef62E52933943";
  
  const balance = await publicClient.getBalance({ address });
  console.log("Current balance:", balance);
  console.log("Balance in ETH:", Number(balance) / 1e18);
  
  console.log("\n🔗 Sepolia Faucets:");
  console.log("1. https://sepoliafaucet.com/");
  console.log("2. https://faucet.sepolia.dev/");
  console.log("3. https://sepolia-faucet.pk910.de/");
  console.log("4. https://faucet.sepolia.starknet.io/");
  
  console.log("\n📝 Address to fund:", address);
  console.log("\nOnce funded, I can deploy Safe v1.4.1+");
  console.log("Need at least 0.01 ETH for deployment");
  
  if (Number(balance) / 1e18 < 0.01) {
    console.log("\nInsufficient funds for Safe v1.4.1+ deployment");
    console.log("Current funds sufficient for existing UserOperations");
  } else {
    console.log("\nSufficient funds for Safe v1.4.1+ deployment");
    console.log("Run: npm run deploy-safe-v1.4.1");
  }
}

main(); 