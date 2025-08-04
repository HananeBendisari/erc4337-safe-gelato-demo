import "dotenv/config";
import { sepolia } from "viem/chains";

// Network Configuration
export const NETWORK_CONFIG = {
  chain: sepolia,
  chainId: sepolia.id, // 11155111
  name: sepolia.name,
  rpcUrl: process.env.RPC_URL || sepolia.rpcUrls.default.http[0],
} as const;

// Contract Addresses - Sepolia Testnet
export const CONTRACT_ADDRESSES = {
  // ERC-4337 v0.7
  entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  
  // Safe v1.4.1+ Contracts
  safeProxyFactory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
  safeSingleton: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
  
  // Safe 4337 Modules (Official Deployment)
  safe4337Module: "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
  safeModuleSetup: "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",

  // Deployed contracts
  token: "0x0566F0CD850220DF2806E3100cc6029144af7041", // TestToken
} as const;

// API Configuration
export const API_CONFIG = {
  gelato: {
    baseUrl: "https://api.gelato.digital",
    bundlerPath: (chainId: number) => `/bundlers/${chainId}/rpc`,
    paymasterPath: (chainId: number) => `/paymasters/${chainId}/rpc`,
    apiKey: process.env.GELATO_API_KEY || "kclD_keh0Dy4UObSs9zh1P2uKyLFcdDK8zIiQtJHbeI_",
  },
} as const;

// Gas Configuration
export const GAS_CONFIG = {
  sponsored: {
    maxFeePerGas: "0x0",
    maxPriorityFeePerGas: "0x0",
  },
  // Native gas will be estimated dynamically
} as const;

// Owner Configuration
export const OWNER_CONFIG = {
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  address: "0xc7Fbbc191Ce9Be67A352B1F2EcBef62E52933943",
} as const;

// Safe Configuration
export const SAFE_CONFIG = {
  threshold: 1, // 1/1 Safe
  saltNonce: Date.now(), // Unique nonce for Safe creation
} as const;

// ABIs (minimal for common operations)
export const ABIS = {
  counter: [
    {
      name: "count",
      type: "function",
      inputs: [],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
    {
      name: "increment",
      type: "function",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ],
  
  safeProxyFactory: [
    "function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (SafeProxy proxy)",
    "event ProxyCreation(SafeProxy proxy)",
  ],
  
  safeSingleton: [
    "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external",
  ],
  
  safeModuleSetup: [
    "function enableModules(address[] calldata modules) external",
  ],

  erc20: [
    {
      name: "balanceOf",
      type: "function",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
      stateMutability: "view"
    },
    {
      name: "transfer",
      type: "function",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      outputs: [{ name: "success", type: "bool" }],
      stateMutability: "nonpayable"
    },
    {
      name: "approve",
      type: "function",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" }
      ],
      outputs: [{ name: "success", type: "bool" }],
      stateMutability: "nonpayable"
    }
  ]
} as const;

// Type definitions
export type NetworkConfig = typeof NETWORK_CONFIG;
export type ContractAddresses = typeof CONTRACT_ADDRESSES;
export type ApiConfig = typeof API_CONFIG;
export type GasConfig = typeof GAS_CONFIG;

// Validation
if (!API_CONFIG.gelato.apiKey) {
  throw new Error("GELATO_API_KEY not found in environment variables");
}

if (!OWNER_CONFIG.privateKey) {
  throw new Error("PRIVATE_KEY not found in environment variables");
}

if (!NETWORK_CONFIG.rpcUrl) {
  throw new Error("RPC_URL not found in environment variables");
}