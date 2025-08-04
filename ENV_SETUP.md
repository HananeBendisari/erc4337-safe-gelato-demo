# Environment Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Gelato API Configuration
GELATO_API_KEY=your_gelato_api_key

# Wallet Configuration  
PRIVATE_KEY=your_private_key

# Paymaster Configuration (for ERC20 UserOperations)
PAYMASTER_URL=your_paymaster_url

# Chain Configuration (optional - defaults to Sepolia)
CHAIN_ID=11155111

# RPC Configuration (optional - for direct blockchain access)
RPC_URL=https://sepolia.infura.io/v3/your_project_id
```

## Getting Your API Keys

### Gelato API Key
1. Go to [Gelato Dashboard](https://app.gelato.network/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key for your project
5. Copy the API key to your `.env` file

### Private Key
- Use your wallet's private key (keep it secure!)
- For testing, you can generate a new wallet
- **Never commit your private key to version control**

### Paymaster URL (Optional)
- Only needed for ERC20 UserOperations
- Format: `https://api.gelato.digital/paymasters/{chainId}/rpc?apiKey={apiKey}`
- Note: Paymaster service is mainnet-only (not available on Sepolia)

### Chain ID
- `11155111` - Sepolia (default for testing)
- `1` - Ethereum Mainnet
- `84532` - Base Sepolia
- `421614` - Arbitrum Sepolia

### RPC URL (Optional)
- Used for direct blockchain interactions
- Infura, Alchemy, or your own RPC endpoint
- Format: `https://{network}.infura.io/v3/{project_id}`

## Security Notes

**Important Security Considerations:**

1. **Never commit `.env` files** - They contain sensitive information
2. **Use test wallets** - Never use mainnet private keys for testing
3. **Rotate API keys** - Regularly update your Gelato API keys
4. **Monitor usage** - Keep track of your API usage and gas costs
5. **Backup safely** - Store your private keys securely

## Testing Setup

For testing purposes, you can use:

```env
GELATO_API_KEY=your_api_key
PRIVATE_KEY=your_test_private_key
CHAIN_ID=11155111
```

This configuration will work with all the scripts in this project. 