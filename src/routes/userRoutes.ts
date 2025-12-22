import { Router } from "express";
import { createUser, getUserByClientId, getAllUsers, updateUser, deleteUser } from "../controllers/userController";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", getAllUsers);
router.post("/create", createUser);
router.get("/:clientId", getUserByClientId);
router.patch("/:clientId", requireAdmin, updateUser);
router.delete("/:clientId", requireAdmin, deleteUser);

export default router;
