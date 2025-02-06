import type { Plugin } from "@elizaos/core";
import { getUserData } from "./actions/getUserData";
import { environment } from "./environment";

// Validation des variables d'environnement
const validateEnvironment = () => {
    const requiredEnvVars = {
        PLAYER_DATA_API_KEY: environment.PLAYER_DATA_API_KEY,
        PLAYER_DATA_BASE_URL: environment.PLAYER_DATA_BASE_URL
    };

    Object.entries(requiredEnvVars).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`${key} environment variable is required`);
        }
    });
};

// Validation immédiate
validateEnvironment();

// Création du plugin
const playerDataPlugin: Plugin = {
    name: "player-data",
    description: "Fetches and provides player data for personalized interactions",
    actions: [getUserData],
    evaluators: [],
    providers: []
};

// Export par défaut (IMPORTANT)
export default playerDataPlugin;

// Exports additionnels
export { playerDataPlugin };

// Export des types et utilitaires
export * from './types';
export * from './environment';
export * from './actions/getUserData';
