import { z } from "zod";
import env from "../config/env.js";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class GitHubResponseValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.core.$ZodIssue[],
  ) {
    super(message);
    this.name = "GitHubResponseValidationError";
  }
}

export async function githubGet<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  params?: Record<string, string>,
): Promise<z.output<Schema>> {
  const url = new URL(path, `${env.GITHUB_API_BASE_URL}/`);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(env.REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const message =
      response.status === 401
        ? "GitHub authentication failed."
        : response.status === 403 || response.status === 429
          ? "GitHub rate limit or permission restriction."
          : response.status === 404
            ? "GitHub resource not found."
            : `GitHub API returned HTTP ${response.status}.`;

    throw new GitHubApiError(message, response.status);
  }

  const payload = await response.json();
  const result = schema.safeParse(payload);

  if (!result.success) {
    console.error("GitHub response failed validation:", result.error.issues);

    throw new GitHubResponseValidationError(
      "GitHub returned a response that did not match the expected schema.",
      result.error.issues,
    );
  }

  return result.data;
}
