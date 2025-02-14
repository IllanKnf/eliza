import Database from 'better-sqlite3';
import { CryptoPrice } from '../types';

interface DBCryptoPrice {
  symbol: string;
  price_usd: number;
  percent_change_24h: number;
}

export class CryptoPriceService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  async getCurrentPrices(symbols: string[]): Promise<CryptoPrice[]> {
    const upperSymbols = symbols.map(s => s.toUpperCase());
    const placeholders = upperSymbols.map(() => '?').join(',');
    
    const rows = this.db.prepare(`
      SELECT symbol, price_usd, percent_change_24h
      FROM crypto_prices
      WHERE symbol IN (${placeholders})
      ORDER BY timestamp DESC
      LIMIT ${symbols.length}
    `).all(upperSymbols) as DBCryptoPrice[];

    return rows.map(row => ({
      symbol: row.symbol,
      price_usd: row.price_usd,
      percent_change_24h: row.percent_change_24h
    }));
  }

  async getPriceHistory(symbol: string, timeframe: number): Promise<CryptoPrice[]> {
    const rows = this.db.prepare(`
      SELECT symbol, price_usd, percent_change_24h
      FROM crypto_prices
      WHERE symbol = ? AND timestamp >= datetime('now', '-' || ? || ' hours')
      ORDER BY timestamp DESC
    `).all(symbol.toUpperCase(), timeframe) as DBCryptoPrice[];

    return rows.map(row => ({
      symbol: row.symbol,
      price_usd: row.price_usd,
      percent_change_24h: row.percent_change_24h
    }));
  }

  close() {
    this.db.close();
  }
} 