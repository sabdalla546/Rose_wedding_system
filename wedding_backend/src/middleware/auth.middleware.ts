// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { User, Role, Permission } from "../models";
import { logger } from "../config/logger";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    roles: string[];
    permissions: string[];
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = (req as any).cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.accessToken;

    const header = req.headers.authorization;
    const headerToken =
      header && header.startsWith("Bearer ") ? header.split(" ")[1] : undefined;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: req.t("auth.missing_token") });
    }

    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.userId, {
      include: [
        {
          model: Role,
          include: [Permission],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: req.t("auth.invalid_token") });
    }

    const roles = (user as any).Roles?.map((r: Role) => r.name) || [];
    const permissionsSet = new Set<string>();
    (user as any).Roles?.forEach((role: any) => {
      role.Permissions?.forEach((perm: Permission) => {
        permissionsSet.add(perm.code);
      });
    });

    req.user = {
      id: user.id,
      roles,
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (err: any) {
    logger.error("Auth error", err);
    return res.status(401).json({ message: req.t("auth.invalid_token") });
  }
};
