import type { Plugin, Action, ActionExample, IAgentRuntime, Memory, State, DatabaseAdapter, UUID } from '@elizaos/core';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { AlertService } from './services/alert-service';
import { AlertChecker } from './services/alert-checker';
import { z } from 'zod';
import { CreateAlertParams, AlertType, AlertCondition } from './types';

// Export types
export * from './types';

// Input schemas
const createAlertSchema = z.object({
  symbols: z.array(z.string()),
  type: z.enum(['PRICE_THRESHOLD', 'PRICE_CHANGE_PERCENT', 'MULTI_CRYPTO_CHANGE']),
  condition: z.enum(['ABOVE', 'BELOW']),
  value: z.number()
});

type CreateAlertContent = z.infer<typeof createAlertSchema>;

// Validate environment
const validateSetup = async () => {
  console.log("=== Validating Crypto Alerts Plugin ===");
  const cryptoDbPath = path.join(process.cwd(), '..', 'eliza-utils', 'data', 'crypto.db');
  console.log('Using database path:', cryptoDbPath);
  
  // Verify database exists
  try {
    const exists = await fs.access(cryptoDbPath).then(() => true).catch(() => false);
    if (!exists) {
      throw new Error(`Crypto database not found at: ${cryptoDbPath}`);
    }
    return cryptoDbPath;
  } catch (error) {
    console.error('Error validating crypto database:', error);
    throw error;
  }
};

// Create actions with service initialization
const createActions = (runtime: IAgentRuntime): Action[] => {
  let alertService: AlertService;
  let alertChecker: AlertChecker;

  const initializeServices = async () => {
    if (!alertService || !alertChecker) {
      const cryptoDbPath = await validateSetup();
      alertService = new AlertService(runtime.databaseAdapter as DatabaseAdapter, cryptoDbPath);
      alertChecker = new AlertChecker(runtime.databaseAdapter as DatabaseAdapter, cryptoDbPath);
      
      // Start the alert checker
      await alertChecker.start(60000);
      console.log('Alert checker started successfully');

      // Register cleanup
      process.on('SIGINT', () => {
        console.log('Shutting down crypto alerts plugin...');
        alertChecker.stop();
        alertService.close();
      });
    }
  };

  const createAlertAction: Action = {
    name: 'CREATE_ALERT',
    description: 'Create a new crypto price alert',
    examples: [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Alert me when BTC goes above 50000",
            symbols: ["BTC"],
            type: "PRICE_THRESHOLD" as AlertType,
            condition: "ABOVE" as AlertCondition,
            value: 50000
          }
        }
      ]
    ],
    similes: ['SET_ALERT', 'NEW_ALERT', 'ADD_ALERT'],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      try {
        createAlertSchema.parse(message.content);
        return true;
      } catch {
        return false;
      }
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
      try {
        await initializeServices();
        const content = createAlertSchema.parse(message.content) as CreateAlertContent;
        const params: CreateAlertParams = {
          userId: message.userId as string,
          symbols: content.symbols,
          type: content.type,
          condition: content.condition,
          value: content.value
        };
        const alert = await alertService.createAlert(params);
        return {
          success: true,
          response: {
            text: `Alert created successfully for ${alert.symbols.join(', ')}`,
            content: alert
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          response: {
            text: 'Failed to create alert'
          }
        };
      }
    }
  };

  const listAlertsAction: Action = {
    name: 'LIST_ALERTS',
    description: 'List all active crypto price alerts',
    examples: [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Show my alerts"
          }
        }
      ]
    ],
    similes: ['GET_ALERTS', 'SHOW_ALERTS', 'VIEW_ALERTS'],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
      try {
        await initializeServices();
        const alerts = await alertService.getAlerts(message.userId as string);
        return {
          success: true,
          response: {
            text: alerts.length > 0 
              ? `Found ${alerts.length} active alerts`
              : 'No active alerts found',
            content: alerts
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          response: {
            text: 'Failed to list alerts'
          }
        };
      }
    }
  };

  const deleteAlertAction: Action = {
    name: 'DELETE_ALERT',
    description: 'Delete a specific crypto price alert',
    examples: [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Delete alert abc-123",
            id: "abc-123"
          }
        }
      ]
    ],
    similes: ['REMOVE_ALERT', 'CANCEL_ALERT', 'STOP_ALERT'],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      return !!message.content?.id;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
      try {
        await initializeServices();
        await alertService.deleteAlert(message.content.id as string);
        return {
          success: true,
          response: {
            text: 'Alert deleted successfully'
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          response: {
            text: 'Failed to delete alert'
          }
        };
      }
    }
  };

  const getNotificationsAction: Action = {
    name: 'GET_NOTIFICATIONS',
    description: 'Get recent crypto price alert notifications',
    examples: [
      [
        {
          user: "{{user1}}",
          content: {
            text: "Show my notifications",
            limit: 10
          }
        }
      ]
    ],
    similes: ['CHECK_NOTIFICATIONS', 'VIEW_NOTIFICATIONS', 'ALERT_HISTORY'],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      return true;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
      try {
        await initializeServices();
        const notifications = await alertChecker.getNotifications(
          message.userId as string,
          message.content?.limit as number | undefined
        );
        return {
          success: true,
          response: {
            text: notifications.length > 0
              ? `Recent notifications:\n${notifications.join('\n')}`
              : 'No recent notifications.',
            content: notifications
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          response: {
            text: 'Failed to get notifications'
          }
        };
      }
    }
  };

  return [
    createAlertAction,
    listAlertsAction,
    deleteAlertAction,
    getNotificationsAction
  ];
};

// Create the plugin
export const cryptoAlertsPlugin: Plugin = {
  name: '@elizaos/plugin-crypto-alerts',
  description: 'Crypto price alerts plugin for ElizaOS',
  actions: [],
  evaluators: [],
  providers: []
};

// Initialize actions when the plugin is loaded
let pluginActions: Action[] = [];

// Function to initialize actions with runtime
export const initializePlugin = (runtime: IAgentRuntime) => {
  pluginActions = createActions(runtime);
  cryptoAlertsPlugin.actions = pluginActions;
};

// Default export
export default cryptoAlertsPlugin; 