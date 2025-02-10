import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import { environment } from "./environment";
import type { 
    TokenBalancesResponse, 
    AssetTransfersResponse, 
    TokenMetadata,
    EnrichedTokenBalancesResponse,
    TokenInfo,
    PriceConversionResponse
} from "./types";

// Liste des tokens connus sur CoinMarketCap
const KNOWN_TOKENS = new Set([
    'ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'LINK', 'UNI', 'AAVE', 'CRV', 'SNX',
    'COMP', 'MKR', 'YFI', 'SUSHI', 'BAT', '1INCH', 'ENJ', 'MATIC', 'LRC', 'BAL'
]);

export async function getTokenBalances(walletAddress: string): Promise<EnrichedTokenBalancesResponse> {
    const alchemy = new Alchemy({
        apiKey: environment.ALCHEMY_API_KEY,
        network: Network[environment.ALCHEMY_NETWORK as keyof typeof Network] || Network.ETH_MAINNET
    });

    try {
        // Récupérer la balance ETH native
        const ethBalance = await alchemy.core.getBalance(walletAddress);
        const ethBalanceInWei = ethBalance.toString();
        
        // Récupérer les balances des tokens ERC20
        const balancesResponse = await alchemy.core.getTokenBalances(walletAddress);
        
        const tokenPromises = [
            // Ajouter ETH comme premier token
            {
                contractAddress: "0x0000000000000000000000000000000000000000", // Adresse nulle pour ETH
                balance: ethBalanceInWei,
                metadata: {
                    decimals: 18,
                    logo: "https://static.alchemyapi.io/images/assets/1.png",
                    name: "Ethereum",
                    symbol: "ETH"
                }
            } as TokenInfo,
            // Mapper les autres tokens ERC20
            ...balancesResponse.tokenBalances
                .filter(token => token.tokenBalance !== "0")
                .map(async (token): Promise<TokenInfo> => {
                    try {
                        const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
                        const balance = Number(token.tokenBalance) / Math.pow(10, metadata.decimals);
                        
                        // Fetch price conversion only for known tokens with non-zero balance
                        let converted_balance;
                        if (metadata.symbol && 
                            KNOWN_TOKENS.has(metadata.symbol.toUpperCase()) && 
                            balance >= 1e-8) {
                            try {
                                const priceConversion = await getTokenPriceConversion(balance, metadata.symbol);
                                if (priceConversion) {
                                    converted_balance = priceConversion;
                                    console.log(`Successfully fetched price for ${metadata.symbol}: EUR=${priceConversion.eur}, USD=${priceConversion.usd}`);
                                }
                            } catch (error) {
                                console.error(`Error fetching price for ${metadata.symbol}:`, error.message);
                            }
                        } else if (metadata.symbol) {
                            if (balance < 1e-8) {
                                console.log(`Skipping price conversion for ${metadata.symbol}: balance too small (${balance})`);
                            } else {
                                console.log(`Skipping price conversion for unknown token: ${metadata.symbol}`);
                            }
                        }

                        return {
                            contractAddress: token.contractAddress,
                            balance: token.tokenBalance,
                            metadata: {
                                decimals: metadata.decimals,
                                logo: metadata.logo || null,
                                name: metadata.name || "Unknown Token",
                                symbol: metadata.symbol || "???"
                            },
                            converted_balance
                        };
                    } catch (error) {
                        console.error(`Error fetching metadata for token ${token.contractAddress}:`, error);
                        return {
                            contractAddress: token.contractAddress,
                            balance: token.tokenBalance,
                            metadata: {
                                decimals: 18,
                                logo: null,
                                name: "Unknown Token",
                                symbol: "???"
                            }
                        };
                    }
                })
        ];

        const tokens = await Promise.all(tokenPromises);

        // Ajouter la conversion de prix pour ETH si la balance est suffisante
        const ethBalanceInEth = Number(ethBalanceInWei) / Math.pow(10, 18);
        if (ethBalanceInEth >= 1e-8) {
            try {
                const ethPriceConversion = await getTokenPriceConversion(ethBalanceInEth, "ETH");
                if (ethPriceConversion) {
                    tokens[0].converted_balance = ethPriceConversion;
                }
            } catch (error) {
                console.error("Error fetching ETH price:", error);
            }
        }

        return {
            address: walletAddress,
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
    // Filtrer les tokens avec une balance non nulle
    const nonZeroTokens = data.tokens.filter(token => {
        const balance = Number(token.balance) / Math.pow(10, token.metadata.decimals);
        return balance > 0;
    });

    if (nonZeroTokens.length === 0) {
        return {
            text: `No tokens with non-zero balance found for wallet ${walletAddress}.`,
            data: {
                walletAddress,
                ...data
            }
        };
    }

    // Calculate total wallet value
    let totalEur = 0;
    let totalUsd = 0;
    
    nonZeroTokens.forEach(token => {
        if (token.converted_balance) {
            totalEur += token.converted_balance.eur;
            totalUsd += token.converted_balance.usd;
        }
    });

    return {
        text: `Here are your token balances for wallet ${walletAddress}:\n` +
              nonZeroTokens.map(token => {
                  const balance = Number(token.balance) / Math.pow(10, token.metadata.decimals);
                  const formattedBalance = balance.toFixed(balance < 0.0001 ? 8 : 4);
                  
                  let conversionText = '';
                  if (token.converted_balance) {
                      conversionText = `\n  Value: €${token.converted_balance.eur.toFixed(2)} / $${token.converted_balance.usd.toFixed(2)} USD`;
                  }
                  
                  return `- ${token.metadata.name} (${token.metadata.symbol})\n` +
                         `  Balance: ${formattedBalance}\n` +
                         `  Contract: ${token.contractAddress}${conversionText}`;
              }).join('\n') +
              `\n\nTotal Wallet Value: €${totalEur.toFixed(2)} / $${totalUsd.toFixed(2)} USD`,
        data: {
            walletAddress,
            ...data,
            totalValue: {
                eur: totalEur,
                usd: totalUsd
            }
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

export async function getTokenPriceConversion(
    amount: number,
    symbol: string
): Promise<{ eur: number; usd: number } | null> {
    try {
        console.log(`Attempting price conversion for ${amount} ${symbol}...`);
        
        // Normaliser le symbole
        const normalizedSymbol = symbol.toUpperCase();
        
        // Faire deux appels séparés pour EUR et USD
        const [eurResponse, usdResponse] = await Promise.all([
            fetch(
                `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=${amount}&symbol=${normalizedSymbol}&convert=EUR`,
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': environment.COINMARKETCAP_API_KEY,
                        'Accept': 'application/json'
                    }
                }
            ),
            fetch(
                `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?amount=${amount}&symbol=${normalizedSymbol}&convert=USD`,
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': environment.COINMARKETCAP_API_KEY,
                        'Accept': 'application/json'
                    }
                }
            )
        ]);

        if (!eurResponse.ok || !usdResponse.ok) {
            const errorText = !eurResponse.ok ? await eurResponse.text() : await usdResponse.text();
            console.error(`CoinMarketCap API error for ${normalizedSymbol}:`, errorText);
            return null;
        }

        const [eurData, usdData] = await Promise.all([
            eurResponse.json(),
            usdResponse.json()
        ]);
        
        // Log des données reçues pour le débogage
        console.log('EUR Data:', JSON.stringify(eurData));
        console.log('USD Data:', JSON.stringify(usdData));
        
        // Vérification des données avec la nouvelle structure
        if (!eurData.data?.[0]?.quote?.EUR?.price || !usdData.data?.[0]?.quote?.USD?.price) {
            console.error(`Incomplete price data for ${normalizedSymbol}:`, {
                eurData: eurData.data?.[0]?.quote?.EUR,
                usdData: usdData.data?.[0]?.quote?.USD
            });
            return null;
        }

        const result = {
            eur: eurData.data[0].quote.EUR.price,
            usd: usdData.data[0].quote.USD.price
        };
        
        console.log(`Successfully converted ${amount} ${normalizedSymbol}: €${result.eur.toFixed(2)} / $${result.usd.toFixed(2)} USD`);
        return result;
        
    } catch (error) {
        console.error(`Unexpected error converting ${symbol}:`, error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
}