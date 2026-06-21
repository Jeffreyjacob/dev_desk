import { AuthController } from "./modules/authentication/auth.controller";
import {
  UserRepository,
  WorkspaceAuthRepository,
} from "./modules/authentication/auth.repository";
import { AuthService } from "./modules/authentication/auth.service";
import { ProjectController } from "./modules/project/project.controller";
import { ProjectRepository } from "./modules/project/project.repository";
import { ProjectService } from "./modules/project/project.service";
import { TaskController } from "./modules/task/task.controller";
import { TaskRepository } from "./modules/task/task.repository";
import { TaskService } from "./modules/task/task.service";
import { WorkspaceController } from "./modules/workspace/workspace.controller";
import {
  WorkspaceInviteRepository,
  WorkspaceMemberRespository,
  WorkspaceRepository,
} from "./modules/workspace/workspace.repository";
import { WorkspaceService } from "./modules/workspace/workspace.service";

const userRepo = new UserRepository();
const workspaceAuthRepo = new WorkspaceAuthRepository();
const workspaceRepo = new WorkspaceRepository();
const workspaceMemberRepo = new WorkspaceMemberRespository();
const workspaceInviteRepo = new WorkspaceInviteRepository();
const projectRepo = new ProjectRepository();
const taskRepo = new TaskRepository();

const authService = new AuthService(userRepo, workspaceAuthRepo);
const workspaceService = new WorkspaceService(
  workspaceRepo,
  workspaceMemberRepo,
  workspaceInviteRepo,
  userRepo
);
const projectService = new ProjectService(projectRepo, workspaceRepo);
const taskService = new TaskService(taskRepo, projectRepo, workspaceMemberRepo);

export const authController = new AuthController(authService);
export const workspaceController = new WorkspaceController(workspaceService);
export const projectController = new ProjectController(projectService);
export const taskController = new TaskController(taskService);
