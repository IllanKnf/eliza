export interface CryptoInfo {
  id: number;
  name: string;
  symbol: string;
  price_usd: number;
  percent_change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface CoinMarketCapResponse {
  data: {
    [key: string]: [{
      id: number;
      name: string;
      symbol: string;
      quote: {
        USD: {
          price: number;
          volume_24h: number;
          percent_change_24h: number;
          market_cap: number;
          last_updated: string;
        }
      }
    }]
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string;
    elapsed: number;
    credit_count: number;
  }
}