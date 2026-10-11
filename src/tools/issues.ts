import { githubGet } from "../services/github-client.js";
import { z } from "zod";

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  body: string | null;
  labels: Array<{ name: string }>;
  user: { login: string } | null;
  created_at: string;
  updated_at: string;
  comments: number;
  pull_request?: { url: string };
}

export const listIssuesTool = {
  name: "list_issues",
  config: {
    description: "List issues in a GitHub repository, filtered by state and labels.",
    inputSchema: {
      owner: z.string().trim().min(1).max(100),
      repo: z.string().trim().min(1).max(100),
      state: z.enum(["open", "closed", "all"]).default("open"),
      labels: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
      page: z.number().int().min(1).max(1000).default(1),
      perPage: z.number().int().min(1).max(100).default(10),
    },
  },
  handler: async ({
    owner,
    repo,
    state,
    labels,
    page,
    perPage,
  }: {
    owner: string;
    repo: string;
    state: "open" | "closed" | "all";
    labels?: string[];
    page: number;
    perPage: number;
  }) => {
    try {
      const data = await githubGet<GitHubIssue[]>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
        {
          state,
          page: String(page),
          per_page: String(perPage),
          sort: "updated",
          direction: "desc",
          ...(labels?.length ? { labels: labels.join(",") } : {}),
        },
      );

      const issues = data
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          state: issue.state,
          author: issue.user?.login ?? "unknown",
          labels: issue.labels.map((label) => label.name),
          comments: issue.comments,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          body: issue.body?.slice(0, 2000) ?? null,
        }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                repository: `${owner}/${repo}`,
                page,
                perPage,
                returned: issues.length,
                issues,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Issue listing failed:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: "Could not list issues. Check the repository and GitHub API configuration.",
          },
        ],
        isError: true,
      };
    }
  },
};
