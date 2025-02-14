import { z } from 'zod';
import { AlertService } from '../services/alert-service';

export const deleteAlertSchema = z.object({
  id: z.string(),
});

export const deleteAlert = async (
  alertService: AlertService,
  params: z.infer<typeof deleteAlertSchema>
) => {
  await alertService.deleteAlert(params.id);
  return {
    success: true,
    message: 'Alert deleted successfully.',
  };
}; 