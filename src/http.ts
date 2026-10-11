import env from "./config/env.js";
import { createHttpApp } from "./http/app.js";

const allowedHost = env.MCP_ALLOWED_HOST;

if (!allowedHost) {
  throw new Error("MCP_ALLOWED_HOST must be set when starting the HTTP server.");
}

const { app, close } = createHttpApp({
  host: "0.0.0.0",
  allowedHost,
  trustProxyHops: env.TRUST_PROXY_HOPS,
});

const httpServer = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`MCP HTTP server listening on port ${env.PORT}`);
});

async function shutdown() {
  console.log("Shutting down MCP HTTP server...");

  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await close();
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
