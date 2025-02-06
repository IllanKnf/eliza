import type { Memory, Content } from '@elizaos/core';

// Request type for the plugin
export interface PlayerStats {
    gamesPlayed: number;
    gamesFinished: number;
    scoreAth: number;
    timePlayed: number;
    credits: number;
    skins: number[];
}

export interface PlayerDataContent extends Content {
    walletAddress: string;
}

export interface GetPlayerDataRequest extends Memory {
    content: PlayerDataContent;
}

// Response type for the plugin
export interface GetPlayerDataResponse {
    text: string;
    data: {
        apiResponse: any; // Raw API response
        walletAddress: string;
        stats: PlayerStats;
    };
}
