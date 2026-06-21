import { Router } from "express";
import {
  authenticate,
  requireRole,
  requireWorkspace,
} from "../../middlewares/authentication";
import { MemberRole } from "../../generated/prisma/enums";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { projectController } from "../../container";

const router = Router();

router.post(
  "/:workspaceId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(projectController.createProject.bind(projectController))
);

router.get(
  "/:workspaceId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(projectController.getProjectbyList.bind(projectController))
);

router.get(
  "/:workspaceId/project/:id",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(projectController.getProjectDetails.bind(projectController))
);

router.patch(
  "/:workspaceId/project/:id",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(projectController.updateProject.bind(projectController))
);

router.delete(
  "/:workspaceId/project/:id",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(projectController.deleteProject.bind(projectController))
);

export default router;
