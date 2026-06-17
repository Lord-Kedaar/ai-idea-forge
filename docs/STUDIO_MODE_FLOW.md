# Studio Mode Flow — AI Idea Forge

## End-to-end flow

```
Użytkownik
    │
    │ IdeaInput: textarea + workflow + context + constraints
    ▼
POST /api/forge/runs
    │ Body: { idea, workflow, context?, constraints? }
    ▼
Tworzenie run directory: data/runs/<runId>/
    │
    ▼
Uruchomienie agent pipeline (wybrany workflow)
    │
    ├─► Agent 1: Context Analyst
    │       └─► SSE: agent_started, chunk..., agent_complete
    │
    ├─► Agent 2: Decision Mapper
    │       └─► SSE: agent_started, chunk..., agent_complete
    │
    ├─► ...
    │
    └─► Agent N: konsolidacja → Decision Memo
            └─► SSE: artifact_ready
                └─► Zapis data/runs/<runId>/decision-memo.md
```

## Workflow Quick Insight (2 agenci)

1. Context Analyst — analizuje tło
2. Decision Mapper — identyfikuje kluczową decyzję
3. Idea Consolidator — syntetyzuje → Decision Memo

## Workflow Deep Analysis (6 agentów)

1. Context Analyst
2. Decision Mapper
3. Option Generator
4. Risk Assessor
5. Stakeholder Mapper
6. Idea Consolidator → Decision Memo

## Workflow Creative Spark

1. Context Analyst
2. Decision Mapper
3. Creative Generator
4. Idea Consolidator → Decision Memo

## Workflow Expert Review

1. Context Analyst
2. Expert Critic
3. Refinement Advisor
4. Idea Consolidator → Decision Memo

## SSE Events

```javascript
// agent_started
{ "type": "agent_started", "agent": "context-analyst", "runId": "..." }

// chunk
{ "type": "chunk", "agent": "context-analyst", "content": "..." }

// agent_complete
{ "type": "agent_complete", "agent": "context-analyst", "output": "..." }

// artifact_ready
{ "type": "artifact_ready", "artifactType": "decision-memo", "runId": "..." }

// run_complete
{ "type": "run_complete", "runId": "..." }

// error
{ "type": "error", "message": "..." }
```

## Decision Memo format

```markdown
# Decision Memo: <topic>

## Context
<context analysis>

## Key Decision
<what needs to be decided>

## Options Considered
<list of options>

## Recommendation
<recommended path>

## Risks & Mitigations
<risks and how to mitigate>

## Next Steps
<action items>
```
