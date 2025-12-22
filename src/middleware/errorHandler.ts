import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Get status code from error or default to 500
  const statusCode = (err as any).statusCode || 500;

  // Handle Drizzle/Database errors
  if (err.name === "PostgresError") {
    return res.status(500).json({
      success: false,
      error: "Database error occurred",
    });
  }

  // Handle validation errors (from zod or other libraries)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Return error response
  return res.status(statusCode).json({
    success: false,
    error: err.message || "Internal server error",
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
