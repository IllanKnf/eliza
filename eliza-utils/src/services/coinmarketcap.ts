import axios, { AxiosError } from 'axios';
import { CoinMarketCapResponse, CryptoInfo } from '../types/coinmarketcap';

export class CoinMarketCapService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://pro-api.coinmarketcap.com';
  
  // Les symboles des cryptos à suivre
  private readonly cryptoSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'USDT'];

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  async getPrices(): Promise<CryptoInfo[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json'
        },
        params: {
          symbol: this.cryptoSymbols.join(','),
          convert: 'USD'
        }
      });

      if (response.data.status.error_code === 0) {
        const prices: CryptoInfo[] = [];
        
        for (const symbol of this.cryptoSymbols) {
          const cryptoData = response.data.data[symbol][0];
          prices.push({
            id: cryptoData.id,
            name: cryptoData.name,
            symbol: cryptoData.symbol,
            price_usd: cryptoData.quote.USD.price,
            percent_change_24h: cryptoData.quote.USD.percent_change_24h,
            volume_24h: cryptoData.quote.USD.volume_24h,
            market_cap: cryptoData.quote.USD.market_cap,
            last_updated: cryptoData.quote.USD.last_updated
          });
        }

        console.log(`Prix récupérés pour ${prices.length} cryptos`);
        return prices;
      }
      
      return [];
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Erreur lors de la récupération des prix:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      return [];
    }
  }
} 