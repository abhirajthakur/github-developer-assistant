import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import env from "./config/env.js";
import { createMcpRateLimiter } from "./http/rate-limit.js";
import { createGitHubServer } from "./server.js";

const allowedHost = env.MCP_ALLOWED_HOST;

if (!allowedHost) {
  throw new Error("MCP_ALLOWED_HOST must be set when starting the HTTP server.");
}

const app = createMcpExpressApp({
  host: "0.0.0.0",
  allowedHosts: [allowedHost],
});

// Trust only the configured number of reverse-proxy hops.
// Set TRUST_PROXY_HOPS=1 on Render.
app.set("trust proxy", env.TRUST_PROXY_HOPS);

const mcpRateLimiter = createMcpRateLimiter();

const handler = createMcpHandler(() => createGitHubServer());
const nodeHandler = toNodeHandler(handler);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.all("/mcp", mcpRateLimiter, (req, res) => {
  void nodeHandler(req, res, req.body);
});

const httpServer = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`MCP HTTP server listening on port ${env.PORT}`);
});

async function shutdown() {
  console.log("Shutting down MCP HTTP server...");

  httpServer.close();
  await handler.close();

  console.log("MCP HTTP server stopped.");
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
