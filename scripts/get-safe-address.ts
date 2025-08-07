/**
 * Get Safe address from deployment transaction
 */

import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

async function main() {
  console.log("=== Get Safe Address from Deployment ===");
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL)
  });

  const txHash = "0xdda74feb34c6554102a6c93e4080f89be6df50f9fb839e66d210aaa9d20f2895";
  
  try {
    console.log("Getting transaction receipt...");
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Logs count:", receipt.logs.length);
    console.log("");
    
    // Find the ProxyCreation event
    const proxyCreationEvent = receipt.logs.find(log => {
      return log.topics[0] === "0x3d0ce9bfc3ed7d6862dbb28b2dea94561fe714a1b4d019aa8af39730d1ad7c3d";
    });
    
    if (proxyCreationEvent) {
      const safeAddress = `0x${proxyCreationEvent.topics[1].slice(26)}`;
      console.log("✅ Safe deployed at:", safeAddress);
      console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
      console.log("");
      
      // Save to file
      const fs = require("fs");
      fs.writeFileSync("docs/deployed-safe-real.txt", safeAddress);
      console.log("✅ Safe address saved to docs/deployed-safe-real.txt");
      
      // Verify the Safe
      console.log("Verifying Safe configuration...");
      const code = await publicClient.getBytecode({ address: safeAddress as `0x${string}` });
      if (code && code !== "0x") {
        console.log("✅ Safe contract found at address");
      } else {
        console.log("❌ No contract found at address");
      }
      
    } else {
      console.log("❌ ProxyCreation event not found in logs");
      console.log("Available events:");
      receipt.logs.forEach((log, index) => {
        console.log(`  ${index}: ${log.topics[0]}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error getting Safe address:", error);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 