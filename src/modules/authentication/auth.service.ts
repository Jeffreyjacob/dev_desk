import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { redis } from "../../config/redis";
import { getEmailQueue } from "../../job/queues/email";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../../shared/errors";
import {
  resetPasswordEmailTemplate,
  verifyEmailTemplate,
} from "../../shared/utils/emailTemplate/verifyEmail";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  hashRefreshToken,
} from "../../shared/utils/token";
import {
  IActivateWorkspaceResponse,
  IAuthMessage,
  IForgetPasswordPayload,
  ILoginPayload,
  ILoginResponse,
  IRefreshTokenResponse,
  IRegisterPayload,
  IRegisterResponse,
  IResetPasswordPayload,
} from "./auth.interface";
import { UserRepository, WorkspaceAuthRepository } from "./auth.repository";
import bcrypt from "bcryptjs";
import { CompleteProfileInput } from "./auth.validation";

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workspaceRepo: WorkspaceAuthRepository
  ) {}

  async register(data: IRegisterPayload): Promise<IRegisterResponse> {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("An account with this email already exist");
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.userRepo.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      },
    });

    const slug = await this.workspaceRepo.generateUniqueSlug(
      data.workspaceName
    );

    const { workspace } = await this.workspaceRepo.createWithOwner({
      name: data.workspaceName,
      slug,
      userId: user.id,
    });

    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      const emailQueue = getEmailQueue();
      await emailQueue.add("verify-email", {
        email: user.email,
        subject: "Verify Email",
        message: verifyEmailTemplate(verificationUrl, user.name),
      });
    } catch (err) {
      logger.warn(
        { err, userId: user.id },
        "Failed to queue verification email"
      );
    }

    return {
      user: { id: user.id, name: user.name, email: user.email },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      message:
        "Account created. Please check your email to verify your account",
    };
  }

  async verifyEmail(token: string): Promise<IAuthMessage> {
    const user = await this.userRepo.findByVerificationToken(token);

    if (!user)
      throw new BadRequestError("Invalid or expired verification token");

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new BadRequestError(
        "Verification token has expired. Please request a new one"
      );
    }

    await this.userRepo.updateById(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    });

    return { message: "Email verified successfully. you can now login." };
  }

  async resendVerification(email: string): Promise<IAuthMessage> {
    const user = await this.userRepo.findByEmail(email);

    if (!user || user.emailVerified) {
      return {
        message:
          "If an unverified account exist with this email, a new verification link has been sent to them",
      };
    }

    const cooldownKey = `cooldown:verify:${user.id}`;
    const onCoolDown = await redis.get(cooldownKey);

    if (onCoolDown) {
      const ttl = await redis.ttl(cooldownKey);
      throw new TooManyRequestsError(
        `Please wait ${ttl} seconds before requesting another verification email`
      );
    }

    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepo.updateById(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: verificationExpiresAt,
    });

    await redis.set(cooldownKey, "1", "EX", 120);

    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      const emailQueue = getEmailQueue();
      await emailQueue.add("verify-email", {
        email: user.email,
        subject: "Verify Your Email ",
        html: verifyEmailTemplate(verificationUrl, user.name),
      });
    } catch (err) {
      logger.warn({ err }, "Failed to queue verification email");
    }

    return {
      message:
        "If an unverified account exist with this email, a new verification link has been sent to them",
    };
  }

  async login(data: ILoginPayload): Promise<ILoginResponse> {
    const user = await this.userRepo.findByEmailWithWorkspace(data.email);

    // Always use bcrypt.compare event if user not found
    // Why ? Timing attack prevention
    // without this: "user not found" return instantly
    // "wrong password" take 100ms (bcrypt)
    // Attacker can detect which emails are registered by response time
    // with dummy compare: both cases take some time

    const dummyHash =
      "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

    const passwordMatch = await bcrypt.compare(
      data.password,
      user?.passwordHash ?? dummyHash
    );

    if (!user || !passwordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError("Please verify your email before logging in");
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        "Your account has been deactivated. Please contact support"
      );
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    // store hashed refresh token on user
    // why one token per user ? Simplest approach
    // trade -off: loggin in on device B invalidates device A's session

    await this.userRepo.updateById(user.id, {
      refreshTokenHash,
      lastLoginAt: new Date(),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        workspace: user.memberships.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: m.role,
          plan: m.workspace.plan,
        })),
      },
      accessToken,
      refreshToken: refreshToken,
    };
  }

  async activateWorkspace(
    userId: string,
    workspaceId: string
  ): Promise<IActivateWorkspaceResponse> {
    const membership = await this.workspaceRepo.findMembershipWithWorkspace(
      userId,
      workspaceId
    );

    if (!membership)
      throw new NotFoundError("Workspace not found or you are not a member");

    await this.userRepo.updateById(userId, {
      lastActiveWorkspaceId: membership.workspaceId,
    });

    const accessToken = generateAccessToken({
      userId,
      email: membership.user.email,
      workspaceId: membership.workspaceId,
      role: membership.role,
    });

    return {
      accessToken,
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        plan: membership.workspace.plan,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<IRefreshTokenResponse> {
    if (!refreshToken) {
      throw new UnauthorizedError("refresh token not found");
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const user = await this.userRepo.findFirst({
      where: { refreshTokenHash: tokenHash },
    });

    if (!user) {
      logger.warn("Refresh token not found - Possible token reuse attack");
      throw new UnauthorizedError("Invalid refresh token");
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    await this.userRepo.updateById(user.id, {
      refreshTokenHash: newRefreshTokenHash,
    });

    let workspaceContext = {};

    if (user.lastActiveWorkspaceId) {
      const member = await this.workspaceRepo.findMembershipWithWorkspace(
        user.id,
        user.lastActiveWorkspaceId
      );

      if (member) {
        workspaceContext = {
          workspaceId: member.workspaceId,
          role: member.role,
        };
      }
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      ...workspaceContext,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string): Promise<IAuthMessage> {
    await this.userRepo.updateById(userId, {
      refreshTokenHash: null,
    });
    return { message: "Loggout successfully" };
  }

  async forgetPassword(data: IForgetPasswordPayload): Promise<IAuthMessage> {
    const user = await this.userRepo.findByEmail(data.email);

    const message =
      "If an account exists with this email, a password reset link has been sent.";

    if (!user) return { message };

    const cooldownkey = `cooldown:reset:${user.id}`;
    const onCoolDown = await redis.get(cooldownkey);

    if (onCoolDown) {
      const ttl = await redis.ttl(cooldownkey);
      const minutes = Math.ceil(ttl / 60);
      throw new TooManyRequestsError(
        `Please wait ${minutes} minutes before requesting another reset`
      );
    }

    const resetToken = generateVerificationToken();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepo.updateById(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpiresAt: resetExpiresAt,
    });

    await redis.set(cooldownkey, "1", "EX", 3600);

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      const emailQueue = getEmailQueue();
      await emailQueue.add("reset-password", {
        email: user.email,
        subject: "Forget Password Link",
        html: resetPasswordEmailTemplate(resetUrl, user.name),
      });
    } catch (err) {
      logger.warn({ err }, "Failed to queue reset email");
    }

    return { message };
  }

  async resetPassword(data: IResetPasswordPayload): Promise<IAuthMessage> {
    const user = await this.userRepo.findByResetToken(data.token);

    if (!user) {
      throw new BadRequestError("invalid or expired reset token");
    }

    if (
      user.resetPasswordExpiresAt &&
      user.resetPasswordExpiresAt < new Date()
    ) {
      throw new BadRequestError(
        "Reset token has expired. Please request a new one"
      );
    }

    const passwordHash = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);

    await this.userRepo.updateById(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
      refreshTokenHash: null,
    });

    return {
      message:
        "Password reset successfully. Please login with your new password.",
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findByEmailWithWorkspace(userId as any);
    if (!user) throw new NotFoundError("User not found");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      workspace: user.memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        plan: m.workspace.plan,
      })),
    };
  }

  async completeProfile(data: CompleteProfileInput) {
    const user = await this.userRepo.findFirst({
      where: { profileSetupToken: data.token },
    });

    if (!user) throw new BadRequestError("Invalid or expired setup link");

    if (user.profileSetupExpiresAt && user.profileSetupExpiresAt < new Date())
      throw new BadRequestError(
        "Setup link has expired. Please contact your workspace admin"
      );

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    await this.userRepo.updateById(user.id, {
      name: data.name,
      passwordHash,
      profileSetupToken: null,
      profileSetupExpiresAt: null,
    });

    return {
      message: "Profile completed. You can now login",
    };
  }
}
