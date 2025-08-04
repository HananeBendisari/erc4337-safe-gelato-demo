/**
 * Validation service for ERC-4337 Safe Gelato Demo
 * Centralized validation logic for addresses, configurations, and data
 */

import type { Address, DeployedAddresses, Safe4337PackConfig } from "../types/index.js";

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate deployed addresses object
 */
export function validateDeployedAddresses(addresses: any): addresses is DeployedAddresses {
  if (!addresses || typeof addresses !== "object") {
    return false;
  }

  const { counter, safe, token } = addresses;
  
  if (!isValidAddress(counter)) {
    throw new Error(`Invalid counter address: ${counter}`);
  }
  
  if (!isValidAddress(safe)) {
    throw new Error(`Invalid safe address: ${safe}`);
  }

  if (!isValidAddress(token)) {
    throw new Error(`Invalid token address: ${token}`);
  }

  return true;
}

/**
 * Validate Safe4337Pack configuration
 */
export function validateSafe4337PackConfig(config: any): config is Safe4337PackConfig {
  if (!config || typeof config !== "object") {
    return false;
  }

  // Required fields
  const requiredFields = [
    "bundlerUrl",
    "chainId", 
    "entryPointAddress",
    "safe4337ModuleAddress",
    "safeModuleSetupAddress"
  ];

  for (const field of requiredFields) {
    if (!(field in config)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate addresses
  const addressFields = [
    "entryPointAddress",
    "safe4337ModuleAddress", 
    "safeModuleSetupAddress"
  ];

  for (const field of addressFields) {
    if (!isValidAddress(config[field])) {
      throw new Error(`Invalid address in ${field}: ${config[field]}`);
    }
  }

  // Validate URLs
  if (!isValidUrl(config.bundlerUrl)) {
    throw new Error(`Invalid bundler URL: ${config.bundlerUrl}`);
  }

  if (config.paymasterUrl && !isValidUrl(config.paymasterUrl)) {
    throw new Error(`Invalid paymaster URL: ${config.paymasterUrl}`);
  }

  // Validate chain ID
  if (typeof config.chainId !== "number" || config.chainId <= 0) {
    throw new Error(`Invalid chain ID: ${config.chainId}`);
  }

  return true;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.PRIVATE_KEY) {
    errors.push("PRIVATE_KEY is required");
  } else if (!isValidAddress(process.env.PRIVATE_KEY)) {
    errors.push("PRIVATE_KEY must be a valid Ethereum private key");
  }

  if (!process.env.GELATO_API_KEY) {
    warnings.push("GELATO_API_KEY not found - some features may not work");
  }

  if (!process.env.RPC_URL) {
    warnings.push("RPC_URL not found - using default RPC");
  } else if (!isValidUrl(process.env.RPC_URL)) {
    errors.push("RPC_URL must be a valid URL");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate contract interaction result
 */
export function validateContractResult<T>(
  result: any,
  expectedType: "string" | "number" | "bigint" | "boolean"
): { success: boolean; data?: T; error?: string } {
  try {
    if (result === null || result === undefined) {
      return {
        success: false,
        error: "Contract call returned null/undefined",
      };
    }

    // Type-specific validation
    switch (expectedType) {
      case "string":
        if (typeof result !== "string") {
          return {
            success: false,
            error: `Expected string, got ${typeof result}`,
          };
        }
        break;
      
      case "number":
        if (typeof result !== "number" || isNaN(result)) {
          return {
            success: false,
            error: `Expected number, got ${typeof result}`,
          };
        }
        break;
      
      case "bigint":
        if (typeof result !== "bigint") {
          return {
            success: false,
            error: `Expected bigint, got ${typeof result}`,
          };
        }
        break;
      
      case "boolean":
        if (typeof result !== "boolean") {
          return {
            success: false,
            error: `Expected boolean, got ${typeof result}`,
          };
        }
        break;
    }

    return {
      success: true,
      data: result as T,
    };
  } catch (error) {
    return {
      success: false,
      error: `Validation error: ${(error as Error).message}`,
    };
  }
}

/**
 * Validate gas parameters
 */
export function validateGasParams(gasParams: {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}): boolean {
  const { maxFeePerGas, maxPriorityFeePerGas } = gasParams;

  // Check format (should be hex string)
  if (maxFeePerGas && !/^0x[0-9a-fA-F]+$/.test(maxFeePerGas)) {
    throw new Error(`Invalid maxFeePerGas format: ${maxFeePerGas}`);
  }

  if (maxPriorityFeePerGas && !/^0x[0-9a-fA-F]+$/.test(maxPriorityFeePerGas)) {
    throw new Error(`Invalid maxPriorityFeePerGas format: ${maxPriorityFeePerGas}`);
  }

  // Priority fee should not exceed max fee
  if (maxFeePerGas && maxPriorityFeePerGas) {
    const maxFee = parseInt(maxFeePerGas, 16);
    const priorityFee = parseInt(maxPriorityFeePerGas, 16);
    
    if (priorityFee > maxFee) {
      throw new Error("Priority fee cannot exceed max fee");
    }
  }

  return true;
}