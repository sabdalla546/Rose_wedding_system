import { Router } from "express";

import { getCalendarFeed } from "../controllers/calendar.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/feed", authMiddleware, getCalendarFeed);

export default router;
