import { Request, Response } from "express";
import { ProjectService } from "./project.service";
import {
  createProjectSchema,
  getProjectSchema,
  updateProjectSchema,
} from "./project.validation";
import { ResponseHelper } from "../../shared/utils/apiResponse";

export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  async createProject(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const actorId = req.user?.userId!;
    const data = createProjectSchema.parse(req.body);
    const result = await this.service.createProject(workspaceId, actorId, data);
    req.log?.info(
      {
        workspaceId: result.workspaceId,
        projectId: result.id,
        createdBy: result.createdById,
      },
      "project created"
    );

    ResponseHelper.created(res, result, "Project created successfully!");
  }

  async getProjectbyList(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const data = getProjectSchema.parse(req.query);
    const result = await this.service.getProjectLists(workspaceId, data);
    ResponseHelper.success(res, result, 200, "project list fetched");
  }

  async getProjectDetails(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const projectId = req.params.id as string;
    const result = await this.service.getProjectDetails(workspaceId, projectId);
    ResponseHelper.success(res, result, 200, "project fetched");
  }

  async updateProject(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const actorId = req.user?.userId!;
    const projectId = req.params.id as string;
    const data = updateProjectSchema.parse(req.body);
    const result = await this.service.updateProject(
      workspaceId,
      actorId,
      projectId,
      data
    );
    req.log?.info({ workspaceId, productId: result.id }, "project updated ");
    ResponseHelper.success(res, result, 200, "project updated successfully");
  }

  async deleteProject(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const projectId = req.params.id as string;
    const result = await this.service.deleteProject(workspaceId, projectId);
    req.log?.info({ workspaceId, projectId }, "project deleted ");
    ResponseHelper.noContent(res);
  }
}
