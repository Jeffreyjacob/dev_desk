import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { getNotificationSchema } from "./notification.validation";
import { ResponseHelper } from "../../shared/utils/apiResponse";

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  async getNotificationList(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId!;
    const data = getNotificationSchema.parse(req.query);
    const result = await this.service.getNotificationList(userId, data);
    ResponseHelper.success(
      res,
      result.data,
      200,
      "notification fetched",
      result.meta
    );
  }

  async getNotificationDetail(req: Request, res: Response): Promise<void> {
    const notificationId = req.params.id as string;
    const result = await this.service.getNotificationDetails(notificationId);
    ResponseHelper.success(res, result, 200, "notification fetched");
  }

  async markAsReadNotification(req: Request, res: Response): Promise<void> {
    const notificationId = req.params.id as string;
    const userId = req.user?.userId!;
    const result = await this.service.markAsReadNotification(
      userId,
      notificationId
    );
    ResponseHelper.success(res, result, 200, "Notification as read");
  }
}
