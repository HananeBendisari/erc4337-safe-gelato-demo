/**
 * Check Safe 4337 Module Status with Viem
 */

import "dotenv/config";
import { 
  createPublicClient, 
  http,
  getContract,
  encodeFunctionData
} from "viem";
import { sepolia } from "viem/chains";

// Safe ABI (simplified)
const SAFE_ABI = [
  {
    inputs: [],
    name: "getOwners",
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getThreshold",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getModules",
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const chain = sepolia;

async function main() {
  console.log("=== Check Safe 4337 Module Status (Viem) ===");
  console.log("Safe Address: 0xA99187fbBdbE75AD71710830B29d8a0a3eE90d17");
  console.log("Network:", chain.name);
  console.log("");

  const publicClient = createPublicClient({
    chain,
    transport: http(process.env.RPC_URL)
  });

  const safeAddress = "0xA99187fbBdbE75AD71710830B29d8a0a3eE90d17";

  try {
    console.log("1. Checking if Safe contract exists...");
    
    const code = await publicClient.getBytecode({ address: safeAddress });
    
    if (!code || code === "0x") {
      console.log("❌ Safe contract not found at this address");
      return;
    }
    
    console.log("✅ Safe contract found!");
    console.log("");

    console.log("2. Creating Safe contract instance...");
    
    const safeContract = getContract({
      address: safeAddress,
      abi: SAFE_ABI,
      publicClient
    });

    console.log("✅ Safe contract instance created");
    console.log("");

    console.log("3. Checking Safe owners...");
    
    try {
      const owners = await safeContract.read.getOwners();
      console.log("✅ Safe owners:", owners);
    } catch (error) {
      console.log("❌ Could not read owners:", (error as Error).message);
    }
    console.log("");

    console.log("4. Checking Safe threshold...");
    
    try {
      const threshold = await safeContract.read.getThreshold();
      console.log("✅ Safe threshold:", threshold.toString());
    } catch (error) {
      console.log("❌ Could not read threshold:", (error as Error).message);
    }
    console.log("");

    console.log("5. Checking Safe modules...");
    
    try {
      const modules = await safeContract.read.getModules();
      console.log("✅ Safe modules:", modules);
      
      // Check if Safe4337Module is enabled
      const safe4337Module = "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4";
      const has4337Module = modules.includes(safe4337Module);
      
      if (has4337Module) {
        console.log("✅ Safe4337Module is enabled!");
      } else {
        console.log("❌ Safe4337Module is NOT enabled");
      }
    } catch (error) {
      console.log("❌ Could not read modules:", (error as Error).message);
    }
    console.log("");

    console.log("6. Checking Safe balance...");
    
    try {
      const balance = await publicClient.getBalance({ address: safeAddress });
      console.log("✅ Safe balance:", balance.toString(), "wei");
      console.log("   ETH:", Number(balance) / 1e18);
    } catch (error) {
      console.log("❌ Could not read balance:", (error as Error).message);
    }

  } catch (error) {
    console.error("❌ Error checking Safe status:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 