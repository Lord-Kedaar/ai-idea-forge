/**
 * AI Idea Forge — oMLX Provider
 * Provider dla lokalnego oMLX (OpenAI-compatible API, /v1).
 * Uwaga: oMLX nie udostępnia szlaku Ollama (/api/chat) — używa /v1/chat/completions.
 */

export class OmlxProvider {
  constructor(config = {}) {
    this.providerId = 'omlx';
    this.baseUrl = (config.baseUrl || 'http://localhost:8585').replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gemma-4-26B-A4B-it-QAT-MLX-4bit';
  }

  /**
   * Wykonuje chat completion przez oMLX API (OpenAI-compatible).
   *
   * @param {object} params
   * @param {string[]} params.messages — array of {role, content}
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
    const url = `${this.baseUrl}/v1/chat/completions`;

    const body = {
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      temperature: Math.min(Math.max(temperature, 0), 2),
      max_tokens: Math.min(maxTokens, 4096),
    };

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
      throw new Error(`oMLX error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0] || {};
    const message = choice.message || {};

    return {
      providerId: this.providerId,
      model: data.model || this.model,
      content: message.content || '',
      reasoning: message.reasoning_content || null,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason || (data.done ? 'stop' : 'length'),
      raw: data,
    };
  }
}
