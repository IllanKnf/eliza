# @elizaos/plugin-alchemy

A plugin for ElizaOS that provides access to blockchain data through the Alchemy API.

## Installation

```bash
npm install @elizaos/plugin-alchemy
```

## Configuration

The plugin requires the following environment variables:

```env
ALCHEMY_API_KEY=your_api_key_here
ALCHEMY_NETWORK=ETH_MAINNET  # or another supported network
```

## Usage

### Character Configuration

To use this plugin in your character configuration:

```json
{
    "name": "BlockchainOracle",
    "plugins": ["@elizaos/plugin-alchemy"],
    "system": "You are a Blockchain Oracle, analyzing on-chain data using the Alchemy API."
}
```

### API Requests

When making requests to a character that uses this plugin, you must include a `walletAddress` in the request content.

#### Example Request

```bash
curl -X POST http://localhost:3001/BlockchainOracle/message \
-H "Content-Type: application/json" \
-d '{
    "text": "Show me my token balances",
    "userId": "user123",
    "userName": "User1",
    "walletAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}'
```

### Response Format

The plugin returns token information in the following format:

```json
{
    "text": "Here are your token balances...",
    "data": {
        "address": "0x...",
        "tokens": [
            {
                "contractAddress": "0x...",
                "balance": "1000000000000000000",
                "metadata": {
                    "decimals": 18,
                    "name": "USD Coin",
                    "symbol": "USDC",
                    "logo": "https://..."
                }
            }
        ]
    }
}
```

## Actions

### GET_TOKEN_BALANCES

This action fetches token balances and metadata for a wallet address. It:
1. Gets all token balances for the wallet
2. Fetches metadata for each token (name, symbol, decimals)
3. Returns formatted balances with proper decimal handling

### GET_ASSET_TRANSFERS

This action fetches transaction history for a wallet address. It returns:
1. Transaction hashes
2. From/To addresses
3. Values and asset types
4. Additional transaction details

## Error Handling

- If no wallet address is provided, the plugin will return an error message
- If the Alchemy API is unreachable, appropriate error messages will be returned
- For tokens with missing metadata, default values will be used

## Development

To contribute or modify this plugin:

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run tests

## Support

For issues or questions:
1. Check the existing issues
2. Create a new issue with details about your problem
3. Include example requests and any error messages

## License

This plugin is part of the ElizaOS ecosystem. See the main repository for license information. 