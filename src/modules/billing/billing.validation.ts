import z from "zod";

export const getFailedWebhookSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export type IGetFailedWebhookInput = z.infer<typeof getFailedWebhookSchema>;
