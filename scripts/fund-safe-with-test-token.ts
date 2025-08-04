import "dotenv/config";
import { createPublicClient, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { ethers } from "ethers";
import { logger } from "../src/services/logger.js";
import { NETWORK_CONFIG, CONTRACT_ADDRESSES, ABIS } from "../src/config/index.js";

const SAFE_ADDRESS = "0xA99187fbBdbE75AD71710830B29d8a0a3eE90d17"; // New Safe with 4337 module

async function main() {
  try {
    logger.info("Starting token transfer process...");
    logger.info("Network:", NETWORK_CONFIG.name);
    logger.info("Token address:", CONTRACT_ADDRESSES.token);
    logger.info("Safe address:", SAFE_ADDRESS);

    // Initialize provider and signer
    const provider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    logger.info("Using account:", await signer.getAddress());

    // Initialize token contract
    const tokenContract = new ethers.Contract(
      CONTRACT_ADDRESSES.token,
      ABIS.erc20,
      signer
    );

    // Check balances
    const deployerBalance = await tokenContract.balanceOf(signer.address);
    logger.info("Deployer TEST balance:", deployerBalance.toString());

    const safeBalance = await tokenContract.balanceOf(SAFE_ADDRESS);
    logger.info("Current Safe TEST balance:", safeBalance.toString());

    // Transfer tokens
    const amountToTransfer = parseEther("10"); // 10 TEST tokens
    logger.info(`Preparing to transfer ${amountToTransfer.toString()} TEST tokens...`);

    const tx = await tokenContract.transfer(SAFE_ADDRESS, amountToTransfer);
    logger.info("Transfer transaction hash:", tx.hash);

    logger.info("Waiting for confirmation...");
    await tx.wait();
    logger.success("Transfer confirmed!");

    // Check final balances
    const newSafeBalance = await tokenContract.balanceOf(SAFE_ADDRESS);
    logger.info("New Safe TEST balance:", newSafeBalance.toString());

  } catch (error) {
    logger.error("Error in token transfer:", error);
    if (error instanceof Error) {
      logger.error("Error message:", error.message);
      logger.error("Error stack:", error.stack);
    }
    throw error;
  }
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});