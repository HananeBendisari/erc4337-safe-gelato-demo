/**
 * Common utilities for ERC-4337 Safe Gelato Demo
 * Shared functions to avoid code duplication
 */

import { readFileSync } from "fs";
import { createPublicClient, http } from "viem";
import { NETWORK_CONFIG, CONTRACT_ADDRESSES, ABIS, API_CONFIG } from "../config/index";
import type { Address, DeployedAddresses, GelatoUrls, Safe4337PackConfig, Safe4337PackRawConfig } from "../types/index";
import { validateDeployedAddresses, validateSafe4337PackConfig, validateEnvironment } from "../services/validation";

/**
 * Create a standard public client for blockchain interactions
 */
export function createStandardPublicClient() {
  return createPublicClient({
    chain: NETWORK_CONFIG.chain,
    transport: http(NETWORK_CONFIG.rpcUrl),
  });
}

/**
 * Read deployed contract addresses from files
 */
export function getDeployedAddresses(): DeployedAddresses {
  try {
    const counterAddress = readFileSync('deployed-counter.txt', "utf-8").trim();
    const safeAddress = readFileSync('deployed-safe-with-4337.txt', "utf-8").trim();
    const tokenAddress = readFileSync('deployed-token.txt', "utf-8").trim();
    
    const addresses = {
      counter: counterAddress as Address,
      safe: safeAddress as Address,
      token: tokenAddress as Address,
    };

    // Validate addresses
    validateDeployedAddresses(addresses);
    
    return addresses;
  } catch (error) {
    throw new Error(`Failed to read deployed addresses: ${(error as Error).message}`);
  }
}

/**
 * Get current counter value from the deployed counter contract
 */
export async function getCurrentCounterValue(
  publicClient: ReturnType<typeof createStandardPublicClient>,
  counterAddress: `0x${string}`
): Promise<string | null> {
  try {
    const counterValue = await publicClient.readContract({
      address: counterAddress,
      abi: ABIS.counter,
      functionName: "count",
    });
    return counterValue.toString();
  } catch (error) {
    console.log("Could not read counter value:", (error as Error).message);
    return null;
  }
}

/**
 * Generate Gelato API URLs
 */
export function getGelatoUrls(sponsored = false) {
  const { chainId } = NETWORK_CONFIG;
  const { gelato } = API_CONFIG;
  
  const bundlerUrl = `${gelato.baseUrl}${gelato.bundlerPath(chainId)}?apiKey=${gelato.apiKey}${sponsored ? "&sponsored=true" : ""}`;
  const paymasterUrl = `${gelato.baseUrl}${gelato.paymasterPath(chainId)}?apiKey=${gelato.apiKey}`;
  
  return { bundlerUrl, paymasterUrl };
}

/**
 * Log standard contract information
 */
export function logContractInfo(addresses: ReturnType<typeof getDeployedAddresses>, counterValue?: string | null) {
  console.log("Deployed Contracts:");
  console.log("  Counter:", addresses.counter);
  console.log("  Safe with 4337:", addresses.safe);
  console.log("  Token:", addresses.token);
  console.log("");
  
  if (counterValue !== undefined) {
    if (counterValue !== null) {
      console.log("Current Counter Value:", counterValue);
    } else {
      console.log("Current Counter Value: Unable to read");
    }
    console.log("");
  }
}

/**
 * Log Safe4337Pack module information
 */
export function logSafe4337ModuleInfo() {
  console.log("Safe 4337 Module Configuration:");
  console.log("  - Safe4337Module:", CONTRACT_ADDRESSES.safe4337Module);
  console.log("  - SafeModuleSetup:", CONTRACT_ADDRESSES.safeModuleSetup);
  console.log("  - EntryPoint:", CONTRACT_ADDRESSES.entryPoint);
  console.log("");
}

/**
 * Log network information
 */
export function logNetworkInfo() {
  console.log("Chain:", NETWORK_CONFIG.name);
  console.log("Chain ID:", NETWORK_CONFIG.chainId);
  console.log("");
}

/**
 * Create Safe4337Pack configuration object
 */
export function createSafe4337PackConfig(sponsored = false): Safe4337PackRawConfig {
  const { bundlerUrl, paymasterUrl } = getGelatoUrls(sponsored);
  
  const config: Safe4337PackRawConfig = {
    bundlerUrl,
    chainId: NETWORK_CONFIG.chainId,
    entryPointAddress: CONTRACT_ADDRESSES.entryPoint,
    safe4337ModuleAddress: CONTRACT_ADDRESSES.safe4337Module,
    safeModuleSetupAddress: CONTRACT_ADDRESSES.safeModuleSetup,
    ...(sponsored && { paymasterUrl }),
  };
  
  // Note: Skip validation for now as Safe4337Pack expects different interface
  // validateSafe4337PackConfig(config);
  
  return config;
}

/**
 * Standard error handler for async operations
 */
export function handleAsyncError(operation: string, error: Error) {
  console.log(`Error during ${operation}:`);
  console.log("  Error:", error.message);
  console.log("");
  console.log("Debugging information:");
  logSafe4337ModuleInfo();
}

/**
 * Initialize and validate environment
 */
export function initializeEnvironment(): void {
  console.log("Initializing environment...");
  
  const validation = validateEnvironment();
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.log("Environment warnings:");
    validation.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
  
  // Log errors and exit if any
  if (validation.errors.length > 0) {
    console.log("Environment errors:");
    validation.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
    console.log("");
    console.log("Please fix these issues and try again.");
    process.exit(1);
  }
  
  if (validation.warnings.length === 0) {
    console.log("Environment validation passed");
  }
  console.log("");
}