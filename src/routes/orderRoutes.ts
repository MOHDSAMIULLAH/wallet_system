import { Router } from "express";
import { createOrder, getOrderDetails, getClientOrders } from "../controllers/orderController";

const router = Router();

router.get("/", getClientOrders);
router.post("/", createOrder);
router.get("/:order_id", getOrderDetails);

export default router;
