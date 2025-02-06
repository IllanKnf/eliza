import type { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
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
        const content = message.content as PlayerDataContent;
        return !!content?.walletAddress;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        try {
            const content = message.content as PlayerDataContent;
            const walletAddress = content?.walletAddress;
            
            if (!walletAddress) {
                return {
                    success: false,
                    error: "No wallet address provided",
                    response: {
                        text: "I need your wallet address to check your game stats. Please provide it in your request."
                    }
                };
            }

            const data = await fetchPlayerData(walletAddress);
            const formattedResponse = formatPlayerDataResponse(data, walletAddress);

            return {
                success: true,
                response: formattedResponse
            };
        } catch (error) {
            console.error("Handler Error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
                response: {
                    text: "I apologize, but I couldn't retrieve your game data at the moment. Please try again later."
                }
            };
        }
    }
}; 