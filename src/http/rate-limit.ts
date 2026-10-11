import { rateLimit } from "express-rate-limit";

export function createMcpRateLimiter(limit = 30) {
  return rateLimit({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Rate limit exceeded. Please retry in a minute.",
    },
  });
}
