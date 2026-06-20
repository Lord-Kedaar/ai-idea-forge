/**
 * AI Idea Forge — Groq Provider
 *
 * API: https://api.groq.com/openai/v1
 * Auth: Bearer token (GROQ_API_KEY)
 *
 * Supported reasoning params:
 *   - reasoning_effort: "none" | "default"  (Qwen3.6)
 *   - reasoning_effort: "low" | "medium" | "high"  (GPT-OSS)
 *   - reasoning_format: "parsed" | "raw" | "hidden"
 */

const BASE_URL = 'https://api.groq.com/openai/v1';
const ENDPOINT = '/chat/completions';

export class GroqProvider {
  /**
   * @param {object} config
   * @param {string} [config.apiKey] — defaults to process.env.GROQ_API_KEY
   */
  constructor(config = {}) {
    this.providerId = 'groq';
    this.baseUrl = BASE_URL;
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
  }

  /**
   * Chat completion through Groq API.
   *
   * @param {object} params
   * @param {string} params.model — e.g. "qwen/qwen3.6-27b" or "openai/gpt-oss-120b"
   * @param {Array<{role:string,content:string}>} params.messages
   * @param {number} [params.temperature=0.7]
   * @param {number} [params.maxTokens=4096]
   * @param {string} [params.reasoningEffort] — "none"|"default"|"low"|"medium"|"high" — model-dependent
   * @param {string} [params.reasoningFormat] — "parsed"|"raw"|"hidden"
   * @param {AbortSignal} [params.abortSignal]
   * @param {object} [params.metadata]
   */
  async chatCompletion({
    model,
    messages,
    temperature = 0.7,
    maxTokens = 4096,
    reasoningEffort,
    reasoningFormat,
    abortSignal,
    metadata = {},
  } = {}) {
    const url = `${this.baseUrl}${ENDPOINT}`;

    const body = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: Math.min(maxTokens, 8192),
      stream: false,
    };

    // Only include reasoning params if explicitly set
    if (reasoningEffort !== undefined) {
      body.reasoning_effort = reasoningEffort;
    }
    if (reasoningFormat !== undefined) {
      body.reasoning_format = reasoningFormat;
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortSignal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Aborted');
      throw new Error(`Network error: ${err.message}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Groq error ${response.status}: ${text || response.statusText}`);
    }

    const data = await response.json();

    // OpenAI-compatible response
    const choice = data.choices?.[0];
    let content = choice?.message?.content || '';
    let reasoning = null;

    if (choice?.message?.reasoning !== undefined) {
      reasoning = choice.message.reasoning;
    }

    return {
      providerId: this.providerId,
      model: data.model || model,
      content,
      reasoning,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason || 'stop',
      raw: data,
    };
  }
}
