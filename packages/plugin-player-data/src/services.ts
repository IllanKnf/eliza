import { environment } from './environment';
import type { GetPlayerDataResponse, PlayerStats } from './types';

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

export function formatPlayerDataResponse(apiResponse: any, walletAddress: string): GetPlayerDataResponse {
    const universeData = apiResponse.user.universes[0];
    const stats = universeData.stats;
    
    const playerStats: PlayerStats = {
        gamesPlayed: stats.gamesPlayed,
        gamesFinished: stats.gamesFinished,
        scoreAth: stats.scoreAth,
        timePlayed: stats.timePlayed,
        credits: universeData.credits,
        skins: universeData.skins
    };

    return {
        text: `Here's your game data for wallet ${walletAddress}:\n` +
              `- Games Played: ${playerStats.gamesPlayed}\n` +
              `- Games Finished: ${playerStats.gamesFinished}\n` +
              `- Highest Score: ${playerStats.scoreAth}\n` +
              `- Total Time Played: ${playerStats.timePlayed} seconds\n` +
              `- Credits: ${playerStats.credits}\n` +
              `- Skins Owned: ${playerStats.skins.length}`,
        data: {
            apiResponse,
            walletAddress,
            stats: playerStats
        }
    };
} 