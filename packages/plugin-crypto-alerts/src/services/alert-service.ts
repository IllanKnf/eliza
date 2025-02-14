import { DatabaseAdapter, UUID, Memory, Content, stringToUuid } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import { CryptoAlert, CreateAlertParams, UpdateAlertParams, AlertCheckResult, CryptoPrice } from '../types';
import { CryptoPriceService } from './crypto-price-service';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000' as UUID;

export class AlertService {
  private db: DatabaseAdapter;
  private priceService: CryptoPriceService;
  private readonly MEMORY_TABLE = 'crypto_alerts';
  private readonly AGENT_ID: UUID;
  private readonly GLOBAL_ROOM_ID: UUID;

  constructor(db: DatabaseAdapter, cryptoDbPath: string) {
    this.db = db;
    this.priceService = new CryptoPriceService(cryptoDbPath);
    this.AGENT_ID = ZERO_UUID;
    this.GLOBAL_ROOM_ID = ZERO_UUID;
  }

  async createAlert(params: CreateAlertParams): Promise<CryptoAlert> {
    const alert: CryptoAlert = {
      id: uuidv4() as UUID,
      userId: stringToUuid(params.userId),
      symbols: params.symbols.map(s => s.toUpperCase()),
      type: params.type,
      condition: params.condition,
      value: params.value,
      createdAt: new Date(),
      lastTriggered: null,
      isActive: true,
      lastKnownPrices: {},
    };

    // Get current prices to initialize lastKnownPrices
    const currentPrices = await this.priceService.getCurrentPrices(alert.symbols);
    alert.lastKnownPrices = Object.fromEntries(
      currentPrices.map(p => [p.symbol, p.price_usd])
    );

    // Store the alert as a memory in Eliza's database
    const memory: Memory = {
      id: alert.id,
      agentId: this.AGENT_ID,
      userId: alert.userId,
      roomId: this.GLOBAL_ROOM_ID,
      content: {
        text: `Crypto price alert for ${alert.symbols.join(', ')}`,
        type: 'CRYPTO_ALERT',
        alert: alert
      } as Content,
      embedding: [],
      createdAt: Date.now(),
    };

    await this.db.createMemory(memory, this.MEMORY_TABLE);
    return alert;
  }

  async getAlerts(userId: string): Promise<CryptoAlert[]> {
    const memories = await this.db.getMemories({
      agentId: this.AGENT_ID,
      roomId: this.GLOBAL_ROOM_ID,
      tableName: this.MEMORY_TABLE,
    });

    const userUuid = stringToUuid(userId);
    return memories
      .filter(memory => memory.userId === userUuid && memory.content.type === 'CRYPTO_ALERT')
      .map(memory => memory.content.alert as CryptoAlert);
  }

  async updateAlert(params: UpdateAlertParams): Promise<void> {
    const memory = await this.db.getMemoryById(stringToUuid(params.id));
    if (!memory) return;

    const alert = memory.content.alert as CryptoAlert;
    
    if (params.value !== undefined) {
      alert.value = params.value;
    }
    if (params.isActive !== undefined) {
      alert.isActive = params.isActive;
    }

    const updatedMemory: Memory = {
      ...memory,
      content: {
        ...memory.content,
        alert
      },
      createdAt: Date.now(),
    };

    await this.db.createMemory(updatedMemory, this.MEMORY_TABLE, true);
  }

  async deleteAlert(id: string): Promise<void> {
    await this.db.removeMemory(stringToUuid(id), this.MEMORY_TABLE);
  }

  async checkAlerts(userId: string): Promise<AlertCheckResult[]> {
    const alerts = await this.getAlerts(userId);
    const results: AlertCheckResult[] = [];

    for (const alert of alerts.filter(a => a.isActive)) {
      const currentPrices = await this.priceService.getCurrentPrices(alert.symbols);
      const priceMap = Object.fromEntries(
        currentPrices.map(p => [p.symbol, p.price_usd])
      );

      let triggered = false;
      let message = '';

      switch (alert.type) {
        case 'PRICE_THRESHOLD': {
          const symbol = alert.symbols[0];
          const price = priceMap[symbol];
          triggered = alert.condition === 'ABOVE' 
            ? price > alert.value
            : price < alert.value;
          if (triggered) {
            message = `${symbol} price is now ${price} USD (${alert.condition.toLowerCase()} ${alert.value})`;
          }
          break;
        }
        case 'PRICE_CHANGE_PERCENT': {
          const symbol = alert.symbols[0];
          const oldPrice = alert.lastKnownPrices?.[symbol] ?? 0;
          const newPrice = priceMap[symbol];
          const change = ((newPrice - oldPrice) / oldPrice) * 100;
          triggered = alert.condition === 'ABOVE'
            ? change > alert.value
            : change < -alert.value;
          if (triggered) {
            message = `${symbol} price changed by ${change.toFixed(2)}% (${alert.condition.toLowerCase()} ${alert.value}%)`;
          }
          break;
        }
        case 'MULTI_CRYPTO_CHANGE': {
          const changes = alert.symbols.map(symbol => {
            const oldPrice = alert.lastKnownPrices?.[symbol] ?? 0;
            const newPrice = priceMap[symbol];
            return {
              symbol,
              change: ((newPrice - oldPrice) / oldPrice) * 100
            };
          });

          const triggeredSymbols = changes.filter(({ change }) => 
            alert.condition === 'ABOVE'
              ? change > alert.value
              : change < -alert.value
          );

          triggered = triggeredSymbols.length > 0;
          if (triggered) {
            message = `Price changes: ${triggeredSymbols
              .map(({ symbol, change }) => `${symbol}: ${change.toFixed(2)}%`)
              .join(', ')}`;
          }
          break;
        }
      }

      if (triggered) {
        await this.updateLastTriggered(alert.id, priceMap);
        results.push({ alert, triggered, message, prices: priceMap });
      }
    }

    return results;
  }

  private async updateLastTriggered(id: UUID, newPrices: Record<string, number>): Promise<void> {
    const memory = await this.db.getMemoryById(id);
    if (!memory) return;

    const alert = memory.content.alert as CryptoAlert;
    alert.lastTriggered = new Date();
    alert.lastKnownPrices = newPrices;

    const updatedMemory: Memory = {
      ...memory,
      content: {
        ...memory.content,
        alert
      },
      createdAt: Date.now(),
    };

    await this.db.createMemory(updatedMemory, this.MEMORY_TABLE, true);
  }

  close() {
    this.priceService.close();
  }
} 