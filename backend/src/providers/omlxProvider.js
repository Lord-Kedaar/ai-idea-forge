/**
 * AI Idea Forge — oMLX Provider
 * Provider dla lokalnego oMLX (Ollama-compatible API).
 */

export class OmlxProvider {
  constructor(config = {}) {
    this.providerId = 'omlx';
    this.baseUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'llama3.2';
  }

  /**
   * Wykonuje chat completion przez oMLX API.
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
    const url = `${this.baseUrl}/api/chat`;

    const body = {
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      options: {
        temperature: Math.min(Math.max(temperature, 0), 2),
        num_predict: Math.min(maxTokens, 4096),
      },
    };

    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = abortSignal ? new AbortController(abortSignal) : null;
    // If an external abortSignal is passed, wire it to our fetch controller
    if (abortSignal && !controller) {
      // abortSignal is already an AbortSignal — use it directly
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

    return {
      providerId: this.providerId,
      model: this.model,
      content: data.message?.content || '',
      reasoning: data.reasoning || null,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      finishReason: data.done ? 'stop' : 'length',
      raw: data,
    };
  }
}
