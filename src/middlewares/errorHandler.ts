import { NextFunction, Request, Response } from "express";
import { AppError, ValidationError } from "../shared/errors";
import { Prisma } from "../generated/prisma/client";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger";
import { env } from "../config/env";

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let message: string = "Internal server error";
  let code: string = "INTERNAL_SERVER_ERROR";
  let statusCode: number = 500;
  let details: any;

  if (err instanceof ValidationError) {
    message = err.message;
    statusCode = err.statusCode;
    code = err.code;
    details = err.details;
  } else if (err instanceof AppError) {
    message = err.message;
    code = err.code;
    statusCode = err.statusCode;

    if (err.isOperational) {
      req.log?.warn({ err, path: req.path });
    } else {
      req.log?.fatal({ err, path: req.path });
    }
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "Resource conflict";
      code = "CONFLICT_ERROR";
      statusCode = 409;
      req.log?.warn({ err, path: req.path });
    }
    if (err.code === "P2025") {
      message = "Resource not found";
      code = "NOT_FOUND";
      statusCode = 404;
      req.log?.warn({ err, path: req.path });
    }
  } else if (err instanceof jwt.TokenExpiredError) {
    message = err.message;
    code = "UNAUTHORIZED";
    statusCode = 401;
    req.log?.warn({ err, path: req.path });
  } else if (err instanceof jwt.JsonWebTokenError) {
    message = err.message;
    code = "UNAUTHORIZED";
    statusCode = 401;
    logger.warn({ err, path: req.path });
  } else {
    logger.fatal({ err, path: req.path });
  }

  if (!res.headersSent) {
    return res.status(statusCode).json({
      message,
      error: {
        code,
        ...(details ? { details } : {}),
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
  }
};
