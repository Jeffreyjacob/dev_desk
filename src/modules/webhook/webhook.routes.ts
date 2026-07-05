import { Router } from "express";
import {
  authenticate,
  requireRole,
  requireWorkspace,
} from "../../middlewares/authentication";
import { MemberRole } from "../../generated/prisma/enums";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { webhookController } from "../../container";

const router = Router();

router.post(
  "/",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(webhookController.createEndpoint.bind(webhookController))
);

router.get(
  "/",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(webhookController.listEndpoints.bind(webhookController))
);

router.delete(
  "/:endpointId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(webhookController.deleteEndpoint.bind(webhookController))
);

router.get(
  "/:endpointId/deliveries",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(webhookController.listDeliveries.bind(webhookController))
);

router.post(
  "/:endpointId/test",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(webhookController.sendTestPing.bind(webhookController))
);

export default router;
