// src/utils/jwt.ts
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: number;
  exp?: number;
}

// تأكيد أن الـ secrets متوافقة مع نوع Secret
const accessSecret: Secret = env.jwt.accessSecret;
const refreshSecret: Secret = env.jwt.refreshSecret;

// ضبط خيارات التوكنز (مع cast بسيط على expiresIn)
const accessTokenOptions: SignOptions = {
  expiresIn: env.jwt.accessExpiresIn as SignOptions["expiresIn"],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.jwt.refreshExpiresIn as SignOptions["expiresIn"],
};

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, accessSecret, accessTokenOptions);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, refreshSecret, refreshTokenOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  // نرجّع الـ payload الخاص بينا فقط
  const decoded = jwt.verify(token, accessSecret) as jwt.JwtPayload | string;

  if (typeof decoded === "string") {
    // في حالتنا مش متوقعين string، بس نرمي خطأ واضح لو حصل
    throw new Error("Invalid access token payload");
  }

  return {
    userId: (decoded as any).userId,
    exp: (decoded as any).exp,
  };
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, refreshSecret) as jwt.JwtPayload | string;

  if (typeof decoded === "string") {
    throw new Error("Invalid refresh token payload");
  }

  return {
    userId: (decoded as any).userId,
    exp: (decoded as any).exp,
  };
};
