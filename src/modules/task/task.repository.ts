import { prisma } from "../../config/database";
import { Prisma, Task } from "../../generated/prisma/client";
import { TenantRepository } from "../../shared/repository/tenantRepository";
import { ICreateTaskInput, IGetTaskInput } from "./task.validation";

export class TaskRepository extends TenantRepository<
  Prisma.TaskDelegate,
  Task
> {
  constructor() {
    super(prisma.task);
  }

  async findTaskById(workspaceId: string, taskId: string) {
    return this.findOneInWorkSpace({
      workspaceId,
      where: {
        id: taskId,
      },
    });
  }

  async createTask(
    workspaceId: string,
    projectId: string,
    actorId: string,
    data: ICreateTaskInput
  ) {
    return this.createInWorkSpace({
      data: {
        workspaceId,
        projectId,
        createdById: actorId,
        ...data,
      },
    });
  }

  async updateWithVersionCheck(
    workspaceId: string,
    taskId: string,
    expectedVersion: number,
    data: Prisma.Args<Prisma.TaskDelegate, "updateMany">["data"]
  ) {
    const result = await this.updateMany({
      where: {
        id: taskId,
        workspaceId,
        version: expectedVersion,
      },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });

    return result.count;
  }

  async getTaskList(
    workspaceId: string,
    projectId: string,
    data: IGetTaskInput
  ) {
    return this.findManyWithCursorPagination({
      where: {
        workspaceId,
        projectId,
        ...(data.status && { status: data.status }),
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
        ...(data.priority && { priority: data.priority }),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      cursor: data.cursor,
      take: data.limit,
    });
  }

  async getTaskDetails(workspaceId: string, taskId: string) {
    return prisma.task.findUnique({
      where: {
        id: taskId,
        workspaceId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteTask(workspaceId: string, taskId: string) {
    return this.deleteInWorkspace({
      workspaceId,
      where: {
        id: taskId,
      },
    });
  }
}
