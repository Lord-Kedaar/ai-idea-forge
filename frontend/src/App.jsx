import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import {
  cancelRun,
  createRun,
  deleteRun,
  getDecisionMemo,
  getDemoQuota,
  getRun,
  getRunsList,
  getWorkflows,
  subscribeRunWithFallback,
  getHealth,
} from './api.js';

import { useI18n } from './i18n/I18nProvider';
import { AppShell } from './components/AppShell';
import { IdeaInputForm } from './components/IdeaInputForm';
import { AnalysisExplainer } from './components/AnalysisExplainer';
import { AnalysisProgress } from './components/AnalysisProgress';
import { DecisionMemoPanel } from './components/DecisionMemoPanel';
import { RunsHistoryPanel } from './components/RunsHistoryPanel';
import { BackendStatus } from './components/BackendStatus';
import { PlaceholderView } from './components/PlaceholderView';
import { IdeaActionBar } from './components/IdeaActionBar';
import { DemoQuotaModal, QuotaBadge } from './components/DemoQuotaModal';

const AGENT_IDS = ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'];
const FINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

function nowIso() {
  return new Date().toISOString();
}

function normalizeRun(run, fallback = {}) {
  if (!run) return null;
  const stages = run.stages?.length
    ? run.stages
    : (run.agents?.length ? run.agents : AGENT_IDS).map((agent) => ({ agent, status: 'pending' }));

  return {
    ...fallback,
    ...run,
    stages,
    status: run.status || fallback.status || 'pending',
    createdAt: run.createdAt || fallback.createdAt || nowIso(),
    startedAt: run.startedAt || fallback.startedAt || run.createdAt || fallback.createdAt || nowIso(),
  };
}

function applyEvent(prev, type, payload = {}) {
  if (!prev) return prev;
  const next = normalizeRun({ ...prev, ...payload }, prev);

  if (type === 'run_started') next.status = 'running';
  if (type === 'run_completed') next.status = 'completed';
  if (type === 'run_failed') {
    next.status = 'failed';
    next.error = payload.error;
  }
  if (type === 'run_cancelled') next.status = 'cancelled';

  if (['agent_started', 'agent_completed', 'agent_failed'].includes(type)) {
    const agentId = payload.agent || payload.stage;
    next.stages = (next.stages || []).map((stage) => {
      if (stage.agent !== agentId) return stage;
      if (type === 'agent_started') return { ...stage, status: 'running', startedAt: payload.at || nowIso() };
      if (type === 'agent_completed')
        return { ...stage, status: 'completed', output: payload.output || stage.output, completedAt: payload.at || nowIso() };
      return { ...stage, status: 'failed', error: payload.error, completedAt: payload.at || nowIso() };
    });
    if (type === 'agent_started') next.currentAgent = agentId;
    if (type !== 'agent_started') next.currentAgent = null;
  }

  return next;
}

