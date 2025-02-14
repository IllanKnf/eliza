import { z } from 'zod';
import { UUID } from '@elizaos/core';

export const AlertTypeEnum = z.enum([
  'PRICE_THRESHOLD',    // For a single crypto reaching a threshold
  'PRICE_CHANGE_PERCENT', // For a single crypto changing by a %
  'MULTI_CRYPTO_CHANGE'  // For multiple cryptos changing by a %
]);
export type AlertType = z.infer<typeof AlertTypeEnum>;

export const AlertConditionEnum = z.enum(['ABOVE', 'BELOW']);
export type AlertCondition = z.infer<typeof AlertConditionEnum>;

// Schema to validate crypto symbols list
export const CryptoSymbolSchema = z.array(z.string()).min(1);
export type CryptoSymbols = z.infer<typeof CryptoSymbolSchema>;

export const CryptoAlertSchema = z.object({
  id: z.custom<UUID>(),
  userId: z.custom<UUID>(),
  symbols: CryptoSymbolSchema,
  type: AlertTypeEnum,
  condition: AlertConditionEnum,
  value: z.number(),
  createdAt: z.date(),
  lastTriggered: z.date().nullable(),
  isActive: z.boolean(),
  // For multi-crypto alerts, store last known prices
  lastKnownPrices: z.record(z.string(), z.number()).optional(),
});

export type CryptoAlert = z.infer<typeof CryptoAlertSchema>;

export interface CreateAlertParams {
  userId: string;
  symbols: string[];
  type: AlertType;
  condition: AlertCondition;
  value: number;
}

export interface UpdateAlertParams {
  id: string;
  value?: number;
  isActive?: boolean;
}

export interface CryptoPrice {
  symbol: string;
  price_usd: number;
  percent_change_24h: number;
}

export interface AlertCheckResult {
  alert: CryptoAlert;
  triggered: boolean;
  message?: string;
  prices?: Record<string, number>;
} 