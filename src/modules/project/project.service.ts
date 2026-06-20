import { eventBus } from "../../events/eventBus";
import { ProjectStatus, TaskStatus } from "../../generated/prisma/enums";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PlanLimitError,
} from "../../shared/errors";
import { WorkspaceRepository } from "../workspace/workspace.repository";
import {
  ICreateProjectResponse,
  IGetProjectDetailResponse,
  IGetProjectListResponse,
  IUpdateProjectResponse,
} from "./project.interface";
import { ProjectRepository } from "./project.repository";
import {
  ICreateProjectInput,
  IGetProjectInput,
  IUpdateProjectInput,
} from "./project.validation";

export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private workspaceRepo: WorkspaceRepository
  ) {}

  async createProject(
    workspaceId: string,
    actorId: string,
    data: ICreateProjectInput
  ): Promise<ICreateProjectResponse> {
    const workspaceDetails =
      await this.workspaceRepo.findByIdWithCounts(workspaceId);

    if (!workspaceDetails)
      throw new NotFoundError("unable to find workspace details");

    if (workspaceDetails._count.projects >= workspaceDetails.maxProjects)
      throw new PlanLimitError(
        "Project limit reached (3). Upgrade to PRO for unlimited projects."
      );
    const checkIfProjectAlreadyExist = await this.projectRepo.existInWorkspace({
      workspaceId,
      where: {
        name: data.name,
      },
    });

    if (checkIfProjectAlreadyExist)
      throw new ConflictError("Project with name already exist");

    const project = await this.projectRepo.createProject(
      workspaceId,
      actorId,
      data
    );

    eventBus.emit("project.created", {
      project: {
        id: project.id,
        name: project.name,
        workspaceId,
      },
      createdBy: actorId,
    });

    return {
      id: project.id,
      workspaceId,
      name: project.name,
      description: project.description,
      status: project.status,
      createdById: actorId,
      createdAt: project.createdAt,
    };
  }

  async getProjectLists(
    workspaceId: string,
    data: IGetProjectInput
  ): Promise<IGetProjectListResponse> {
    const projects = await this.projectRepo.getProjectByList(workspaceId, data);
    return {
      data: projects.data.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        taskCount: (project as any)._count.tasks,
        createdAt: project.createdAt,
      })),
      meta: projects.meta,
    };
  }

  async getProjectDetails(
    workspaceId: string,
    projectId: string
  ): Promise<IGetProjectDetailResponse> {
    const project = await this.projectRepo.getProjectDetails(
      workspaceId,
      projectId
    );

    if (!project) throw new NotFoundError("unable to find");

    let tasksByStatus: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_REVIEW]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
    };

    const statusGroup = await this.projectRepo.getProjectTasksByStatus({
      workspaceId,
      projectId,
    });

    statusGroup.forEach((group) => {
      tasksByStatus[group.status] = group._count.status;
    });

    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      status: project.status,
      createdBy: {
        ...project.createdBy,
      },
      taskCount: project._count.tasks,
      tasksByStatus,
      createdAt: project.createdAt,
    };
  }

  async updateProject(
    workspaceId: string,
    actorId: string,
    projectId: string,
    data: IUpdateProjectInput
  ): Promise<IUpdateProjectResponse> {
    const project = await this.projectRepo.findProjectById(
      workspaceId,
      projectId
    );

    if (!project) throw new NotFoundError("unable to find project");

    if (data.status && data.status === project.status)
      throw new BadRequestError(`The project is already ${data.status}`);

    const updatedProject = await this.projectRepo.updateProject(
      workspaceId,
      projectId,
      data
    );

    if (!updatedProject) throw new BadRequestError("unable to update project");

    if (data.status === ProjectStatus.ARCHIVED) {
      eventBus.emit("project.archived", {
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          workspaceId: updatedProject.workspaceId,
        },
        archivedBy: actorId,
      });
    }

    return {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject?.description!,
      status: updatedProject?.status!,
      updatedAt: updatedProject?.updatedAt!,
    };
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<void> {
    const project = await this.projectRepo.findProjectById(
      workspaceId,
      projectId
    );
    if (!project) throw new NotFoundError("unable to find project");
    if (project.status !== ProjectStatus.ARCHIVED)
      throw new BadRequestError("Only archived project can be deleted");

    return this.projectRepo.deleteProject(workspaceId, projectId);
  }
}
