# @elizaos/plugin-player-data

A plugin for ElizaOS that provides access to player game data and statistics.

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

When making requests to a character that uses this plugin, you must include a `walletAddress` in the request content. This is required for the plugin to fetch the correct player's data.

#### Example Request with Wallet Address (for GameMaster)

```bash
curl -X POST http://localhost:3000/GameMaster/message \
-H "Content-Type: application/json" \
-d '{
    "text": "Show me my stats",
    "userId": "user123",
    "userName": "Player1",
    "walletAddress": "0xc454038fdbef3254fb32a62565b46de4fff10aa4"
}'
```

#### Example Request for Other Characters

For characters that don't use this plugin, you can omit the walletAddress:

```bash
curl -X POST http://localhost:3000/OtherCharacter/message \
-H "Content-Type: application/json" \
-d '{
    "text": "Hello",
    "userId": "user123",
    "userName": "Player1"
}'
```

### Response Format

The plugin returns player statistics in the following format:

```json
{
    "text": "Here's your game data for wallet 0xc454...",
    "data": {
        "stats": {
            "gamesPlayed": number,
            "gamesFinished": number,
            "scoreAth": number,
            "timePlayed": number,
            "credits": number,
            "skins": number[]
        }
    }
}
```

## Error Handling

- If no wallet address is provided when required, the plugin will return an error message asking for the wallet address.
- If the wallet address is invalid or the API is unreachable, appropriate error messages will be returned.

## Actions

### GET_PLAYER_DATA

This action is automatically triggered when users request their game statistics. It:
1. Validates the wallet address
2. Fetches real-time player data
3. Returns formatted statistics

The action will only execute if a valid wallet address is provided in the request.

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