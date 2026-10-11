# GitHub Developer Assistant MCP Server

A read-only **Model Context Protocol (MCP) server** that connects AI assistants to GitHub repository data through typed tools. Built with TypeScript, Node.js, the official MCP TypeScript SDK, and the GitHub REST API.

The project supports both local development over **stdio** and remote access over **Streamable HTTP**. It includes runtime input validation, GitHub API response validation, request timeouts, HTTP rate limiting, integration tests, and automated CI checks.

## Live Demo

- **MCP endpoint:** https://github-developer-assistant.onrender.com/mcp
- **Health check:** https://github-developer-assistant.onrender.com/health

> Hosting notice: This server is deployed on Render's free web service tier. The instance may spin down after a period of inactivity, so the first request after a quiet period can take longer while the service starts back up. The service may also be temporarily unavailable due to cold starts, restarts, or hosting limitations. Please allow a little time and retry if the endpoint does not respond immediately. The demo uses GitHub's unauthenticated API, so GitHub rate limits also apply.

## Features

- **MCP tools:** Exposes GitHub operations through standardized, schema-validated tool interfaces.
- **Dual transports:** Supports stdio for local integrations and Streamable HTTP for remote clients.
- **GitHub REST API integration:** Retrieves repository, issue, pull request, and CI check data.
- **Runtime validation:** Uses Zod schemas to validate tool inputs and upstream API responses.
- **Defensive API client:** Applies request timeouts and handles HTTP errors.
- **Bounded responses:** Limits search and pagination results and truncates long text fields.
- **HTTP protection:** Includes host validation, configurable proxy trust, and per-IP rate limiting.
- **Automated testing:** Covers GitHub client behavior, repository search parameters, HTTP rate limiting, and MCP HTTP integration.
- **Continuous integration:** Runs type checking, tests, and a production build through GitHub Actions.

## Available Tools

| Tool | Description | Key inputs |
|---|---|---|
| `search_repositories` | Search repositories by keywords and optional programming language. | `query`, `language`, `limit`, `sort` |
| `list_issues` | List repository issues filtered by state and labels. Pull requests are excluded from the results. | `owner`, `repo`, `state`, `labels`, `page`, `perPage` |
| `get_pull_request` | Retrieve pull request metadata, branches, change statistics, and status. | `owner`, `repo`, `pullNumber` |
| `get_pr_checks` | Retrieve CI check runs for a pull request's latest commit. | `owner`, `repo`, `pullNumber` |

### Repository search options

The `search_repositories` tool supports three sort modes:

- `best_match` — GitHub's default relevance ordering.
- `stars` — Sort by star count.
- `updated` — Sort by last update.

The result limit is configurable from 1 to 10 repositories.

## Architecture

```text
MCP Client
    |
    | stdio or Streamable HTTP
    v
MCP Server
    |
    +-- Tool registration
    |     +-- search_repositories
    |     +-- list_issues
    |     +-- get_pull_request
    |     +-- get_pr_checks
    |
    +-- Zod input validation
    |
    v
GitHub API Client
    |
    +-- Request timeout
    +-- Authentication headers when configured
    +-- HTTP error handling
    +-- Response schema validation
    |
    v
GitHub REST API
```

The HTTP entry point is separate from the shared MCP server and tool implementations. This allows the same tool logic to be used by local stdio clients and the remote HTTP deployment.

### Technology stack

- TypeScript
- Node.js
- pnpm
- Model Context Protocol TypeScript SDK v2
- Express middleware for HTTP integration
- Zod for runtime validation
- GitHub REST API
- Vitest for automated tests
- GitHub Actions for continuous integration

## Getting Started

### Prerequisites

- Node.js 24 or a compatible version
- pnpm matching the version specified by the project
- Git

### 1. Clone the repository

