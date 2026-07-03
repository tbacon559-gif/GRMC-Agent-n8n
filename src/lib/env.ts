import { z } from "zod";

/**
 * Validated environment variables. Import this instead of reading
 * `process.env` directly so a missing/malformed variable fails fast with a
 * clear message instead of surfacing as a confusing runtime error deep in a
 * request handler.
 *
 * `ANTHROPIC_API_KEY` is intentionally optional: every non-AI feature
 * (customers, inventory, matching, dashboard) must keep working without it.
 * AI-dependent services check `hasAnthropicApiKey` themselves and throw a
 * typed `AIServiceUnavailableError` when it's missing.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${message}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export const hasAnthropicApiKey = Boolean(env.ANTHROPIC_API_KEY);
