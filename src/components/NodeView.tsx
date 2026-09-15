import { useState } from 'react';
import type { TreeNode, Choice } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser, vulnById, brandInitials } from '../lib/data';

export function NodeView({
  node,
  onChoose,
}: {
  node: TreeNode;
  onChoose: (c: Choice) => void;
}) {
  const teaser = bodyTeaser(node.body);

  return (
    <article className="node-view">
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
      </header>

      <div className="choices" data-count={node.choices.length}>
        <ul>
          {node.choices.map((c) => (
            <li key={c.id}>
              <button type="button" className="choice-btn" onClick={() => onChoose(c)}>
                {(c.icon || c.subtitle) && <BrandIcon choice={c} />}
                <span className="choice-text">
                  <span className="choice-label">{c.label}</span>
                  {c.subtitle && <span className="choice-subtitle">{c.subtitle}</span>}
                </span>
                <ChoiceDetail choice={c} />
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

function ChoiceDetail({ choice }: { choice: Choice }) {
  const vulns = (choice.addsVulnIds ?? []).map((id) => vulnById[id]).filter(Boolean);
  if (!vulns.length && !choice.subtitle) return null;

  return (
    <div className="choice-detail hover-detail" role="tooltip">
      {choice.subtitle && (
        <div className="detail-block">
          <span className="detail-heading">Services</span>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{choice.subtitle}</p>
        </div>
      )}
      {vulns.length > 0 && (
        <div className="detail-block">
          <span className="detail-heading">Risks introduced</span>
          <ul>
            {vulns.map((v) => (
              <li key={v.id}>
                <strong>{v.title}</strong>
                <span>{v.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
