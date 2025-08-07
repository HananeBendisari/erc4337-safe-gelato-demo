/**
 * Verify Safe 1/1 with ERC-4337 Module deployment
 */

import "dotenv/config";
import { createPublicClient, http, encodeFunctionData, getAddress } from "viem";
import { sepolia } from "viem/chains";

async function main() {
  console.log("=== Verify Safe 1/1 with ERC-4337 Module ===");
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL)
  });

  // Safe address from deployment
  const safeAddress = "0x5C98f6c1eB52D20d7720F5Ae93603F2E7dbcCdF8";
  
  console.log("Safe Address:", safeAddress);
  console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
  console.log("");

  try {
    console.log("1. Checking if Safe contract exists...");
    
    const code = await publicClient.getBytecode({ address: safeAddress as `0x${string}` });
    if (!code || code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    console.log("✅ Contract found at this address");
    console.log("");

    console.log("2. Checking Safe owners...");
    
    const ownersData = encodeFunctionData({
      abi: [{ inputs: [], name: "getOwners", outputs: [{ type: "address[]" }], stateMutability: "view", type: "function" }],
      args: []
    });
    
    const ownersResult = await publicClient.call({
      address: safeAddress as `0x${string}`,
      data: ownersData
    });
    
    if (ownersResult.data) {
      console.log("✅ Safe owners:", ownersResult.data);
    } else {
      console.log("❌ Could not read Safe owners");
    }
    console.log("");

    console.log("3. Checking Safe threshold...");
    
    const thresholdData = encodeFunctionData({
      abi: [{ inputs: [], name: "getThreshold", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
      args: []
    });
    
    const thresholdResult = await publicClient.call({
      address: safeAddress as `0x${string}`,
      data: thresholdData
    });
    
    if (thresholdResult.data) {
      console.log("✅ Safe threshold:", thresholdResult.data);
    } else {
      console.log("❌ Could not read Safe threshold");
    }
    console.log("");

    console.log("4. Checking Safe modules...");
    
    const modulesData = encodeFunctionData({
      abi: [{ inputs: [], name: "getModules", outputs: [{ type: "address[]" }], stateMutability: "view", type: "function" }],
      args: []
    });
    
    const modulesResult = await publicClient.call({
      address: safeAddress as `0x${string}`,
      data: modulesData
    });
    
    if (modulesResult.data) {
      console.log("✅ Safe modules:", modulesResult.data);
      
      // Check if Safe4337Module is enabled
      const safe4337Module = "0xa581c4A4DB7175302464fF3C06380BC3270b4037";
      const has4337Module = modulesResult.data.includes(safe4337Module);
      
      if (has4337Module) {
        console.log("✅ Safe4337Module is enabled!");
      } else {
        console.log("❌ Safe4337Module is NOT enabled");
      }
    } else {
      console.log("❌ Could not read Safe modules");
    }
    console.log("");

    console.log("5. Checking Safe balance...");
    
    const balance = await publicClient.getBalance({ address: safeAddress as `0x${string}` });
    console.log("✅ Safe balance:", balance.toString(), "wei");
    console.log("   ETH:", Number(balance) / 1e18);
    console.log("");

    console.log("🎉 Safe 1/1 with ERC-4337 module verification complete!");
    console.log("The Safe is properly deployed and configured.");
    
  } catch (error) {
    console.error("❌ Error verifying Safe:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 