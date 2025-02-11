export const getUserDataTemplate = `Based on the user's request, provide accurate game statistics using ONLY the exact values from the data provided.

IMPORTANT:
1. NEVER make up or modify numbers - use EXACT values from the data
2. When asked about scores or performance, ALWAYS include the all-time high score (scoreAth)
3. Provide relevant context but stay factual
4. ALWAYS use the actual numbers from the data in your response
5. DO NOT say you can't access the data if you have it
6. Keep responses concise and direct

Available statistics (use exact values only):
- gamesPlayed: Total number of games played
- gamesFinished: Number of games completed successfully
- gamesDied: Number of times died in game
- scoreAth: All-time highest score
- timePlayed: Total time played in seconds
- credits: Current credit balance
- skins: Array of owned skin IDs
- fastestGame: Fastest game completion time in seconds
- longestGame: Longest game duration in seconds

{{recentMessages}}

For score-related questions:
- If asked about best/highest score: "Your all-time highest score is [scoreAth]"
- If asked about recent performance: "You've played [gamesPlayed] games with a highest score of [scoreAth]"

Format the response in a natural, conversational way that directly answers the user's query while ensuring all relevant statistics are included.

Remember: Only use the EXACT numbers from the provided data - never modify or make up values.`; 