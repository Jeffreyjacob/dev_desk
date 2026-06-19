import { prisma } from "../../config/database";
import {
  InviteStatus,
  MemberRole,
  Prisma,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
} from "../../generated/prisma/client";
import { BaseRepository } from "../../shared/repository/baseRepository";
import { TenantRepository } from "../../shared/repository/tenantRepository";

export class WorkspaceRepository extends BaseRepository<
  Prisma.WorkspaceDelegate,
  Workspace
> {
  constructor() {
    super(prisma.workspace);
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.findFirst({
      where: { id },
    });
  }

  async findByIdWithCounts(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });
  }

  async updateById(
    id: string,
    data: Prisma.WorkspaceUpdateInput
  ): Promise<Workspace | null> {
    return this.update({ where: { id }, data });
  }

  async deleteById(id: string): Promise<void> {
    return this.delete({ where: { id } });
  }
}

export class WorkspaceMemberRespository extends TenantRepository<
  Prisma.WorkspaceMemberDelegate,
  WorkspaceMember
> {
  constructor() {
    super(prisma.workspaceMember);
  }

  async findMember(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMember | null> {
    return this.findOneInWorkSpace({
      workspaceId,
      where: {
        userId,
      },
    });
  }

  async findMemberWithUser(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findMembersWithUsers(args: {
    workspaceId: string;
    cursor?: string;
    limit: number;
  }) {
    return this.findManyInWorkspaceWithCursor({
      workspaceId: args.workspaceId,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { joinedAt: "asc" },
      take: args.limit,
      cursor: args.cursor,
      cursorField: "id",
    });
  }

  async countMembers(workspaceId: string): Promise<number> {
    return this.countInWorkspace({ workspaceId });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { workspaceId, assignedToId: userId },
        data: { assignedToId: null },
      });

      await tx.workspaceMember.delete({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
      });
    });
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: MemberRole
  ): Promise<WorkspaceMember> {
    return prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      data: { role },
    });
  }
}

export class WorkspaceInviteRepository extends TenantRepository<
  Prisma.WorkspaceInviteDelegate,
  WorkspaceInvite
> {
  constructor() {
    super(prisma.workspaceInvite);
  }

  async findByToken(token: string): Promise<WorkspaceInvite | null> {
    return this.findFirst({
      where: { token },
    });
  }

  async findByTokenWithDetails(token: string) {
    return prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findPendingInvite(
    workspaceId: string,
    email: string
  ): Promise<WorkspaceInvite | null> {
    return this.findFirst({
      where: {
        workspaceId,
        email,
        status: InviteStatus.PENDING,
      },
    });
  }

  async updateStatus(
    id: string,
    status: InviteStatus,
    jobId?: string
  ): Promise<WorkspaceInvite | null> {
    return this.update({
      where: { id },
      data: {
        status,
        ...(jobId && { expiryJobId: jobId }),
      },
    });
  }

  async findInviteInWorkspace(args: {
    workspaceId: string;
    status?: InviteStatus;
    cursor?: string;
    limit: number;
  }) {
    return this.findManyInWorkspaceWithCursor({
      workspaceId: args.workspaceId,
      where: args.status ? { status: args.status } : undefined,
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: args.limit,
      cursor: args.cursor,
      cursorField: "id",
    });
  }
}
