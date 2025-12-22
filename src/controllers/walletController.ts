import { Request, Response } from "express";
import { walletService } from "../services/walletService";
import { createHttpError } from "../utils/httpError";

/**
 * Get wallet balance
 * GET /wallet/balance
 * Headers: client-id
 */
export const getBalance = async (req: Request, res: Response) => {
  const clientId = req.headers["client-id"] as string;

  if (!clientId) {
    throw createHttpError(400, "client-id header is required");
  }

  const result = await walletService.getBalance(clientId);

  res.status(200).json({
    success: true,
    data: result,
  });
};
