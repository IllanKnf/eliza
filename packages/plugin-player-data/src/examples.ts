import type { ActionExample } from "@elizaos/core";

export const examples: ActionExample[][] = [
    [
        {
            user: "user",
            content: { 
                text: "How many games have I won?",
                walletAddress: "0xc454038fdbef3254fb32a62565b46de4fff10aa4"
            }
        },
        {
            user: "GameMaster",
            content: {
                text: "Let me check your game statistics...",
                action: "GET_PLAYER_DATA"
            }
        }
    ],
    [
        {
            user: "user",
            content: { 
                text: "What's my highest score?",
                walletAddress: "0xc454038fdbef3254fb32a62565b46de4fff10aa4"
            }
        },
        {
            user: "GameMaster",
            content: {
                text: "I'll fetch your score history...",
                action: "GET_PLAYER_DATA"
            }
        }
    ]
];

export const TRIGGER_PATTERNS = [
    /how.*(?:doing|going).*game/i,
    /(?:show|tell|give).*(?:game.*stats|stats.*game)/i,
    /(?:my|current).*(?:progress|performance)/i,
    /how.*(?:many|much).*(?:games?|played|credits)/i,
    /game.*(?:stats|statistics|progress|performance)/i
]; 