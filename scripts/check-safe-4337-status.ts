/**
 * Check Safe 4337 Module Status
 * Verify if the deployed Safe has the 4337 module properly enabled
 */

import "dotenv/config";
import { ethers } from "ethers";
import { getDeployedAddresses } from "../src/utils/common";

// Safe ABI for checking modules
const SAFE_ABI = [
  "function getModules() external view returns (address[] memory)",
  "function isModuleEnabled(address module) external view returns (bool)",
  "function getOwners() external view returns (address[] memory)",
  "function getThreshold() external view returns (uint256)",
  "function ownerCount() external view returns (uint256)"
];

async function main() {
  console.log("=== Check Safe 4337 Module Status ===");
  
  const addresses = getDeployedAddresses();
  const safeAddress = addresses.safe;
  
  console.log("Safe Address:", safeAddress);
  console.log("Network: Sepolia");
  console.log("");

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, provider);

  try {
    // Check Safe owners
    console.log("1. Checking Safe owners...");
    const owners = await safeContract.getOwners();
    console.log("   Owners:", owners);
    
    // Check threshold
    console.log("2. Checking Safe threshold...");
    const threshold = await safeContract.getThreshold();
    console.log("   Threshold:", threshold.toString());
    
    // Check all modules
    console.log("3. Checking all enabled modules...");
    const modules = await safeContract.getModules();
    console.log("   Total modules:", modules.length);
    console.log("   Modules:", modules);
    
    // Check specific 4337 module
    console.log("4. Checking 4337 module status...");
    const safe4337ModuleAddress = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226";
    const is4337Enabled = await safeContract.isModuleEnabled(safe4337ModuleAddress);
    console.log("   Safe4337Module address:", safe4337ModuleAddress);
    console.log("   Is 4337 module enabled:", is4337Enabled);
    
    console.log("");
    console.log("=== Analysis ===");
    
    if (is4337Enabled) {
      console.log("✅ Safe4337Module is ENABLED on the Safe");
      console.log("✅ The Safe should be able to send UserOperations");
      console.log("❓ If UserOperations still fail, the issue might be:");
      console.log("   - EntryPoint configuration");
      console.log("   - Gas estimation");
      console.log("   - UserOperation format");
    } else {
      console.log("❌ Safe4337Module is NOT ENABLED on the Safe");
      console.log("❌ This explains why UserOperations fail with 'AA20 account not deployed'");
      console.log("🔧 Solution: Re-deploy the Safe with 4337 module properly enabled");
    }
    
    console.log("");
    console.log("=== Safe Configuration Summary ===");
    console.log(`Safe Address: ${safeAddress}`);
    console.log(`Owners: ${owners.join(", ")}`);
    console.log(`Threshold: ${threshold}`);
    console.log(`Total Modules: ${modules.length}`);
    console.log(`4337 Module Enabled: ${is4337Enabled}`);
    
  } catch (error) {
    console.error("Error checking Safe status:", error);
    console.log("");
    console.log("❌ Could not read Safe status");
    console.log("   This might indicate:");
    console.log("   - Safe not properly deployed");
    console.log("   - Network connectivity issues");
    console.log("   - ABI compatibility issues");
  }
}

main().catch(console.error); 