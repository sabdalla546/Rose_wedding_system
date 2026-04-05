import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

const buildRateLimiter = ({
  windowMs,
  max,
  message,
  skipSuccessfulRequests = false,
}: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: (req) => req.method === "OPTIONS" || req.path === "/health",
    handler: (_req, res) => {
      res.status(429).json({
        message,
      });
    },
  });

export const globalRateLimiter = buildRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 300,
  message: "Too many requests. Please try again later.",
});

export const loginRateLimiter = buildRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  message: "Too many login attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

export const refreshRateLimiter = buildRateLimiter({
  windowMs: FIVE_MINUTES,
  max: 20,
  message: "Too many token refresh attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

export const registerRateLimiter = buildRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: "Too many registration attempts. Please try again later.",
  skipSuccessfulRequests: true,
});
