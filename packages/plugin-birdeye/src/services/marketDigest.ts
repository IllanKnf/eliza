import { elizaLogger, Service, IAgentRuntime, Content, ServiceType, settings, stringToUuid } from "@elizaos/core";
import { BirdeyeProvider } from "../birdeye";

export interface MarketData {
    timestamp: number;
    tokens: Array<{
        symbol: string;
        currentPrice: number;
        priceChange: number;
    }>;
}

export class MarketDigestService implements Service {
    private intervalId: NodeJS.Timeout | null = null;
    private runtime: IAgentRuntime;
    private api: BirdeyeProvider;
    private lastPrices: Map<string, number> = new Map();
    private lastDigest: string | null = null;
    private lastMarketData: MarketData | null = null;
    private static instance: MarketDigestService | null = null;
    private PRICE_CHANGE_THRESHOLD = 5; // 5% change threshold

    private constructor() {}

    public static getInstance(): MarketDigestService {
        if (!this.instance) {
            this.instance = new MarketDigestService();
        }
        return this.instance;
    }

    static get serviceType(): ServiceType {
        return ServiceType.MARKET_DIGEST;
    }

    get serviceType(): ServiceType {
        return MarketDigestService.serviceType;
    }

    static async initialize(runtime: IAgentRuntime): Promise<void> {
        const instance = MarketDigestService.getInstance();
        await instance.initialize(runtime);
    }

    async initialize(runtime: IAgentRuntime): Promise<void> {
        this.runtime = runtime;
        
        // Initialize API with key from settings
        const apiKey = runtime.getSetting("BIRDEYE_API_KEY");
        if (!apiKey) {
            elizaLogger.error("BIRDEYE_API_KEY not found in settings");
            return;
        }
        settings.BIRDEYE_API_KEY = apiKey;
        
        this.api = new BirdeyeProvider(runtime.cacheManager);
        
        // Start periodic task
        const interval = parseInt(runtime.getSetting("MARKET_DIGEST_INTERVAL") || "240", 10);
        this.startPeriodicTask(interval);
        
        elizaLogger.info("MarketDigestService initialized");
    }

    // Nouvelle méthode pour forcer une mise à jour
    public async forceUpdate(): Promise<void> {
        elizaLogger.info("Forcing market digest update...");
        await this.generateDigest();
    }

    private async startPeriodicTask(intervalMinutes: number): Promise<void> {
        const intervalMs = intervalMinutes * 60 * 1000;
        
        // Initial run
        await this.generateDigest();
        
        // Schedule periodic runs
        this.intervalId = setInterval(() => {
            this.generateDigest().catch(error => {
                elizaLogger.error("Error in market digest:", error);
            });
        }, intervalMs);
        
        elizaLogger.info(`Market digest scheduled every ${intervalMinutes} minutes`);
    }

    private async checkPriceChanges(symbol: string, currentPrice: number): Promise<boolean> {
        const lastPrice = this.lastPrices.get(symbol);
        if (!lastPrice) {
            this.lastPrices.set(symbol, currentPrice);
            return false;
        }

        const priceChange = ((currentPrice - lastPrice) / lastPrice) * 100;
        this.lastPrices.set(symbol, currentPrice);

        if (Math.abs(priceChange) >= this.PRICE_CHANGE_THRESHOLD) {
            await this.sendAlert(symbol, currentPrice, lastPrice, priceChange);
            return true;
        }

        return false;
    }

    private async sendAlert(symbol: string, currentPrice: number, lastPrice: number, priceChange: number): Promise<void> {
        const alertText = `🚨 Major Price Change Alert!\n\n${symbol}: ${priceChange > 0 ? '📈' : '📉'}\nPrice changed by ${priceChange.toFixed(2)}%\nFrom: $${lastPrice.toFixed(4)}\nTo: $${currentPrice.toFixed(4)}`;

        const content: Content = {
            text: alertText,
            source: "direct"
        };

        await this.runtime.messageManager.createMemory({
            id: stringToUuid(Date.now().toString()),
            agentId: this.runtime.agentId,
            userId: this.runtime.agentId,
            roomId: stringToUuid("market-alerts"),
            content,
            createdAt: Date.now()
        });

        elizaLogger.info(`Price alert sent for ${symbol}`);
    }

    // Nouvelle méthode pour récupérer le dernier digest
    public getLastDigest(): string | null {
        return this.lastDigest;
    }

    // Nouvelle méthode pour récupérer les données structurées
    public getMarketData(): MarketData | null {
        return this.lastMarketData;
    }

    private async generateDigest(): Promise<void> {
        try {
            const tokenList = await this.api.fetchTokenList({
                limit: 10,
                sort_by: "mc",
                sort_type: "desc"
            });

            if (!tokenList?.data?.tokens) {
                elizaLogger.error("Invalid token list response");
                return;
            }

            const topTokens = tokenList.data.tokens
                .filter(token => token.address && token.symbol)
                .slice(0, 5);

            let digestText = "🔔 Market Digest Update\n\n";
            let hasSignificantChanges = false;
            const marketData: MarketData = {
                timestamp: Date.now(),
                tokens: []
            };

            for (const token of topTokens) {
                try {
                    const price = await this.api.fetchDefiPrice({ address: token.address });
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting

                    const history = await this.api.fetchDefiPriceHistorical({
                        address: token.address,
                        address_type: "token",
                        type: "1H",
                        time_from: Math.floor(Date.now() / 1000) - 3600,
                        time_to: Math.floor(Date.now() / 1000)
                    });
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting

                    const currentPrice = price?.data?.value;
                    const historicalPrice = history?.data?.items[0]?.value;

                    if (currentPrice) {
                        const priceChange = historicalPrice ? 
                            ((currentPrice - historicalPrice) / historicalPrice) * 100 : 0;
                        
                        // Vérifier les changements majeurs
                        if (await this.checkPriceChanges(token.symbol, currentPrice)) {
                            hasSignificantChanges = true;
                        }

                        digestText += `${token.symbol}: $${currentPrice.toFixed(4)} (${priceChange.toFixed(2)}%)\n`;
                        
                        // Ajouter les données au format structuré
                        marketData.tokens.push({
                            symbol: token.symbol,
                            currentPrice: currentPrice,
                            priceChange: priceChange
                        });
                    } else {
                        digestText += `${token.symbol}: Price data unavailable\n`;
                    }
                } catch (error) {
                    elizaLogger.error(`Error processing ${token.symbol}:`, error);
                    digestText += `${token.symbol}: Error fetching data\n`;
                }
            }

            // Store the latest data
            this.lastDigest = digestText;
            this.lastMarketData = marketData;

            // Send to direct client
            const content: Content = {
                text: digestText,
                source: "direct"
            };

            await this.runtime.messageManager.createMemory({
                id: stringToUuid(Date.now().toString()),
                agentId: this.runtime.agentId,
                userId: this.runtime.agentId,
                roomId: stringToUuid("market-digest"),
                content,
                createdAt: Date.now()
            });

            elizaLogger.info("Market digest sent successfully");
        } catch (error) {
            elizaLogger.error("Error generating market digest:", error);
        }
    }

    async stop(): Promise<void> {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
} 