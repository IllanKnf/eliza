import { z } from 'zod';
import { AlertService } from '../services/alert-service';
import { AlertTypeEnum, AlertConditionEnum, CryptoSymbolSchema } from '../types';

export const createAlertSchema = z.object({
  userId: z.string(),
  symbols: CryptoSymbolSchema,
  type: AlertTypeEnum,
  condition: AlertConditionEnum,
  value: z.number(),
});

export const createAlert = async (
  alertService: AlertService,
  params: z.infer<typeof createAlertSchema>
) => {
  const alert = await alertService.createAlert({
    userId: params.userId,
    symbols: params.symbols,
    type: params.type,
    condition: params.condition,
    value: params.value,
  });
  
  let message = '';
  switch (alert.type) {
    case 'PRICE_THRESHOLD':
      message = `Alert created for ${alert.symbols[0]}. You will be notified when the price goes ${alert.condition.toLowerCase()} ${alert.value} USD.`;
      break;
    case 'PRICE_CHANGE_PERCENT':
      message = `Alert created for ${alert.symbols[0]}. You will be notified when the price changes by ${alert.value}%.`;
      break;
    case 'MULTI_CRYPTO_CHANGE':
      message = `Alert created for ${alert.symbols.join(', ')}. You will be notified when any of these cryptos changes by ${alert.value}%.`;
      break;
  }

  return {
    success: true,
    alert,
    message,
  };
}; 