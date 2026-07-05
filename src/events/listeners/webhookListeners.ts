import { logger } from "../../config/logger";
import { webhookService } from "../../container";
import { eventBus } from "../eventBus";

export function webhookListners(): void {
  const webhhookService = webhookService;

  eventBus.on("task.assigned", async ({ task, newAssigneeId, assignedBy }) => {
    await webhhookService
      .dispatchEvent(task.workspaceId, "task.assigned", {
        taskId: task.id,
        taskTitle: task.title,
        newAssigneeId,
        assignedBy,
      })
      .catch((err) =>
        logger.error({ err }, "Failed to dispatch task.assigned webhook")
      );
  });

  eventBus.on("task.created", async ({ task, createdBy }) => {
    await webhhookService
      .dispatchEvent(task.workspaceId, "task.created", {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.projectId,
        createdBy,
      })
      .catch((err) =>
        logger.error({ err }, "Failed to dispatch task.created webhook")
      );
  });

  eventBus.on("member.joined", async ({ member, workspace }) => {
    await webhhookService
      .dispatchEvent(workspace.id, "member.joined", {
        userId: member.userId,
        role: member.role,
      })
      .catch((err) =>
        logger.error({ err }, "Failed to dispatch member.joined webhook")
      );
  });

  eventBus.on("member.removed", async ({ userId, workspaceId, role }) => {
    await webhhookService
      .dispatchEvent(workspaceId, "member.removed", {
        userId,
        role,
      })
      .catch((err) =>
        logger.error({ err }, "Failed to dispatch member.removed webhook")
      );
  });
}
