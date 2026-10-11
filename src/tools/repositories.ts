import { z } from "zod";
import { githubSearchResponseSchema } from "../schemas/github.js";
import { githubGet } from "../services/github-client.js";

const searchRepositoriesSchema = z.object({
  query: z.string().trim().min(1).max(200),
  language: z.string().trim().min(1).max(50).optional(),
  limit: z.number().int().min(1).max(10).default(5),
  sort: z.enum(["best_match", "stars", "updated"]).default("best_match"),
});

type SearchRepositoriesInput = z.infer<typeof searchRepositoriesSchema>;

export const searchRepositoriesTool = {
  name: "search_repositories",
  config: {
    description: "Search GitHub repositories by keywords and optional programming language.",
    inputSchema: searchRepositoriesSchema,
  },
  handler: async ({ query, language, limit, sort }: SearchRepositoriesInput) => {
    try {
      const searchQuery = [query, ...(language ? [`language:${language}`] : [])].join(" ");

      const params: Record<string, string> = {
        q: searchQuery,
        per_page: String(limit),
        ...(sort !== "best_match" ? { sort } : {}),
      };

      const data = await githubGet("/search/repositories", githubSearchResponseSchema, params);

      const repositories = data.items.map((repo) => ({
        name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        lastUpdated: repo.updated_at,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                totalMatches: data.total_count,
                incompleteResults: data.incomplete_results,
                repositories,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Repository search failed:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: "Repository search failed. Check the GitHub API configuration and try again.",
          },
        ],
        isError: true,
      };
    }
  },
};
