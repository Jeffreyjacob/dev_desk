import z from "zod";

export const getNotificationSchema = z.object({
  workspaceId: z.string().optional(),
  isRead: z.boolean().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).optional(),
});

export type IGetNotificationInput = z.infer<typeof getNotificationSchema>;
