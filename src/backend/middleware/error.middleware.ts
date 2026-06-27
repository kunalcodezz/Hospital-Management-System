import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || undefined;

  // Handle Zod validation errors (duck-type check for cross-module compatibility)
  if (err instanceof ZodError || (err.name === "ZodError" && Array.isArray(err.issues))) {
    statusCode = 400;
    message = "Validation Error";
    const issues = Array.isArray(err.issues) ? err.issues : [];
    errors = issues.map((e: any) => ({
      field: e.path?.join(".") || "unknown",
      message: e.message || "Invalid value",
    }));
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = "Resource already exists (duplicate key error)";
    const field = Object.keys(err.keyValue || {})[0];
    errors = [{ field, message: `This ${field} is already in use.` }];
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  console.error(`[Error] ${req.method} ${req.url} - Status ${statusCode} - ${message}`);
  if (err.stack && env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
