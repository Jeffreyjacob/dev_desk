import { MemberRole, WorkspacePlan } from "../../generated/prisma/enums";

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

export interface IRegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  message: string;
}

// --- Email Verification
export interface IVerifyEmailPayload {
  token: string;
}

export interface IResendVerificationPayload {
  email: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ILoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    workspace: {
      id: string;
      name: string;
      slug: string;
      role: MemberRole;
      plan: WorkspacePlan;
    }[];
  };
  accessToken: string;
}

export interface IActivateWorkspaceResponse {
  accessToken: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: WorkspacePlan;
  };
}

export interface IRefreshTokenResponse {
  accessToken: string;
}

export interface IForgetPasswordPayload {
  accessToken: string;
}

export interface IResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  workspaceId?: string;
  role?: MemberRole;
}

export interface IAuthMessage {
  message: string;
}
