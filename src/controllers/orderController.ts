import { Request, Response } from "express";
import { orderService } from "../services/orderService";
import { createHttpError } from "../utils/httpError";
import { z } from "zod";

// Validation schemas
const createOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

/**
 * Create order
 * POST /orders
 * Headers: client-id
 */
export const createOrder = async (req: Request, res: Response) => {
  const clientId = req.headers["client-id"] as string;


  if (!clientId) {
    throw createHttpError(400, "client-id header is required");
  }

  const validation = createOrderSchema.safeParse(req.body);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const { amount } = validation.data;
  const result = await orderService.createOrder(clientId, amount);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: result,
  });
};

/**
 * Get order details
 * GET /orders/:order_id
 * Headers: client-id
 */
export const getOrderDetails = async (req: Request, res: Response) => {
  const clientId = req.headers["client-id"] as string;
  const { order_id } = req.params;

  if (!clientId) {
    throw createHttpError(400, "client-id header is required");
  }

  if (!order_id) {
    throw createHttpError(400, "order_id parameter is required");
  }

  const result = await orderService.getOrderDetails(clientId, order_id);

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * Get all orders for client
 * GET /orders
 * Headers: client-id
 */
export const getClientOrders = async (req: Request, res: Response) => {
  const clientId = req.headers["client-id"] as string;

  if (!clientId) {
    throw createHttpError(400, "client-id header is required");
  }

  const result = await orderService.getClientOrders(clientId);

  res.status(200).json({
    success: true,
    data: result,
  });
};
