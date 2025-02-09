import { Action, ActionExample, IAgentRuntime, Memory, State } from "@elizaos/core";
import { z } from "zod";
import { getAssetTransfers, formatAssetTransfersResponse } from "../services";
import type { AlchemyRequest } from "../types";
import type { HandlerCallback } from "@elizaos/core";

const inputSchema = z.object({
  walletAddress: z.string()
});

export const getAssetTransfersAction: Action = {
  name: "GET_ASSET_TRANSFERS",
  description: "Get asset transfers for a specific wallet address",
  similes: [
    "Check transaction history",
    "View transfer activity",
    "Get wallet transactions",
    "Check asset movements"
  ],
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show my recent transfers",
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
    console.log("=== GET_ASSET_TRANSFERS Handler ===");
    try {
      const walletAddress = message.content?.walletAddress;
      
      if (!walletAddress) {
        return {
          success: false,
          error: "No wallet address provided",
          response: {
            text: "I need your wallet address to check your transaction history."
          }
        };
      }

      const data = await getAssetTransfers(walletAddress);
      const formattedResponse = formatAssetTransfersResponse(data, walletAddress);

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
          text: "Sorry, I couldn't retrieve your asset transfers at the moment."
        }
      };
    }
  },
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    console.log("=== GET_ASSET_TRANSFERS Validation ===");
    console.log("Message received:", JSON.stringify(message, null, 2));
    
    const walletAddress = message.content?.walletAddress;
    const isValid = !!walletAddress;
    
    console.log("WalletAddress found:", walletAddress);
    console.log("Is Valid:", isValid);
    
    return isValid;
  }
}; 
