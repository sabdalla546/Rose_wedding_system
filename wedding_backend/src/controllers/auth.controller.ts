import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth.middleware";
import { RefreshToken, Role, User } from "../models";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  comparePassword,
  compareToken,
  hashPassword,
  hashToken,
} from "../utils/password";
import { loginSchema, registerSchema } from "../validation/auth.schemas";

const isProd = env.nodeEnv === "production";
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 20 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};

const storeRefreshToken = async (userId: number, refreshTokenValue: string) => {
  const payload = verifyRefreshToken(refreshTokenValue);

  if (!payload.exp) {
    throw new Error("Refresh token is missing exp");
  }

  const refreshTokenHash = await hashToken(refreshTokenValue);

  return RefreshToken.create({
    userId,
    token: refreshTokenHash,
    expiresAt: new Date(payload.exp * 1000),
  });
};

const matchesStoredRefreshToken = async (
  refreshTokenValue: string,
  storedTokenValue: string
) => {
  if (storedTokenValue === refreshTokenValue) {
    return true;
  }

  if (!BCRYPT_HASH_PREFIX.test(storedTokenValue)) {
    return false;
  }

  return compareToken(refreshTokenValue, storedTokenValue);
};

const findRefreshTokenRecord = async (
  userId: number,
  refreshTokenValue: string
) => {
  const activeTokens = await RefreshToken.findAll({
    where: {
      userId,
      revoked: false,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    order: [["createdAt", "DESC"]],
  });

  for (const record of activeTokens) {
    if (await matchesStoredRefreshToken(refreshTokenValue, record.token)) {
      return record;
    }
  }

  return null;
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

    await storeRefreshToken(user.id, refreshTokenValue);
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

export const refreshToken = async (req: Request, res: Response) => {
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  const tokenFromBody = (req.body && req.body.refreshToken) || undefined;
  const tokenFromCookie = cookies?.refreshToken;
  const refreshTokenValue = tokenFromBody || tokenFromCookie;

  if (!refreshTokenValue) {
    return res
      .status(400)
      .json({ message: req.t("auth.missing_refresh_token") });
  }

  try {
    const payload = verifyRefreshToken(refreshTokenValue);
    const existingTokenRecord = await findRefreshTokenRecord(
      payload.userId,
      refreshTokenValue
    );

    if (!existingTokenRecord) {
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ message: req.t("auth.invalid_refresh_token") });
    }

    const newAccessToken = signAccessToken({ userId: payload.userId });
    const newRefreshTokenValue = signRefreshToken({ userId: payload.userId });
    const newRefreshTokenRecord = await storeRefreshToken(
      payload.userId,
      newRefreshTokenValue
    );

    await existingTokenRecord.update({
      revoked: true,
      replacedByToken: newRefreshTokenRecord.token,
    });

    setAuthCookies(res, newAccessToken, newRefreshTokenValue);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenValue,
    });
  } catch (err) {
    clearAuthCookies(res);
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

    clearAuthCookies(res);

    return res.json({ message: req.t("auth.logged_out") });
  } catch (err) {
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: req.t("auth.unauthorized") });
  }

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