export default function App() {
  const { t, lang } = useI18n();
  const [nav, setNav] = useState('idea');

  const [health, setHealth] = useState({ status: 'unknown' });
  const [backendDown, setBackendDown] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);

  // Demo quota
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [quotaError, setQuotaError] = useState(null);

  const [idea, setIdea] = useState('');
  const [workflowType, setWorkflowType] = useState('decision_memo');
  const [context, setContext] = useState('');
  const [constraints, setConstraints] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [lengthPref, setLengthPref] = useState('medium');
  const [criticismLevel, setCriticismLevel] = useState('balanced');
  const [priority, setPriority] = useState('balanced');

  const [submitting, setSubmitting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [currentRun, setCurrentRun] = useState(null);
  const [memo, setMemo] = useState(null);
  const [memoError, setMemoError] = useState(null);

  const unsubRef = useRef(null);

  const onBackendDown = (err) => {
    setBackendDown(true);
    setBackendError(err);
  };

  async function fetchQuotaInfo() {
    try {
      const data = await getDemoQuota();
      setQuotaInfo(data);
    } catch {
      // Non-critical — quota endpoint is optional
      setQuotaInfo(null);
    }
  }

  async function refreshBootstrap() {
    const [h, w] = await Promise.all([getHealth(onBackendDown), getWorkflows(onBackendDown)]);
    setHealth(h.ok ? h.data : { status: 'down' });
    setWorkflows(w?.workflows || []);
    setBackendDown(!h.ok);
    if (h.ok) setBackendError(null);
  }

  async function refreshRuns() {
    try {
      const data = await getRunsList();
      setRuns(data?.runs || []);
    } catch {
      setRuns([]);
    }
  }

  useEffect(() => {
    refreshBootstrap();
    refreshRuns();
    fetchQuotaInfo();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forge.currentRunId');
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    unsubRef.current?.();
    if (!currentRun?.runId || FINAL_STATUSES.has(currentRun.status)) return undefined;

    const unsub = subscribeRunWithFallback(currentRun.runId, {
      onEvent: (type, payload) => {
        setCurrentRun((prev) => applyEvent(prev, type, payload));
        if (type === 'run_completed') {
          fetchMemo(currentRun.runId);
          refreshRuns();
        }
        if (type === 'run_failed' || type === 'run_cancelled') refreshRuns();
      },
      onUpdate: (data) => {
        setCurrentRun((prev) => normalizeRun(data, prev || {}));
        if (FINAL_STATUSES.has(data.status)) refreshRuns();
        if (data.status === 'completed') fetchMemo(data.runId);
      },
      onError: () => {},
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, [currentRun?.runId, currentRun?.status]);

  async function fetchMemo(runId) {
    try {
      const text = await getDecisionMemo(runId);
      setMemo(text);
      setMemoError(null);
    } catch (e) {
      setMemo(null);
      setMemoError(e.message);
    }
  }

  async function openRun(runId) {
    try {
      const data = await getRun(runId);
      const normalized = normalizeRun(data);
      setCurrentRun(normalized);
      setMemo(null);
      setMemoError(null);
      // Land on the right tab depending on what the run has produced so far
      setNav(normalized.status === 'completed' ? 'memo' : 'analysis');
      if (normalized.status === 'completed') fetchMemo(runId);
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('forge.currentRunId');
    }
  }

  async function handleStart() {
    setSubmitError(null);
    setQuotaError(null);
    if (!idea.trim()) {
      setSubmitError(t('ideaRequiredError'));
      return;
    }
    setSubmitting(true);
    try {
      const runLanguage = (typeof window !== 'undefined' && localStorage.getItem('language')) || lang;
      const data = await createRun({ workflowType, idea, context, constraints, language: runLanguage });
      const workflow = workflows.find((w) => w.id === workflowType);
      const initial = normalizeRun({
        runId: data.runId,
        status: data.status || 'pending',
        workflowType,
        idea,
        context,
        constraints,
        language: runLanguage,
        createdAt: data.createdAt || nowIso(),
        startedAt: nowIso(),
        stages: (workflow?.agents?.length ? workflow.agents : AGENT_IDS).map((agent) => ({ agent, status: 'pending' })),
      });
      setCurrentRun(initial);
      setMemo(null);
      setMemoError(null);
      setNav('analysis');
      refreshRuns();
      // Refresh quota after a successful start (count was consumed server-side)
      fetchQuotaInfo();
    } catch (e) {
      if (e.quotaExceeded === true || (e.status === 429 && (e.body?.error === 'demo_quota_exceeded'))) {
        const displayMsg = t('demoModal.quotaExceeded', 'Limit analiz został wyczerpany. Możesz poprosić o odblokowanie.');
        setQuotaError(displayMsg);
        fetchQuotaInfo();
      } else {
        setSubmitError(e.message || t('runError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStop() {
    if (!currentRun?.runId || FINAL_STATUSES.has(currentRun.status)) return;
    setStopping(true);
    try {
      const data = await cancelRun(currentRun.runId);
      setCurrentRun((prev) => normalizeRun(data.run || { ...prev, status: 'cancelled' }, prev || {}));
      refreshRuns();
    } catch {
      // noop — surface via run state
    } finally {
      setStopping(false);
    }
  }

  function handleNewRun() {
    unsubRef.current?.();
    setCurrentRun(null);
    setMemo(null);
    setMemoError(null);
    setQuotaError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forge.currentRunId');
      window.history.replaceState(null, '', window.location.pathname);
    }
    setNav('idea');
    refreshRuns();
  }

  function handleClearForm() {
    setIdea('');
    setContext('');
    setConstraints('');
    setExtraInstructions('');
  }

  async function handleDeleteRun(runId) {
    await deleteRun(runId);
    if (currentRun?.runId === runId) handleNewRun();
    await refreshRuns();
  }

  const activeWorkflow = workflows.find((w) => w.id === workflowType);
  // Disable start if: no idea, already running, backend down, quota exceeded
  const quotaExceeded = quotaInfo?.exceeded === true && quotaInfo?.mode === 'limited';
  const effectiveCanStart = idea.trim().length > 0 && !submitting && !backendDown && !currentRun && !quotaExceeded;

  const headerExtras = (
    <div className="flex items-center gap-3">
      {!currentRun && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNav('history')}>
          <Plus className="h-3.5 w-3.5" /> {t('newAnalysis')}
        </button>
      )}
      {currentRun && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleNewRun}>
          <Plus className="h-3.5 w-3.5" /> {t('newAnalysis')}
        </button>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Per-tab content. Hard rule from FIX_TAB_CONTENT_RENDERING_MAIN_VIEW.md:
  // never render tab views as siblings of <main>. Each tab returns ONE block
  // and only the active one is mounted.
  // ─────────────────────────────────────────────────────────────────────────

  function renderIdeaView() {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="grid flex-1 min-h-0 grid-cols-1 gap-6 overflow-y-auto px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6 min-w-0">
            {/* Quota badge — subtle info strip */}
            <div className="flex justify-end">
              <QuotaBadge quotaInfo={quotaInfo} />
            </div>

            <IdeaInputForm
              idea={idea}
              setIdea={setIdea}
              workflowType={workflowType}
              setWorkflowType={setWorkflowType}
              workflows={workflows}
              context={context}
              setContext={setContext}
              constraints={constraints}
              setConstraints={setConstraints}
              extraInstructions={extraInstructions}
              setExtraInstructions={setExtraInstructions}
              lengthPref={lengthPref}
              setLengthPref={setLengthPref}
              criticismLevel={criticismLevel}
              setCriticismLevel={setCriticismLevel}
              priority={priority}
              setPriority={setPriority}
              canStart={effectiveCanStart}
              submitting={submitting}
              submitError={quotaError || submitError}
              onStart={handleStart}
              disabled={!!currentRun || backendDown}
            />
          </div>

          <div className="space-y-6 min-w-0">
            {backendDown && <BackendStatus down={backendDown} error={backendError} onRetry={refreshBootstrap} />}
            <AnalysisExplainer workflow={activeWorkflow} />
          </div>
        </div>

        <IdeaActionBar
          selectedWorkflow={activeWorkflow}
          canStart={effectiveCanStart}
          canClear={!currentRun && !backendDown && (idea.trim() || context.trim() || constraints.trim() || extraInstructions.trim())}
          isStarting={submitting}
          submitError={quotaError || submitError}
          onClear={handleClearForm}
          onStart={handleStart}
        />
      </div>
    );
  }

  function renderAnalysisView() {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
          {backendDown && <BackendStatus down={backendDown} error={backendError} onRetry={refreshBootstrap} />}
          {currentRun ? (
            <AnalysisProgress
              run={currentRun}
              onStop={handleStop}
              stopping={stopping}
              onGoToMemo={() => setNav('memo')}
            />
          ) : (
            <div className="rounded-md border border-dashed border-border bg-background/40 p-10 text-center text-sm text-muted-foreground">
              {t('memoWaiting')}
            </div>
          )}
          <AnalysisExplainer workflow={activeWorkflow} />
        </div>
      </div>
    );
  }

  function renderDecisionMemoView() {
    if (!currentRun) {
      return (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
            <div className="rounded-md border border-dashed border-border bg-background/40 p-10 text-center text-sm text-muted-foreground">
              {t('memoWaiting')}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
          <DecisionMemoPanel
            run={currentRun}
            memo={memo}
            memoError={memoError}
          />
        </div>
      </div>
    );
  }

  function renderHistoryView() {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
          <RunsHistoryPanel
            runs={runs}
            onOpen={openRun}
            onDelete={handleDeleteRun}
            onRefresh={refreshRuns}
          />
        </div>
      </div>
    );
  }

  function renderActiveTabContent() {
    switch (nav) {
      case 'analysis':
        return renderAnalysisView();
      case 'memo':
        return renderDecisionMemoView();
      case 'history':
        return renderHistoryView();
      case 'settings':
        return (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
              <PlaceholderView kind="settings" />
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
              <PlaceholderView kind="help" />
            </div>
          </div>
        );
      case 'idea':
      default:
        return renderIdeaView();
    }
  }

  return (
    <AppShell activeNav={nav} onNavChange={setNav} headerExtras={headerExtras}>
      {/* Demo quota modal — shown once per session */}
      <DemoQuotaModal quotaInfo={quotaInfo} onClose={() => fetchQuotaInfo()} />
      {renderActiveTabContent()}
    </AppShell>
  );
}
