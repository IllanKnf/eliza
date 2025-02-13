import { Action, ActionExample, IAgentRuntime, Memory, State } from "@elizaos/core";
import { z } from "zod";
import { getTokenBalances, formatTokenBalancesResponse } from "../services";
import type { AlchemyRequest } from "../types";
import type { HandlerCallback } from "@elizaos/core";

const inputSchema = z.object({
    walletAddress: z.string(),
    tokenAddresses: z.array(z.string()).optional()
});

export const getTokenBalancesAction: Action = {
    name: "GET_TOKEN_BALANCES",
    description: "Get token balances for a specific wallet address",
    similes: [
        "Check token holdings",
        "View wallet balances",
        "Get token amounts",
        "Check wallet assets"
    ],
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check my token balances",
                    walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
                }
            } as ActionExample
        ]
    ],
    handler: async (
        runtime: IAgentRuntime,
        message: AlchemyRequest,
        state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        console.log("=== GET_TOKEN_BALANCES Handler ===");
        try {
            const walletAddress = message.content?.walletAddress;
            
            if (!walletAddress) {
                return {
                    success: false,
                    error: "No wallet address provided",
                    response: {
                        text: "I need your wallet address to check your token balances."
                    }
                };
            }

            const data = await getTokenBalances(walletAddress);
            const formattedResponse = formatTokenBalancesResponse(data, walletAddress);

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
                    text: "Sorry, I couldn't retrieve your token balances at the moment."
                }
            };
        }
    },
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        console.log("=== GET_TOKEN_BALANCES Validation ===");
        console.log("Message received:", JSON.stringify(message, null, 2));
        
        const walletAddress = message.content?.walletAddress;
        const isValid = !!walletAddress;
        
        console.log("WalletAddress found:", walletAddress);
        console.log("Is Valid:", isValid);
        
        return isValid;
    }
}; 