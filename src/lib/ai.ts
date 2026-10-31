/**
 * AI provider configuration.
 *
 * Any OpenAI-compatible endpoint works: set `AI_API_KEY` plus optionally
 * `AI_BASE_URL` (default https://api.openai.com/v1) and `AI_MODEL`
 * (default gpt-4o-mini) in `.env.local`. Nothing here throws when a key is
 * missing — callers decide how to report "not configured".
 */

export interface AiConfig {
  key: string;
  baseUrl: string;
  model: string;
}

export function aiConfig(): AiConfig {
  return {
    key: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
    baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  };
}

/** Shown to staff when generation is requested but no key is set. */
export const AI_SETUP_HINT =
  "To enable AI generation, add AI_API_KEY (and optionally AI_BASE_URL / AI_MODEL) to .env.local and restart the server.";
