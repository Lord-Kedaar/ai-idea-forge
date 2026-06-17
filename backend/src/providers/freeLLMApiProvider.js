/**
 * AI Idea Forge — FreeLLMApi Provider
 *
 * OpenAI-compatible chat completions provider.
 * Endpoint: ${baseUrl}/v1/chat/completions
 *
 * Env config:
 *   FREELLMAPI_BASE_URL   (e.g. https://api.freellmapi.com)
 *   FREELLMAPI_API_KEY    (Bearer token)
 *   FREELLMAPI_MODEL      (e.g. "auto" — server picks the model)
 *
 * When `FREELLMAPI_MODEL=auto` (or empty), the server picks the model
 * automatically. The actual model is returned in the response and
 * surfaced to the run state via `chatCompletion()` return value:
 *   { providerId, model: <actual>, content, usage, ... }
 */

const DEFAULT_BASE_URL = 'https://api.freellmapi.com';
const DEFAULT_MODEL = 'auto';
// FreeLLMAPI uses /v1/chat/completions (OpenAI-compatible root is /v1)
const ENDPOINT_PATH = '/v1/chat/completions';

export class FreeLLMApiProvider {
  constructor(config = {}) {
    this.providerId = 'freellmapi';
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
    this.model = config.model || DEFAULT_MODEL;
  }

  /**
   * Chat completion through FreeLLMApi OpenAI-compatible API.
   *
   * @param {object} params
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {number} params.temperature
   * @param {number} params.maxTokens
   * @param {AbortSignal} params.abortSignal
   * @param {object} params.metadata — extra context (agentId, runId)
   */
  async chatCompletion({
    messages,
    temperature = 0.7,
    maxTokens = 500,
    abortSignal,
    metadata = {},
  } = {}) {
    const url = `${this.baseUrl}${ENDPOINT_PATH}`;

    // If model is 'auto' (or empty), omit it so the server picks one.
    // We still record the requested model for telemetry.
    const requestedModel = this.model;
    const useModel = requestedModel && requestedModel !== 'auto' ? requestedModel : undefined;

    const body = {
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: Math.min(maxTokens, 4096),
      stream: false,
    };
    if (useModel) {
      body.model = useModel;
    }

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortSignal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Aborted');
      }
      throw new Error(`Network error: ${err.message}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`FreeLLMApi error ${response.status}: ${text || response.statusText}`);
    }

    const data = await response.json();

    // OpenAI-compatible response shape:
    //   { id, model, choices: [{ message: { role, content }, finish_reason, index }], usage: {...} }
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const actualModel = data.model || useModel || 'auto';

    return {
      providerId: this.providerId,
      requestedModel,
      model: actualModel,
      content,
      reasoning: null,
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
