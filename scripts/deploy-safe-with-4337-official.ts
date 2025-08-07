/**
 * Deploy Safe with ERC-4337 using official Safe tools
 * This script deploys a Safe 1/1 with ERC-4337 module properly configured
 */

import "dotenv/config";
import { 
  SafeAccountConfig, 
  SafeFactory,
  Safe4337Module,
  Safe4337ModuleSetup
} from "@safe-global/protocol-kit";
import { 
  createPublicClient, 
  http, 
  type Hex,
  getContract,
  parseEther
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { readFileSync, writeFileSync } from "fs";

const chain = sepolia;
const chainID = chain.id;

async function main() {
  console.log("=== Deploy Safe with ERC-4337 (Official Tools) ===");
  console.log("Chain:", chain.name);
  console.log("Chain ID:", chainID);
  console.log("");

  const privateKey = process.env.PRIVATE_KEY as Hex;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is not set");
  }

  const account = privateKeyToAccount(privateKey);
  console.log("Deploying with account:", account.address);
  console.log("");

  // Create public client
  const publicClient = createPublicClient({
    chain,
    transport: http(process.env.RPC_URL)
  });

  try {
    console.log("1. Creating Safe Factory...");
    
    // Create Safe Factory
    const safeFactory = await SafeFactory.create({
      ethAdapter: {
        getSignerAddress: async () => account.address,
        signMessage: async (message: string) => {
          // Implement signing logic
          return "0x" as Hex;
        },
        signTypedData: async (typedData: any) => {
          // Implement typed data signing
          return "0x" as Hex;
        },
        getChainId: async () => chainID,
        getBalance: async (address: string) => {
          return await publicClient.getBalance({ address: address as `0x${string}` });
        },
        getNonce: async (address: string) => {
          return await publicClient.getTransactionCount({ address: address as `0x${string}` });
        },
        getCode: async (address: string) => {
          return await publicClient.getBytecode({ address: address as `0x${string}` });
        },
        isContractDeployed: async (address: string) => {
          const code = await publicClient.getBytecode({ address: address as `0x${string}` });
          return code !== undefined && code !== "0x";
        },
        estimateGas: async (transaction: any) => {
          return await publicClient.estimateGas(transaction);
        },
        call: async (transaction: any) => {
          return await publicClient.call(transaction);
        },
        sendTransaction: async (transaction: any) => {
          // This would need a wallet client
          throw new Error("sendTransaction not implemented");
        }
      },
      safeVersion: "1.4.1"
    });

    console.log("Safe Factory created successfully");
    console.log("");

    console.log("2. Creating Safe Account Config...");
    
    // Safe account configuration
    const safeAccountConfig: SafeAccountConfig = {
      owners: [account.address],
      threshold: 1,
      fallbackHandler: "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4" // Safe4337Module
    };

    console.log("Safe Account Config:");
    console.log("  - Owners:", safeAccountConfig.owners);
    console.log("  - Threshold:", safeAccountConfig.threshold);
    console.log("  - Fallback Handler:", safeAccountConfig.fallbackHandler);
    console.log("");

    console.log("3. Deploying Safe with ERC-4337...");
    
    // Deploy Safe
    const safeSdk = await safeFactory.deploySafe({
      safeAccountConfig,
      saltNonce: "0x" + Math.random().toString(16).substring(2, 10)
    });

    const safeAddress = await safeSdk.getAddress();
    console.log("✅ Safe deployed successfully!");
    console.log("Safe Address:", safeAddress);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
    console.log("");

    console.log("4. Configuring ERC-4337 Module...");
    
    // Configure ERC-4337 module
    const safe4337Module = await Safe4337Module.create({
      ethAdapter: safeFactory.getEthAdapter(),
      safeAddress
    });

    // Enable the module
    await safe4337Module.enableModule();
    console.log("✅ ERC-4337 module enabled!");
    console.log("");

    console.log("5. Funding Safe...");
    
    // Fund the Safe with some ETH
    const fundingAmount = parseEther("0.01");
    
    // This would require a wallet client to send transaction
    console.log("⚠️  Manual funding required:");
    console.log("  - Send 0.01 ETH to:", safeAddress);
    console.log("  - For gas fees and testing");
    console.log("");

    console.log("6. Saving deployment info...");
    
    // Save deployment info
    const deploymentInfo = {
      safeAddress,
      owner: account.address,
      chainId: chainID,
      chainName: chain.name,
      deploymentTime: new Date().toISOString(),
      safeVersion: "1.4.1",
      erc4337Module: "enabled",
      fallbackHandler: safeAccountConfig.fallbackHandler
    };

    writeFileSync(
      'docs/deployed-safe-with-4337-official.json', 
      JSON.stringify(deploymentInfo, null, 2)
    );

    writeFileSync(
      'docs/deployed-safe-with-4337-official.txt', 
      safeAddress
    );

    console.log("✅ Deployment info saved!");
    console.log("  - JSON:", 'docs/deployed-safe-with-4337-official.json');
    console.log("  - Address:", 'docs/deployed-safe-with-4337-official.txt');
    console.log("");

    console.log("🎉 Safe with ERC-4337 deployed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Fund the Safe with 0.01 ETH");
    console.log("2. Test UserOperations with the new Safe");
    console.log("3. Update scripts to use the new Safe address");

  } catch (error) {
    console.error("❌ Error during Safe deployment:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 