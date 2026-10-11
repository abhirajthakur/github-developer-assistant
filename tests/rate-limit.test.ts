import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createMcpRateLimiter } from "../src/http/rate-limit.js";

describe("MCP rate limiter", () => {
  it("rejects requests after the configured limit", async () => {
    const app = express();

    app.get("/mcp", createMcpRateLimiter(2), (_req, res) => {
      res.status(200).json({ status: "ok" });
    });

    const first = await request(app).get("/mcp");
    const second = await request(app).get("/mcp");
    const third = await request(app).get("/mcp");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({
      error: "Rate limit exceeded. Please retry in a minute.",
    });
    expect(third.headers.ratelimit).toBeDefined();
  });
});
