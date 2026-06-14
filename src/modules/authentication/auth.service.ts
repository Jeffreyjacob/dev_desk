import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { getEmailQueue } from "../../job/queues/email";
import { ConflictError } from "../../shared/errors";
import { verifyEmailTemplate } from "../../shared/utils/emailTemplate/verifyEmail";
import { generateVerificationToken } from "../../shared/utils/token";
import { IRegisterPayload, IRegisterResponse } from "./auth.interface";
import { UserRepository, WorkspaceAuthRepository } from "./auth.repository";
import bcrypt from "bcryptjs";

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
        name: data.email,
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
}
