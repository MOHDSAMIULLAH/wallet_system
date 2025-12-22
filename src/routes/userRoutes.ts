import { Router } from "express";
import { createUser, getUserByClientId, getAllUsers, updateUser, deleteUser } from "../controllers/userController";
import { adminAuth } from "../middleware/auth";

const router = Router();

router.get("/", getAllUsers);
router.post("/create", createUser);
router.get("/:clientId", getUserByClientId);
router.patch("/:clientId", adminAuth, updateUser);
router.delete("/:clientId", adminAuth, deleteUser);

export default router;
