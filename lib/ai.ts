/**
 * ai.ts — Opt-in AI module (thin wiring over @nseluga/app-core).
 *
 * The flag-gated client factory (`maybeCreateAnthropicClient`) lives in
 * app-core; this file binds it to THIS app's env-derived config. The AI
 * feature stays genuinely opt-in: with AI_ENABLED off the factory is never
 * invoked — see tests/ai-optin.test.mjs for the import-boundary proof.
 */

import {
  createAnthropicClient,
  maybeCreateAnthropicClient,
} from "@nseluga/app-core";
import { getConfig, type AppConfig } from "./env";

/**
 * The Anthropic client type, derived from app-core's factory return type so we
 * don't take a direct dependency on @anthropic-ai/sdk here.
 */
type AnthropicClient = ReturnType<typeof createAnthropicClient>;

/** Test seam: swap the underlying client factory. */
export interface AiDeps {
  createClient?: typeof createAnthropicClient;
  config?: AppConfig;
}

/**
 * Return an Anthropic client ONLY when the AI feature is opted in and a key is
 * present; otherwise null.
 */
export function maybeGetAiClient(deps: AiDeps = {}): AnthropicClient | null {
  const config = deps.config ?? getConfig();
  return maybeCreateAnthropicClient(
    { aiEnabled: config.aiEnabled, anthropicApiKey: config.anthropicApiKey },
    { createClient: deps.createClient },
  );
}

/** True when the AI feature flag is on. Cheap predicate for UI gating. */
export function isAiEnabled(deps: AiDeps = {}): boolean {
  const config = deps.config ?? getConfig();
  return config.aiEnabled;
}
