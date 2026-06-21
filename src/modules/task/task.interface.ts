import { TaskPriority, TaskStatus } from "../../generated/prisma/enums";
import { CursorPaginationMeta } from "../../shared/repository/baseRepository";

export interface ICreateTaskResponse {
  id: string;
  workspaceId: string;
  prijectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToid: string | null;
  dueDate: Date | null;
  version: number;
  createdAt: Date;
}

export interface IGetTaskListsResponse {
  data: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo: { id: string; name: string; email: string };
    dueDate: Date | null;
    version: number;
  }[];
  meta: CursorPaginationMeta;
}

export interface IGetTaskDetails {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  dueDate: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateTaskResponse {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  version: number;
  updatedAt: Date;
}

export interface IAssignTaskResponse {
  id: string;
  assignedTo: { id: string; name: string; email: string };
  version: number;
  updatedAt: Date;
}

export interface IUpdateTaskStatusResponse {
  id: string;
  status: TaskStatus;
  version: number;
  updatedAt: Date;
}
