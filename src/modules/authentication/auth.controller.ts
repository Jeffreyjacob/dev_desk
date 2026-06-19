import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  completeProfileSchema,
  forgetPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validation";
import { ResponseHelper } from "../../shared/utils/apiResponse";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../../shared/utils/token";
import { env } from "../../config/env";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    const data = registerSchema.parse(req.body);
    const result = await this.authService.register(data);
    req.log?.info({ email: data.email }, "User registered");
    ResponseHelper.created(
      res,
      { user: result.user, workspace: result.workspace },
      result.message
    );
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = verifyEmailSchema.parse(req.body);
    const result = await this.authService.verifyEmail(token);
    ResponseHelper.success(res, "", 200, result.message);
  }

  async resendVerification(req: Request, res: Response): Promise<void> {
    const { email } = resendVerificationSchema.parse(req.body);
    const result = await this.authService.resendVerification(email);
    ResponseHelper.success(res, "", 200, result.message);
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = loginSchema.parse(req.body);
    const result = await this.authService.login(data);
    req.log?.info({ email: data.email }, "User logged in");
    const { refreshToken, ...newResult } = result;
    setRefreshTokenCookie(res, refreshToken);
    ResponseHelper.success(res, newResult, 200, "User logged in");
  }

  async activateWorkspace(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { workspaceId } = req.params;
    const result = await this.authService.activateWorkspace(
      userId,
      workspaceId as string
    );
    req.log?.info({ userId, workspaceId }, "workspace activated");
    ResponseHelper.success(res, result, 200, "Workspace activated!");
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies[env.REFRESH_TOKEN_NAME];
    const result = await this.authService.refreshToken(refreshToken);
    const { refreshToken: newRefreshToken, ...newResult } = result;
    setRefreshTokenCookie(res, newRefreshToken);
    ResponseHelper.success(res, newResult, 200, "token refreshed");
  }

  async logout(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const result = await this.authService.logout(userId);
    clearRefreshTokenCookie(res);
    req.log?.info({ userId }, "User logged out");
    ResponseHelper.success(res, "", 200, "User Logged out");
  }

  async forgetPassword(req: Request, res: Response): Promise<void> {
    const data = forgetPasswordSchema.parse(req.body);
    const result = await this.authService.forgetPassword(data);
    ResponseHelper.success(res, "", 200, result.message);
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const data = resetPasswordSchema.parse(req.body);
    const result = await this.authService.resetPassword(data);
    ResponseHelper.success(res, "", 200, result.message);
  }

  async getMe(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const result = await this.authService.getMe(userId);
    ResponseHelper.success(res, result, 200, "User Fetched");
  }

  async completeProfile(req: Request, res: Response): Promise<void> {
    const data = completeProfileSchema.parse(req.body);
    const result = await this.authService.completeProfile(data);
    ResponseHelper.success(res, "", 200, result.message);
  }
}
