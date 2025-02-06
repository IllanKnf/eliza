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

When making requests to a character that uses this plugin, you must include a `walletAddress` in the request content. This is required for the plugin to fetch the correct player's data.

### Example Request

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

If no wallet address is provided in the request, the plugin will return an error message asking for the wallet address.

## Integration with Characters

To use this plugin in your character configuration:

```json
{
    "name": "GameMaster",
    "plugins": ["@elizaos/plugin-player-data"],
    "system": "You are a Game Master, analyzing player data and providing coaching."
}
``` 