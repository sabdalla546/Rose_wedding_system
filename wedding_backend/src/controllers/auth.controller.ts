// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { User, RefreshToken, Role, Permission } from "../models";
import {
  hashPassword,
  comparePassword,
  hashToken,
  compareToken,
} from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { loginSchema, registerSchema } from "../validation/auth.schemas";
import { ZodError } from "zod";
import { Op } from "sequelize";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth.middleware";

const isProd = env.nodeEnv === "production";

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 20 * 60 * 1000,
    // تقدر تضيف maxAge هنا لو حابب تحسبها
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ message: req.t("auth.email_exists") });
    }

    const passwordHash = await hashPassword(data.password);

    const user = await User.create({
      email: data.email,
      password: passwordHash,
      fullName: data.fullName,
    });

    // ممكن تعطيه role افتراضي "user"
    const defaultRole = await Role.findOne({ where: { name: "user" } });
    if (defaultRole) {
      await (user as any).$add("Roles", defaultRole.id);
    }

    return res.status(201).json({
      message: req.t("auth.user_created"),
      data: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      return res
        .status(400)
        .json({ message: req.t("auth.invalid_credentials") });
    }

    const valid = await comparePassword(data.password, user.password);
    if (!valid) {
      return res
        .status(400)
        .json({ message: req.t("auth.invalid_credentials") });
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshTokenValue = signRefreshToken({ userId: user.id });

    const decoded: any = verifyRefreshToken(refreshTokenValue);

    // نخزن refresh token بشكل مشفّر (hashed)
    // const refreshTokenHash = await hashToken(refreshTokenValue);

    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenValue, // ✅ خزنها كما هي
      expiresAt: new Date(decoded.exp * 1000),
    });
    // نضبط الكوكيز
    setAuthCookies(res, accessToken, refreshTokenValue);

    return res.json({
      accessToken,
      refreshToken: refreshTokenValue,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
// src/controllers/auth.controller.ts
export const refreshToken = async (req: Request, res: Response) => {
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  const tokenFromBody = (req.body && req.body.refreshToken) || undefined;
  const tokenFromCookie = cookies?.refreshToken;

  const refreshToken = tokenFromBody || tokenFromCookie;

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: req.t("auth.missing_refresh_token") });
  }

  try {
    // فقط تأكد إن الـ JWT بتاع refresh صالح
    const payload = verifyRefreshToken(refreshToken);

    // أصدر access + refresh جديدين
    const newAccessToken = signAccessToken({ userId: payload.userId });
    const newRefreshTokenValue = signRefreshToken({ userId: payload.userId });

    // حدّث الكوكيز
    setAuthCookies(res, newAccessToken, newRefreshTokenValue);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenValue,
    });
  } catch (err) {
    return res
      .status(401)
      .json({ message: req.t("auth.invalid_refresh_token") });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: req.t("auth.unauthorized") });
    }

    // revoke كل الـ refresh tokens الخاصة باليوزر
    await RefreshToken.update(
      {
        revoked: true,
        replacedByToken: null,
      },
      {
        where: {
          userId,
          revoked: false,
        },
      }
    );

    // مسح الكوكيز
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    return res.json({ message: req.t("auth.logged_out") });
  } catch (err) {
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: req.t("auth.unauthorized") });
  }

  // ممكن ترجع بيانات إضافية من جدول users لو حابب
  const user = await User.findByPk(req.user.id, {
    attributes: ["id", "email", "fullName", "isActive", "createdAt"],
    include: [Role],
  });

  if (!user) {
    return res.status(401).json({ message: req.t("auth.unauthorized") });
  }

  return res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    roles: (user as any).Roles?.map((r: Role) => r.name) || [],
    permissions: req.user.permissions || [],
  });
};
