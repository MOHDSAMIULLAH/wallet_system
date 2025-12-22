import { Router } from "express";
import { creditWallet, debitWallet } from "../controllers/adminController";
import { requireAdmin } from "../middleware/auth";

const router = Router();

// All routes require admin role (authenticated user with isAdmin=true)
router.use(requireAdmin);

router.post("/wallet/credit", creditWallet);
router.post("/wallet/debit", debitWallet);

export default router;
