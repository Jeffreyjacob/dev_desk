import { AuthController } from "./modules/authentication/auth.controller";
import {
  UserRepository,
  WorkspaceAuthRepository,
} from "./modules/authentication/auth.repository";
import { AuthService } from "./modules/authentication/auth.service";

const userRepo = new UserRepository();
const workspaceRepo = new WorkspaceAuthRepository();

const authService = new AuthService(userRepo, workspaceRepo);

export const authController = new AuthController(authService);
