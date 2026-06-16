import { Router } from "express";
import { authRateLimit, loginRateLimit } from "../../middlewares/ratelimit";
import { AsyncHandler } from "../../shared/utils/asyncHandler";
import { authController } from "../../container";
import { authenticate } from "../../middlewares/authentication";

const router = Router();

router.post(
  "/register",
  authRateLimit,
  AsyncHandler(authController.register.bind(authController))
);

router.post(
  "/verify-email",
  AsyncHandler(authController.verifyEmail.bind(authController))
);

router.post(
  "/resend-verification",
  authRateLimit,
  AsyncHandler(authController.resendVerification.bind(authController))
);

router.post(
  "/login",
  loginRateLimit,
  AsyncHandler(authController.login.bind(authController))
);

router.post(
  "/refresh",
  AsyncHandler(authController.refresh.bind(authController))
);

router.post(
  "/forget-password",
  authRateLimit,
  AsyncHandler(authController.forgetPassword.bind(authController))
);

router.post(
  "/reset-password",
  AsyncHandler(authController.resetPassword.bind(authController))
);

router.post(
  "/logout",
  authenticate,
  AsyncHandler(authController.logout.bind(authController))
);

router.post(
  "/workspace/:workspaceId/activate",
  authenticate,
  AsyncHandler(authController.activateWorkspace.bind(authController))
);

router.get(
  "/me",
  authenticate,
  AsyncHandler(authController.getMe.bind(authController))
);

export default router;
