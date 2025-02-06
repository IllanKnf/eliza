export const environment = {
    PLAYER_DATA_API_KEY: process.env.PLAYER_DATA_API_KEY || '',
    PLAYER_DATA_BASE_URL: process.env.PLAYER_DATA_BASE_URL || 'https://api.pourriv.com'
} as const;

export type Environment = typeof environment;