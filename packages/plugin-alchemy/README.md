# @elizaos/plugin-alchemy

A powerful Ethereum blockchain data plugin for ElizaOS that provides comprehensive wallet analysis through the Alchemy API and token price conversions via CoinMarketCap.

## Features

- **Token Balance Tracking**
  - Native ETH balance
  - ERC20 token balances
  - Automatic decimal handling
  - Token metadata (name, symbol, logo)

- **Price Conversions**
  - Real-time price conversion to EUR/USD
  - Support for major tokens
  - Individual token value calculation
  - Total wallet value aggregation

- **Asset Transfer History**
  - Transaction history tracking
  - Support for ETH, ERC20, and ERC721 transfers
  - Detailed transfer information

## Installation

```bash
npm install @elizaos/plugin-alchemy
```

## Configuration

The plugin requires the following environment variables:

```env
# Required Alchemy Configuration
ALCHEMY_API_KEY=your_api_key_here
ALCHEMY_NETWORK=ETH_MAINNET  # or another supported network

# Required for Price Conversions
COINMARKETCAP_API_KEY=your_cmc_api_key_here
```

## Usage

### Basic Integration

```json
{
    "name": "BlockchainOracle",
    "plugins": ["@elizaos/plugin-alchemy"],
    "system": "You are a Blockchain Oracle, analyzing on-chain data using the Alchemy API."
}
```

### Available Actions

#### 1. GET_TOKEN_BALANCES
Fetches comprehensive wallet information including:
- Token balances with proper decimal formatting
- Token metadata (name, symbol, logo)
- Price conversions in EUR/USD
- Total wallet value

Example Response:
```json
{
    "text": "Here are your token balances for wallet 0x123...:\n- Ethereum (ETH)\n  Balance: 0.5\n  Value: €800.00 / $850.00 USD\n\nTotal Wallet Value: €800.00 / $850.00 USD",
    "data": {
        "address": "0x123...",
        "tokens": [
            {
                "contractAddress": "0x0000000000000000000000000000000000000000",
                "balance": "500000000000000000",
                "metadata": {
                    "decimals": 18,
                    "name": "Ethereum",
                    "symbol": "ETH",
                    "logo": "https://..."
                },
                "converted_balance": {
                    "eur": 800.00,
                    "usd": 850.00
                }
            }
        ],
        "totalValue": {
            "eur": 800.00,
            "usd": 850.00
        }
    }
}
```

#### 2. GET_ASSET_TRANSFERS
Retrieves transaction history including:
- Transaction hashes
- From/To addresses
- Transfer values and asset types
- Contract details

Example Response:
```json
{
    "text": "Here are your recent transfers...",
    "data": {
        "transfers": [
            {
                "hash": "0x...",
                "from": "0x...",
                "to": "0x...",
                "value": 1.5,
                "asset": "ETH"
            }
        ]
    }
}
```

### Supported Tokens

The plugin automatically handles price conversions for major tokens including:
- ETH, WETH, USDT, USDC, DAI
- LINK, UNI, AAVE, CRV, SNX
- COMP, MKR, YFI, SUSHI
- And more...

## Use Cases

1. **Portfolio Tracking**
   - Real-time wallet value monitoring
   - Multi-token portfolio analysis
   - Price tracking in multiple currencies

2. **Transaction Analysis**
   - Historical transaction review
   - Transfer pattern analysis
   - Asset movement tracking

3. **DeFi Integration**
   - Token balance verification
   - Smart contract interaction monitoring
   - DeFi position tracking

4. **Wallet Health Checks**
   - Balance monitoring
   - Transaction history review
   - Asset distribution analysis

## Technical Details

### Price Conversion Flow
1. Fetches token balances from Alchemy
2. Filters for known tokens with non-zero balances
3. Converts each balance using CoinMarketCap API
4. Aggregates total wallet value
5. Returns formatted response with individual and total values

### Error Handling
- Graceful handling of API failures
- Detailed error logging
- Fallback for unknown tokens
- Minimum balance thresholds (1e-8)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Support

For issues or questions:
1. Check existing issues
2. Create a new issue with:
   - Wallet address (if public)
   - Expected vs actual results
   - Error messages
   - Environment details

## License

This plugin is part of the ElizaOS ecosystem. See the main repository for license information. 
