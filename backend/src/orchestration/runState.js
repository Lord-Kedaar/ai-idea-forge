/**
 * AI Idea Forge — Run State
 * Tracks state of a single forge run.
 *
 * Provider metadata:
 *   - provider:        ID providera który wykonał run (np. 'freellmapi')
 *   - requestedModel:  Model który klient zażądał (np. 'auto')
 *   - actualModel:     Faktyczny model zwrócony przez serwer LLM
 *                      (przydatne gdy model='auto' i serwer sam wybiera)
 */

export class RunState {
  constructor({ runId, workflowType, idea, context, constraints, agents, provider, requestedModel }) {
    this.runId = runId;
    this.workflowType = workflowType;
    this.idea = idea;
    this.context = context || '';
    this.constraints = constraints || '';
    this.status = 'pending'; // pending | running | completed | failed
    this.currentAgent = null;
    this.stages = agents.map(agentId => ({
      agent: agentId,
      status: 'pending', // pending | running | completed | failed
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
      model: null, // per-agent actual model (jeśli różni się per call)
    }));
    this.createdAt = new Date().toISOString();
    this.completedAt = null;

    // Provider metadata (filled in at run start or first agent)
    this.provider = provider || null;
    this.requestedModel = requestedModel || null;
    this.actualModel = null; // set on first successful response
  }

  setRunning() {
    this.status = 'running';
  }

  startAgent(agentId) {
    const stage = this.stages.find(s => s.agent === agentId);
    if (!stage) throw new Error(`Nieznany agent: ${agentId}`);
    stage.status = 'running';
    stage.startedAt = new Date().toISOString();
    this.currentAgent = agentId;
  }

  completeAgent(agentId, output, { model } = {}) {
    const stage = this.stages.find(s => s.agent === agentId);
    if (!stage) throw new Error(`Nieznany agent: ${agentId}`);
    stage.status = 'completed';
    stage.output = output;
    stage.completedAt = new Date().toISOString();
    if (model) {
      stage.model = model;
      if (!this.actualModel) this.actualModel = model;
    }
    this.currentAgent = null;
  }

  failAgent(agentId, error) {
    const stage = this.stages.find(s => s.agent === agentId);
    if (!stage) throw new Error(`Nieznany agent: ${agentId}`);
    stage.status = 'failed';
    stage.error = error;
    stage.completedAt = new Date().toISOString();
    this.currentAgent = null;
  }

  setCompleted() {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
    this.currentAgent = null;
  }

  setFailed(error) {
    this.status = 'failed';
    this.completedAt = new Date().toISOString();
    this.currentAgent = null;
  }

  getPriorOutputs(currentAgentId) {
    return this.stages
      .filter(s => s.status === 'completed' && s.agent !== currentAgentId)
      .map(s => ({ agent: s.agent, content: s.output }));
  }

  toJSON() {
    return {
      runId: this.runId,
      workflowType: this.workflowType,
      idea: this.idea,
      context: this.context,
      constraints: this.constraints,
      status: this.status,
      currentAgent: this.currentAgent,
      provider: this.provider,
      requestedModel: this.requestedModel,
      actualModel: this.actualModel,
      stages: this.stages,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
    };
  }
}
