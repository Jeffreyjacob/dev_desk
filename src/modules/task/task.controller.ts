import { Request, Response } from "express";
import { TaskService } from "./task.service";
import {
  assignTaskSchema,
  createTaskSchema,
  getTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./task.validation";
import { ResponseHelper } from "../../shared/utils/apiResponse";

export class TaskController {
  constructor(private readonly service: TaskService) {}

  async createTask(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const projectId = req.params.projectId as string;
    const actorId = req.user?.userId!;
    const data = createTaskSchema.parse(req.body);
    const result = await this.service.createTask(
      workspaceId,
      projectId,
      actorId,
      data
    );
    req.log?.info(
      { workspaceId, projectId, taskId: result.id },
      "Task created"
    );
    ResponseHelper.created(res, result, "task created successfully!");
  }

  async getTaskList(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const projectId = req.params.projectId as string;
    const data = getTaskSchema.parse(req.query);
    const result = await this.service.getTaskList(workspaceId, projectId, data);
    ResponseHelper.success(res, result, 200, "task list fetched");
  }

  async getTaskDetails(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const taskId = req.params.id as string;
    const result = await this.service.getTaskDetails(workspaceId, taskId);
    ResponseHelper.success(res, result, 200, "task details");
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const taskId = req.params.id as string;
    const data = updateTaskSchema.parse(req.body);
    const result = await this.service.updateTask(workspaceId, taskId, data);
    req.log?.info(
      { workspaceId, taskId, updatedBy: req.user?.userId },
      "task updated"
    );
    ResponseHelper.success(res, result, 200, "task updated");
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const taskId = req.params.id as string;
    const data = updateTaskStatusSchema.parse(req.body);
    const result = await this.service.updateTaskStatus(
      workspaceId,
      taskId,
      req.user?.userId!,
      data
    );
    req.log?.info(
      { workspaceId, taskId, updatedBy: req.user?.userId },
      "task status updated"
    );
    ResponseHelper.success(res, result, 200, "task status updated");
  }

  async assignTask(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const taskId = req.params.id as string;
    const actorId = req.user?.userId!;
    const data = assignTaskSchema.parse(req.body);
    const result = await this.service.assignTask(
      workspaceId,
      taskId,
      actorId,
      data
    );
    req.log?.info(
      { workspaceId, taskId, assignedBy: actorId, assignee: data.assignedToId },
      "Task assigned"
    );
    ResponseHelper.success(res, result, 200, "Task has been assigned");
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    const workspaceId = req.user?.workspaceId!;
    const taskId = req.params.id as string;
    const actorId = req.user?.userId!;
    const result = await this.service.deleteTask(workspaceId, taskId, actorId);
    req.log?.info({ workspaceId, taskId, actorId }, "task deleted");
    ResponseHelper.noContent(res);
  }
}
