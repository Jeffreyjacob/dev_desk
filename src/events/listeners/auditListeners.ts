import { prisma } from "../../config/database";
import { eventBus } from "../eventBus";

export function auditListeners(): void {
  eventBus.on("member.invited", async ({ invite, workspace, invitedBy }) => {
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: invitedBy.id,
        action: "member.invited",
        resourceType: "WorkspaceInvite",
        resourceId: invite.id,
        after: { email: invite.email, role: invite.role },
      },
    });
  });

  eventBus.on("member.joined", async ({ member, workspace }) => {
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: member.userId,
        action: "member.joined",
        resourceType: "WorkspaceMember",
        resourceId: member.userId,
        after: { role: member.role },
      },
    });
  });

  eventBus.on(
    "member.removed",
    async ({ userId, workspaceId, removedBy, role }) => {
      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorId: removedBy,
          action: "member.removed",
          resourceType: "WorkspaceMember",
          resourceId: userId,
          before: { role },
        },
      });
    }
  );
}
