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

export async function githubGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, `${env.GITHUB_API_BASE_URL}/`);

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

  return (await response.json()) as T;
}
