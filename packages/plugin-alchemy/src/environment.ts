import type { AgentRuntime } from "@elizaos/core";
import { z } from "zod";
import { Network } from "alchemy-sdk";

export const environment = {
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || '',
    ALCHEMY_NETWORK: process.env.ALCHEMY_NETWORK || Network.ETH_MAINNET
} as const;

export const alchemyEnvSchema = z.object({
    API_KEY: z.string().min(1, "Alchemy API key is required"),
    NETWORK: z.nativeEnum(Network).default(Network.ETH_MAINNET),
});

export const requiredEnvVars = [
    "ALCHEMY_API_KEY",
    "ALCHEMY_NETWORK",
] as const;

export type Environment = typeof environment;
export type AlchemyConfig = z.infer<typeof alchemyEnvSchema>;

export async function validateAlchemyConfig(
    runtime: AgentRuntime
): Promise<AlchemyConfig> {
    try {
        const config = {
            API_KEY: runtime.getSetting("API_KEY") || process.env.ALCHEMY_API_KEY,
            NETWORK: runtime.getSetting("NETWORK") || process.env.ALCHEMY_NETWORK || "ETH_MAINNET",
        };

        return alchemyEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Alchemy configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
} 