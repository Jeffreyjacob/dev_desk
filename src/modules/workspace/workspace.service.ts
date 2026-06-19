import { logger } from "../../config/logger";
import { eventBus } from "../../events/eventBus";
import { InviteStatus, MemberRole } from "../../generated/prisma/enums";
import { getInviteQueue } from "../../job/queues/invite";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PlanLimitError,
} from "../../shared/errors";
import { UserRepository } from "../authentication/auth.repository";
import {
  IAcceptInviteResponse,
  ICreateInvitePayload,
  IUpdateWorkspacePayload,
} from "./worksapce.interface";
import {
  WorkspaceInviteRepository,
  WorkspaceMemberRespository,
  WorkspaceRepository,
} from "./workspace.repository";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { getEmailQueue } from "../../job/queues/email";
import { completeProfileEmail } from "../../shared/utils/emailTemplate/completeProfileEmail";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../shared/utils/token";

export class WorkspaceService {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly memberRepo: WorkspaceMemberRespository,
    private readonly inviteRepo: WorkspaceInviteRepository,
    private readonly userRepo: UserRepository
  ) {}

  async getWorkspace(workspaceId: string) {
    const workspace = await this.workspaceRepo.findByIdWithCounts(workspaceId);
    if (!workspace) throw new NotFoundError("workspace not found");

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      maxMembers: workspace.maxMembers,
      maxProjects: workspace.maxProjects,
      webhooksEnabled: workspace.webhooksEnabled,
      memberCount: workspace._count.members,
      projectCount: workspace._count.projects,
      createdAt: workspace.createdAt,
    };
  }

  async updateWorkspace(
    workspaceId: string,
    actorId: string,
    data: IUpdateWorkspacePayload
  ) {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("workspace not found");

    const updated = await this.workspaceRepo.updateById(workspaceId, {
      name: data.name,
    });

    return updated;
  }

  async deleteWorkspace(workspaceId: string, actorId: string): Promise<void> {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("workspace not found");

    logger.info(
      { workspaceId, actorId, workspaceName: workspace.name },
      "Workspace deleted"
    );

    await this.workspaceRepo.deleteById(workspaceId);
  }

  async getMembers(
    workspaceId: string,
    query: { cursor?: string; limit: number }
  ) {
    return this.memberRepo.findMembersWithUsers({
      workspaceId,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  async updateMemberRole(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    role: MemberRole
  ) {
    if (actorId === targetUserId) {
      throw new BadRequestError("You cannot change your own role");
    }
    const member = await this.memberRepo.findMember(workspaceId, targetUserId);
    if (!member) throw new NotFoundError("Member not found");

    if (member.role === MemberRole.OWNER)
      throw new ForbiddenError("Cannot change the role of a workspace owner");

    const previousRole = member.role;

    const updated = await this.memberRepo.updateMemberRole(
      workspaceId,
      targetUserId,
      role
    );

    eventBus.emit("member.role_changed", {
      userId: targetUserId,
      workspaceId,
      previousRole,
      newRole: role,
      changedBy: actorId,
    });

    return updated;
  }

  async removeMember(
    workspaceId: string,
    actorId: string,
    targetUserId: string
  ): Promise<void> {
    if (actorId === targetUserId) {
      throw new BadRequestError(
        "You cannot remove yourself. Transfer ownership first"
      );
    }

    const member = await this.memberRepo.findMember(workspaceId, targetUserId);

    if (!member) throw new NotFoundError("Member not found");

    if (member.role === MemberRole.OWNER)
      throw new NotFoundError("Can not remove the workspace owner");

    const removedRole = member.role;

    await this.memberRepo.removeMember(workspaceId, targetUserId);

    eventBus.emit("member.removed", {
      userId: targetUserId,
      workspaceId,
      removedBy: actorId,
      role: removedRole,
    });
  }

  async createInvite(
    workspaceId: string,
    actorId: string,
    data: ICreateInvitePayload
  ) {
    const workspace = await this.workspaceRepo.findByIdWithCounts(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace not found");

    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      const existingMember = await this.memberRepo.findMember(
        workspaceId,
        existingUser.id
      );

      if (existingMember)
        throw new ConflictError(
          "This user is already a member of this workspace"
        );
    }

    const pendingInvite = await this.inviteRepo.findPendingInvite(
      workspaceId,
      data.email
    );

    if (pendingInvite)
      throw new ConflictError("A pending invite already exists for this email");

    const currentMemberCount = workspace._count.members;
    if (currentMemberCount >= workspace.maxMembers)
      throw new PlanLimitError(
        `Member limit reached (${workspace.maxMembers}). upgrade to PRO for unlimited members.`
      );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitedBy = await this.userRepo.findUnique({
      where: {
        id: actorId,
      },
    });

    if (!invitedBy) throw new NotFoundError("Actor not found");

    const invite = await this.inviteRepo.createInWorkSpace({
      data: {
        workspaceId,
        invitedByUserId: actorId,
        role: data.role,
        email: data.email,
        token,
        expiresAt,
        status: InviteStatus.PENDING,
      },
    });

    try {
      const inviteQueue = getInviteQueue();
      const job = await inviteQueue.add(
        "expiry-invite",
        { inviteId: invite.id },
        { delay: 48 * 60 * 60 * 1000 }
      );

      if (job.id) {
        await this.inviteRepo.updateStatus(
          invite.id,
          InviteStatus.PENDING,
          job.id
        );
      }
    } catch (err: any) {
      logger.warn(
        { err, inviteId: invite.id },
        "Failed to schedule expiry job"
      );
    }

    eventBus.emit("member.invited", {
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      invitedBy: {
        id: invitedBy.id,
        name: invitedBy.name,
        email: invitedBy.email,
      },
    });

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    };
  }

  async getInvites(
    workspaceId: string,
    query: { status?: InviteStatus; cursor?: string; limit: number }
  ) {
    return this.inviteRepo.findInviteInWorkspace({
      workspaceId,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  async revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
    const invite = await this.inviteRepo.findOneInWorkSpace({
      workspaceId,
      where: {
        id: inviteId,
      },
    });

    if (!invite) throw new NotFoundError("invite not found");

    if (invite.status !== InviteStatus.PENDING)
      throw new BadRequestError("only pending invites can be revoked");

    if (invite.expiryJobId) {
      try {
        const inviteQueue = getInviteQueue();
        const job = await inviteQueue.getJob(invite.expiryJobId);
        if (job) await job.remove();
      } catch (err) {
        logger.warn({ err, inviteId }, "Failed to cancel expiry job");
      }
    }

    await this.inviteRepo.updateStatus(inviteId, InviteStatus.REVOKED);
  }

  async resendInvite(workspaceId: string, inviteId: string, actorId: string) {
    const invite = await this.inviteRepo.findOneInWorkSpace({
      workspaceId,
      where: { id: inviteId },
    });

    if (!invite) throw new NotFoundError("Invite not found");

    if (invite.status !== InviteStatus.PENDING)
      throw new BadRequestError("Can only resend pending invites");

    const worksapce = await this.workspaceRepo.findById(workspaceId);
    const actor = await this.userRepo.findUnique({
      where: {
        id: actorId,
      },
    });

    if (!worksapce || !actor) throw new NotFoundError("Resouce not found");

    eventBus.emit("member.invited", {
      invite: {
        id: invite.id,
        email: invite.role,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
      },
      workspace: { id: worksapce.id, name: worksapce.name },
      invitedBy: { id: actor.id, name: actor.name, email: actor.email },
    });

    return {
      message: "Invite resent successfully",
    };
  }

  async getInviteDetails(token: string) {
    const invite = await this.inviteRepo.findByTokenWithDetails(token);

    if (!invite) throw new NotFoundError("Invite not found");

    if (
      invite.status !== InviteStatus.PENDING ||
      invite.expiresAt < new Date()
    ) {
      throw new BadRequestError(
        "This invite has expired or is no longer valid"
      );
    }

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
        slug: invite.workspace.slug,
        plan: invite.workspace.plan,
        memberCount: invite.workspace._count.members,
      },
      inviteBy: {
        name: invite.invitedBy.name,
        email: invite.invitedBy.email,
      },
    };
  }

  async acceptInvite(token: string): Promise<IAcceptInviteResponse> {
    const invite = await this.inviteRepo.findByTokenWithDetails(token);

    if (!invite) throw new NotFoundError("Invite not found");

    if (invite.status !== InviteStatus.PENDING)
      throw new BadRequestError("This invite is no longer valid");

    if (invite.expiresAt < new Date())
      throw new BadRequestError(
        "THis invite has expired. Please request a new one"
      );

    if (invite.expiryJobId) {
      try {
        const inviteQueue = getInviteQueue();
        const job = await inviteQueue.getJob(invite.expiryJobId);
        if (job) await job.remove();
      } catch (err: any) {
        logger.warn({ err }, "Failed to cancel invite expiry job");
      }
    }

    await this.inviteRepo.updateStatus(invite.id, InviteStatus.ACCEPTED);

    let userId: string;
    let wasNewUser = false;

    const existingUser = await this.userRepo.findByEmail(invite.email);

    if (existingUser) {
      const existingMember = await this.memberRepo.findMember(
        invite.workspaceId,
        existingUser.id
      );

      if (existingMember)
        throw new ConflictError("You are already a memeber of this workspace");

      userId = existingUser.id;
    } else {
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
      const profileSetupToken = crypto.randomBytes(32).toString("hex");
      const profileSetupExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

      const newUser = await this.userRepo.create({
        data: {
          email: invite.email,
          name: invite.email.split("@")[0],
          passwordHash,
          emailVerified: true,
          profileSetupToken,
          profileSetupExpiresAt,
        },
      });

      userId = newUser.id;
      wasNewUser = true;

      const url = `${env.FRONTEND_URL}/complete-profile?email=${invite.email}&profileToken=${profileSetupToken}`;

      try {
        const emailQueue = getEmailQueue();
        await emailQueue.add("complete-profile", {
          email: invite.email,
          subject: "",
          html: completeProfileEmail({
            workspaceName: invite.workspace.name,
            setupUrl: url,
            year: new Date().getFullYear(),
          }),
        });
      } catch (err) {
        logger.warn({ err }, "failed to queue complete profile email");
      }
    }

    const member = await this.memberRepo.createInWorkSpace({
      data: {
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
      },
    });

    eventBus.emit("member.joined", {
      member: {
        userId,
        workspaceId: invite.workspaceId,
        role: member.role,
      },
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
      },
      wasNewUser,
    });

    const user = await this.userRepo.findUnique({
      where: {
        id: userId,
      },
    });

    if (wasNewUser) {
      return {
        message:
          "You have been added to the workspace, click your email to complete profile setup",
        newUser: true,
      };
    } else {
      const accessToken = generateAccessToken({
        userId,
        email: user!.email,
        workspaceId: invite.workspaceId,
        role: member.role,
      });

      const refreshToken = generateRefreshToken();
      const hashedRefreshToken = hashRefreshToken(refreshToken);

      await this.userRepo.updateById(userId, {
        refreshTokenHash: hashedRefreshToken,
      });

      return {
        message: "Your have been added to the workspace",
        accessToken,
        refreshToken,
        newUser: false,
      };
    }
  }
}
