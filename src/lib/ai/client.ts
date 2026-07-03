import Anthropic from "@anthropic-ai/sdk";
import { env, hasAnthropicApiKey } from "@/lib/env";
import { AIServiceUnavailableError } from "@/lib/errors";

export const DEFAULT_MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

/** Throws AIServiceUnavailableError instead of the SDK's own error so routes can return a clean 503. */
export function getAnthropicClient(): Anthropic {
  if (!hasAnthropicApiKey) {
    throw new AIServiceUnavailableError();
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}
