import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { getEmailQueue } from "../../job/queues/email";
import { memberInviteEmail } from "../../shared/utils/emailTemplate/memberInviteEmail";
import { eventBus } from "../eventBus";

export function memberListeners(): void {
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
}
