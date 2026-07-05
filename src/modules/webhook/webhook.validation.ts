import z from "zod";

export const VALID_WEBHOOK_EVENTS = [
  "task.created",
  "task.assigned",
  "task.status_changed",
  "task.deleted",
  "project.created",
  "project.archived",
  "member.joined",
  "member.removed",
  "member.role_changed",
] as const;

export const createWebhookEndpointSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URlL")
    .startsWith("https://", "Webhook URL must user HTTPS"),
  events: z
    .array(z.enum(VALID_WEBHOOK_EVENTS))
    .min(1, "Must subscribe at least one event"),
  description: z.string().max(255).optional(),
});

export const listDeliveriesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type CreateWebhookEndpointInput = z.infer<
  typeof createWebhookEndpointSchema
>;
