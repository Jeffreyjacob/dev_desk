import { auditListeners } from "./auditListeners";
import { memberListeners } from "./memberListeners";

export function registerAllListeners(): void {
  memberListeners();
  auditListeners();
}
