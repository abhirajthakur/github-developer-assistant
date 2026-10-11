import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";

import { createGitHubServer } from "../server.js";
import { createMcpRateLimiter } from "./rate-limit.js";

type HttpAppOptions = {
  host: string;
  allowedHost: string;
  trustProxyHops?: number;
  rateLimit?: number;
};

export function createHttpApp(options: HttpAppOptions) {
  const app = createMcpExpressApp({
    host: options.host,
    allowedHosts: [options.allowedHost],
  });

  app.set("trust proxy", options.trustProxyHops ?? 0);

  const handler = createMcpHandler(() => createGitHubServer());
  const nodeHandler = toNodeHandler(handler);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.all("/mcp", createMcpRateLimiter(options.rateLimit ?? 30), (req, res) => {
    void nodeHandler(req, res, req.body);
  });

  return {
    app,
    close: async () => {
      await handler.close();
    },
  };
}
