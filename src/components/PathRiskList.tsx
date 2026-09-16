import { useEffect, useMemo, useState } from 'react';
import type { AdventureState, Choice, ProcedureStep, TrailStep } from '../types/schema';
import { nodeById, vulnById, mitigationForVuln } from '../lib/data';
import type { Severity } from '../types/schema';
import { ChoiceIcon } from './ChoiceIcon';

const severityClass: Record<Severity, string> = {
  low: 'sev-low',
  medium: 'sev-medium',
  high: 'sev-high',
  critical: 'sev-critical',
};

function switchButtonLabel(mitTitle: string, choiceLabel?: string): string {
  const target = choiceLabel || mitTitle;
  const short = target.length > 28 ? target.slice(0, 27) + '…' : target;
  return `Switch to ${short}`;
}

/** Prefer choice label; fall back to node title (destination / question). */
function stepTitle(
  choiceLabel: string | null | undefined,
  nodeId: string,
  isStart: boolean,
): string {
  if (isStart) return nodeById[nodeId]?.title ?? 'Start';
  return choiceLabel || nodeById[nodeId]?.title || nodeId;
}


/** Reconstruct the Choice taken for a trail step (for icon + title). */
function choiceForTrailStep(trail: TrailStep[], index: number): Choice | null {
  const step = trail[index];
  if (!step?.choiceId || index <= 0) return null;
  const parent = nodeById[trail[index - 1].nodeId];
  const found = parent?.choices.find((c) => c.id === step.choiceId);
  if (found) return found;
  // Fallback: synthetic choice so resolveChoiceIcon still works from id/label
  return {
    id: step.choiceId,
    label: step.choiceLabel || step.choiceId,
    nextNodeId: step.nodeId,
    description: step.choiceDescription ?? undefined,
  };
}

/**
 * Unified vertical path checklist + risks introduced at each step.
 * Entire panel expands/collapses as one unit; content scrolls when expanded.
 * When embedded (summary), always open — left aside is hidden to avoid duplicate UI.
 */
