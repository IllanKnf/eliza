# @elizaos/plugin-player-data

A plugin for ElizaOS that provides access to player game data and statistics for an endless runner game with NFT integration.

## Installation

```bash
npm install @elizaos/plugin-player-data
```

## Configuration

The plugin requires the following environment variables:

```env
PLAYER_DATA_API_KEY=your_api_key_here
PLAYER_DATA_BASE_URL=https://api.pourriv.com
```

## Features

- Real-time player statistics retrieval
- Detailed game performance metrics
- NFT skin information and multipliers
- Universe-specific data
- Comprehensive game analytics

## Available Statistics

The plugin provides access to the following player statistics:

- Games played and completed
- All-time high score
- Total time played
- Current credits balance
- Owned skins and their multipliers
- Fastest and longest game sessions
- Number of deaths/games lost
- Skins earned and minted
- Universe-specific information

## Usage

### Character Configuration

To use this plugin in your character configuration:

```json
{
    "name": "GameMaster",
    "plugins": ["@elizaos/plugin-player-data"],
    "system": "You are a Game Master, analyzing player data and providing coaching."
}
```

### API Requests

When making requests, include a `walletAddress` in the request content:

```bash
curl -X POST http://localhost:3000/GameMaster/message \
-H "Content-Type: application/json" \
-d '{
    "text": "What's my best score?",
    "userId": "user123",
    "userName": "Player1",
    "walletAddress": "0xc454038fdbef3254fb32a62565b46de4fff10aa4"
}'
```

### Response Format

The plugin returns detailed player statistics:

```json
{
    "text": "Your all-time highest score is [specific_score]",
    "data": {
        "stats": {
            "gamesPlayed": number,
            "gamesFinished": number,
            "gamesDied": number,
            "scoreAth": number,
            "timePlayed": number,
            "credits": number,
            "skins": number[],
            "fastestGame": number,
            "longestGame": number,
            "skinsEarned": number,
            "skinsMinted": number
        },
        "gameInfo": {
            "availableSkins": [
                {
                    "id": number,
                    "name": string,
                    "multiplier": number
                }
            ],
            "universeName": string,
            "universeSymbol": string
        }
    }
}
```

## Response Guidelines

The plugin follows these guidelines for generating responses:

1. Always uses exact values from the data
2. Provides relevant context while staying factual
3. Includes specific statistics when asked about scores or performance
4. Maintains concise and direct responses
5. Incorporates skin multiplier information when relevant
6. Never modifies or makes up numbers

## Error Handling

The plugin handles various scenarios:

- Missing wallet address
- Invalid wallet format
- API connectivity issues
- Rate limiting
- Data validation errors

Each error returns a clear message explaining the issue and how to resolve it.

## Development

To contribute or modify this plugin:

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables
4. Run the plugin:
   ```bash
   pnpm start
   ```

## Debugging

The plugin includes comprehensive logging for debugging:
- API request/response data
- Player statistics extraction
- Response generation process
- Error tracking

## Support

For issues or questions:
1. Check existing issues in the repository
2. Create a new issue with:
   - Detailed description
   - Example requests
   - Error messages
   - Wallet address (if relevant)
   - Expected vs actual behavior