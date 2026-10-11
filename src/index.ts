import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { listIssuesTool } from "./tools/issues.js";
import { getPrChecksTool, getPullRequestTool } from "./tools/pull-requests.js";
import { searchRepositoriesTool } from "./tools/repositories.js";

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
server.registerTool(getPullRequestTool.name, getPullRequestTool.config, getPullRequestTool.handler);
server.registerTool(getPrChecksTool.name, getPrChecksTool.config, getPrChecksTool.handler);

void serveStdio(() => server);

console.error("GitHub Developer Assistant MCP server started.");
