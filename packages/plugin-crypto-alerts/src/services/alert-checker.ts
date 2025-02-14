import { DatabaseAdapter, UUID, stringToUuid, Memory, Content } from '@elizaos/core';
import { AlertService } from './alert-service';
import { AlertCheckResult } from '../types';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000' as UUID;

export class AlertChecker {
  private alertService: AlertService;
  private db: DatabaseAdapter;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly AGENT_ID: UUID = ZERO_UUID;
  private readonly GLOBAL_ROOM_ID: UUID = ZERO_UUID;

  constructor(db: DatabaseAdapter, cryptoDbPath: string) {
    this.db = db;
    this.alertService = new AlertService(db, cryptoDbPath);
  }

  async start(intervalMs: number = 60000): Promise<void> {
    // Stop existing interval if present
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Start periodic checking
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkAllAlerts();
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    }, intervalMs);

    // Run first check immediately
    await this.checkAllAlerts();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAllAlerts(): Promise<void> {
    // Get all users with active alerts
    const memories = await this.db.getMemories({
      agentId: this.AGENT_ID,
      roomId: this.GLOBAL_ROOM_ID,
      tableName: 'crypto_alerts',
    });

    const userIds = [...new Set(memories.map(m => m.userId))];

    // Check alerts for each user
    for (const userId of userIds) {
      const results = await this.alertService.checkAlerts(userId);
      await this.handleAlertResults(userId, results);
    }
  }

  private async handleAlertResults(userId: UUID, results: AlertCheckResult[]): Promise<void> {
    for (const result of results) {
      if (result.triggered && result.message) {
        // Store notification in Eliza's database
        const memory: Memory = {
          id: stringToUuid(crypto.randomUUID()),
          agentId: this.AGENT_ID,
          userId,
          roomId: this.GLOBAL_ROOM_ID,
          content: {
            text: result.message,
            type: 'CRYPTO_ALERT_NOTIFICATION',
            alertId: result.alert.id,
            timestamp: new Date(),
            prices: result.prices,
          } as Content,
          createdAt: Date.now(),
        };

        await this.db.createMemory(memory, 'notifications');
      }
    }
  }

  async getNotifications(userId: string, limit: number = 10): Promise<string[]> {
    const memories = await this.db.getMemories({
      agentId: this.AGENT_ID,
      roomId: this.GLOBAL_ROOM_ID,
      tableName: 'notifications',
    });

    const userUuid = stringToUuid(userId);
    return memories
      .filter(m => m.userId === userUuid && m.content.type === 'CRYPTO_ALERT_NOTIFICATION')
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, limit)
      .map(m => m.content.text);
  }
} 