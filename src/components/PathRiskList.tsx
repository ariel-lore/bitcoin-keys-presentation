import { useEffect, useMemo, useState } from 'react';
import type { AdventureState, ProcedureStep } from '../types/schema';
import { nodeById, vulnById, mitigationForVuln } from '../lib/data';
import type { Severity } from '../types/schema';

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

/**
 * Unified vertical path + risks list.
 * Entire panel expands/collapses as one unit; content scrolls when expanded.
 * Per-step accordion removed — steps always show their body when the panel is open.
 */
export function PathRiskList({
  state,
  sufficientToOperate,
  onJump,
  onApplyMitigation,
}: {
  state: AdventureState;
  sufficientToOperate: boolean;
  onJump: (nodeId: string) => void;
  onApplyMitigation: (vulnId: string) => void;
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

  // Whole panel: collapsed by default while incomplete; expanded when operable (user can toggle).
  const [panelOpen, setPanelOpen] = useState(sufficientToOperate);

  useEffect(() => {
    if (sufficientToOperate) setPanelOpen(true);
  }, [sufficientToOperate]);

  const openRiskCount = state.vulnIds.filter((id) => !mitigated.has(id)).length;

  return (
    <nav
      className={`path-risk-list ${sufficientToOperate ? 'operable' : 'incomplete'} ${panelOpen ? 'panel-open' : 'panel-collapsed'}`}
      aria-label={sufficientToOperate ? 'Setup procedure' : 'Path and risks'}
    >
      <header className="prl-head">
        <button
          type="button"
          className="prl-panel-toggle"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
        >
          <h2>{sufficientToOperate ? 'Procedure' : 'Path & risks'}</h2>
          <span className="prl-panel-meta">
            {openRiskCount > 0 ? `${openRiskCount} open` : 'clear'}
            <span className="prl-chevron" aria-hidden>
              {panelOpen ? '▾' : '▸'}
            </span>
          </span>
        </button>
      </header>

      {panelOpen && (
        <div className="prl-scroll">
          <ol className="prl-steps">
            {state.trail.map((step, i) => {
              const node = nodeById[step.nodeId];
              const isStart = i === 0 && !step.choiceLabel;
              const label = isStart
                ? (node?.title ?? 'Start')
                : (step.choiceLabel ?? node?.title ?? step.nodeId);
              const description = isStart
                ? 'Starting question'
                : (step.choiceDescription || (node ? `Leads to: ${node.title}` : null));
              const vulns = (step.addsVulnIds ?? []).map((id) => vulnById[id]).filter(Boolean);
              const isLast = i === state.trail.length - 1;

              return (
                <li
                  key={`${step.nodeId}-${i}`}
                  className={`prl-step open ${isLast ? 'current' : ''}`}
                >
                  <div className="prl-step-head">
                    <span className="prl-idx" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="prl-step-main">
                      <span className="prl-label">{label}</span>
                      {vulns.length > 0 && (
                        <span className="prl-risk-count" title={`${vulns.length} risk(s)`}>
                          {vulns.filter((v) => !mitigated.has(v.id)).length > 0
                            ? `${vulns.filter((v) => !mitigated.has(v.id)).length} open`
                            : 'secured'}
                        </span>
                      )}
                    </span>
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
                      <ul className="prl-risks" aria-label={`Risks from ${label}`}>
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
    <li className="prl-step prl-procedure open">
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
  const isSwitch = mit?.kind === 'switchOption';

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
          <span className="detail-heading">{isSwitch ? 'Structural switch' : 'Mitigation'}</span>
          <strong className="mit-title">{mit.title}</strong>
          <p>{mit.description}</p>
          {!mitigated ? (
            <button
              type="button"
              className={`btn btn-sm btn-primary apply-mit-btn ${isSwitch ? 'btn-switch' : ''}`}
              onClick={() => onApply(vulnId)}
            >
              {isSwitch
                ? switchButtonLabel(mit.title, mit.switchTo?.choiceLabel)
                : 'Apply · add to procedure'}
            </button>
          ) : (
            <span className="mit-applied">{isSwitch ? 'Switched' : 'Applied'}</span>
          )}
        </div>
      )}
    </li>
  );
}
