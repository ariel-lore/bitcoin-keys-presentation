import { useState } from 'react';
import type { TreeNode, Choice } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser, vulnById, brandInitials, mitigationById } from '../lib/data';

export function NodeView({
  node,
  onChoose,
  mitigatedVulnIds = [],
  onApplyPreMitigation,
  procedureMode = false,
}: {
  node: TreeNode;
  onChoose: (c: Choice) => void;
  mitigatedVulnIds?: string[];
  onApplyPreMitigation?: (mitigationId: string) => void;
  procedureMode?: boolean;
}) {
  const teaser = bodyTeaser(node.body);
  const preMits = (node.preMitigationIds ?? [])
    .map((id) => mitigationById[id])
    .filter(Boolean);
  const mitigated = new Set(mitigatedVulnIds);

  return (
    <article className={`node-view ${procedureMode ? "procedure-doc" : ""}`}>
      <header className="node-header">
        {(procedureMode || node.category) && (
          <span className="badge">{procedureMode ? 'Setup' : node.category}</span>
        )}
        <h1>{node.title}</h1>
        {teaser && (
          <div className="node-teaser-wrap" tabIndex={0}>
            <p className="node-teaser">{teaser}</p>
            <div className="hover-detail node-body-detail" role="tooltip">
              <Markdown source={node.body} />
            </div>
          </div>
        )}
      </header>

      {preMits.length > 0 && onApplyPreMitigation && (
        <section className="pre-mits" aria-label="Apply before choosing">
          <h2 className="pre-mits-heading">Ceremony OPSEC — apply before choosing</h2>
          <ul className="pre-mits-list">
            {preMits.map((m) => {
              const done = (m.addressesVulnIds ?? []).every((id) => mitigated.has(id));
              return (
                <li key={m.id} className={done ? 'applied' : ''}>
                  <div className="pre-mit-text">
                    <strong>{m.title}</strong>
                    <span>{m.description}</span>
                  </div>
                  {done ? (
                    <span className="mit-applied">Applied</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => onApplyPreMitigation(m.id)}
                    >
                      Apply
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="choices" data-count={node.choices.length}>
        <ul>
          {node.choices.map((c) => {
            const vulns = (c.addsVulnIds ?? []).map((id) => vulnById[id]).filter(Boolean);
            return (
              <li key={c.id} className="choice-item">
                <button type="button" className="choice-btn" onClick={() => onChoose(c)}>
                  {(c.icon || c.subtitle) && <BrandIcon choice={c} />}
                  <span className="choice-text">
                    <span className="choice-label">{c.label}</span>
                    {c.subtitle && <span className="choice-subtitle">{c.subtitle}</span>}
                    {c.description && <span className="choice-description">{c.description}</span>}
                  </span>
                  <ChoiceDetail choice={c} />
                </button>
                {vulns.length > 0 && (
                  <ul className="choice-vulns" aria-label={`Risks from ${c.label}`}>
                    {vulns.map((v) => (
                      <li key={v.id} className={`choice-vuln sev-${v.severity}`}>
                        <strong>{v.title}</strong>
                        <span>{v.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function BrandIcon({ choice }: { choice: Choice }) {
  const [failed, setFailed] = useState(false);
  if (!choice.icon || failed) {
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

/** Hover detail: description / services only — risks stay listed under the option. */
function ChoiceDetail({ choice }: { choice: Choice }) {
  if (!choice.subtitle && !choice.description) return null;

  return (
    <div className="choice-detail hover-detail" role="tooltip">
      {choice.description && (
        <div className="detail-block">
          <span className="detail-heading">About this option</span>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{choice.description}</p>
        </div>
      )}
      {choice.subtitle && (
        <div className="detail-block">
          <span className="detail-heading">Services</span>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{choice.subtitle}</p>
        </div>
      )}
    </div>
  );
}
