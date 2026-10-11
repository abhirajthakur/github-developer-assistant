import { z } from "zod";

export const githubRepositorySchema = z.object({
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.url(),
  stargazers_count: z.number().int().nonnegative(),
  language: z.string().nullable(),
  updated_at: z.iso.datetime(),
});

export const githubSearchResponseSchema = z.object({
  total_count: z.number().int().nonnegative(),
  incomplete_results: z.boolean(),
  items: z.array(githubRepositorySchema),
});

export const githubIssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  html_url: z.url(),
  state: z.enum(["open", "closed"]),
  body: z.string().nullable(),
  labels: z.array(z.object({ name: z.string() })),
  user: z.object({ login: z.string() }).nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  comments: z.number().int().nonnegative(),
  pull_request: z
    .object({
      url: z.url(),
    })
    .optional(),
});

export const githubIssuesResponseSchema = z.array(githubIssueSchema);

export const githubPullRequestSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  html_url: z.url(),
  state: z.enum(["open", "closed"]),
  body: z.string().nullable(),
  draft: z.boolean(),
  merged: z.boolean(),
  mergeable: z.boolean().nullable(),
  user: z.object({ login: z.string() }).nullable(),
  head: z.object({
    ref: z.string(),
    sha: z.string(),
  }),
  base: z.object({
    ref: z.string(),
  }),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  changed_files: z.number().int().nonnegative(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const githubCheckRunsResponseSchema = z.object({
  total_count: z.number().int().nonnegative(),
  check_runs: z.array(
    z.object({
      name: z.string(),
      status: z.string(),
      conclusion: z.string().nullable(),
      html_url: z.url().nullable(),
      started_at: z.iso.datetime().nullable(),
      completed_at: z.iso.datetime().nullable(),
    }),
  ),
});
