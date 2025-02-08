import {
    type Action,
    type ActionExample,
    elizaLogger,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    ServiceType
} from "@elizaos/core";
import { MarketDigestService } from "../services/marketDigest";

export const marketDigestAction = {
    name: "GET_MARKET_DIGEST",
    similes: [
        "SHOW_MARKET_DIGEST",
        "DISPLAY_MARKET_DATA",
        "SHOW_MARKET_DATA",
        "GET_MARKET_DATA",
        "MARKET_UPDATE"
    ],
    description: "Get the latest market digest data",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        try {
            const service = runtime.getService<MarketDigestService>(ServiceType.MARKET_DIGEST);
            if (!service) {
                throw new Error("Market Digest service not found");
            }

            // Force an update to get fresh data
            await service.forceUpdate();
            
            // Get the latest data
            const marketData = service.getMarketData();
            const digest = service.getLastDigest();
            
            if (!digest || !marketData) {
                callback?.({ 
                    text: "No market data available yet. Please try again in a moment.",
                    source: "direct"
                });
                return false;
            }

            callback?.({ 
                text: digest,
                source: "direct",
                marketData: marketData // Ajouter les données structurées à la réponse
            });
            return true;
        } catch (error) {
            elizaLogger.error("Error in GET_MARKET_DIGEST handler:", error);
            callback?.({ 
                text: `Error fetching market data: ${error.message}`,
                source: "direct"
            });
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        return text.includes("market") && 
               (text.includes("digest") || text.includes("data") || text.includes("update"));
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me the market digest",
                    action: "GET_MARKET_DIGEST"
                }
            }
        ]
    ] as ActionExample[][]
} as Action; 