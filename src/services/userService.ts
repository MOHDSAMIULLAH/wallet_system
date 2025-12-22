import { db } from "../db";
import { users, wallets } from "../db/schema";
import { eq } from "drizzle-orm";
import { createHttpError } from "../utils/httpError";
import { v4 as uuidv4 } from "uuid";

export class UserService {
  /**
   * Create a new user with client_id
   * POST /users/create
   */
  async createUser(data: {
    name?: string;
    email?: string;
    clientId?: string;
    isAdmin?: boolean;
  }) {
    const {
      name,
      email,
      clientId = `client_${uuidv4()}`,
      isAdmin = false,
    } = data;

    // Check if clientId already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (existingUser) {
      throw createHttpError(409, "User with this client_id already exists");
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmail) {
        throw createHttpError(409, "User with this email already exists");
      }
    }

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        clientId,
        name: name || `User ${clientId}`,
        email: email || `${clientId}@example.com`,
        isAdmin,
      })
      .returning();

    // Create wallet for new user
    await db.insert(wallets).values({
      userId: newUser.id,
      balance: "0.00",
    });

    return {
      id: newUser.id,
      clientId: newUser.clientId,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Get user by client_id
   * GET /users/:clientId
   */
  async getUserByClientId(clientId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
      with: {
        wallet: true,
      },
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return {
      id: user.id,
      clientId: user.clientId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      wallet: user.wallet,
    };
  }

  /**
   * Get all users
   * GET /users
   */
  async getAllUsers(params?: { limit?: number; offset?: number }) {
    const { limit = 50, offset = 0 } = params || {};

    const allUsers = await db.query.users.findMany({
      limit,
      offset,
      with: {
        wallet: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return allUsers.map((user) => ({
      id: user.id,
      clientId: user.clientId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      wallet: user.wallet,
    }));
  }

  /**
   * Update user
   * PATCH /users/:clientId
   */
  async updateUser(
    clientId: string,
    data: {
      name?: string;
      email?: string;
    }
  ) {
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    // Check if email is being updated and if it's already in use
    if (data.email && data.email !== user.email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (existingEmail) {
        throw createHttpError(409, "Email already in use");
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        updatedAt: new Date(),
      })
      .where(eq(users.clientId, clientId))
      .returning();

    return {
      id: updatedUser.id,
      clientId: updatedUser.clientId,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * Delete user
   * DELETE /users/:clientId
   */
  async deleteUser(clientId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    // Delete user (cascade will handle wallet and related records)
    await db.delete(users).where(eq(users.clientId, clientId));

    return {
      success: true,
      message: "User deleted successfully",
    };
  }
}

export const userService = new UserService();
