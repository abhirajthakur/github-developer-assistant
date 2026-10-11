import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpApp } from "../../src/http/app.js";

describe("MCP HTTP integration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("discovers tools and calls repository search over HTTP", async () => {
    const realFetch = globalThis.fetch;

    const fakeGitHubResponse = {
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          full_name: "modelcontextprotocol/typescript-sdk",
          description: "Official MCP TypeScript SDK",
          html_url: "https://github.com/modelcontextprotocol/typescript-sdk",
          stargazers_count: 100,
          language: "TypeScript",
          updated_at: "2026-10-01T12:00:00Z",
        },
      ],
    };

    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());

      if (url.hostname === "127.0.0.1") {
        return realFetch(input, init);
      }

      if (url.hostname === "api.github.com") {
        return new Response(JSON.stringify(fakeGitHubResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch destination: ${url.hostname}`);
    });

    const { app, close } = createHttpApp({
      host: "127.0.0.1",
      allowedHost: "127.0.0.1",
      rateLimit: 30,
    });

    const httpServer = app.listen(0, "127.0.0.1");

    let client: Client | undefined;

    try {
      // Wait until the OS assigns the ephemeral port.
      await new Promise<void>((resolve, reject) => {
        httpServer.once("listening", resolve);
        httpServer.once("error", reject);
      });

      const address = httpServer.address();

      if (!address || typeof address === "string") {
        throw new Error("Could not determine the test server port");
      }

      client = new Client({
        name: "github-developer-assistant-test",
        version: "1.0.0",
      });

      const transport = new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
      );

      await client.connect(transport);

      const tools = await client.listTools();

      expect(tools.tools.some((tool) => tool.name === "search_repositories")).toBe(true);

      const result = await client.callTool({
        name: "search_repositories",
        arguments: {
          query: "modelcontextprotocol",
          limit: 1,
          sort: "stars",
        },
      });

      expect(result.isError).not.toBe(true);

      const textContent = result.content.find((item) => item.type === "text");

      if (!textContent || textContent.type !== "text") {
        throw new Error("Expected a text result from repository search");
      }

      const payload = JSON.parse(textContent.text);

      expect(payload.repositories).toHaveLength(1);
      expect(payload.repositories[0].name).toBe("modelcontextprotocol/typescript-sdk");
    } finally {
      try {
        if (client) {
          await client.close();
        }
      } finally {
        try {
          if (httpServer.listening) {
            await new Promise<void>((resolve, reject) => {
              httpServer.close((error) => {
                if (error) reject(error);
                else resolve();
              });
            });
          }
        } finally {
          await close();
        }
      }
    }
  });
});
