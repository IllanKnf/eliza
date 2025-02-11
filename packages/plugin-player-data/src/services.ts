import { environment } from './environment';
import type { PlayerStats } from './types';

export async function fetchPlayerData(walletAddress: string): Promise<any> {
    const url = new URL(`${environment.PLAYER_DATA_BASE_URL}/ai-agent/${walletAddress}`);
    
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            "x-ai-agent-key": environment.PLAYER_DATA_API_KEY,
            "accept": "*/*"
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response.json();
}

export function extractPlayerStats(apiResponse: any): PlayerStats {
    const universeData = apiResponse.user.universes[0];
    const stats = universeData.stats;
    
    return {
        gamesPlayed: stats.gamesPlayed,
        gamesFinished: stats.gamesFinished,
        gamesDied: stats.gamesDied,
        scoreAth: stats.scoreAth,
        timePlayed: stats.timePlayed,
        credits: universeData.credits,
        skins: universeData.skins,
        fastestGame: stats.fastestGame,
        longestGame: stats.longestGame
    };
} 