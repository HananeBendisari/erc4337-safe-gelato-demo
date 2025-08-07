/**
 * Calculate Safe address from saltNonce
 */

import "dotenv/config";
import { createPublicClient, http, encodeFunctionData, getAddress } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  console.log("=== Calculate Safe Address ===");
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment");
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log("Owner address:", account.address);
  console.log("");

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL)
  });

  // Safe addresses for Sepolia
  const safeFactoryAddress = getAddress("0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67");
  const safeSingletonAddress = getAddress("0x41675C099F32341bf84BFc5382aF534df5C7461a");
  const safe4337ModuleAddress = getAddress("0xa581c4A4DB7175302464fF3C06380BC3270b4037");
  
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
      [account.address], // owners
      1n, // threshold
      "0x0000000000000000000000000000000000000000", // to
      "0x", // data
      safe4337ModuleAddress, // fallbackHandler
      "0x0000000000000000000000000000000000000000", // paymentToken
      0n, // payment
      "0x0000000000000000000000000000000000000000" // paymentReceiver
    ]
  });

  // Create initCodeCallData
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
    args: [safeSingletonAddress, initializer, saltNonce]
  });

  console.log("Factory address:", safeFactoryAddress);
  console.log("Singleton address:", safeSingletonAddress);
  console.log("Module address:", safe4337ModuleAddress);
  console.log("Salt nonce:", saltNonce.toString());
  console.log("");

  // Try to calculate the Safe address using the factory's computeAddress function
  try {
    const computeAddressData = encodeFunctionData({
      abi: [{
        inputs: [
          { name: "singleton", type: "address" },
          { name: "initializer", type: "bytes" },
          { name: "saltNonce", type: "uint256" }
        ],
        name: "computeAddress",
        outputs: [{ name: "proxy", type: "address" }],
        stateMutability: "view",
        type: "function"
      }],
      args: [safeSingletonAddress, initializer, saltNonce]
    });

    const result = await publicClient.call({
      address: safeFactoryAddress,
      data: computeAddressData
    });

    if (result.data) {
      const safeAddress = getAddress(result.data);
      console.log("✅ Safe address calculated:", safeAddress);
      console.log("Etherscan:", `https://sepolia.etherscan.io/address/${safeAddress}`);
      console.log("");

      // Check if Safe is deployed
      const code = await publicClient.getBytecode({ address: safeAddress });
      if (code && code !== "0x") {
        console.log("✅ Safe is deployed at this address");
        
        // Save to file
        const fs = require("fs");
        fs.writeFileSync("docs/deployed-safe-real.txt", safeAddress);
        console.log("✅ Safe address saved to docs/deployed-safe-real.txt");
        
      } else {
        console.log("❌ Safe is not deployed at this address");
      }
    } else {
      console.log("❌ Could not calculate Safe address");
    }
    
  } catch (error) {
    console.error("❌ Error calculating Safe address:", error);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
}); 