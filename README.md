# Safe Smart Account + Counter Demo (ERC-4337)

This project demonstrates how to deploy a minimal smart contract (`Counter.sol`) and interact with it using a Safe (Gnosis Safe) 1/1 smart account on Sepolia testnet.

## Tech Stack

* Ethers v5
* Safe Protocol Kit
* Foundry
* TypeScript + Viem

## Features

* Deploy a 1/1 Safe smart account on Sepolia
* Deploy a simple `Counter.sol` contract (increment logic)
* Store deployed addresses locally
* Ready for interaction via ERC-4337 UserOperations

## Project Structure

```
contracts/              # Smart contract source (Counter.sol)
scripts/                # TypeScript scripts for deployment
foundry/                # Foundry setup (optional)
deployed-safe.txt       # Deployed Safe address
deployed-counter.txt    # Deployed Counter address
```

## Setup

1. Create a `.env` file with the following content:

   ```
   PRIVATE_KEY=your_private_key
   RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ```

2. Deploy the Safe:

   ```
   npx ts-node scripts/createSafe.ts
   ```

3. Deploy the Counter contract:

   ```
   npx ts-node scripts/deployCounter.ts
   ```

## Install dependencies

```
npm install
```

## Status

* Safe deployed to Sepolia
* Counter contract deployed and ready
* Next steps: sending ERC-4337 UserOperations
