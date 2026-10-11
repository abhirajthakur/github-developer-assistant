import { z } from "zod";
import { githubGet } from "../services/github-client.js";

interface GitHubRepository {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

export const searchRepositoriesTool = {
  name: "search_repositories",
  config: {
    description: "Search GitHub repositories by keywords and optional programming language.",
    inputSchema: {
      query: z.string().trim().min(1).max(200),
      language: z.string().trim().min(1).max(50).optional(),
      limit: z.number().int().min(1).max(10).default(5),
    },
  },
  handler: async ({
    query,
    language,
    limit,
  }: {
    query: string;
    language?: string;
    limit: number;
  }) => {
    try {
      const searchQuery = [query, ...(language ? [`language:${language}`] : [])].join(" ");

      const data = await githubGet<GitHubSearchResponse>("/search/repositories", {
        q: searchQuery,
        per_page: String(limit),
        sort: "stars",
        order: "desc",
      });

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
