import { Router } from "express";
import {
  authenticate,
  requireRole,
  requireWorkspace,
} from "../../middlewares/authentication";
import { MemberRole } from "../../generated/prisma/enums";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { billingController } from "../../container";

const router = Router();

router.post(
  "/webhook",
  AsyncHandler(billingController.handleWebhook.bind(billingController))
);

router.post(
  "/checkout",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(billingController.createCheckOut.bind(billingController))
);

router.get(
  "/status",
  authenticate,
  requireWorkspace,
  AsyncHandler(billingController.getStatus.bind(billingController))
);

router.post(
  "/cancel",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(billingController.cancel.bind(billingController))
);

// Admin

router.get(
  "/admin/webhooks/failed",
  requireRole("ADMIN"),
  AsyncHandler(billingController.getFailedWebhooks.bind(billingController))
);

router.post(
  "/admin/webhook/replay",
  authenticate,
  requireRole("ADMIN"),
  AsyncHandler(billingController.replayWebhook.bind(billingController))
);

export default router;
