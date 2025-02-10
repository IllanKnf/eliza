import type { Memory, Content } from '@elizaos/core';

// Token Balance types
export interface TokenBalance {
    contractAddress: string;
    tokenBalance: string;
    error?: string;
}

export interface TokenBalancesResponse {
    address: string;
    tokenBalances: TokenBalance[];
}

// Token Metadata types
export interface TokenMetadata {
    decimals: number;
    logo?: string;
    name: string;
    symbol: string;
}

// Combined token info
export interface TokenInfo {
    contractAddress: string;
    balance: string;
    metadata: {
        decimals: number;
        logo: string | null;
        name: string;
        symbol: string;
    };
    converted_balance?: {
        eur: number;
        usd: number;
    };
}

export interface EnrichedTokenBalancesResponse {
    address: string;
    tokens: TokenInfo[];
}

// Asset Transfer types
export interface AssetTransfer {
    blockNum: string;
    uniqueId: string;
    hash: string;
    from: string;
    to: string;
    value: number;
    erc721TokenId?: string;
    asset: string;
    category: string;
    rawContract: {
        address: string;
        decimal?: string;
    };
}

export interface AssetTransfersResponse {
    transfers: AssetTransfer[];
}

// Request types
export interface AlchemyContent extends Content {
    walletAddress: string;
}

export interface AlchemyRequest extends Memory {
    content: AlchemyContent;
}

// Price Conversion types
export interface PriceConversionResponse {
    data: {
        quote: {
            [key: string]: { price: number };
        };
    };
} 