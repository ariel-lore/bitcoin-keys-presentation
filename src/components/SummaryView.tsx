import type { AdventureState, Choice, TreeNode } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser, vulnById, mitigationForVuln, brandInitials } from '../lib/data';
import { useState } from 'react';

export function SummaryView({
  node,
  state,
  openVulnIds,
  onChoose,
  onApplyMitigation,
}: {
  node: TreeNode;
  state: AdventureState;
  openVulnIds: string[];
  onChoose: (c: Choice) => void;
  onApplyMitigation: (vulnId: string) => void;
}) {
  const teaser = bodyTeaser(node.body);
  const sufficient = isSufficientToOperate(state);
  const trailLabels = state.trail
    .filter((s) => s.choiceLabel)
    .map((s) => s.choiceLabel as string);
  const applied = state.mitigatedVulnIds
    .map((id) => vulnById[id])
    .filter(Boolean);
  const open = openVulnIds.map((id) => vulnById[id]).filter(Boolean);
  const remaining = open.length;

  return (
    <article className="node-view summary-view">
      <header className="node-header">
        {node.category && <span className="badge">{node.category}</span>}
        <h1>{node.title}</h1>
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
            ? remaining > 0
              ? `Operable — ${remaining} open risk${remaining === 1 ? '' : 's'} remain`
              : 'Operable — open risks cleared (vigilance still required)'
            : 'Not yet sufficient to operate — complete private + public sides'}
        </p>
      </header>

      <div className="summary-grid">
        <section className="summary-panel">
          <h2 className="summary-h">Path trail</h2>
          {trailLabels.length === 0 ? (
            <p className="summary-muted">No choices recorded.</p>
          ) : (
            <ol className="summary-trail">
              {trailLabels.map((label, i) => (
                <li key={`${label}-${i}`}>{label}</li>
              ))}
            </ol>
          )}
        </section>

        <section className="summary-panel">
          <h2 className="summary-h">Open vulnerabilities</h2>
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
                        <span className="summary-mit-label">Mitigation: {mit.title}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => onApplyMitigation(v.id)}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="summary-panel">
          <h2 className="summary-h">Applied mitigations</h2>
          {applied.length === 0 ? (
            <p className="summary-muted">None applied yet — click Apply on open risks.</p>
          ) : (
            <ul className="summary-applied">
              {applied.map((v) => (
                <li key={v.id}>
                  <span className="check">✓</span> {v.title}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="choices summary-choices" data-count={node.choices.length}>
        <h2 className="summary-h continue-h">Continue mitigating / hardening</h2>
        <ul>
          {node.choices.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`choice-btn ${c.nextNodeId === 'start' ? 'choice-discreet' : ''}`}
                onClick={() => onChoose(c)}
              >
                {(c.icon || c.subtitle) && <BrandIcon choice={c} />}
                <span className="choice-text">
                  <span className="choice-label">{c.label}</span>
                  {c.subtitle && <span className="choice-subtitle">{c.subtitle}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function BrandIcon({ choice }: { choice: Choice }) {
  const [failed, setFailed] = useState(false);
  if (!choice.icon || failed) {
    if (!choice.icon) return null;
    return (
      <span className="brand-icon brand-fallback" aria-hidden>
        {brandInitials(choice.label)}
      </span>
    );
  }
  return (
    <img
      className="brand-icon"
      src={choice.icon}
      alt=""
      width={28}
      height={28}
      onError={() => setFailed(true)}
    />
  );
}
