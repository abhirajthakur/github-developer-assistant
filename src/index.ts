import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createGitHubServer } from "./server.js";

void serveStdio(() => createGitHubServer());
