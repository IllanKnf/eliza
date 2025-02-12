// packages/plugin-alchemy/src/database.ts

import { IDatabaseAdapter } from "@elizaos/core";

export async function initializeDatabase(db: IDatabaseAdapter) {
  await db.execute(`
    -- Table des snapshots de wallet
    CREATE TABLE IF NOT EXISTS wallet_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      total_value_usd DECIMAL(24,8),
      total_value_eur DECIMAL(24,8),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(wallet_address, block_number)
    );

    -- Table des positions par token
    CREATE TABLE IF NOT EXISTS token_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      token_address TEXT NOT NULL,
      balance TEXT NOT NULL,
      price_usd DECIMAL(24,8),
      price_eur DECIMAL(24,8),
      value_usd DECIMAL(24,8),
      value_eur DECIMAL(24,8),
      FOREIGN KEY(snapshot_id) REFERENCES wallet_snapshots(id),
      UNIQUE(snapshot_id, token_address)
    );

    -- Table des métadonnées de tokens
    CREATE TABLE IF NOT EXISTS token_metadata (
      contract_address TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      decimals INTEGER NOT NULL,
      logo_url TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des alertes de prix
    CREATE TABLE IF NOT EXISTS price_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      token_address TEXT NOT NULL,
      alert_type TEXT NOT NULL, -- 'PRICE_CHANGE', 'VALUE_CHANGE', 'THRESHOLD'
      threshold_percentage DECIMAL(5,2),
      last_checked_price_usd DECIMAL(24,8),
      last_checked_at DATETIME,
      is_active BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Index pour optimiser les requêtes
    CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_address_time 
    ON wallet_snapshots(wallet_address, timestamp);

    CREATE INDEX IF NOT EXISTS idx_token_positions_token 
    ON token_positions(token_address);

    CREATE INDEX IF NOT EXISTS idx_price_alerts_wallet 
    ON price_alerts(wallet_address, token_address);
  `);
}