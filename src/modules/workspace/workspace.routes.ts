import { Router } from "express";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { workspaceController } from "../../container";
import {
  authenticate,
  requireRole,
  requireWorkspace,
} from "../../middlewares/authentication";
import { MemberRole } from "../../generated/prisma/enums";

const router = Router();

router.get(
  "/invote/:token",
  AsyncHandler(workspaceController.getInviteDetails.bind(workspaceController))
);

router.post(
  "/invite/:token/accept",
  AsyncHandler(workspaceController.acceptInvite.bind(workspaceController))
);

// workspace setting

router.get(
  "/:workspaceId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
  AsyncHandler(workspaceController.getWorkspace.bind(workspaceController))
);

router.patch(
  "/:workspaceId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(workspaceController.updateWorkspace.bind(workspaceController))
);

router.delete(
  "/:workspaceId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(workspaceController.deleteWorkspace.bind(workspaceController))
);

// Member management
router.get(
  "/:workspaceId/members",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.ADMIN),
  AsyncHandler(workspaceController.getMembers.bind(workspaceController))
);

router.patch(
  "/:workspaceId/members/:userId/role",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(workspaceController.updateMemberRole.bind(workspaceController))
);

router.delete(
  "/:workspaceId/member/:userId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER),
  AsyncHandler(workspaceController.removeMember.bind(workspaceController))
);

// Invite management
router.post(
  "/:workspaceId/invites",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(workspaceController.createInvite.bind(workspaceController))
);

router.get(
  "/:workspaceId/invites",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(workspaceController.getInvites.bind(workspaceController))
);

router.delete(
  "/:workspaceId/invite/:inviteId",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(workspaceController.revokeInvite.bind(workspaceController))
);

router.post(
  "/:workspaceId/invites/:inviteId/resend",
  authenticate,
  requireWorkspace,
  requireRole(MemberRole.OWNER, MemberRole.ADMIN),
  AsyncHandler(workspaceController.resendInvite.bind(workspaceController))
);

export default router;
