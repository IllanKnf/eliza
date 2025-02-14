import { z } from 'zod';
import { AlertService } from '../services/alert-service';

export const listAlertsSchema = z.object({
  userId: z.string(),
});

export const listAlerts = async (
  alertService: AlertService,
  params: z.infer<typeof listAlertsSchema>
) => {
  const alerts = await alertService.getAlerts(params.userId);
  
  if (alerts.length === 0) {
    return {
      success: true,
      alerts: [],
      message: 'You have no active alerts.',
    };
  }

  const alertDescriptions = alerts.map(alert => {
    switch (alert.type) {
      case 'PRICE_THRESHOLD':
        return `${alert.symbols[0]}: ${alert.condition.toLowerCase()} ${alert.value} USD`;
      case 'PRICE_CHANGE_PERCENT':
        return `${alert.symbols[0]}: ${alert.value}% change`;
      case 'MULTI_CRYPTO_CHANGE':
        return `${alert.symbols.join(', ')}: ${alert.value}% change`;
      default:
        return '';
    }
  });

  return {
    success: true,
    alerts,
    message: `Your active alerts:\n${alertDescriptions.join('\n')}`,
  };
}; 