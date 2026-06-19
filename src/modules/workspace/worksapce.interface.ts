import {
  InviteStatus,
  MemberRole,
  WorkspacePlan,
} from "../../generated/prisma/enums";

export interface IWorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  maxMembers: number;
  maxProjects: number;
  webhooksEnabled: boolean;
  memberCount: number;
  projectCount: number;
  createdAt: Date;
}

export interface IUpdateWorkspacePayload {
  name?: string;
}

export interface IMemberResponse {
  id: string;
  role: MemberRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface IUpdateMemberRolePayload {
  role: MemberRole;
}

export interface ICreateInvitePayload {
  email: string;
  role: MemberRole;
}

export interface IInviteResponse {
  id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  expiredAt: Date;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface IInviteDetailsResponse {
  id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  expiresAt: Date;
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: WorkspacePlan;
    memberCount: number;
  };
  invitedBy: {
    name: string;
    email: string;
  };
}

export interface IAcceptInviteResponse {
  accessToken?: string;
  refreshToken?: string;
  message: string;
  newUser: boolean;
}

export interface IGetMembersQuery {
  cursor?: string;
  limit?: number;
}

export interface IGetInvitesQuery {
  status?: InviteStatus;
  cursor?: string;
  limit?: number;
}
