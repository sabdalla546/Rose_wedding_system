import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  me,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  loginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.post("/refresh-token", refreshRateLimiter, refreshToken);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);
router.post("/register", registerRateLimiter, register);

export default router;
