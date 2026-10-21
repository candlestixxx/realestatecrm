/**
 * DeepSeek — central LLM provider for the main CRM.
 *
 * Why: the platform was previously split across Google Gemini (AI chat +
 * lead parsing) and OpenAI (qualification, agentcore, social copy). This
 * module consolidates all *chat/completion* LLM calls onto a single
 * OpenAI-compatible provider (DeepSeek) driven by one env var:
 *
 *   DEEPSEEK_API_KEY  (required)
 *   DEEPSEEK_MODEL    (optional, default "deepseek-v4-flash")
 *
 * DeepSeek is OpenAI-compatible, so we reuse `@ai-sdk/openai`'s
 * `createOpenAI` pointed at DeepSeek's base URL.
 *
 * NOTE: DeepSeek does NOT offer an embeddings endpoint nor audio
 * (TTS/STT). RAG embeddings stay on OpenAI (src/lib/rag.ts) and voice
 * stays on OpenAI (src/lib/voice.ts).
 */

import { createOpenAI } from '@ai-sdk/openai';

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
// Default: deepseek-v4-flash (fast tier). Set DEEPSEEK_MODEL=deepseek-v4-pro
// for the highest-quality tier where latency is acceptable.
export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

/** Returns the DeepSeek API key from env, or undefined if unset. */
export function getDeepSeekApiKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY?.trim() || undefined;
}

/**
 * Returns a Vercel AI SDK LanguageModel backed by DeepSeek.
 * Throws if DEEPSEEK_API_KEY is not configured (callers should catch).
 */
export function getDeepSeekModel() {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');
  const provider = createOpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
  return provider(DEEPSEEK_MODEL);
}

/**
 * Raw OpenAI-compatible chat completion via DeepSeek (for non-AI-SDK paths
 * that only need a single completion, e.g. social copy / agentcore).
 */
export async function deepSeekCompletion(opts: {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

  const messages: { role: string; content: string }[] = [];
  if (opts.system) messages.push({ role: 'system', content: opts.system });
  messages.push({ role: 'user', content: opts.prompt });

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      // V4 reasoning models spend part of this budget on reasoning_content —
      // keep the floor generous so the visible answer is never truncated.
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * NOTE on V4 reasoning models: both `deepseek-flash` (aka deepseek-v4-flash)
 * and `deepseek-v4-pro` emit `reasoning_content` before `content`, and those
 * reasoning tokens count against `max_tokens`. Budgets must be generous
 * (default raised to 4096) or `content` comes back empty with
 * `finish_reason: "length"`. Verified live 2026-10-21.
 *
 * Verified DeepSeek V4 API capabilities (live tests):
 * - response_format json_object: SUPPORTED
 * - response_format json_schema: REJECTED ("This response_format type is
 *   unavailable now") — always pass mode:'json' to generateObject.
 * - Tool calling: SUPPORTED (incl. parallel tool calls)
 */
