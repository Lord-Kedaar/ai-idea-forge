import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * DemoQuotaModal — shown once per session (cookie-gated).
 *
 * Informs the user that:
 * - This is a public demo
 * - 6 analyses per IP limit applies
 * - Cookies are used to remember the acknowledgement
 * - Server stores IP hash for quota enforcement
 * - Link to privacy policy and contact email
 *
 * State machine:
 *  visible  → "Rozumiem" clicked → dismissed (cookie written, never shown again)
 *  hidden   → never shown again (cookie present, or mode=unlimited)
 */
export function DemoQuotaModal({ quotaInfo, onClose }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!quotaInfo) return;

    // Never show modal in unlimited mode
    if (quotaInfo.mode === 'unlimited') {
      setVisible(false);
      return;
    }

    // Check cookie — only show if not yet acknowledged
    const cookieName = quotaInfo.cookieName || 'forge_demo_acknowledged';
    const acknowledged = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${cookieName}=1`));

    if (!acknowledged) {
      setVisible(true);
    }
  }, [quotaInfo]);

  if (!visible || !quotaInfo) return null;

  const { remaining, limit, contactEmail } = quotaInfo;
  const mailtoSubject = encodeURIComponent('AI Idea Forge — prośba o odblokowanie limitu demo');
  const mailtoHref = `mailto:${contactEmail || 'kontakt@radoslaw-pleskot.com'}?subject=${mailtoSubject}`;

  function handleAcknowledge() {
    const cookieName = quotaInfo.cookieName || 'forge_demo_acknowledged';
    // Cookie valid for 365 days
    document.cookie = `${cookieName}=1; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    setVisible(false);
    onClose?.();
  }

  return (
    <div
      className="shrink-0 border-b border-border bg-background/95 px-4 py-3 md:px-6"
      role="region"
      aria-labelledby="demo-modal-title"
    >
      {/* Non-blocking notice: normal document flow, no overlay, no fixed layer. */}
      <div className="mx-auto w-full max-w-[1400px] rounded-xl border border-border bg-card/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div>
            <h2 id="demo-modal-title" className="text-lg font-semibold text-foreground">
              {t('demoModal.title', 'To jest publiczne demo AI Idea Forge')}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAcknowledge}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={t('demoModal.close', 'Zamknij')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              'demoModal.body',
              'Aplikacja pozwala przetestować funkcję analizy pomysłów. Aby zabezpieczyć demo przed nadużyciami, obowiązuje limit 6 analiz na jeden adres IP.',
              { limit }
            )}
          </p>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
            <div className="text-sm text-muted-foreground">{t('demoModal.remainingLabel', 'Pozostało Ci:')}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              {remaining} <span className="text-lg font-normal text-muted-foreground">/ {limit}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t('demoModal.analysesLeft', 'analiz')}</div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              'demoModal.privacyNote',
              'Na potrzeby obsługi limitu aplikacja używa plików cookies oraz zapisuje adres IP po stronie serwera. Szczegóły znajdziesz w polityce prywatności.'
            )}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('demoModal.understand', 'Rozumiem')}
          </button>

          <div className="flex items-center justify-between gap-2">
            <a
              href="https://radoslaw-pleskot.com/pl/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              {t('demoModal.privacyPolicy', 'Polityka prywatności')}
            </a>
            <a
              href="https://radoslaw-pleskot.com/projekty/ai-idea-forge/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              {t('demoModal.projectDescription', 'Opis projektu')}
            </a>
            <a
              href={mailtoHref}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
            >
              {t('demoModal.requestUnlock', 'Poproś o odblokowanie limitu')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * QuotaBadge — subtle indicator shown in IdeaActionBar or IdeaView.
 *
 * States:
 *  - limited + has quota: "5 / 6 analiz"
 *  - limited + last analysis: "1 / 6 — ostatnia!"
 *  - limited + exceeded: "Limit wyczerpany"
 *  - unlimited: "brak limitu"
 */
export function QuotaBadge({ quotaInfo }) {
  const { t } = useI18n();

  if (!quotaInfo) return null;
  if (quotaInfo.mode === 'unlimited') {
    return (
      <span className="text-xs text-muted-foreground italic">
        {t('demoModal.noLimit', 'brak limitu')}
      </span>
    );
  }

  const { remaining, limit, exceeded } = quotaInfo;

  if (exceeded || remaining === 0) {
    return (
      <span className="text-xs font-medium text-destructive">
        {t('demoModal.limitReached', 'Limit wyczerpany')}
      </span>
    );
  }

  // Build the badge text inline. We avoid t() {{var}} interpolation here because
  // the regex-based substitution was fragile (intermittent display of
  // `{{remaining{{ / {{limit{{ analiz` in dist). Numeric values are templated
  // directly; i18n keys hold only the translatable word.
  const unitLabel = t('demoModal.quotaRemaining', 'analiz');
  const lastAnalysisTitle = t('demoModal.lastAnalysis', 'To Twoja ostatnia bezpłatna analiza!');
  const lastSuffix = t('demoModal.lastRemaining', 'ostatnia!');

  if (remaining === 1) {
    return (
      <span className="text-xs font-medium text-amber-500" title={lastAnalysisTitle}>
        {`1 / ${limit} — ${lastSuffix}`}
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {`${remaining} / ${limit} ${unitLabel}`}
    </span>
  );
}
