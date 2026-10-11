import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { githubGet, GitHubResponseValidationError } from "../../src/services/github-client.js";

const exampleSchema = z.object({
  name: z.string(),
  stars: z.number().int().nonnegative(),
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("githubGet", () => {
  it("returns data matching the response schema", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ name: "example", stars: 42 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await githubGet("/test", exampleSchema);

    expect(result).toEqual({ name: "example", stars: 42 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects malformed response data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ name: "example", stars: "many" })),
    );

    await expect(githubGet("/test", exampleSchema)).rejects.toBeInstanceOf(
      GitHubResponseValidationError,
    );
  });

  it.each([
    [401, "GitHub authentication failed."],
    [403, "GitHub rate limit or permission restriction."],
    [404, "GitHub resource not found."],
    [500, "GitHub API returned HTTP 500."],
  ])("handles HTTP %i errors safely", async (status, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "sensitive upstream details" }, status)),
    );

    await expect(githubGet("/test", exampleSchema)).rejects.toMatchObject({
      name: "GitHubApiError",
      status,
      message,
    });
  });

  it("propagates network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network unavailable")));

    await expect(githubGet("/test", exampleSchema)).rejects.toThrow("Network unavailable");
  });
});
