import { AuthController } from "./modules/authentication/auth.controller";
import {
  UserRepository,
  WorkspaceAuthRepository,
} from "./modules/authentication/auth.repository";
import { AuthService } from "./modules/authentication/auth.service";
import { BillingController } from "./modules/billing/billing.controller";
import { BillingRepository } from "./modules/billing/billing.repository";
import { BillingService } from "./modules/billing/billing.service";
import { NotificationController } from "./modules/notification/notification.controller";
import { NotificationRepository } from "./modules/notification/notification.repository";
import { NotificationService } from "./modules/notification/notification.service";
import { ProjectController } from "./modules/project/project.controller";
import { ProjectRepository } from "./modules/project/project.repository";
import { ProjectService } from "./modules/project/project.service";
import { TaskController } from "./modules/task/task.controller";
import { TaskRepository } from "./modules/task/task.repository";
import { TaskService } from "./modules/task/task.service";
import { WebhookController } from "./modules/webhook/webhook.controller";
import { WebhookRepository } from "./modules/webhook/webhook.repository";
import { WebhookService } from "./modules/webhook/webhook.service";
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
const notificationRepo = new NotificationRepository();
const billingRepo = new BillingRepository();
const webhookRepo = new WebhookRepository();

const authService = new AuthService(userRepo, workspaceAuthRepo);
const workspaceService = new WorkspaceService(
  workspaceRepo,
  workspaceMemberRepo,
  workspaceInviteRepo,
  userRepo
);
const projectService = new ProjectService(projectRepo, workspaceRepo);
const taskService = new TaskService(taskRepo, projectRepo, workspaceMemberRepo);
const notificationService = new NotificationService(notificationRepo);
const billingService = new BillingService(billingRepo, workspaceRepo);
export const webhookService = new WebhookService(webhookRepo, workspaceRepo);

export const authController = new AuthController(authService);
export const workspaceController = new WorkspaceController(workspaceService);
export const projectController = new ProjectController(projectService);
export const taskController = new TaskController(taskService);
export const notificationController = new NotificationController(
  notificationService
);
export const billingController = new BillingController(billingService);
export const webhookController = new WebhookController(webhookService);
