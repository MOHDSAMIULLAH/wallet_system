import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { createHttpError } from "../utils/httpError";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { AuthenticatedUser } from "../types";

/**
 * User authentication middleware
 * Validates JWT token and attaches user info to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createHttpError(401, "Authorization header required");
    }

    // Expected format: "Bearer <jwt-token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw createHttpError(401, "Invalid authorization format. Use: Bearer <token>");
    }

    const token = parts[1];

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };

    // Fetch user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));

    if (!user) {
      throw createHttpError(401, "User not found");
    }

    // Attach user to request
    req.user = {
      id: user.id,
      clientId: user.clientId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createHttpError(401, "Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createHttpError(401, "Token expired"));
    } else {
      next(error);
    }
  }
};

/**
 * Role-based authorization middleware
 * Requires user to be authenticated and have admin role
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First authenticate the user
    await authenticate(req, res, (err?: any) => {
      if (err) {
        return next(err);
      }

      // Check if user has admin role
      if (!req.user) {
        throw createHttpError(401, "Authentication required");
      }

      if (!req.user.isAdmin) {
        throw createHttpError(403, "Admin access required");
      }

      next();
    });
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
