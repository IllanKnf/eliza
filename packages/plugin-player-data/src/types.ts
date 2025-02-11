import type { Memory, Content } from '@elizaos/core';

// Request type for the plugin
export interface PlayerStats {
    gamesPlayed: number;
    gamesFinished: number;
    gamesDied: number;
    scoreAth: number;
    timePlayed: number;
    credits: number;
    skins: number[];
    fastestGame: number;
    longestGame: number;
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
        apiResponse: any;
        walletAddress: string;
        stats: PlayerStats;
    };
}
