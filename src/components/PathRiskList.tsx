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

/**
 * Unified vertical path + risks list.
 * Each decision is a row; risks introduced by that decision nest under it.
 * Collapsed by default while setup is incomplete; expanded when operable.
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

  // Expand all when operable; otherwise start collapsed (user can expand).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sufficientToOperate) {
      const next: Record<string, boolean> = {};
      state.trail.forEach((_, i) => {
        next[`step-${i}`] = true;
      });
      state.procedureSteps.forEach((_, i) => {
        next[`proc-${i}`] = true;
      });
      if (orphanVulnIds.length) next['orphans'] = true;
      setExpanded(next);
    }
  }, [sufficientToOperate, state.trail.length, state.procedureSteps.length, orphanVulnIds.length]);

  const toggle = (key: string) => {
    if (sufficientToOperate) return; // stay open when operable
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isOpen = (key: string) => (sufficientToOperate ? true : !!expanded[key]);

  return (
    <nav
      className={`path-risk-list ${sufficientToOperate ? 'operable' : 'incomplete'}`}
      aria-label={sufficientToOperate ? 'Setup procedure' : 'Path and risks'}
    >
      <header className="prl-head">
        <h2>{sufficientToOperate ? 'Procedure' : 'Path & risks'}</h2>
        {!sufficientToOperate && (
          <span className="prl-hint">Tap a step to expand</span>
        )}
      </header>

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
          const key = `step-${i}`;
          const open = isOpen(key);
          const isLast = i === state.trail.length - 1;

          return (
            <li key={`${step.nodeId}-${i}`} className={`prl-step ${isLast ? 'current' : ''} ${open ? 'open' : 'collapsed'}`}>
              <button
                type="button"
                className="prl-step-toggle"
                onClick={() => toggle(key)}
                aria-expanded={open}
              >
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
                <span className="prl-chevron" aria-hidden>
                  {open ? '▾' : '▸'}
                </span>
              </button>

              {open && (
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
              )}
            </li>
          );
        })}

        {state.procedureSteps.map((ps, i) => (
          <ProcedureRow
            key={ps.id}
            step={ps}
            open={isOpen(`proc-${i}`)}
            onToggle={() => toggle(`proc-${i}`)}
            forceOpen={sufficientToOperate}
          />
        ))}
      </ol>

      {orphanVulnIds.length > 0 && (
        <section className={`prl-orphans ${isOpen('orphans') ? 'open' : 'collapsed'}`}>
          <button
            type="button"
            className="prl-step-toggle"
            onClick={() => toggle('orphans')}
            aria-expanded={isOpen('orphans')}
          >
            <span className="prl-idx" aria-hidden>
              ·
            </span>
            <span className="prl-step-main">
              <span className="prl-label">Other open risks</span>
              <span className="prl-risk-count">
                {orphanVulnIds.filter((id) => !mitigated.has(id)).length} open
              </span>
            </span>
            <span className="prl-chevron" aria-hidden>
              {isOpen('orphans') ? '▾' : '▸'}
            </span>
          </button>
          {isOpen('orphans') && (
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
          )}
        </section>
      )}
    </nav>
  );
}

function ProcedureRow({
  step,
  open,
  onToggle,
  forceOpen,
}: {
  step: ProcedureStep;
  open: boolean;
  onToggle: () => void;
  forceOpen: boolean;
}) {
  return (
    <li className={`prl-step prl-procedure ${open || forceOpen ? 'open' : 'collapsed'}`}>
      <button
        type="button"
        className="prl-step-toggle"
        onClick={() => {
          if (!forceOpen) onToggle();
        }}
        aria-expanded={open || forceOpen}
      >
        <span className="prl-idx prl-idx-proc" aria-hidden>
          ✓
        </span>
        <span className="prl-step-main">
          <span className="prl-label">{step.title}</span>
          <span className="prl-badge">Procedure</span>
        </span>
        <span className="prl-chevron" aria-hidden>
          {open || forceOpen ? '▾' : '▸'}
        </span>
      </button>
      {(open || forceOpen) && (
        <div className="prl-step-body">
          <p className="prl-desc">{step.description}</p>
        </div>
      )}
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
          <span className="detail-heading">Mitigation</span>
          <strong className="mit-title">{mit.title}</strong>
          <p>{mit.description}</p>
          {!mitigated ? (
            <button
              type="button"
              className="btn btn-sm btn-primary apply-mit-btn"
              onClick={() => onApply(vulnId)}
            >
              Apply · add to procedure
            </button>
          ) : (
            <span className="mit-applied">Applied</span>
          )}
        </div>
      )}
    </li>
  );
}
