import { ProjectStatus } from "../../generated/prisma/enums";
import { CursorPaginationMeta } from "../../shared/repository/baseRepository";

export interface ICreateProjectResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdById: string;
  createdAt: Date;
}

export interface IGetProjectListResponse {
  data: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    taskCount: number;
    createdAt: Date;
  }[];
  meta: CursorPaginationMeta;
}

export interface IGetProjectDetailResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  taskCount: number;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
  createdAt: Date;
}

export interface IUpdateProjectResponse {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  updatedAt: Date;
}
