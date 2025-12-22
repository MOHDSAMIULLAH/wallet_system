import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { createHttpError } from "../utils/httpError";

/**
 * Admin authentication middleware
 * Checks for valid admin API key in Authorization header
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createHttpError(401, "Authorization header required");
    }

    // Expected format: "Bearer <api-key>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw createHttpError(401, "Invalid authorization format. Use: Bearer <api-key>");
    }

    const apiKey = parts[1];

    if (apiKey !== config.admin.apiKey) {
      throw createHttpError(403, "Invalid API key");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};
