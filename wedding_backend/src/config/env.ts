// src/config/env.ts
import dotenv from "dotenv";

dotenv.config();

const parseCorsOrigins = () => {
  const rawOrigins =
    process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "http://localhost:5173";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  corsOrigins: parseCorsOrigins(),

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || "ewallet_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh_secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
};
