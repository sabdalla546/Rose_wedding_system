import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  me,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);
router.post("/register", register);

export default router;
