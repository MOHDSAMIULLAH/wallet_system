import { db } from "../db";
import { orders, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { walletService } from "./walletService";
import { fulfillmentService } from "./fulfillmentService";
import { OrderStatus } from "../types";
import { createHttpError } from "../utils/httpError";
import { v4 as uuidv4 } from "uuid";

export class OrderService {
  /**
   * Create order with atomic wallet deduction and fulfillment API call
   */
  async createOrder(clientId: string, amount: number) {
    // Validate amount
    if (amount <= 0) {
      throw createHttpError(400, "Order amount must be greater than 0");
    }

    // Validate precision (2 decimal places)
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      throw createHttpError(400, "Amount must have at most 2 decimal places");
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`;

    try {
      // Step 1: Create order record in PENDING state
      const [order] = await db
        .insert(orders)
        .values({
          orderId,
          userId: user.id,
          amount: amount.toFixed(2),
          status: OrderStatus.PENDING,
        })
        .returning();

      // Step 2: Atomically deduct from wallet
      try {
        await walletService.deductForOrder(user.id, amount, orderId);
      } catch (error) {
        // If wallet deduction fails, mark order as FAILED
        await db
          .update(orders)
          .set({
            status: OrderStatus.FAILED,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        throw error;
      }

      // Step 3: Call fulfillment API
      let fulfillmentId: string | null = null;
      try {
        const fulfillmentResponse = await fulfillmentService.createFulfillmentWithRetry(
          clientId,
          orderId,
          3
        );
        fulfillmentId = fulfillmentResponse.id.toString();
      } catch (error) {
        // Fulfillment API failed - log but don't fail the order
        // In production, you might want to implement a retry queue
        console.error("Fulfillment API failed:", error);
        
        // Mark order as FAILED since fulfillment couldn't be created
        await db
          .update(orders)
          .set({
            status: OrderStatus.FAILED,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        throw createHttpError(
          500,
          "Order created and amount deducted, but fulfillment failed. Please contact support."
        );
      }

      // Step 4: Update order with fulfillment ID and mark as COMPLETED
      const [updatedOrder] = await db
        .update(orders)
        .set({
          fulfillmentId,
          status: OrderStatus.COMPLETED,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      return {
        orderId: updatedOrder.orderId,
        amount: parseFloat(updatedOrder.amount),
        status: updatedOrder.status,
        fulfillmentId: updatedOrder.fulfillmentId,
        createdAt: updatedOrder.createdAt,
      };
    } catch (error) {
      // If error has statusCode, it's an HTTP error, rethrow it
      if ((error as any).statusCode) {
        throw error;
      }

      // Otherwise, wrap it
      throw createHttpError(500, "Failed to create order");
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(clientId: string, orderId: string) {
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    // Get order
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderId, orderId),
    });

    if (!order) {
      throw createHttpError(404, "Order not found");
    }

    // Verify order belongs to user
    if (order.userId !== user.id) {
      throw createHttpError(403, "Access denied: Order does not belong to this user");
    }

    return {
      orderId: order.orderId,
      amount: parseFloat(order.amount),
      status: order.status,
      fulfillmentId: order.fulfillmentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Get all orders for a client
   */
  async getClientOrders(clientId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.clientId, clientId),
    });

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const clientOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    return clientOrders.map((order) => ({
      orderId: order.orderId,
      amount: parseFloat(order.amount),
      status: order.status,
      fulfillmentId: order.fulfillmentId,
      createdAt: order.createdAt,
    }));
  }
}

export const orderService = new OrderService();
