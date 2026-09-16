import type { AdventureState, Choice, TreeNode } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser, vulnById, mitigationForVuln } from '../lib/data';
import { ChoiceIcon } from './ChoiceIcon';

export function SummaryView({
  node,
  state,
  openVulnIds,
  onChoose,
  onApplyMitigation,
  procedureMode = false,
}: {
  node: TreeNode;
  state: AdventureState;
  openVulnIds: string[];
  onChoose: (c: Choice) => void;
  onApplyMitigation: (vulnId: string) => void;
  /** When true, render as setup/procedure document rather than question chrome */
  procedureMode?: boolean;
}) {
  const teaser = bodyTeaser(node.body);
  const sufficient = isSufficientToOperate(state);
  const open = openVulnIds.map((id) => vulnById[id]).filter(Boolean);
  const remaining = open.length;
  const showProcedure = procedureMode || sufficient;

  return (
    <article className={`node-view summary-view ${showProcedure ? 'procedure-doc' : ''}`}>
      <header className="node-header">
        {node.category && <span className="badge">{showProcedure ? 'Procedure' : node.category}</span>}
        <h1>{showProcedure ? 'Your custody setup' : node.title}</h1>
        {teaser && (
          <div className="node-teaser-wrap" tabIndex={0}>
            <p className="node-teaser">{teaser}</p>
            <div className="hover-detail node-body-detail" role="tooltip">
              <Markdown source={node.body} />
            </div>
          </div>
        )}
        <p className={`summary-risk-line ${sufficient ? 'ready' : 'incomplete'}`}>
          {sufficient
            ? state.hasPrivateKey
              ? remaining > 0
                ? `Operable — ${remaining} open risk${remaining === 1 ? '' : 's'} remain.`
                : 'Operable — open risks cleared (vigilance still required)'
              : remaining > 0
                ? `Setup complete — can receive & send via custodian (no private key). ${remaining} open risk${remaining === 1 ? '' : 's'} remain.`
                : 'Setup complete — can receive & send via custodian (no private key).'
            : 'Not yet sufficient to operate — finish auth / key setup'}
        </p>
      </header>

      <div className="node-scroll">
        <div className={`summary-grid ${showProcedure ? 'procedure-grid' : ''}`}>
          <section className="summary-panel procedure-panel">
            <h2 className="summary-h">Setup checklist</h2>
            {state.trail.filter((s) => s.choiceLabel).length === 0 && state.procedureSteps.length === 0 ? (
              <p className="summary-muted">No choices recorded yet.</p>
            ) : (
              <ol className="summary-trail procedure-steps">
                {state.trail
                  .filter((s) => s.choiceLabel)
                  .map((s, i) => (
                    <li key={`t-${s.choiceId}-${i}`}>
                      <strong>✓ {s.choiceLabel}</strong>
                      {s.choiceDescription && <span className="proc-desc">{s.choiceDescription}</span>}
                      {(s.addsVulnIds?.length ?? 0) > 0 && (
                        <ul className="proc-step-risks">
                          {(s.addsVulnIds ?? []).map((id) => {
                            const v = vulnById[id];
                            if (!v) return null;
                            const secured = state.mitigatedVulnIds.includes(id);
                            const stillOpen = state.vulnIds.includes(id) || secured;
                            if (!stillOpen) return null;
                            return (
                              <li key={id} className={secured ? 'secured' : 'open'}>
                                {secured ? '✓' : '⚠'} {v.title}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  ))}
                {state.procedureSteps.map((ps) => (
                  <li key={ps.id} className="proc-mitigation-step">
                    <strong>✓ {ps.title}</strong>
                    <span className="proc-desc">{ps.description}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="summary-panel summary-panel-risks">
            <h2 className="summary-h">Open risks — continue mitigating</h2>
            {open.length === 0 ? (
              <p className="summary-muted">None open — apply ongoing operational discipline.</p>
            ) : (
              <ul className="summary-vuln-list">
                {open.map((v) => {
                  const mit = mitigationForVuln(v.id);
                  return (
                    <li key={v.id} className={`summary-vuln sev-${v.severity}`}>
                      <div className="summary-vuln-head">
                        <strong>{v.title}</strong>
                        <em>{v.severity}</em>
                      </div>
                      <p>{v.description}</p>
                      {mit && (
                        <div className="summary-mit-row">
                          <span className="summary-mit-label">
                            {mit.kind === 'switchOption'
                              ? 'Switch: '
                              : mit.kind === 'chooseOtherOption'
                                ? 'Mitigation: '
                                : mit.kind === 'guidance'
                                  ? 'Guidance: '
                                  : 'Mitigation: '}
                            {mit.title}
                            {mit.kind === 'switchOption'
                              ? ' · changes structure'
                              : mit.kind === 'chooseOtherOption'
                                ? ' · revisit a prior choice'
                                : mit.kind === 'guidance'
                                  ? ''
                                  : mit.procedureStep
                                    ? ' · adds procedure step'
                                    : ''}
                          </span>
                          {mit.kind === 'guidance' ? null : (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => onApplyMitigation(v.id)}
                            >
                              {mit.kind === 'switchOption'
                                ? `Switch to ${mit.switchTo?.choiceLabel ?? mit.title}…`
                                : mit.kind === 'chooseOtherOption'
                                  ? 'Choose another option'
                                  : 'Apply'}
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {node.choices.length > 0 && (
          <div className="choices summary-choices" data-count={node.choices.length}>
            <h2 className="summary-h continue-h">
              {showProcedure ? 'Further hardening (adds steps)' : 'Continue mitigating / hardening'}
            </h2>
            <ul>
              {node.choices.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`choice-btn ${c.nextNodeId === 'start' ? 'choice-discreet' : ''}`}
                    onClick={() => onChoose(c)}
                  >
                    <ChoiceIcon choice={c} />
                    <span className="choice-text">
                      <span className="choice-label">{c.label}</span>
                      {c.subtitle && <span className="choice-subtitle">{c.subtitle}</span>}
                      {c.description && <span className="choice-description">{c.description}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

