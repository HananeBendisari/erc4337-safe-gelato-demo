# Script Architecture - ERC-4337 Safe Gelato Demo

## Overview

This document explains the architectural decisions and factorization choices made for the project scripts and utilities.

## Architecture Principles

### 1. **Separation of Concerns**
- **Configuration**: Centralized in `src/config/index.ts`
- **Utilities**: Shared functions in `src/utils/common.ts`
- **Scripts**: Individual UserOperation implementations
- **Types**: TypeScript definitions in `src/types/index.ts`

### 2. **DRY (Don't Repeat Yourself)**
- Common functions extracted to utilities
- Configuration centralized to avoid duplication
- Shared ABIs and constants

### 3. **Maintainability**
- Single source of truth for configuration
- Easy to update network settings
- Consistent error handling

## Directory Structure

```
src/
├── config/
│   └── index.ts          # Centralized configuration
├── utils/
│   └── common.ts         # Shared utility functions
├── types/
│   └── index.ts          # TypeScript type definitions
└── services/
    ├── logger.ts         # Logging utilities
    └── validation.ts     # Input validation

scripts/
├── safe4337-sponsored.ts     # Sponsored UserOperation
├── safe4337-native.ts        # Native UserOperation
├── safe4337-erc20-starter-kit.ts  # ERC20 UserOperation
├── test-safe-4337-pack.ts    # Safe4337Pack testing
├── create-safe-with-4337.ts  # Safe deployment
├── deployCounter.ts          # Counter deployment
├── fund-safe-with-test-token.ts  # Token funding
├── get-funds.ts              # ETH funding
├── check-safe-modules-deployed.ts  # Module verification
├── run-all-endpoints.ts      # Comprehensive testing
└── final-status-complete.ts  # Project status
```

## Factorization Choices

### 1. **Configuration Centralization**

**File**: `src/config/index.ts`

**Rationale**: All configuration in one place for easy maintenance

```typescript
// Network Configuration
export const NETWORK_CONFIG = {
  chain: sepolia,
  chainId: sepolia.id,
  name: sepolia.name,
  rpcUrl: process.env.RPC_URL || sepolia.rpcUrls.default.http[0],
} as const;

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  safe4337Module: "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
  // ... other addresses
} as const;
```

**Benefits**:
- Single source of truth for addresses
- Easy network switching
- Environment variable management
- Type safety with `as const`

### 2. **Utility Functions Extraction**

**File**: `src/utils/common.ts`

**Rationale**: Avoid code duplication across scripts

```typescript
// Shared functions used by multiple scripts
export function createStandardPublicClient() { /* ... */ }
export function getDeployedAddresses() { /* ... */ }
export function getCurrentCounterValue() { /* ... */ }
export function getGelatoUrls() { /* ... */ }
export function logContractInfo() { /* ... */ }
```

**Benefits**:
- Consistent behavior across scripts
- Easy to update common logic
- Reduced code duplication
- Centralized error handling

### 3. **Script Organization**

#### **UserOperation Scripts** (Core Functionality)
- `safe4337-sponsored.ts` - Sponsored UserOperation
- `safe4337-native.ts` - Native UserOperation  
- `safe4337-erc20-starter-kit.ts` - ERC20 UserOperation
- `test-safe-4337-pack.ts` - Safe4337Pack testing

#### **Deployment Scripts** (Setup)
- `create-safe-with-4337.ts` - Safe deployment
- `deployCounter.ts` - Counter deployment

#### **Utility Scripts** (Support)
- `fund-safe-with-test-token.ts` - Token funding
- `get-funds.ts` - ETH funding
- `check-safe-modules-deployed.ts` - Verification
- `run-all-endpoints.ts` - Testing suite
- `final-status-complete.ts` - Status reporting

### 4. **Type Safety**

**File**: `src/types/index.ts`

**Rationale**: Ensure type safety across the project

```typescript
export type Address = `0x${string}`;
export type DeployedAddresses = {
  counter: Address;
  safe: Address;
};
export type Safe4337PackConfig = {
  // ... configuration types
};
```

**Benefits**:
- Compile-time error detection
- Better IDE support
- Self-documenting code
- Reduced runtime errors

## Specific Factorization Examples

### 1. **Public Client Creation**

**Before** (duplicated in each script):
```typescript
// In each script
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL),
});
```

**After** (centralized):
```typescript
// src/utils/common.ts
export function createStandardPublicClient() {
  return createPublicClient({
    chain: NETWORK_CONFIG.chain,
    transport: http(NETWORK_CONFIG.rpcUrl),
  });
}

// In scripts
const publicClient = createStandardPublicClient();
```

### 2. **Address Reading**

**Before** (duplicated):
```typescript
// In each script
const counterAddress = readFileSync('deployed-counter.txt', "utf-8").trim();
const safeAddress = readFileSync('deployed-safe-with-4337.txt', "utf-8").trim();
```

**After** (centralized):
```typescript
// src/utils/common.ts
export function getDeployedAddresses(): DeployedAddresses {
  const counterAddress = readFileSync('deployed-counter.txt', "utf-8").trim();
  const safeAddress = readFileSync('deployed-safe-with-4337.txt', "utf-8").trim();
  
  return {
    counter: counterAddress as Address,
    safe: safeAddress as Address,
  };
}

// In scripts
const addresses = getDeployedAddresses();
```

### 3. **Gelato URL Generation**

**Before** (duplicated):
```typescript
// In each script
const bundlerUrl = `https://api.gelato.digital/bundlers/11155111/rpc?apiKey=${process.env.GELATO_API_KEY}`;
```

**After** (centralized):
```typescript
// src/utils/common.ts
export function getGelatoUrls(sponsored = false) {
  const { chainId } = NETWORK_CONFIG;
  const { gelato } = API_CONFIG;
  
  const bundlerUrl = `${gelato.baseUrl}${gelato.bundlerPath(chainId)}?apiKey=${gelato.apiKey}${sponsored ? "&sponsored=true" : ""}`;
  return { bundlerUrl };
}

// In scripts
const { bundlerUrl } = getGelatoUrls(true); // for sponsored
```

## Benefits of This Architecture

### 1. **Maintainability**
- Easy to update network configuration
- Single place to modify common logic
- Consistent behavior across scripts

### 2. **Scalability**
- Easy to add new networks
- Simple to extend with new UserOperation types
- Modular design supports growth

### 3. **Reliability**
- Centralized error handling
- Type safety prevents runtime errors
- Consistent validation

### 4. **Developer Experience**
- Clear separation of concerns
- Easy to understand structure
- Good IDE support with TypeScript

### 5. **Testing**
- Utilities can be tested independently
- Scripts are focused and testable
- Mock-friendly architecture

## Script Dependencies

```
UserOperation Scripts
├── src/config/index.ts (configuration)
├── src/utils/common.ts (utilities)
└── src/types/index.ts (types)

Deployment Scripts
├── src/config/index.ts (configuration)
└── src/utils/common.ts (utilities)

Utility Scripts
├── src/config/index.ts (configuration)
└── src/utils/common.ts (utilities)
```

## Future Extensibility

This architecture supports easy extension:

1. **New Networks**: Update `NETWORK_CONFIG`
2. **New UserOperations**: Create new script using shared utilities
3. **New Contract Types**: Add to `CONTRACT_ADDRESSES` and `ABIS`
4. **New Utilities**: Add to `src/utils/common.ts`

## Conclusion

The factorization choices demonstrate:
- **Professional code organization**
- **Maintainable architecture**
- **Scalable design**
- **Type safety**
- **Developer-friendly structure**

This architecture is suitable for production use and demonstrates strong software engineering practices. 