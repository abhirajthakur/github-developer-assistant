import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Used by the remote HTTP deployment.
  PORT: z.coerce.number().int().positive().default(3000),

  // Optional: public GitHub search works without a token.
  GITHUB_TOKEN: z.string().min(1).optional(),

  GITHUB_API_BASE_URL: z.url().default("https://api.github.com"),

  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

const env = envSchema.parse(process.env);

export default env;
