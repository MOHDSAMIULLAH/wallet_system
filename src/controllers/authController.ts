import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { createHttpError } from "../utils/httpError";
import { generateToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import { ApiResponse } from "../types";

/**
 * Login endpoint
 * Authenticates user and returns JWT token
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    throw createHttpError(401, "Invalid email or password");
  }

  // Verify password
  const isValidPassword = comparePassword(password, user.password);

  if (!isValidPassword) {
    throw createHttpError(401, "Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken(user.id);

  const response: ApiResponse = {
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        clientId: user.clientId,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    },
    message: "Login successful",
  };

  res.json(response);
};

/**
 * Register endpoint
 * Creates a new user account
 */
export const register = async (req: Request, res: Response) => {
  const { clientId, name, email, password, isAdmin = false } = req.body;

  // Validate input
  if (!clientId || !name || !email || !password) {
    throw createHttpError(400, "All fields are required: clientId, name, email, password");
  }

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    throw createHttpError(409, "User with this email already exists");
  }

  // Check if clientId already exists
  const [existingClientId] = await db
    .select()
    .from(users)
    .where(eq(users.clientId, clientId));

  if (existingClientId) {
    throw createHttpError(409, "User with this client ID already exists");
  }

  // Hash password
  const hashedPassword = hashPassword(password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      clientId,
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin,
    })
    .returning();

  // Generate JWT token
  const token = generateToken(newUser.id);

  const response: ApiResponse = {
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        clientId: newUser.clientId,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      },
    },
    message: "Registration successful",
  };

  res.status(201).json(response);
};

/**
 * Get current user profile
 * Requires authentication
 */
export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    throw createHttpError(401, "Authentication required");
  }

  const response: ApiResponse = {
    success: true,
    data: {
      user: req.user,
    },
  };

  res.json(response);
};
