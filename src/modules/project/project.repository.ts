import { prisma } from "../../config/database";
import { Prisma, Project, TaskStatus } from "../../generated/prisma/client";
import { TenantRepository } from "../../shared/repository/tenantRepository";
import {
  ICreateProjectInput,
  IGetProjectInput,
  IUpdateProjectInput,
} from "./project.validation";

export class ProjectRepository extends TenantRepository<
  Prisma.ProjectDelegate,
  Project
> {
  constructor() {
    super(prisma.project);
  }

  async findProjectById(workspaceId: string, projectId: string) {
    return this.findOneInWorkSpace({
      workspaceId,
      where: {
        id: projectId,
      },
    });
  }

  async createProject(
    workspaceId: string,
    actorId: string,
    data: ICreateProjectInput
  ) {
    return this.createInWorkSpace({
      data: {
        workspaceId,
        createdById: actorId,
        ...data,
      },
    });
  }

  async getProjectByList(workspaceId: string, data: IGetProjectInput) {
    return this.findManyWithCursorPagination({
      where: {
        workspaceId,
        ...(data.status && { status: data.status }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      cursor: data.cursor,
      take: data.limit,
    });
  }

  async getProjectDetails(workspaceId: string, projectId: string) {
    return prisma.project.findUnique({
      where: {
        workspaceId,
        id: projectId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async getProjectTasksByStatus({
    workspaceId,
    projectId,
  }: {
    workspaceId: string;
    projectId: string;
  }) {
    return prisma.task.groupBy({
      by: ["status"],
      where: {
        workspaceId,
        projectId,
      },
      _count: {
        status: true,
      },
    });
  }

  async updateProject(
    workspaceId: string,
    projectId: string,
    data: IUpdateProjectInput
  ) {
    return this.updateInWorkSpace({
      workspaceId,
      where: {
        id: projectId,
      },
      data,
    });
  }

  async deleteProject(workspaceId: string, projectId: string) {
    return this.deleteInWorkspace({
      workspaceId,
      where: {
        id: projectId,
      },
    });
  }
}
