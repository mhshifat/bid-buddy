import { generateCorrelationId } from "./correlation-id";

/**
 * Base application error class with correlation ID support.
 * - `userMessage`: Human-readable message safe to show in the UI.
 * - `message`: Technical message for server logs / developers.
 * - `correlationId`: Unique ID for tracing this error across systems.
 */
export class AppError extends Error {
  public readonly correlationId: string;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(params: {
    message: string;
    userMessage: string;
    statusCode?: number;
    correlationId?: string;
    isOperational?: boolean;
    cause?: Error;
  }) {
    super(params.message);
    this.name = "AppError";
    this.userMessage = params.userMessage;
    this.statusCode = params.statusCode ?? 500;
    this.correlationId = params.correlationId ?? generateCorrelationId();
    this.isOperational = params.isOperational ?? true;

    if (params.cause) {
      this.cause = params.cause;
    }

    // Preserve proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string,
    correlationId?: string
  ) {
    super({
      message: `${resource} not found${identifier ? `: ${identifier}` : ""}`,
      userMessage: `The requested ${resource.toLowerCase()} could not be found.`,
      statusCode: 404,
      correlationId,
    });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    fieldErrors: Record<string, string[]>,
    correlationId?: string
  ) {
    const errorCount = Object.keys(fieldErrors).length;
    super({
      message: `Validation failed: ${errorCount} field(s) have errors`,
      userMessage: "Please check the form for errors and try again.",
      statusCode: 400,
      correlationId,
    });
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(correlationId?: string) {
    super({
      message: "Unauthorized access attempt",
      userMessage: "You need to sign in to access this resource.",
      statusCode: 401,
      correlationId,
    });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(correlationId?: string) {
    super({
      message: "Forbidden access attempt",
      userMessage: "You do not have permission to perform this action.",
      statusCode: 403,
      correlationId,
    });
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, userMessage: string, correlationId?: string) {
    super({
      message,
      userMessage,
      statusCode: 409,
      correlationId,
    });
    this.name = "ConflictError";
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, cause?: Error, correlationId?: string) {
    super({
      message: `Database error during ${operation}: ${cause?.message ?? "Unknown"}`,
      userMessage:
        "An unexpected error occurred while processing your request. Please try again.",
      statusCode: 500,
      correlationId,
      cause,
    });
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, cause?: Error, correlationId?: string) {
    super({
      message: `External service error [${service}]: ${cause?.message ?? "Unknown"}`,
      userMessage: `We're having trouble connecting to ${service}. Please try again later.`,
      statusCode: 502,
      correlationId,
      cause,
    });
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