export function PathRiskList({
  state,
  sufficientToOperate,
  onJump,
  onApplyMitigation,
  embedded = false,
  presentation = false,
}: {
  state: AdventureState;
  sufficientToOperate: boolean;
  onJump: (nodeId: string) => void;
  onApplyMitigation: (vulnId: string) => void;
  /** Render inside SummaryView (no collapse chrome; always expanded) */
  embedded?: boolean;
  /** Larger type for presentation / finished-path readability */
  presentation?: boolean;
}) {
  const mitigated = useMemo(() => new Set(state.mitigatedVulnIds), [state.mitigatedVulnIds]);

  const stepScopedVulnIds = useMemo(() => {
    const ids = new Set<string>();
    for (const step of state.trail) {
      for (const id of step.addsVulnIds ?? []) ids.add(id);
    }
    return ids;
  }, [state.trail]);

  const orphanVulnIds = useMemo(
    () => state.vulnIds.filter((id) => !stepScopedVulnIds.has(id)),
    [state.vulnIds, stepScopedVulnIds],
  );

  const [panelOpen, setPanelOpen] = useState(sufficientToOperate || embedded);

  useEffect(() => {
    if (sufficientToOperate || embedded) setPanelOpen(true);
  }, [sufficientToOperate, embedded]);

  const openRiskCount = state.vulnIds.filter((id) => !mitigated.has(id)).length;
  const showBody = embedded || panelOpen;

  /** Path starts at the first choice taken — omit the opening question step. */
  const visibleTrail = useMemo(() => {
    if (state.trail.length <= 1) return state.trail;
    const [first, ...rest] = state.trail;
    const isOpeningQuestion = !first.choiceId && !first.choiceLabel;
    return isOpeningQuestion ? rest : state.trail;
  }, [state.trail]);


  return (
    <nav
      className={[
        'path-risk-list',
        sufficientToOperate ? 'operable' : 'incomplete',
        embedded || panelOpen ? 'panel-open' : 'panel-collapsed',
        embedded ? 'prl-embedded' : '',
        presentation ? 'prl-presentation' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={sufficientToOperate ? 'Setup checklist' : 'Path checklist'}
    >
      {!embedded && (
        <header className="prl-head">
          <button
            type="button"
            className="prl-panel-toggle"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
          >
            <h2>{sufficientToOperate ? 'Checklist' : 'Path checklist'}</h2>
            <span className="prl-panel-meta">
              {openRiskCount > 0 ? `${openRiskCount} open` : 'clear'}
              <span className="prl-chevron" aria-hidden>
                {panelOpen ? '▾' : '▸'}
              </span>
            </span>
          </button>
        </header>
      )}

      {showBody && (
        <div className="prl-scroll">
          <ol className="prl-steps">
            {visibleTrail.map((step, i) => {
              const trailIndex = state.trail.indexOf(step);
              const node = nodeById[step.nodeId];
              const isStart = trailIndex === 0 && !step.choiceLabel;
              const label = stepTitle(step.choiceLabel, step.nodeId, isStart);
              const choice = choiceForTrailStep(state.trail, trailIndex >= 0 ? trailIndex : i);
              const description = isStart
                ? 'Starting question'
                : (step.choiceDescription || (node ? `Leads to: ${node.title}` : null));
              // Intrinsic risks introduced at this step (hide ones later cleared off the path)
              const vulns = (step.addsVulnIds ?? [])
                .filter((id) => state.vulnIds.includes(id) || mitigated.has(id))
                .map((id) => vulnById[id])
                .filter(Boolean);
              const isLast = i === visibleTrail.length - 1;
              const done = !isLast || sufficientToOperate;

              return (
                <li
                  key={`${step.nodeId}-${i}`}
                  className={`prl-step open ${isLast ? 'current' : ''} ${done ? 'done' : ''}`}
                >
                  <div className="prl-step-head">
                    <div className="prl-step-cluster">
                      <span className={`prl-idx`} aria-hidden>
                        {i + 1}
                      </span>
                      {choice && (
                        <span className="prl-step-icon" aria-hidden>
                          <ChoiceIcon choice={choice} />
                        </span>
                      )}
                      <span className="prl-step-main">
                        <span className="prl-label">{label}</span>
                        {vulns.length > 0 && (
                          <span className="prl-risk-count" title={`${vulns.length} introduced here`}>
                            {vulns.filter((v) => !mitigated.has(v.id)).length > 0
                              ? `${vulns.filter((v) => !mitigated.has(v.id)).length} introduced`
                              : 'secured'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="prl-step-body">
                    {description && <p className="prl-desc">{description}</p>}
                    {node && !isStart && (
                      <button
                        type="button"
                        className="prl-jump"
                        onClick={() => onJump(step.nodeId)}
                      >
                        Go to this step
                      </button>
                    )}
                    {vulns.length > 0 && (
                      <ul className="prl-risks" aria-label={`Risks introduced at ${label}`}>
                        <li className="prl-introduced-label" aria-hidden>
                          Introduced at this step
                        </li>
                        {vulns.map((v) => (
                          <RiskRow
                            key={v.id}
                            vulnId={v.id}
                            mitigated={mitigated.has(v.id)}
                            onApply={onApplyMitigation}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}

            {state.procedureSteps.map((ps) => (
              <ProcedureRow key={ps.id} step={ps} />
            ))}
          </ol>

          {orphanVulnIds.length > 0 && (
            <section className="prl-orphans open">
              <div className="prl-step-head">
                <span className="prl-idx" aria-hidden>
                  ·
                </span>
                <span className="prl-step-main">
                  <span className="prl-label">Other open risks</span>
                  <span className="prl-risk-count">
                    {orphanVulnIds.filter((id) => !mitigated.has(id)).length} open
                  </span>
                </span>
              </div>
              <ul className="prl-risks">
                {orphanVulnIds.map((id) => (
                  <RiskRow
                    key={id}
                    vulnId={id}
                    mitigated={mitigated.has(id)}
                    onApply={onApplyMitigation}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </nav>
  );
}

function ProcedureRow({ step }: { step: ProcedureStep }) {
  return (
    <li className="prl-step prl-procedure open done">
      <div className="prl-step-head">
        <span className="prl-idx prl-idx-proc" aria-hidden>
          ✓
        </span>
        <span className="prl-step-main">
          <span className="prl-label">{step.title}</span>
          <span className="prl-badge">Procedure</span>
        </span>
      </div>
      <div className="prl-step-body">
        <p className="prl-desc">{step.description}</p>
      </div>
    </li>
  );
}

function RiskRow({
  vulnId,
  mitigated,
  onApply,
}: {
  vulnId: string;
  mitigated: boolean;
  onApply: (vulnId: string) => void;
}) {
  const v = vulnById[vulnId];
  if (!v) return null;
  const mit = mitigationForVuln(vulnId);
  const kind = mit?.kind ?? 'procedure';
  const isSwitch = kind === 'switchOption';
  const isChooseOther = kind === 'chooseOtherOption';
  const isGuidance = kind === 'guidance';

  return (
    <li className={`prl-risk ${mitigated ? 'mitigated' : 'open'} ${severityClass[v.severity]}`}>
      <div className="prl-risk-head">
        <strong>{v.title}</strong>
        <em className="sev-tag">
          {v.severity}
          {mitigated ? ' · secured' : ''}
        </em>
      </div>
      <p>{v.description}</p>
      {mit && (
        <div className="prl-mit">
          <span className="detail-heading">
            {isSwitch
              ? 'Structural switch'
              : isChooseOther || isGuidance
                ? 'Mitigation'
                : 'Mitigation'}
          </span>
          <strong className="mit-title">{mit.title}</strong>
          <p>{mit.description}</p>
          {mitigated ? (
            <span className="mit-applied">{isSwitch ? 'Switched' : 'Applied'}</span>
          ) : isGuidance ? null : isChooseOther ? (
            <button
              type="button"
              className="btn btn-sm btn-primary apply-mit-btn btn-choose-other"
              onClick={() => onApply(vulnId)}
            >
              Choose another option
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-sm btn-primary apply-mit-btn ${isSwitch ? 'btn-switch' : ''}`}
              onClick={() => onApply(vulnId)}
            >
              {isSwitch
                ? switchButtonLabel(mit.title, mit.switchTo?.choiceLabel)
                : 'Apply · add to procedure'}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
