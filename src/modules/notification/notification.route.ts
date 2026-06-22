import { Router } from "express";
import { authenticate } from "../../middlewares/authentication";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { notificationController } from "../../container";

const router = Router();

router.get(
  "/",
  authenticate,
  AsyncHandler(
    notificationController.getNotificationList.bind(notificationController)
  )
);

router.get(
  "/:id",
  authenticate,
  AsyncHandler(
    notificationController.getNotificationDetail.bind(notificationController)
  )
);

router.post(
  "/:id",
  authenticate,
  AsyncHandler(
    notificationController.markAsReadNotification.bind(notificationController)
  )
);

export default router;
