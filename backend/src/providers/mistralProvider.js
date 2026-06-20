/**
 * AI Idea Forge — Mistral Provider
 *
 * API: https://api.mistral.ai/v1
 * Auth: Bearer token (MISTRAL_API_KEY)
 *
 * Supported reasoning params:
 *   - reasoning_effort: "none" | "high"  (Mistral Small 4 / hybrid models)
 */

const BASE_URL = 'https://api.mistral.ai/v1';
const ENDPOINT = '/chat/completions';

export class MistralProvider {
  /**
   * @param {object} config
   * @param {string} [config.apiKey] — defaults to process.env.MISTRAL_API_KEY
   */
  constructor(config = {}) {
    this.providerId = 'mistral';
    this.baseUrl = BASE_URL;
    this.apiKey = config.apiKey || process.env.MISTRAL_API_KEY || '';
  }

  /**
   * Chat completion through Mistral API.
   *
   * @param {object} params
   * @param {string} params.model — e.g. "mistral-small-latest" or "mistral-small-2603"
   * @param {Array<{role:string,content:string}>} params.messages
   * @param {number} [params.temperature=0.7]
   * @param {number} [params.maxTokens=4096]
   * @param {string} [params.reasoningEffort] — "none" | "high"
   * @param {AbortSignal} [params.abortSignal]
   * @param {object} [params.metadata]
   */
  async chatCompletion({
    model,
    messages,
    temperature = 0.7,
    maxTokens = 4096,
    reasoningEffort,
    abortSignal,
    metadata = {},
  } = {}) {
    const url = `${this.baseUrl}${ENDPOINT}`;

    const body = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: Math.min(maxTokens, 32768),
      stream: false,
    };

    // Only include reasoning_effort if explicitly set
    if (reasoningEffort !== undefined) {
      body.reasoning_effort = reasoningEffort;
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
      throw new Error(`Mistral error ${response.status}: ${text || response.statusText}`);
    }

    const data = await response.json();

    // OpenAI-compatible response shape
    const choice = data.choices?.[0];
    let content = '';
    let reasoning = null;

    if (Array.isArray(choice?.message?.content)) {
      // reasoning_effort="high" returns a list of content chunks
      // First chunk is reasoning, last is the final answer
      const chunks = choice.message.content;
      if (chunks.length > 1) {
        reasoning = chunks.slice(0, -1).map(c => c.text || c.content || '').join('\n');
        content = chunks[chunks.length - 1]?.text || chunks[chunks.length - 1]?.content || '';
      } else {
        content = chunks[0]?.text || chunks[0]?.content || '';
      }
    } else {
      content = choice?.message?.content || '';
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
