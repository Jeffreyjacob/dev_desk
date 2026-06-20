import { prisma } from "../../config/database";
import { ProjectStatus } from "../../generated/prisma/enums";
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

  eventBus.on(
    "member.role_changed",
    async ({ userId, workspaceId, previousRole, newRole, changedBy }) => {
      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorId: changedBy,
          action: "member.role_changed",
          resourceType: "WorkspaceMember",
          resourceId: userId,
          before: { role: previousRole },
          after: { role: newRole },
        },
      });
    }
  );

  eventBus.on("project.created", async ({ project, createdBy }) => {
    await prisma.auditLog.create({
      data: {
        workspaceId: project.workspaceId,
        actorId: createdBy,
        action: "project.created",
        resourceType: "Project",
        resourceId: project.id,
        before: {},
        after: { name: project.name },
      },
    });
  });

  eventBus.on("project.archived", async ({ project, archivedBy }) => {
    await prisma.auditLog.create({
      data: {
        workspaceId: project.workspaceId,
        actorId: archivedBy,
        action: "project.archived",
        resourceType: "Project",
        resourceId: project.id,
        before: { status: ProjectStatus.ACTIVE },
        after: { status: ProjectStatus.ARCHIVED },
      },
    });
  });

  eventBus.on("task.created", async ({ task, createdBy }) => {
    await prisma.auditLog.create({
      data: {
        workspaceId: task.workspaceId,
        actorId: createdBy,
        action: "task.created",
        resourceType: "Task",
        resourceId: task.id,
        before: {},
        after: { title: task.title },
      },
    });
  });

  eventBus.on(
    "task.assigned",
    async ({ task, previousAssigneeId, newAssigneeId, assignedBy }) => {
      await prisma.auditLog.create({
        data: {
          workspaceId: task.workspaceId,
          actorId: assignedBy,
          action: "task.assgined",
          resourceType: "Task",
          resourceId: task.id,
          before: { assignedTo: previousAssigneeId },
          after: { assignedTo: newAssigneeId },
        },
      });
    }
  );

  eventBus.on(
    "task.status_changed",
    async ({ task, previousStatus, changedBy, newStatus }) => {
      await prisma.auditLog.create({
        data: {
          workspaceId: task.workspaceId,
          actorId: changedBy,
          action: "task.status_changed",
          resourceType: "Task",
          resourceId: task.id,
          before: { status: previousStatus },
          after: { status: newStatus },
        },
      });
    }
  );
}
