// src/middleware/errorHandler.middleware.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error("Unhandled error", err);

  const status = err.status || 500;
  const message = err.message || req.t("common.unexpected_error");

  res.status(status).json({ message });
};
