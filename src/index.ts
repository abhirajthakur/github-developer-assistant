import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { searchRepositoriesTool } from "./tools/repositories.js";
import { listIssuesTool } from "./tools/issues.js";

const server = new McpServer({
  name: "github-developer-assistant",
  version: "1.0.0",
});

server.registerTool(
  searchRepositoriesTool.name,
  searchRepositoriesTool.config,
  searchRepositoriesTool.handler,
);

server.registerTool(listIssuesTool.name, listIssuesTool.config, listIssuesTool.handler);

void serveStdio(() => server);

console.error("GitHub Developer Assistant MCP server started.");
