import { prisma } from "../../config/database";
import { eventBus } from "../eventBus";

export function notificationListeners(): void {
  eventBus.on("member.joined", async ({ member, workspace }) => {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        workspaceId: member.workspaceId,
        type: "MEMBER_JOINED",
        title: `Welcome to ${workspace.name}`,
        body: ` You have successfully joined ${workspace.name}`,
        resourceType: "Workspace",
        resourceId: member.workspaceId,
      },
    });
  });

  eventBus.on("task.assigned", async ({ task, newAssigneeId }) => {
    await prisma.notification.create({
      data: {
        userId: newAssigneeId,
        workspaceId: task.workspaceId,
        type: "TASK ASSIGNED",
        title: "A new task has been assigned to you",
        body: `You have assigned a new task, task title ${task.title}, check task for more details`,
        resourceType: "Task",
        resourceId: task.workspaceId,
      },
    });
  });
}
