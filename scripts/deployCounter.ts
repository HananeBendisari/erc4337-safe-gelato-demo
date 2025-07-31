/**
 * Deploys the Counter contract to Optimism Goerli using Viem.
 * Requires a compiled JSON artifact from Foundry (ABI + bytecode).
 * Saves the deployed contract address to a local file for reuse.
 */

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimismGoerli } from "viem/chains";
import * as dotenv from "dotenv";
import { writeFileSync } from "fs";

// Load environment variables from .env file
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string;

// Import the compiled contract artifact (must be generated via Foundry)
import CounterJson from "../out/Counter.sol/Counter.json";

async function main() {
  // Initialize the Viem wallet account from the private key
  const account = privateKeyToAccount(PRIVATE_KEY);

  // Create a Viem wallet client targeting Optimism Goerli
  const client = createWalletClient({
    account,
    chain: optimismGoerli,
    transport: http(RPC_URL),
  });

  // Extract bytecode and ABI from the compiled JSON output
  const bytecode = `0x${CounterJson.bytecode.object}`;
  const abi = CounterJson.abi;

  // Deploy the contract to the network
  const hash = await client.deployContract({
    abi,
    bytecode,
    account,
    args: [], // No constructor arguments for Counter
  });

  console.log("Transaction sent. Waiting for confirmation...");

  // Wait for the transaction to be mined and extract the deployed address
  const tx = await client.waitForTransactionReceipt({ hash });
  const deployedAddress = tx.contractAddress;

  console.log(`Contract deployed at address: ${deployedAddress}`);

  // Store the address locally for reuse by other scripts
  writeFileSync("deployed-counter.txt", deployedAddress!);
}

// Execute and handle errors gracefully
main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
