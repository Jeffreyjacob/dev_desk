import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors";
import { verifyAccessToken } from "../shared/utils/token";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    next(error);
  }
};

export const requireWorkspace = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user?.workspaceId) {
    throw new UnauthorizedError(
      "No workspace selected. Please activate a workspace first"
    );
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.role) {
      throw new UnauthorizedError("No workspace context");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `This action requires one of these roles: ${roles.join(", ")}`
      );
    }
    next();
  };
};
