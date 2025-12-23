import { Request, Response } from "express";
import { userService } from "../services/userService";
import { createHttpError } from "../utils/httpError";
import { z } from "zod";

// Validation schemas
const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  client_id: z.string().optional(),
  is_admin: z.boolean().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  email: z.string().email("Invalid email address").optional(),
});

/**
 * Create a new user
 * POST /users/create
 */
export const createUser = async (req: Request, res: Response) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const { name, email, password, client_id, is_admin } = validation.data;

  const result = await userService.createUser({
    name,
    email,
    password,
    clientId: client_id,
    isAdmin: is_admin,
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: result,
  });
};

/**
 * Get user by client_id
 * GET /users/:clientId
 */
export const getUserByClientId = async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw createHttpError(400, "client_id is required");
  }

  const result = await userService.getUserByClientId(clientId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * Get all users
 * GET /users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  const limit = req.query.limit
    ? parseInt(req.query.limit as string)
    : undefined;
  const offset = req.query.offset
    ? parseInt(req.query.offset as string)
    : undefined;

  const result = await userService.getAllUsers({ limit, offset });

  res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
};

/**
 * Update user
 * PATCH /users/:clientId
 */
export const updateUser = async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw createHttpError(400, "client_id is required");
  }

  const validation = updateUserSchema.safeParse(req.body);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const result = await userService.updateUser(clientId, validation.data);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: result,
  });
};

/**
 * Delete user
 * DELETE /users/:clientId
 */
export const deleteUser = async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw createHttpError(400, "client_id is required");
  }

  const result = await userService.deleteUser(clientId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
};
