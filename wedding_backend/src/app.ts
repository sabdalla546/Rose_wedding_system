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
import venueRoutes from "./routes/venue.routes";
import appointmentRoutes from "./routes/appointment.routes";
import customerRoutes from "./routes/customer.routes";
import eventRoutes from "./routes/event.routes";
import vendorRoutes from "./routes/vendor.routes";
import serviceRoutes from "./routes/service.routes";
import quotationRoutes from "./routes/quotation.routes";
import contractRoutes from "./routes/contract.routes";
import calendarRoutes from "./routes/calendar.routes";

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

  app.use("/api/v1/venues", venueRoutes);
  app.use("/api/v1/appointments", appointmentRoutes);
  app.use("/api/v1/customers", customerRoutes);

  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/calendar", calendarRoutes);
  app.use("/api/v1/vendors", vendorRoutes);
  app.use("/api/v1/services", serviceRoutes);
  app.use("/api/v1/quotations", quotationRoutes);
  app.use("/api/v1/contracts", contractRoutes);
  app.use(errorHandler);

  return app;
};
