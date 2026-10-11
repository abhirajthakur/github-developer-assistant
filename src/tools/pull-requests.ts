import { z } from "zod";
import { githubPullRequestSchema, githubCheckRunsResponseSchema } from "../schemas/github.js";
import { githubGet } from "../services/github-client.js";

const pullRequestSchema = z.object({
  owner: z.string().trim().min(1).max(100),
  repo: z.string().trim().min(1).max(100),
  pullNumber: z.number().int().positive(),
});

type PullRequestInput = z.infer<typeof pullRequestSchema>;

export const getPullRequestTool = {
  name: "get_pull_request",
  config: {
    description:
      "Retrieve GitHub pull request details, branches, review-related metadata, and change statistics.",
    inputSchema: pullRequestSchema,
  },
  handler: async ({ owner, repo, pullNumber }: PullRequestInput) => {
    try {
      const pr = await githubGet(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
        githubPullRequestSchema,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                repository: `${owner}/${repo}`,
                number: pr.number,
                title: pr.title,
                url: pr.html_url,
                state: pr.state,
                draft: pr.draft,
                merged: pr.merged,
                mergeable: pr.mergeable,
                author: pr.user?.login ?? "unknown",
                sourceBranch: pr.head.ref,
                targetBranch: pr.base.ref,
                headSha: pr.head.sha,
                additions: pr.additions,
                deletions: pr.deletions,
                changedFiles: pr.changed_files,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                body: pr.body?.slice(0, 4000) ?? null,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Pull request lookup failed:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: "Could not retrieve the pull request. Verify the repository and pull request number.",
          },
        ],
        isError: true,
      };
    }
  },
};

export const getPrChecksTool = {
  name: "get_pr_checks",
  config: {
    description: "Get CI check runs for the latest commit of a GitHub pull request.",
    inputSchema: pullRequestSchema,
  },
  handler: async ({ owner, repo, pullNumber }: PullRequestInput) => {
    try {
      const pr = await githubGet(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`,
        githubPullRequestSchema,
      );

      const data = await githubGet(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${pr.head.sha}/check-runs`,
        githubCheckRunsResponseSchema,
        { per_page: "100" },
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                repository: `${owner}/${repo}`,
                pullNumber,
                headSha: pr.head.sha,
                totalChecks: data.total_count,
                checks: data.check_runs.map((check) => ({
                  name: check.name,
                  status: check.status,
                  conclusion: check.conclusion,
                  url: check.html_url,
                  startedAt: check.started_at,
                  completedAt: check.completed_at,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Pull request checks lookup failed:", error);

      return {
        content: [
          {
            type: "text" as const,
            text: "Could not retrieve CI checks. Verify repository access and check-run permissions.",
          },
        ],
        isError: true,
      };
    }
  },
};
