import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly field?: string;
  readonly headers?: HeadersInit;

  constructor(status: number, code: ErrorCode, message: string, field?: string, headers?: HeadersInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
    this.headers = headers;
  }
}

export function validationError(message: string, field?: string): ApiError {
  return new ApiError(400, "VALIDATION_ERROR", message, field);
}

export function notFound(message = "Resource not found."): ApiError {
  return new ApiError(404, "NOT_FOUND", message);
}

export function conflict(message: string, field?: string): ApiError {
  return new ApiError(409, "CONFLICT", message, field);
}

export function errorResponse(error: unknown): NextResponse {
  const apiError = normalizeError(error);

  return NextResponse.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.field ? { field: apiError.field } : {}),
        timestamp: new Date().toISOString()
      }
    },
    {
      status: apiError.status,
      headers: apiError.headers
    }
  );
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path?.join(".") || undefined;
    return validationError(issue?.message ?? "Request validation failed.", field);
  }

  if (error instanceof Error) {
    return new ApiError(500, "INTERNAL_ERROR", error.message);
  }

  return new ApiError(500, "INTERNAL_ERROR", "Unexpected server-side failure.");
}
