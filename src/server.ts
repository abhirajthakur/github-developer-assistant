import { McpServer } from "@modelcontextprotocol/server";

import { searchRepositoriesTool } from "./tools/repositories.js";
import { listIssuesTool } from "./tools/issues.js";
import { getPullRequestTool, getPrChecksTool } from "./tools/pull-requests.js";

export function createGitHubServer() {
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

  server.registerTool(
    getPullRequestTool.name,
    getPullRequestTool.config,
    getPullRequestTool.handler,
  );

  server.registerTool(getPrChecksTool.name, getPrChecksTool.config, getPrChecksTool.handler);

  return server;
}
