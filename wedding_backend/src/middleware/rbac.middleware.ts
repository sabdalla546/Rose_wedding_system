// src/middleware/rbac.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: req.t("auth.unauthorized") });
    }
    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ message: req.t("auth.forbidden") });
    }
    next();
  };
};

export const requirePermissions = (...perms: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: req.t("auth.unauthorized") });
    }
    const hasPerm = perms.every((p) => req.user!.permissions.includes(p));
    if (!hasPerm) {
      return res.status(403).json({ message: req.t("auth.forbidden") });
    }
    next();
  };
};