```bash
git clone https://github.com/abhirajthakur/github-developer-assistant.git
cd github-developer-assistant
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a local environment file from the example:

```bash
cp .env.example .env
```

Review the example configuration:

```dotenv
PORT=3000
GITHUB_API_BASE_URL=https://api.github.com
REQUEST_TIMEOUT_MS=10000
MCP_ALLOWED_HOST=localhost
TRUST_PROXY_HOPS=0
```

`GITHUB_TOKEN` is optional. For local development, you can configure a token if you need authenticated GitHub API access.

### 4. Run locally

Start the stdio MCP server:

```bash
pnpm dev
```

For local HTTP development, use a separate terminal:

```bash
pnpm dev:http
```

The HTTP server uses the configured port. Its MCP endpoint is `/mcp`, and its health endpoint is `/health`.

Use the transport appropriate for your MCP client. The stdio server is intended for local integrations, while the HTTP server is intended for remote connections.

## Testing and Quality Checks

Run the project's checks locally:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Or run all three sequentially:

```bash
pnpm typecheck && pnpm test && pnpm build
```

The tests are organized by responsibility:

```text
tests/
├── unit/
│   ├── github-client.test.ts
│   └── repositories.test.ts
└── integration/
    ├── mcp-http.test.ts
    └── rate-limit.test.ts
```

The suite covers:

- GitHub API client behavior and error handling.
- Repository search parameter construction and sorting.
- HTTP rate limiting.
- MCP tool discovery and invocation through Streamable HTTP.

GitHub Actions runs type checking, the test suite, and the production build on pushes to `main` and pull requests targeting `main`.

## HTTP API

### Health check

```bash
curl -sS \
  https://github-developer-assistant.onrender.com/health \
  | jq .
```

Expected response:

```json
{
  "status": "ok"
}
```

### Discover MCP tools

The server uses Streamable HTTP. The following request sends an MCP `tools/list` request and formats the returned JSON-RPC text payload with `jq`:

```bash
curl -sS -X POST \
  https://github-developer-assistant.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }' \
  | sed -n 's/^data: //p' \
  | jq .
```

This example assumes the server responds using the Server-Sent Events representation. If the response uses ordinary JSON, inspect the raw response instead.

### Call repository search

```bash
curl -sS -X POST \
  https://github-developer-assistant.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_repositories",
      "arguments": {
        "query": "modelcontextprotocol",
        "limit": 3,
        "sort": "stars"
      }
    }
  }' \
  | sed -n 's/^data: //p' \
  | jq -r '.result.content[] | select(.type == "text") | .text' \
  | jq .
```

The server may return an error if GitHub's API rate limit has been reached or the hosting service is temporarily unavailable.

## Security Considerations

This project is designed as a public, read-only portfolio demonstration.

- **No public write operations:** The registered tools retrieve data and do not modify repositories.
- **No privileged deployment token:** The public Render deployment is configured without `GITHUB_TOKEN`.
- **Validated inputs:** Tool arguments are validated before being used in API requests.
- **Validated upstream responses:** GitHub API payloads are checked against Zod schemas.
- **Bounded requests and responses:** Search limits, pagination bounds, and text truncation help control response size.
- **Request timeouts:** Upstream requests have a configurable timeout.
- **Host validation:** The HTTP server uses an explicit host allowlist.
- **Rate limiting:** HTTP requests are rate-limited to reduce abuse.

The public endpoint is unauthenticated, so it should not be used to expose private repository data or privileged operations. Production deployments that need private-resource access should implement appropriate authentication and authorization before enabling it.

The public demo also uses GitHub's unauthenticated API allowance, which is subject to GitHub's rate limits.

## Deployment

The HTTP server can be deployed to a Node.js hosting platform such as Render.

Typical configuration:

| Setting | Value |
|---|---|
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Health check path | `/health` |
| MCP endpoint | `/mcp` |
| `MCP_ALLOWED_HOST` | Your deployed hostname |
| `TRUST_PROXY_HOPS` | Value appropriate to the trusted proxy setup |

Set environment variables in the hosting provider's dashboard. Do not include secrets in the repository or README.

The live endpoint listed above is the project's public demonstration deployment.

## Future Improvements

Potential next steps include:

- Add structured logging and request correlation IDs.
- Improve GitHub API rate-limit feedback and retry handling.
- Add further unit and integration tests for issue and pull-request tools.
- Add metrics and operational monitoring.
- Support authenticated access through a dedicated authorization flow if private repository access becomes a requirement.
- Expand the tool set based on real developer workflows.

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP TypeScript SDK v2 documentation](https://ts.sdk.modelcontextprotocol.io/v2/)
- [GitHub REST API documentation](https://docs.github.com/en/rest)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
