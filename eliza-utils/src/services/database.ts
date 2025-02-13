import { CryptoInfo } from '../types/coinmarketcap';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

interface PriceHistoryEntry {
  price_usd: number;
  percent_change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
  created_at: string;
}

export class DatabaseService {
  private db: Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath?: string) {
    // Si aucun chemin n'est fourni, on utilise le dossier data à la racine du projet
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'crypto.db');
  }

  async init(): Promise<void> {
    // Création du dossier data s'il n'existe pas
    const dbDir = path.dirname(this.dbPath);
    await import('fs').then(fs => fs.promises.mkdir(dbDir, { recursive: true }));

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Activation des clés étrangères et optimisations
    await this.db.exec('PRAGMA foreign_keys = ON');
    await this.db.exec('PRAGMA journal_mode = WAL');
    await this.db.exec('PRAGMA synchronous = NORMAL');

    await this.createTables();
  }

  private async createTables(): Promise<void> {
    await this.db?.exec(`
      CREATE TABLE IF NOT EXISTS cryptocurrencies (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crypto_id INTEGER NOT NULL,
        price_usd REAL NOT NULL,
        percent_change_24h REAL NOT NULL,
        volume_24h REAL NOT NULL,
        market_cap REAL NOT NULL,
        last_updated TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (crypto_id) REFERENCES cryptocurrencies(id)
      );

      CREATE INDEX IF NOT EXISTS idx_price_history_crypto_id ON price_history(crypto_id);
      CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at);
    `);
  }

  async savePrices(prices: CryptoInfo[]): Promise<void> {
    await this.db?.exec('BEGIN TRANSACTION');

    try {
      for (const price of prices) {
        await this.db?.run(
          `INSERT OR IGNORE INTO cryptocurrencies (id, name, symbol) 
           VALUES (?, ?, ?)`,
          [price.id, price.name, price.symbol]
        );

        await this.db?.run(
          `INSERT INTO price_history (
            crypto_id, price_usd, percent_change_24h, 
            volume_24h, market_cap, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            price.id,
            price.price_usd,
            price.percent_change_24h,
            price.volume_24h,
            price.market_cap,
            price.last_updated
          ]
        );
      }

      await this.db?.exec('COMMIT');
    } catch (error) {
      await this.db?.exec('ROLLBACK');
      throw error;
    }
  }

  // Méthodes utiles pour récupérer les données
  async getLatestPrices(): Promise<CryptoInfo[]> {
    if (!this.db) return [];
    
    const query = `
      WITH LatestPrices AS (
        SELECT 
          crypto_id,
          price_usd,
          percent_change_24h,
          volume_24h,
          market_cap,
          last_updated,
          ROW_NUMBER() OVER (PARTITION BY crypto_id ORDER BY created_at DESC) as rn
        FROM price_history
      )
      SELECT 
        c.id,
        c.name,
        c.symbol,
        lp.price_usd,
        lp.percent_change_24h,
        lp.volume_24h,
        lp.market_cap,
        lp.last_updated
      FROM cryptocurrencies c
      JOIN LatestPrices lp ON c.id = lp.crypto_id
      WHERE lp.rn = 1
    `;

    const results = await this.db.all<CryptoInfo>(query);
    return Array.isArray(results) ? results : [];
  }

  async getPriceHistory(cryptoId: number, days: number): Promise<PriceHistoryEntry[]> {
    if (!this.db) return [];
    
    const query = `
      SELECT 
        price_usd,
        percent_change_24h,
        volume_24h,
        market_cap,
        last_updated,
        created_at
      FROM price_history
      WHERE crypto_id = ?
        AND created_at >= datetime('now', '-' || ? || ' days')
      ORDER BY created_at ASC
    `;

    const results = await this.db.all<PriceHistoryEntry>(query, [cryptoId, days]);
    return Array.isArray(results) ? results : [];
  }
} 