import { db } from "../db";
import { users, wallets, ledgerEntries } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { TransactionType } from "../types";
import { createHttpError } from "../utils/httpError";

export class WalletService {
  /**
   * Get or create user by client_id
   */
  async getOrCreateUser(clientId: string) {
    let user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      // Auto-create user if doesn't exist
      const [newUser] = await db
        .insert(users)
        .values({
          clientId,
          name: `User ${clientId}`,
          email: `${clientId}@example.com`,
          isAdmin: false,
        })
        .returning();
      user = newUser;

      // Create wallet for new user
      await db.insert(wallets).values({
        userId: user.id,
        balance: "0.00",
      });
    }

    return user;
  }

  /**
   * Get user wallet with lock for atomic operations
   */
  async getUserWallet(userId: number, forUpdate: boolean = false) {
    const query = db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    // For atomic operations, we'll use SQL-level locking
    if (forUpdate) {
      const result = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for("update");
      return result[0];
    }

    return await query;
  }

  /**
   * Credit wallet with transaction logging (Admin operation)
   */
  async creditWallet(clientId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw createHttpError(400, "Amount must be greater than 0");
    }

    // Get or create user
    const user = await this.getOrCreateUser(clientId);

    // Get current wallet
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, user.id),
    });

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    // Update wallet balance using atomic SQL operation
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount.toFixed(2)}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, user.id));

    // Create ledger entry
    await db.insert(ledgerEntries).values({
      userId: user.id,
      transactionType: TransactionType.CREDIT,
      amount: amount.toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
      description: description || "Admin credit",
    });

    return {
      clientId,
      previousBalance: balanceBefore,
      newBalance: balanceAfter,
      amountCredited: amount,
    };
  }

  /**
   * Debit wallet with transaction logging (Admin operation)
   */
  async debitWallet(clientId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw createHttpError(400, "Amount must be greater than 0");
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    // Get current wallet
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, user.id),
    });

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    const balanceBefore = parseFloat(wallet.balance);

    // Check sufficient balance
    if (balanceBefore < amount) {
      throw createHttpError(400, "Insufficient balance");
    }

    const balanceAfter = balanceBefore - amount;

    // Update wallet balance using atomic SQL operation with check
    const result = await db
      .update(wallets)
      .set({
        balance: sql`CASE WHEN ${wallets.balance}::numeric >= ${amount.toFixed(2)}::numeric THEN ${wallets.balance}::numeric - ${amount.toFixed(2)}::numeric ELSE ${wallets.balance} END`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, user.id))
      .returning();

    // Verify the balance was actually updated
    if (result.length === 0 || parseFloat(result[0].balance) === balanceBefore) {
      throw createHttpError(400, "Insufficient balance for debit operation");
    }

    // Create ledger entry
    await db.insert(ledgerEntries).values({
      userId: user.id,
      transactionType: TransactionType.DEBIT,
      amount: amount.toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
      description: description || "Admin debit",
    });

    return {
      clientId,
      previousBalance: balanceBefore,
      newBalance: balanceAfter,
      amountDebited: amount,
    };
  }

  /**
   * Deduct amount from wallet atomically (for order creation)
   */
  async deductForOrder(userId: number, amount: number, orderId: string) {
    if (amount <= 0) {
      throw createHttpError(400, "Amount must be greater than 0");
    }

    // Get current wallet
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    const balanceBefore = parseFloat(wallet.balance);

    // Check sufficient balance
    if (balanceBefore < amount) {
      throw createHttpError(400, "Insufficient wallet balance for order");
    }

    const balanceAfter = balanceBefore - amount;

    // Update wallet balance using atomic SQL operation with check
    const result = await db
      .update(wallets)
      .set({
        balance: sql`CASE WHEN ${wallets.balance}::numeric >= ${amount.toFixed(2)}::numeric THEN ${wallets.balance}::numeric - ${amount.toFixed(2)}::numeric ELSE ${wallets.balance} END`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    // Verify the balance was actually updated
    if (result.length === 0 || parseFloat(result[0].balance) === balanceBefore) {
      throw createHttpError(400, "Insufficient wallet balance for order");
    }

    // Create ledger entry
    await db.insert(ledgerEntries).values({
      userId: userId,
      transactionType: TransactionType.ORDER_DEDUCTION,
      amount: amount.toFixed(2),
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
      referenceId: orderId,
      description: `Order deduction - ${orderId}`,
    });

    return {
      previousBalance: balanceBefore,
      newBalance: balanceAfter,
      amountDeducted: amount,
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(clientId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
      with: {
        wallet: true,
      },
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, user.id),
    });

    if (!wallet) {
      throw createHttpError(404, "Wallet not found");
    }

    return {
      clientId,
      balance: parseFloat(wallet.balance),
      lastUpdated: wallet.updatedAt,
    };
  }
}

export const walletService = new WalletService();
