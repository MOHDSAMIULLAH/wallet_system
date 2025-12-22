import { Router } from "express";
import { creditWallet, debitWallet } from "../controllers/adminController";
import { adminAuth } from "../middleware/auth";

const router = Router();

router.use(adminAuth);

router.post("/wallet/credit", creditWallet);
router.post("/wallet/debit", debitWallet);

export default router;
