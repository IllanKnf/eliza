import type { Action, IAgentRuntime, Memory, State, Content } from "@elizaos/core";
import { examples } from "../examples";
import { fetchPlayerData, formatPlayerDataResponse } from "../services";
import type { GetPlayerDataRequest, PlayerDataContent } from "../types";
import type { HandlerCallback } from "@elizaos/core";

export const getUserData: Action = {
    name: "GET_PLAYER_DATA",
    description: "Fetches player data and statistics from the API",
    examples,
    similes: ["checkstats", "getstats", "playerstats", "gamestats", "progress"],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        console.log("=== GET_PLAYER_DATA Validation ===");
        console.log("Message received:", JSON.stringify(message, null, 2));
        
        const walletAddress = message.content?.walletAddress;
        const isValid = !!walletAddress;
        
        console.log("WalletAddress found:", walletAddress);
        console.log("Is Valid:", isValid);
        
        return isValid;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        console.log("=== GET_PLAYER_DATA Handler ===");
        try {
            const walletAddress = message.content?.walletAddress as string;
            
            if (!walletAddress) {
                return {
                    success: false,
                    error: "No wallet address provided",
                    response: {
                        text: "I need your wallet address to check your game stats."
                    }
                };
            }

            const data = await fetchPlayerData(walletAddress);
            const formattedResponse = formatPlayerDataResponse(data, walletAddress);

            if (callback) {
                callback({
                    text: formattedResponse.text,
                    content: formattedResponse.data
                });
            }

            return {
                success: true,
                response: {
                    text: formattedResponse.text,
                    content: formattedResponse.data
                }
            };
        } catch (error) {
            console.error("Handler Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            
            if (callback) {
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