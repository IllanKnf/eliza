import { Plugin } from "@elizaos/core";
import { tokenSearchSymbolAction } from "./actions/token-search-symbol";
import { tokenSearchAddressAction } from "./actions/token-search-address";
import { walletSearchAddressAction } from "./actions/wallet-search-address";
import { testAllEndpointsAction } from "./actions/test-all-endpoints";
import { agentPortfolioProvider } from "./providers/agent-portfolio-provider";
import { topTradersAction } from "./actions/top-traders";
import { marketDigestAction } from "./actions/market-digest";
import { MarketDigestService } from "./services/marketDigest";

const marketDigestService = MarketDigestService.getInstance();

export const birdeyePlugin: Plugin = {
    name: "birdeye",
    description: "Birdeye Plugin for token data and analytics",
    services: [marketDigestService],
    actions: [
        tokenSearchSymbolAction,
        tokenSearchAddressAction,
        walletSearchAddressAction,
        testAllEndpointsAction,
        topTradersAction,
        marketDigestAction
    ],
    providers: [agentPortfolioProvider]
};

export default birdeyePlugin;
