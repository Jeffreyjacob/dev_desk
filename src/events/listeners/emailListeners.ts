import { getEmailQueue } from "../../job/queues/email";
import { memberInviteEmail } from "../../shared/utils/emailTemplate/memberInviteEmail";
import { eventBus } from "../eventBus";
import { logger } from "../../config/logger";
import { prisma } from "../../config/database";
import { taskAsgginedEmail } from "../../shared/utils/emailTemplate/taskAssignedEmail";
import { env } from "../../config/env";

export function emailListeners(): void {
  eventBus.on("member.invited", async ({ invite, workspace, invitedBy }) => {
    try {
      const emailQueue = getEmailQueue();
      await emailQueue.add("invite-email", {
        email: invite.email,
        subject: `Invite to ${workspace.name}`,
        html: memberInviteEmail({
          workspaceName: workspace.name,
          invitedByName: invitedBy.name,
          role: invite.role,
          acceptUrl: `${env.FRONTEND_URL}/invites/${invite.token}/accept`,
          expiresAt: new Date(invite.expiresAt),
        }),
      });
    } catch (err) {
      logger.warn({ err, inviteId: invite.id }, "Failed to queue invite email");
    }
  });

  eventBus.on("task.assigned", async ({ task, newAssigneeId, assignedBy }) => {
    try {
      const emailQueue = getEmailQueue();

      const assigner = await prisma.user.findUnique({
        where: { id: assignedBy },
      });

      const assignee = await prisma.user.findUnique({
        where: { id: newAssigneeId },
      });

      if (!assignee) return;

      const taskUrl = `${env.FRONTEND_URL}/workspace/${task.workspaceId}/task/${task.id}`;

      await emailQueue.add("email", {
        email: assignee.email,
        subject: "You have been assigned a new Task",
        html: taskAsgginedEmail({
          taskTitle: task.title,
          assignedBy: assigner?.name!,
          assignedName: assignee.name,
          taskUrl,
          year: new Date().getFullYear(),
        }),
      });
    } catch (err: any) {
      logger.warn({ err, taskId: task.id }, "Failed to queue task assigned ");
    }
  });
}
