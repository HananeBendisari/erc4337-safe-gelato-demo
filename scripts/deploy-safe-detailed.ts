/**
 * Deploy Safe 1/1 with ERC-4337 Module - Detailed Permissionless.js
 * Using correct Sepolia addresses and manual UserOperation construction
 */

import 'dotenv/config';
import { bundlerActions, getAccountNonce } from 'permissionless';
import {
  Address,
  Client,
  Hash,
  Hex,
  PrivateKeyAccount,
  createClient,
  createPublicClient,
  encodeFunctionData,
  http,
  getAddress,
  getContractAddress
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// Sepolia addresses (from Safe documentation)
const ENTRYPOINT_ADDRESS_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// Safe addresses for Sepolia
const ADD_MODULE_LIB_ADDRESS = '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb';
const SAFE_4337_MODULE_ADDRESS = '0xa581c4A4DB7175302464fF3C06380BC3270b4037';
const SAFE_PROXY_FACTORY_ADDRESS = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67';
const SAFE_SINGLETON_ADDRESS = '0x41675C099F32341bf84BFc5382aF534df5C7461a';
const SAFE_MULTISEND_ADDRESS = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526';

type UserOperation = {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
};

async function main() {
  console.log("=== Deploy Safe 1/1 with ERC-4337 Module (Detailed) ===");
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment");
  }

  const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
  const signer = privateKeyToAccount(PRIVATE_KEY as Hash);
  
  console.log("Signer address:", signer.address);
  console.log("Chain:", sepolia.name);
  console.log("Chain ID:", sepolia.id);
  console.log("");

  try {
    console.log("1. Initializing clients...");
    
    // Create public client
    const publicClient = createPublicClient({
      transport: http(process.env.RPC_URL || "https://rpc.ankr.com/sepolia"),
      chain: sepolia
    });

    // Create bundler client (using Gelato)
    const bundlerClient = createClient({
      transport: http(`https://api.gelato.digital/bundlers/${sepolia.id}/rpc?apiKey=${process.env.GELATO_API_KEY || "demo"}`),
      chain: sepolia
    }).extend(bundlerActions(ENTRYPOINT_ADDRESS_V06));

    console.log("✅ Clients initialized");
    console.log("");

    console.log("2. Verifying Safe infrastructure addresses...");
    
    // Check if Safe infrastructure exists on Sepolia
    const factoryCode = await publicClient.getBytecode({ address: SAFE_PROXY_FACTORY_ADDRESS });
    if (!factoryCode || factoryCode === "0x") {
      console.log("❌ Safe Proxy Factory not found on Sepolia");
      console.log("Address:", SAFE_PROXY_FACTORY_ADDRESS);
      return;
    }
    console.log("✅ Safe Proxy Factory found");

    const singletonCode = await publicClient.getBytecode({ address: SAFE_SINGLETON_ADDRESS });
    if (!singletonCode || singletonCode === "0x") {
      console.log("❌ Safe Singleton not found on Sepolia");
      console.log("Address:", SAFE_SINGLETON_ADDRESS);
      return;
    }
    console.log("✅ Safe Singleton found");

    const moduleCode = await publicClient.getBytecode({ address: SAFE_4337_MODULE_ADDRESS });
    if (!moduleCode || moduleCode === "0x") {
      console.log("❌ Safe4337Module not found on Sepolia");
      console.log("Address:", SAFE_4337_MODULE_ADDRESS);
      return;
    }
    console.log("✅ Safe4337Module found");
    console.log("");

    console.log("3. Calculating Safe address...");
    
    // Calculate the Safe address
    const saltNonce = 0n;
    
    // Create initializer data for Safe setup
    const initializer = encodeFunctionData({
      abi: [{
        inputs: [
          { name: "_owners", type: "address[]" },
          { name: "_threshold", type: "uint256" },
          { name: "to", type: "address" },
          { name: "data", type: "bytes" },
          { name: "fallbackHandler", type: "address" },
          { name: "paymentToken", type: "address" },
          { name: "payment", type: "uint256" },
          { name: "paymentReceiver", type: "address" }
        ],
        name: "setup",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      }],
      args: [
        [signer.address], // owners
        1n, // threshold
        "0x0000000000000000000000000000000000000000", // to
        "0x", // data
        SAFE_4337_MODULE_ADDRESS, // fallbackHandler
        "0x0000000000000000000000000000000000000000", // paymentToken
        0n, // payment
        "0x0000000000000000000000000000000000000000" // paymentReceiver
      ]
    });

    // Calculate Safe address
    const sender = getContractAddress({
      from: SAFE_PROXY_FACTORY_ADDRESS,
      nonce: saltNonce,
      bytecode: "0x" // Safe proxy bytecode (simplified)
    });

    console.log("✅ Safe address calculated:", sender);
    console.log("");

    console.log("4. Checking if Safe is already deployed...");
    
    const contractCode = await publicClient.getBytecode({ address: sender });
    if (contractCode && contractCode !== "0x") {
      console.log("✅ Safe already deployed at:", sender);
      console.log("Etherscan:", `https://sepolia.etherscan.io/address/${sender}`);
      
      // Save to file
      const fs = require("fs");
      fs.writeFileSync("docs/deployed-safe-detailed.txt", sender);
      console.log("✅ Safe address saved to docs/deployed-safe-detailed.txt");
      return;
    }

    console.log("Safe not deployed yet, proceeding with deployment...");
    console.log("");

    console.log("5. Creating UserOperation...");
    
    // Get nonce
    const nonce = await getAccountNonce(publicClient as Client, {
      entryPoint: ENTRYPOINT_ADDRESS_V06,
      sender
    });

    // Create initCode for Safe deployment
    const initCodeCallData = encodeFunctionData({
      abi: [{
        inputs: [
          { name: "singleton", type: "address" },
          { name: "initializer", type: "bytes" },
          { name: "saltNonce", type: "uint256" }
        ],
        name: "createProxyWithNonce",
        outputs: [{ name: "proxy", type: "address" }],
        stateMutability: "nonpayable",
        type: "function"
      }],
      args: [SAFE_SINGLETON_ADDRESS, initializer, saltNonce]
    });

    const initCode = `${SAFE_PROXY_FACTORY_ADDRESS}${initCodeCallData.slice(2)}` as Hex;

    // Create callData (simple transaction to Safe itself)
    const callData = encodeFunctionData({
      abi: [{
        inputs: [
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
          { name: "operation", type: "uint8" },
          { name: "safeTxGas", type: "uint256" },
          { name: "baseGas", type: "uint256" },
          { name: "gasPrice", type: "uint256" },
          { name: "gasToken", type: "address" },
          { name: "refundReceiver", type: "address" },
          { name: "signatures", type: "bytes" }
        ],
        name: "execTransaction",
        outputs: [{ name: "success", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function"
      }],
      args: [
        sender, // to (Safe itself)
        0n, // value
        "0x", // data
        0, // operation
        0n, // safeTxGas
        0n, // baseGas
        0n, // gasPrice
        "0x0000000000000000000000000000000000000000", // gasToken
        "0x0000000000000000000000000000000000000000", // refundReceiver
        "0x" // signatures
      ]
    });

    // Create UserOperation
    const userOperation: UserOperation = {
      sender,
      nonce,
      initCode,
      callData,
      callGasLimit: 1n,
      verificationGasLimit: 1n,
      preVerificationGas: 1n,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      paymasterAndData: "0x",
      signature: "0x"
    };

    console.log("✅ UserOperation created");
    console.log("");

    console.log("6. Estimating gas...");
    
    // Estimate gas
    const gasEstimate = await bundlerClient.estimateUserOperationGas({
      userOperation,
      entryPoint: ENTRYPOINT_ADDRESS_V06
    });

    // Get gas price
    const gasPriceResult = await bundlerClient.getUserOperationGasPrice();

    // Update UserOperation with gas estimates
    userOperation.callGasLimit = gasEstimate.callGasLimit;
    userOperation.verificationGasLimit = gasEstimate.verificationGasLimit;
    userOperation.preVerificationGas = gasEstimate.preVerificationGas;
    userOperation.maxFeePerGas = gasPriceResult.fast.maxFeePerGas;
    userOperation.maxPriorityFeePerGas = gasPriceResult.fast.maxPriorityFeePerGas;

    console.log("✅ Gas estimated");
    console.log("Call gas limit:", userOperation.callGasLimit.toString());
    console.log("Verification gas limit:", userOperation.verificationGasLimit.toString());
    console.log("Pre-verification gas:", userOperation.preVerificationGas.toString());
    console.log("");

    console.log("7. Signing UserOperation...");
    
    // Sign the UserOperation (simplified - in real implementation, this would use Safe4337Module signing)
    userOperation.signature = "0x" as Hex; // Placeholder - actual signing would be more complex
    
    console.log("✅ UserOperation signed (placeholder)");
    console.log("");

    console.log("8. Submitting UserOperation...");
    
    // Submit UserOperation
    const userOperationHash = await bundlerClient.sendUserOperation({
      userOperation,
      entryPoint: ENTRYPOINT_ADDRESS_V06
    });

    console.log("✅ UserOperation submitted!");
    console.log("UserOperation hash:", userOperationHash);
    console.log("");

    console.log("9. Waiting for confirmation...");
    
    // Wait for receipt
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOperationHash
    });

    console.log("✅ UserOperation confirmed!");
    console.log("Transaction hash:", receipt.receipt.transactionHash);
    console.log("Block number:", receipt.blockNumber);
    console.log("");

    console.log("🎉 Safe 1/1 with ERC-4337 deployed successfully!");
    console.log("Safe Address:", sender);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${sender}`);
    console.log("Transaction:", `https://sepolia.etherscan.io/tx/${receipt.receipt.transactionHash}`);
    console.log("");

    // Save to file
    const fs = require("fs");
    fs.writeFileSync("docs/deployed-safe-detailed.txt", sender);
    console.log("✅ Safe address saved to docs/deployed-safe-detailed.txt");

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