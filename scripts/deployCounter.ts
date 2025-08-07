/**
 * Deploys the Counter contract to Ethereum Sepolia using Viem.
 * Requires a compiled JSON artifact from Foundry (ABI + bytecode).
 * Saves the deployed contract address to a local file for reuse.
 */

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { writeFileSync } from "fs";

// Load environment variables from .env file
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string;

// Import the compiled contract artifact (must be generated via Foundry)
import CounterJson from "../out/Counter.sol/Counter.json";

async function main() {
  // Initialize the wallet account from the private key
  const account = privateKeyToAccount(PRIVATE_KEY);

  // Create a Viem wallet client for sending the deployment transaction
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  // Extract bytecode and ABI from the compiled JSON
  const rawBytecode = CounterJson.bytecode.object.startsWith("0x")
    ? CounterJson.bytecode.object
    : `0x${CounterJson.bytecode.object}`;

  const bytecode = rawBytecode as `0x${string}`;
  const abi = CounterJson.abi;

  // Deploy the contract and get the transaction hash
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    account,
    args: [], // No constructor arguments
  });

  console.log("Transaction sent. Waiting for confirmation...");

  // Create a public client to retrieve the deployment receipt
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const tx = await publicClient.waitForTransactionReceipt({ hash });
  const deployedAddress = tx.contractAddress;

  console.log(`Contract deployed at: ${deployedAddress}`);

  // Save the deployed address to a local file
  writeFileSync("docs/deployed-counter.txt", deployedAddress!);
}

// Run the script
main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
