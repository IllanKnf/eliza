import type { Plugin } from "@elizaos/core";
import { getTokenBalancesAction } from "./actions/get-token-balances";
import { getAssetTransfersAction } from "./actions/get-asset-transfers";
import { environment } from "./environment";

// Validate environment variables immediately
const validateEnvironment = () => {
    console.log("=== Validating Alchemy Plugin Environment ===");
    const requiredEnvVars = {
        ALCHEMY_API_KEY: environment.ALCHEMY_API_KEY,
        ALCHEMY_NETWORK: environment.ALCHEMY_NETWORK
    };
    console.log("Environment variables:", {
        API_KEY: environment.ALCHEMY_API_KEY ? "Set" : "Not Set",
        NETWORK: environment.ALCHEMY_NETWORK
    });

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`${key} environment variable is required`);
        }
    });
};

// Immediate validation
validateEnvironment();

// Create the plugin
const alchemyPlugin: Plugin = {
    name: "@elizaos/plugin-alchemy",
    description: "Alchemy plugin for blockchain data access",
    actions: [
        getTokenBalancesAction,
        getAssetTransfersAction
    ],
    evaluators: [],
    providers: []
};

// Default export
export default alchemyPlugin;

// Additional exports
export { alchemyPlugin };

// Export types and utilities
export * from './types';
export * from './environment';
export * from './actions/get-token-balances';
export * from './actions/get-asset-transfers'; 