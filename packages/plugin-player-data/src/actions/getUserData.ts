import type { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { examples } from "../examples";
import { fetchPlayerData, extractPlayerStats } from "../services";
import type { GetPlayerDataRequest } from "../types";
import type { HandlerCallback } from "@elizaos/core";
import { composeContext, elizaLogger, ModelClass, generateText } from "@elizaos/core";
import { getUserDataTemplate } from "./getUserData/template";

export const getUserData: Action = {
    name: "GET_PLAYER_DATA",
    description: "Fetches player data and statistics from the API",
    examples,
    similes: ["checkstats", "getstats", "playerstats", "gamestats", "progress"],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        elizaLogger.log("=== GET_PLAYER_DATA Validation ===");
        elizaLogger.log("Message received:", JSON.stringify(message, null, 2));
        
        const walletAddress = message.content?.walletAddress;
        const isValid = !!walletAddress;
        
        elizaLogger.log("WalletAddress found:", walletAddress);
        elizaLogger.log("Is Valid:", isValid);
        
        return isValid;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("=== GET_PLAYER_DATA Handler Started ===");
        elizaLogger.log("Incoming message:", JSON.stringify(message, null, 2));
        
        try {
            const walletAddress = message.content?.walletAddress as string;
            
            if (!walletAddress) {
                elizaLogger.error("No wallet address provided in message content");
                return {
                    success: false,
                    error: "No wallet address provided",
                    response: {
                        text: "I need your wallet address to check your game stats."
                    }
                };
            }

            elizaLogger.log("Fetching player data from API for address:", walletAddress);
            const data = await fetchPlayerData(walletAddress);
            elizaLogger.log("API Response:", JSON.stringify(data, null, 2));

            elizaLogger.log("Extracting player stats from API response");
            const stats = extractPlayerStats(data);
            elizaLogger.log("Extracted stats:", JSON.stringify(stats, null, 2));

            // Get available skins info
            const availableSkins = data.universes[0]?.skins || [];
            const skinInfo = availableSkins.map(skin => ({
                id: skin.skinId,
                name: skin.skinName,
                multiplier: skin.multiplier
            }));

            // Get universe data for additional stats
            const universeData = data.user.universes[0];

            // Construct the context with the actual data
            const contextData = {
                userQuestion: message.content.text,
                stats: {
                    gamesPlayed: stats.gamesPlayed,
                    gamesFinished: stats.gamesFinished,
                    gamesDied: stats.gamesDied,
                    scoreAth: stats.scoreAth,
                    timePlayed: stats.timePlayed,
                    credits: stats.credits,
                    skins: stats.skins,
                    fastestGame: stats.fastestGame,
                    longestGame: stats.longestGame,
                    // Additional stats
                    skinsEarned: universeData.stats.skinsEarned,
                    skinsMinted: universeData.stats.skinsMinted
                },
                gameInfo: {
                    availableSkins: skinInfo,
                    universeName: data.universes[0]?.name || "Unknown",
                    universeSymbol: data.universes[0]?.symbol || "Unknown"
                }
            };

            elizaLogger.log("Generating response with context:", JSON.stringify(contextData, null, 2));
            const responseText = await generateText({
                runtime,
                context: `
Question: "${contextData.userQuestion}"

Available player statistics:
- Games Played: ${contextData.stats.gamesPlayed}
- Games Finished: ${contextData.stats.gamesFinished}
- Games Lost: ${contextData.stats.gamesDied}
- All-Time High Score: ${contextData.stats.scoreAth}
- Total Time Played: ${contextData.stats.timePlayed} seconds
- Credits Balance: ${contextData.stats.credits}
- Skins Earned: ${contextData.stats.skinsEarned}
- Skins Minted: ${contextData.stats.skinsMinted}
- Owned Skins: ${contextData.stats.skins.length > 0 ? contextData.stats.skins.join(', ') : 'None'}
- Fastest Game: ${contextData.stats.fastestGame} seconds
- Longest Game: ${contextData.stats.longestGame} seconds

Game Information:
Universe: ${contextData.gameInfo.universeName} (${contextData.gameInfo.universeSymbol})
Available Skins: ${contextData.gameInfo.availableSkins.map(skin => 
    `${skin.name} (x${skin.multiplier} multiplier)`).join(', ')}

Instructions:
1. Answer the question using ONLY the exact values from the statistics above
2. Be direct and specific in your response
3. Include relevant context when appropriate
4. DO NOT make up or modify any numbers
5. If the question is about a specific stat, always include that exact value in your response
6. When discussing skins, include their multipliers if relevant

Please provide a natural, conversational response that directly answers the question using these exact statistics.`,
                modelClass: ModelClass.SMALL
            });
            elizaLogger.log("Generated response text:", responseText);

            const response = {
                text: responseText,
                content: {
                    apiResponse: data,
                    walletAddress,
                    stats
                }
            };

            if (callback) {
                elizaLogger.log("Executing callback with response");
                callback(response);
            }

            elizaLogger.log("=== GET_PLAYER_DATA Handler Completed Successfully ===");
            return {
                success: true,
                response
            };
        } catch (error) {
            elizaLogger.error("=== GET_PLAYER_DATA Handler Error ===");
            elizaLogger.error("Error details:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            
            if (callback) {
                elizaLogger.log("Executing error callback");
                callback({
                    text: `Error: ${errorMessage}`,
                    content: { error: errorMessage }
                });
            }

            return {
                success: false,
                error: errorMessage,
                response: {
                    text: "Sorry, I couldn't retrieve your game data at the moment."
                }
            };
        }
    }
}; 