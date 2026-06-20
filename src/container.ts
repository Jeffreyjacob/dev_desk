import { AuthController } from "./modules/authentication/auth.controller";
import {
  UserRepository,
  WorkspaceAuthRepository,
} from "./modules/authentication/auth.repository";
import { AuthService } from "./modules/authentication/auth.service";
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

const authService = new AuthService(userRepo, workspaceAuthRepo);
const workspaceService = new WorkspaceService(
  workspaceRepo,
  workspaceMemberRepo,
  workspaceInviteRepo,
  userRepo
);

export const authController = new AuthController(authService);
export const workspaceController = new WorkspaceController(workspaceService);
