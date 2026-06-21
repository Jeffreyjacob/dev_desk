import { Router } from "express";
import {
  authenticate,
  requireRole,
  requireWorkspace,
} from "../../middlewares/authentication";
import { MemberRole } from "../../generated/prisma/enums";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { taskController } from "../../container";

const router = Router();

router.post(
  "/workspace/:workspaceId/project/:projectId/tasks",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(taskController.createTask.bind(taskController))
);

router.get(
  "/workspaces/:workspaceId/project/:projectId/tasks",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(taskController.getTaskList.bind(taskController))
);

router.get(
  "/workspaces/:workspaceId/tasks/:id",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(taskController.getTaskDetails.bind(taskController))
);

router.patch(
  "/workspaces/:workspaceId/tasks/:id",
  authenticate,
  requireWorkspace,
  requireRole(),
  AsyncHandler(taskController.updateTask.bind(taskController))
);

router.patch(
  "/workspaces/:workspaceId/task/:id/assign",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(taskController.assignTask.bind(taskController))
);

router.patch(
  "/workspaces/:workspaceId/task/:id/status",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER),
  AsyncHandler(taskController.updateStatus.bind(taskController))
);

router.delete(
  "/workspaces/:workspaceId/task/:id",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(taskController.deleteTask.bind(taskController))
);

export default router;
