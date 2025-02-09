import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import { environment } from "./environment";
import type { 
    TokenBalancesResponse, 
    AssetTransfersResponse, 
    TokenMetadata,
    EnrichedTokenBalancesResponse,
    TokenInfo
} from "./types";

export async function getTokenBalances(walletAddress: string): Promise<EnrichedTokenBalancesResponse> {
    const alchemy = new Alchemy({
        apiKey: environment.ALCHEMY_API_KEY,
        network: Network[environment.ALCHEMY_NETWORK as keyof typeof Network] || Network.ETH_MAINNET
    });

    try {
        // First, get token balances
        const balancesResponse = await alchemy.core.getTokenBalances(walletAddress);
        
        // Then, get metadata for each token
        const tokenPromises = balancesResponse.tokenBalances
            .filter(token => token.tokenBalance !== "0") // Filter out zero balances
            .map(async (token): Promise<TokenInfo> => {
                try {
                    const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
                    return {
                        contractAddress: token.contractAddress,
                        balance: token.tokenBalance,
                        metadata: {
                            decimals: metadata.decimals,
                            logo: metadata.logo,
                            name: metadata.name,
                            symbol: metadata.symbol
                        }
                    };
                } catch (error) {
                    console.error(`Error fetching metadata for token ${token.contractAddress}:`, error);
                    return {
                        contractAddress: token.contractAddress,
                        balance: token.tokenBalance,
                        metadata: {
                            decimals: 18, // Default to 18 decimals
                            name: "Unknown Token",
                            symbol: "???"
                        }
                    };
                }
            });

        const tokens = await Promise.all(tokenPromises);

        return {
            address: balancesResponse.address,
            tokens
        };
    } catch (error) {
        throw new Error(`Failed to fetch token balances: ${error.message}`);
    }
}

export async function getAssetTransfers(walletAddress: string): Promise<AssetTransfersResponse> {
    const alchemy = new Alchemy({
        apiKey: environment.ALCHEMY_API_KEY,
        network: Network[environment.ALCHEMY_NETWORK as keyof typeof Network] || Network.ETH_MAINNET
    });

    try {
        const response = await alchemy.core.getAssetTransfers({
            fromBlock: "0x0",
            category: [
                AssetTransfersCategory.EXTERNAL,
                AssetTransfersCategory.ERC20,
                AssetTransfersCategory.ERC721
            ],
            fromAddress: walletAddress,
        });
        
        return {
            transfers: response.transfers.map(transfer => ({
                blockNum: transfer.blockNum,
                uniqueId: transfer.uniqueId,
                hash: transfer.hash,
                from: transfer.from,
                to: transfer.to,
                value: transfer.value,
                erc721TokenId: transfer.erc721TokenId,
                asset: transfer.asset,
                category: transfer.category,
                rawContract: {
                    address: transfer.rawContract.address,
                    decimal: transfer.rawContract.decimal,
                }
            }))
        };
    } catch (error) {
        throw new Error(`Failed to fetch asset transfers: ${error.message}`);
    }
}

export function formatTokenBalancesResponse(data: EnrichedTokenBalancesResponse, walletAddress: string) {
    return {
        text: `Here are your token balances for wallet ${walletAddress}:\n` +
              data.tokens.map(token => {
                  const balance = token.metadata.decimals 
                      ? (Number(token.balance) / Math.pow(10, token.metadata.decimals)).toFixed(4)
                      : token.balance;
                  return `- ${token.metadata.name} (${token.metadata.symbol})\n` +
                         `  Balance: ${balance}\n` +
                         `  Contract: ${token.contractAddress}`;
              }).join('\n'),
        data: {
            walletAddress,
            ...data
        }
    };
}

export function formatAssetTransfersResponse(data: AssetTransfersResponse, walletAddress: string) {
    return {
        text: `Here are your recent transfers for wallet ${walletAddress}:\n` +
              data.transfers.map(transfer => 
                `- Hash: ${transfer.hash}\n  From: ${transfer.from}\n  To: ${transfer.to}\n  Value: ${transfer.value} ${transfer.asset}`
              ).join('\n'),
        data: {
            walletAddress,
            ...data
        }
    };
} 