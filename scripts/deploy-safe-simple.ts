/**
 * Deploy Safe 1/1 with ERC-4337 Module - Simple Version
 * Uses pre-deployed Safe infrastructure on Sepolia
 */

import "dotenv/config";
import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploy Safe 1/1 with ERC-4337 Module ===");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("");

  // Safe 1/1 configuration
  const owners = [deployer.address];
  const threshold = 1;
  
  console.log("Safe Configuration:");
  console.log("- Owners:", owners);
  console.log("- Threshold:", threshold);
  console.log("");

  try {
    // Use pre-deployed Safe4337Module on Sepolia
    const safe4337ModuleAddress = "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4";
    console.log("1. Using pre-deployed Safe4337Module at:", safe4337ModuleAddress);
    console.log("");

    // Deploy Safe with ERC-4337 module
    console.log("2. Deploying Safe with ERC-4337 module...");
    
    // Use Safe Factory to create Safe
    const safeFactory = await ethers.getContractAt(
      "SafeProxyFactory",
      "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67" // Sepolia Safe Factory
    );

    const safeSingleton = "0x41675C099F32341bf84BFc5382aF534df5C3341a"; // Sepolia Safe Singleton
    
    const initializer = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint256", "address", "bytes", "address", "address", "uint256", "address"],
      [
        owners,
        threshold,
        safe4337ModuleAddress, // Safe4337Module as fallback handler
        "0x", // no setup data
        ethers.ZeroAddress, // no payment token
        ethers.ZeroAddress, // no payment receiver
        0, // no payment
        ethers.ZeroAddress // no guard
      ]
    );

    console.log("Creating Safe proxy...");
    const tx = await safeFactory.createProxyWithNonce(safeSingleton, initializer, 0);
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);
    
    // Get Safe address from event
    const event = receipt?.logs.find(log => {
      try {
        const parsed = safeFactory.interface.parseLog(log);
        return parsed?.name === "ProxyCreation";
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = safeFactory.interface.parseLog(event);
      const safeAddress = parsed?.args[1];
      console.log("✅ Safe deployed at:", safeAddress);
      console.log("");

      // Save to file
      const fs = require("fs");
      fs.writeFileSync("docs/deployed-safe-real.txt", safeAddress);
      console.log("✅ Safe address saved to docs/deployed-safe-real.txt");
      console.log("");

      console.log("3. Verifying Safe configuration...");
      
      const safe = await ethers.getContractAt("Safe", safeAddress);
      
      const safeOwners = await safe.getOwners();
      const safeThreshold = await safe.getThreshold();
      const safeModules = await safe.getModules();
      
      console.log("✅ Safe owners:", safeOwners);
      console.log("✅ Safe threshold:", safeThreshold.toString());
      console.log("✅ Safe modules:", safeModules);
      
      const has4337Module = safeModules.includes(safe4337ModuleAddress);
      if (has4337Module) {
        console.log("✅ Safe4337Module is enabled!");
      } else {
        console.log("❌ Safe4337Module is NOT enabled");
      }
      
      console.log("");
      console.log("🎉 Safe 1/1 with ERC-4337 deployed successfully!");
      console.log("Safe Address:", safeAddress);
      console.log("Module Address:", safe4337ModuleAddress);
      console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
      
    } else {
      console.log("❌ Could not find Safe address in deployment event");
    }

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