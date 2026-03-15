// src/middleware/rateLimit.middleware.ts
import rateLimit from "express-rate-limit";

// Global limiter – يحمي الـ API بشكل عام
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 1000, // أقصى عدد requests لكل IP في الـ window
  standardHeaders: true, // يضيف RateLimit-* headers
  legacyHeaders: false,
});

// Limiter لمحاسبة محاولات login (Brute force protection)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 محاولات في 15 دقيقة لكل IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

// ممكن تستخدمه برضه على refresh-token لو حابب:
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many token refresh attempts. Please try again later.",
  },
});
