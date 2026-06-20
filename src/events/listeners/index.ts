import { auditListeners } from "./auditListeners";
import { emailListeners } from "./emailListeners";
import { notificationListeners } from "./notificationListener";
import { webhookListners } from "./webhookListeners";

export function registerAllListeners(): void {
  emailListeners();
  auditListeners();
  notificationListeners();
  webhookListners();
}
