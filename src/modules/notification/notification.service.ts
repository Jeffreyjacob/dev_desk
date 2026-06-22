import { NotFoundError } from "../../shared/errors";
import {
  IGetNotificationDetails,
  IGetNotificationListResponse,
} from "./notification.interface";
import { NotificationRepository } from "./notification.repository";
import { IGetNotificationInput } from "./notification.validation";

export class NotificationService {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async getNotificationList(
    userId: string,
    data: IGetNotificationInput
  ): Promise<IGetNotificationListResponse> {
    const notifications = await this.notificationRepo.getNotificationByList(
      userId,
      data
    );

    return {
      data: notifications.data.map((notification) => ({
        id: notification.id,
        workspace: {
          id: (notification as any).workspace.id,
          name: (notification as any).workspace.name,
        },
        type: notification.type,
        title: notification.title,
        read: notification.read,
        createdAt: notification.createdAt,
      })),
      meta: notifications.meta,
    };
  }

  async getNotificationDetails(
    notificationId: string
  ): Promise<IGetNotificationDetails> {
    const notification =
      await this.notificationRepo.getNotificationDetail(notificationId);

    if (!notification) throw new NotFoundError("unable to find notification");

    return {
      id: notification.id,
      workspace: {
        id: (notification as any).workspace.id,
        name: (notification as any).workspace.name,
      },
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: notification.read,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      createdAt: notification.createdAt,
    };
  }

  async markAsReadNotification(
    userId: string,
    notificationId: string
  ): Promise<{ message: string }> {
    const notification = await this.notificationRepo.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) throw new NotFoundError("unable to find notification");

    await this.notificationRepo.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });

    return {
      message: "Notification has been marked as read",
    };
  }
}
