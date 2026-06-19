import { Request, Response } from "express";
import { WorkspaceService } from "./workspace.service";
import { ResponseHelper } from "../../shared/utils/apiResponse";
import {
  createInviteSchema,
  getInviteSchema,
  getMembersSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from "./workspace.validation";
import { setRefreshTokenCookie } from "../../shared/utils/token";

export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async getWorkspace(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const result = await this.workspaceService.getWorkspace(workspaceId);
    ResponseHelper.success(res, result, 200, "workspace fetched");
  }

  async updateWorkspace(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const actorId = req.user!.userId;
    const data = updateWorkspaceSchema.parse(req.body);
    const result = await this.workspaceService.updateWorkspace(
      workspaceId,
      actorId,
      data
    );
    ResponseHelper.success(res, result, 200, "workspace updated");
  }

  async deleteWorkspace(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const actorId = req.user!.userId;
    await this.workspaceService.deleteWorkspace(workspaceId, actorId);
    ResponseHelper.noContent(res);
  }

  async getMembers(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const qurery = getMembersSchema.parse(req.query);
    const result = await this.workspaceService.getMembers(workspaceId, qurery);
    ResponseHelper.success(res, result, 200, "members fetched");
  }

  async updateMemberRole(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const actorId = req.user!.userId;
    const { userId } = req.params;
    const { role } = updateMemberRoleSchema.parse(req.body);
    const result = await this.workspaceService.updateMemberRole(
      workspaceId,
      actorId,
      userId as string,
      role
    );
    ResponseHelper.success(res, result, 200, "member role has been updated");
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const actorId = req.user!.userId!;
    const { userId } = req.params;
    await this.workspaceService.removeMember(
      workspaceId,
      actorId,
      userId as string
    );
    ResponseHelper.noContent(res);
  }

  async createInvite(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const actorId = req.user!.userId;
    const data = createInviteSchema.parse(req.body);
    const result = await this.workspaceService.createInvite(
      workspaceId,
      actorId,
      data
    );
    ResponseHelper.created(res, result, "invite created");
  }

  async getInvites(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const query = getInviteSchema.parse(req.query);
    const result = await this.workspaceService.getInvites(workspaceId, query);
    ResponseHelper.success(res, result, 200, "Invited fetched");
  }

  async revokeInvite(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const { inviteId } = req.params;
    await this.workspaceService.revokeInvite(workspaceId, inviteId as string);
    ResponseHelper.noContent(res);
  }

  async resendInvite(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user!.workspaceId!;
    const actorId = req.user!.userId;
    const { inviteId } = req.params;
    const result = await this.workspaceService.resendInvite(
      workspaceId,
      inviteId as string,
      actorId
    );
    ResponseHelper.success(res, result, 200, "Invite has been resent");
  }

  async getInviteDetails(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const result = await this.workspaceService.getInviteDetails(
      token as string
    );
    ResponseHelper.success(res, result, 200, "Invite detail fetched");
  }

  async acceptInvite(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    const result = await this.workspaceService.acceptInvite(token as string);
    const { refreshToken, ...data } = result;
    setRefreshTokenCookie(res, refreshToken!);
    ResponseHelper.success(
      res,
      data.accessToken ? { accessToken: data.accessToken } : "",
      200,
      data.message
    );
  }
}
