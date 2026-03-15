import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { initI18n } from "./config/i18n";

import { errorHandler } from "./middleware/errorHandler.middleware";
import { globalRateLimiter } from "./middleware/rateLimit.middleware";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";

export const createApp = async () => {
  const app = express();

  const i18nMiddleware = await initI18n();
  app.use(i18nMiddleware);

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(globalRateLimiter);

  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "ok", message: req.t("hello") });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/roles", roleRoutes);
  app.use("/api/v1/permissions", permissionRoutes);

  app.use(errorHandler);

  return app;
};
