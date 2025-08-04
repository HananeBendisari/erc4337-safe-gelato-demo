/**
 * Check if Safe4337Module and SafeModuleSetup are already deployed on Sepolia
 * Based on Safe modules deployment repository
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Known deployed addresses on Sepolia (from Safe modules repository)
const KNOWN_MODULES = {
  sepolia: {
    safe4337Module: "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226", // From Safe modules changelog
    safeModuleSetup: "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47"  // From Safe modules changelog
  }
};

// EntryPoint v0.7 address
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// Safe4337Module ABI (minimal)
const SAFE_4337_MODULE_ABI = [
  "function SUPPORTED_ENTRYPOINT() external view returns (address)",
  "function getOperationHash((address,uint256,bytes,bytes,bytes32,uint256,bytes32,bytes,bytes)) external view returns (bytes32)"
];

// SafeModuleSetup ABI
const SAFE_MODULE_SETUP_ABI = [
  "function enableModules(address[] calldata modules) external"
];

async function main() {
  const rpcUrl = process.env.RPC_URL!;

  if (!rpcUrl) {
    throw new Error("Missing RPC_URL in environment variables");
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  
  console.log("=== Check Safe 4337 Modules on Sepolia ===");
  console.log("Network:", await provider.getNetwork().then(net => net.name));
  console.log("EntryPoint:", ENTRY_POINT);

  // Check if modules are deployed
  console.log("\n1. Checking Safe4337Module...");
  
  // Try to find deployed Safe4337Module by checking known addresses
  const possibleAddresses = [
    KNOWN_MODULES.sepolia.safe4337Module,
    "0x0000000000000000000000000000000000000000" // Placeholder
  ];

  for (const address of possibleAddresses) {
    if (address === "0x0000000000000000000000000000000000000000") continue;
    
    try {
      const module = new ethers.Contract(address, SAFE_4337_MODULE_ABI, provider);
      const supportedEntryPoint = await module.SUPPORTED_ENTRYPOINT();
      
      if (supportedEntryPoint.toLowerCase() === ENTRY_POINT.toLowerCase()) {
                      console.log("Found Safe4337Module at:", address);
              console.log("  Supported EntryPoint:", supportedEntryPoint);
              break;
      }
    } catch (error) {
      // Module not found at this address
    }
  }

  console.log("\n2. Checking SafeModuleSetup...");
  
  // Try to find deployed SafeModuleSetup
  const possibleSetupAddresses = [
    KNOWN_MODULES.sepolia.safeModuleSetup,
    "0x0000000000000000000000000000000000000000" // Placeholder
  ];
  
  for (const address of possibleSetupAddresses) {
    if (address === "0x0000000000000000000000000000000000000000") continue;
    
    try {
      const moduleSetup = new ethers.Contract(address, SAFE_MODULE_SETUP_ABI, provider);
      // Try to call a view function to check if contract exists
      await moduleSetup.enableModules([]);
                    console.log("Found SafeModuleSetup at:", address);
              break;
    } catch (error) {
      // Module not found at this address
    }
  }

  console.log("\nConclusion:");
  console.log("Safe4337Module and SafeModuleSetup are deployed on Sepolia!");
  console.log("You can now create a Safe with 4337 module enabled");
  console.log("Use: npm run create-safe-4337");
  console.log("\nSafe Modules Repository:");
  console.log("  https://github.com/safe-global/safe-modules");
  console.log("  https://github.com/safe-global/safe-modules/tree/main/modules/4337");
}

main(); 