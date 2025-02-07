import {
    type Action,
    type ActionExample,
    elizaLogger,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import { BirdeyeProvider } from "../birdeye";
import { formatValue } from "../utils";
import type { GainersLosersResponse } from "../types/api/trader";

export const topTradersAction = {
    name: "TOP_TRADERS",
    similes: [
        "SHOW_TOP_WALLETS",
        "GET_TOP_PERFORMING_WALLETS",
        "BEST_PERFORMING_WALLETS",
        "TOP_TRADERS",
        "BEST_TRADERS"
    ],
    description: "Get the top performing traders/wallets based on profit",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        try {
            elizaLogger.info("[TOP_TRADERS] Starting handler execution");
            elizaLogger.info(`[TOP_TRADERS] Received message: ${JSON.stringify(message)}`);
            
            const provider = new BirdeyeProvider(runtime.cacheManager);
            elizaLogger.info("[TOP_TRADERS] BirdeyeProvider initialized");
            
            elizaLogger.info("[TOP_TRADERS] Fetching top traders from Birdeye API");
            const results = await provider.fetchTraderGainersLosers({
                type: "today",
                sort_by: "PnL",
                sort_type: "desc",
                limit: 5
            });

            elizaLogger.info(`[TOP_TRADERS] API Response: ${JSON.stringify(results)}`);

            if (!results.success || !results.data?.items) {
                elizaLogger.error("[TOP_TRADERS] API request failed or returned invalid data");
                throw new Error("Failed to fetch trader data from Birdeye");
            }

            elizaLogger.info(`[TOP_TRADERS] Successfully retrieved ${results.data.items.length} traders`);

            const formattedResponse = `Based on the most recent data, here are the current top 5 performing Solana wallets by total portfolio value in SOL:\n\n${
                results.data.items.map((trader, index) => 
                    `${index + 1}. Wallet ${trader.address} - Total value: ${formatValue(trader.volume || 0)} SOL`
                ).join('\n')
            }\n\nThese wallets are showing the strongest growth and inflows across their token holdings in the last 24 hours. Let me know if you need any other insights into these top performers or analysis of specific addresses.`;

            callback?.({ 
                text: formattedResponse,
                content: {
                    traders: results.data.items
                }
            });
            return true;
        } catch (error) {
            elizaLogger.error("Error in TOP_TRADERS handler:", error);
            callback?.({ text: `Error fetching trader data: ${error.message}` });
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        elizaLogger.info(`[TOP_TRADERS] Validating message: "${text}"`);
        
        const hasTop = text.includes("top");
        const hasWallet = text.includes("wallet");
        const hasPerforming = text.includes("performing");
        const hasTraders = text.includes("traders");
        const hasBest = text.includes("best");
        
        elizaLogger.info(`[TOP_TRADERS] Validation checks: top=${hasTop}, wallet=${hasWallet}, performing=${hasPerforming}, traders=${hasTraders}, best=${hasBest}`);
        
        const isValid = hasTop && (hasWallet || hasPerforming || hasTraders || hasBest);
        elizaLogger.info(`[TOP_TRADERS] Validation result: ${isValid}`);
        
        return isValid;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me the top performing wallets",
                    action: "TOP_TRADERS"
                }
            }
        ]
    ] as ActionExample[][]
} as Action;