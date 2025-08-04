/**
 * Type definitions for ERC-4337 Safe Gelato Demo
 * Centralized type definitions to improve type safety
 */

// Ethereum Address Type
export type Address = `0x${string}`;

// Chain Configuration
export interface ChainConfig {
  readonly chainId: number;
  readonly name: string;
  readonly rpcUrl: string;
}

// Contract Addresses Interface
export interface ContractAddresses {
  readonly entryPoint: Address;
  readonly safeProxyFactory: Address;
  readonly safeSingleton: Address;
  readonly safe4337Module: Address;
  readonly safeModuleSetup: Address;
}

// Deployed Contract Addresses
export interface DeployedAddresses {
  readonly counter: Address;
  readonly safe: Address;
  readonly token: Address;
}

// Safe4337Pack Configuration
export interface Safe4337PackConfig {
  bundlerUrl: string;
  paymasterUrl?: string;
  chainId: number;
  entryPointAddress: Address;
  safe4337ModuleAddress: Address;
  safeModuleSetupAddress: Address;
}

// Raw configuration for Safe4337Pack constructor
export interface Safe4337PackRawConfig {
  [key: string]: any;
}

// UserOperation Types
export type UserOperationType = "sponsored" | "native" | "erc20";

// Gas Configuration
export interface GasConfig {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

// API Response Types
export interface GelatoApiResponse<T = any> {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

// Contract Call Result
export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Script Execution Result
export interface ScriptResult {
  success: boolean;
  message: string;
  data?: any;
}

// Environment Variables
export interface EnvConfig {
  PRIVATE_KEY?: Address;
  GELATO_API_KEY?: string;
  RPC_URL?: string;
}

// Safe Configuration
export interface SafeConfig {
  threshold: number;
  owners: Address[];
  saltNonce?: number;
}

// Counter Contract Interface
export interface CounterContract {
  count(): Promise<bigint>;
  increment(): Promise<void>;
}

// Gelato URLs
export interface GelatoUrls {
  bundlerUrl: string;
  paymasterUrl: string;
}