import { prisma } from "../../config/database";
import { Prisma } from "../../generated/prisma/client";
import { BaseRepository } from "../../shared/repository/baseRepository";
import { IGetNotificationInput } from "./notification.validation";

export class NotificationRepository extends BaseRepository<
  Prisma.NotificationDelegate,
  Notification
> {
  constructor() {
    super(prisma.notification);
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    return this.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  async getNotificationByList(userId: string, data: IGetNotificationInput) {
    return this.findManyWithOffsetPagination({
      where: {
        userId,
        ...(data.workspaceId && { workspaceId: data.workspaceId }),
        ...(data.isRead !== undefined && { read: data.isRead }),
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      page: data.page,
      pageSize: data.limit,
    });
  }

  async getNotificationDetail(notificationId: string) {
    return this.findUnique({
      where: {
        id: notificationId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
