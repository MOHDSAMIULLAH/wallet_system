import { Request, Response } from "express";
import { walletService } from "../services/walletService";
import { createHttpError } from "../utils/httpError";
import { z } from "zod";

// Validation schemas
const creditWalletSchema = z.object({
  client_id: z.string().min(1, "client_id is required"),
  amount: z.number().positive("Amount must be positive"),
});

const debitWalletSchema = z.object({
  client_id: z.string().min(1, "client_id is required"),
  amount: z.number().positive("Amount must be positive"),
});

/**
 * Credit wallet
 * POST /admin/wallet/credit
 */
export const creditWallet = async (req: Request, res: Response) => {
  const validation = creditWalletSchema.safeParse(req.body);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const { client_id, amount } = validation.data;
  const result = await walletService.creditWallet(client_id, amount);

  res.status(200).json({
    success: true,
    message: "Wallet credited successfully",
    data: result,
  });
};

/**
 * Debit wallet
 * POST /admin/wallet/debit
 */
export const debitWallet = async (req: Request, res: Response) => {
  const validation = debitWalletSchema.safeParse(req.body);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const { client_id, amount } = validation.data;
  const result = await walletService.debitWallet(client_id, amount);

  res.status(200).json({
    success: true,
    message: "Wallet debited successfully",
    data: result,
  });
};
