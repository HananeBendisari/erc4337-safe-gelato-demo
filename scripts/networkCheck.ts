/**
 * Checks the connection to the Ethereum network using Viem and prints the chain ID.
 */

import { createPublicClient, http } from "viem";
import * as dotenv from "dotenv";

dotenv.config();

// Create a public client using the RPC URL from environment variables
const client = createPublicClient({
  transport: http(process.env.RPC_URL!),
});

async function main() {
  // Retrieve and print the current chain ID
  const chainId = await client.getChainId();
  console.log("Connected to chain ID:", chainId);
}

main();
