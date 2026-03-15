// src/utils/password.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (plain: string) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = (plain: string, hash: string) => {
  return bcrypt.compare(plain, hash);
};

// تقدر تستخدم نفس الآليات للـ tokens
export const hashToken = async (token: string) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(token, salt);
};

export const compareToken = (token: string, hash: string) => {
  return bcrypt.compare(token, hash);
};
