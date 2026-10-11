import { describe, expect, it } from "vitest";

import { buildRepositorySearchParams } from "../../src/tools/repositories.js";

describe("buildRepositorySearchParams", () => {
  it("omits sort for best-match ranking", () => {
    const params = buildRepositorySearchParams({
      query: "modelcontextprotocol typescript sdk",
      limit: 3,
      sort: "best_match",
    });

    expect(params).toEqual({
      q: "modelcontextprotocol typescript sdk",
      per_page: "3",
    });
  });

  it("sorts by stars", () => {
    const params = buildRepositorySearchParams({
      query: "modelcontextprotocol",
      limit: 5,
      sort: "stars",
    });

    expect(params.sort).toBe("stars");
  });

  it("sorts by most recently updated", () => {
    const params = buildRepositorySearchParams({
      query: "modelcontextprotocol",
      limit: 5,
      sort: "updated",
    });

    expect(params.sort).toBe("updated");
  });

  it("includes the language filter", () => {
    const params = buildRepositorySearchParams({
      query: "mcp server",
      language: "TypeScript",
      limit: 3,
      sort: "best_match",
    });

    expect(params.q).toBe("mcp server language:TypeScript");
  });
});
