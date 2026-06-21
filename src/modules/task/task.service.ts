import { eventBus } from "../../events/eventBus";
import { Task } from "../../generated/prisma/client";
import { ProjectStatus } from "../../generated/prisma/enums";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../shared/errors";
import { ProjectRepository } from "../project/project.repository";
import { WorkspaceMemberRespository } from "../workspace/workspace.repository";
import {
  IAssignTaskResponse,
  IGetTaskDetails,
  IGetTaskListsResponse,
  IUpdateTaskResponse,
  IUpdateTaskStatusResponse,
} from "./task.interface";
import { TaskRepository } from "./task.repository";
import {
  IAssignTaskInput,
  ICreateTaskInput,
  IGetTaskInput,
  IUpdateTaskInput,
  IUpdateTaskStatusInput,
} from "./task.validation";

export class TaskService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly workspaceMemberRepo: WorkspaceMemberRespository
  ) {}

  async createTask(
    workspaceId: string,
    projectId: string,
    actorId: string,
    data: ICreateTaskInput
  ): Promise<Task> {
    const project = await this.projectRepo.findProjectById(
      workspaceId,
      projectId
    );

    if (!project) throw new NotFoundError("unable to find project");

    if (project.status !== ProjectStatus.ACTIVE)
      throw new BadRequestError("you can't create task for archived project");

    const task = await this.taskRepo.createTask(
      workspaceId,
      projectId,
      actorId,
      data
    );

    eventBus.emit("task.created", {
      task,
      createdBy: actorId,
    });

    return task;
  }

  async getTaskList(
    workspaceId: string,
    projectId: string,
    data: IGetTaskInput
  ): Promise<IGetTaskListsResponse> {
    const tasks = await this.taskRepo.getTaskList(workspaceId, projectId, data);

    return {
      data: tasks.data.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignedTo: (task as any).assignedTo
          ? {
              id: (task as any).assignedTo.id as string,
              name: (task as any).assignedTo.name as string,
              email: (task as any).assignedTo.email as string,
            }
          : null,
        dueDate: task.dueDate,
        version: task.version,
      })),
      meta: tasks.meta,
    };
  }

  async getTaskDetails(
    workspaceId: string,
    taskId: string
  ): Promise<IGetTaskDetails> {
    const task = await this.taskRepo.getTaskDetails(workspaceId, taskId);
    if (!task) throw new NotFoundError("unable to find task");
    return task;
  }

  async updateTask(
    workspaceId: string,
    taskId: string,
    data: IUpdateTaskInput
  ): Promise<IUpdateTaskResponse> {
    const existingTask = await this.taskRepo.findTaskById(workspaceId, taskId);

    if (!existingTask) throw new NotFoundError("Task not found");

    const { version, ...otherData } = data;

    const updatedCount = await this.taskRepo.updateWithVersionCheck(
      workspaceId,
      taskId,
      version,
      otherData
    );

    if (updatedCount === 0)
      throw new ConflictError(
        "This task was modified by someone else, Please refresh and try again"
      );

    const updateData = await this.taskRepo.findTaskById(workspaceId, taskId);
    return {
      id: updateData?.id!,
      title: updateData?.title!,
      priority: updateData?.priority!,
      status: updateData?.status!,
      version: updateData?.version!,
      updatedAt: updateData?.updatedAt!,
    };
  }

  async assignTask(
    workspaceId: string,
    taskId: string,
    actorId: string,
    data: IAssignTaskInput
  ): Promise<IAssignTaskResponse> {
    const existingTask = await this.taskRepo.findTaskById(workspaceId, taskId);

    if (!existingTask) throw new NotFoundError("Task not found");

    if (data.assignedToId) {
      const isMember = this.workspaceMemberRepo.findMember(
        workspaceId,
        data.assignedToId
      );
      if (!isMember)
        throw new BadRequestError(
          "cannot assign task to user that's not in your workspace"
        );
    }

    const updatedCount = await this.taskRepo.updateWithVersionCheck(
      workspaceId,
      taskId,
      data.version,
      { assignedToId: data.assignedToId }
    );

    if (updatedCount === 0)
      throw new ConflictError(
        "This task was modified by someone else, Please refresh and try again"
      );

    const updateData = await this.taskRepo.getTaskDetails(workspaceId, taskId);

    if (!updateData) throw new NotFoundError("unable to find updated task");

    eventBus.emit("task.assigned", {
      task: {
        id: updateData.id,
        title: updateData.title,
        workspaceId: updateData.workspaceId,
      },
      previousAssigneeId: existingTask.assignedToId,
      newAssigneeId: data.assignedToId,
      assignedBy: actorId,
    });

    return {
      id: updateData.id,
      assignedTo: updateData.assignedTo
        ? {
            id: updateData.assignedTo.id,
            name: updateData.assignedTo.name,
            email: updateData.assignedTo.email,
          }
        : null,
      version: updateData.version,
      updatedAt: updateData.updatedAt,
    };
  }

  async updateTaskStatus(
    workspaceId: string,
    taskId: string,
    actorId: string,
    data: IUpdateTaskStatusInput
  ): Promise<IUpdateTaskStatusResponse> {
    const existingTask = await this.taskRepo.findTaskById(workspaceId, taskId);

    if (!existingTask) throw new NotFoundError("Task not found");

    const updatedCount = await this.taskRepo.updateWithVersionCheck(
      workspaceId,
      taskId,
      data.version,
      { status: data.status }
    );

    if (updatedCount === 0)
      throw new ConflictError(
        "This task was modified by someone else, Please refresh and try again"
      );

    const updateData = await this.taskRepo.findTaskById(workspaceId, taskId);

    if (!updateData) throw new NotFoundError("unable to find updated task");

    eventBus.emit("task.status_changed", {
      task: {
        id: updateData.id,
        title: updateData.title,
        workspaceId: updateData.workspaceId,
      },
      previousStatus: existingTask.status,
      newStatus: data.status,
      changedBy: actorId,
    });

    return {
      id: updateData.id,
      status: updateData.status,
      version: updateData.version,
      updatedAt: updateData.updatedAt,
    };
  }

  async deleteTask(
    workspaceId: string,
    taskId: string,
    actorId: string
  ): Promise<void> {
    const existingTask = await this.taskRepo.findTaskById(workspaceId, taskId);
    if (!existingTask) throw new NotFoundError("unable to find task");

    await this.taskRepo.deleteTask(workspaceId, taskId);

    eventBus.emit("task.deleted", {
      taskId: existingTask.id,
      title: existingTask.title,
      workspaceId: existingTask.workspaceId,
      deletedBy: actorId,
    });
  }
}
