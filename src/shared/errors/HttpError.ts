import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exist") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  public details: unknown;
  constructor(message = "Validation Failed", details: unknown) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR", false);
  }
}

export class PlanLimitError extends AppError {
  constructor(message = "Plan limit exceeded") {
    super(message, 403, "PLAN_LIMIT_EXCEEDED");
  }
}
