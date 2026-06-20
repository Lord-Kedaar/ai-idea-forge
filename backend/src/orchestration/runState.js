export class RunState {
  constructor({ runId, workflowType, idea, context, constraints, language, agents, provider, requestedModel }) {
    this.runId = runId;
    this.workflowType = workflowType;
    this.idea = idea;
    this.context = context || '';
    this.constraints = constraints || ''; this.language = ['en', 'de', 'pl'].includes(language) ? language : 'pl';
    this.status = 'pending';
    this.currentAgent = null;
    this.provider = provider;
    this.requestedModel = requestedModel || null;
    this.actualModel = null;
    this.createdAt = new Date().toISOString();
    this.completedAt = null;
    this.cancelledAt = null;
    this.cancelReason = null;
    this.error = null;
    this.stages = agents.map((agent) => ({ agent, status: 'pending' }));
  }

  setRunning() {
    this.status = 'running';
  }

  startAgent(agentId) {
    const stage = this.stages.find((s) => s.agent === agentId);
    if (!stage) throw new Error(`Unknown agent: ${agentId}`);
    stage.status = 'running';
    stage.startedAt = new Date().toISOString();
    this.currentAgent = agentId;
  }

  completeAgent(agentId, output, { model } = {}) {
    const stage = this.stages.find((s) => s.agent === agentId);
    if (!stage) throw new Error(`Unknown agent: ${agentId}`);
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
    const stage = this.stages.find((s) => s.agent === agentId);
    if (!stage) throw new Error(`Unknown agent: ${agentId}`);
    stage.status = 'failed';
    stage.error = error;
    stage.completedAt = new Date().toISOString();
    this.currentAgent = null;
  }

  cancel(reason = 'cancelled') {
    this.status = 'cancelled';
    this.cancelledAt = new Date().toISOString();
    this.completedAt = this.cancelledAt;
    this.cancelReason = reason;
    const running = this.stages.find((s) => s.status === 'running');
    if (running) {
      running.status = 'cancelled';
      running.error = reason;
      running.completedAt = this.cancelledAt;
    }
    this.stages = this.stages.map((stage) => (
      stage.status === 'pending' ? { ...stage, status: 'cancelled', completedAt: this.cancelledAt } : stage
    ));
    this.currentAgent = null;
  }

  setCompleted() {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
    this.currentAgent = null;
  }

  setFailed(error) {
    this.status = 'failed';
    this.error = error;
    this.completedAt = new Date().toISOString();
    this.currentAgent = null;
  }

  getPriorOutputs(currentAgentId) {
    return this.stages
      .filter((s) => s.status === 'completed' && s.agent !== currentAgentId)
      .map((s) => ({ agent: s.agent, output: s.output }));
  }

  toJSON() {
    return {
      runId: this.runId,
      workflowType: this.workflowType,
      idea: this.idea,
      context: this.context,
      constraints: this.constraints, language: this.language,
      status: this.status,
      currentAgent: this.currentAgent,
      provider: this.provider,
      requestedModel: this.requestedModel,
      actualModel: this.actualModel,
      stages: this.stages,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      cancelledAt: this.cancelledAt,
      cancelReason: this.cancelReason,
      error: this.error,
    };
  }
}
