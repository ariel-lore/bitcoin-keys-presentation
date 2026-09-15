import type { TreeNode, Choice } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser, vulnById, mitigationById } from '../lib/data';

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
        <div className="node-teaser-wrap" tabIndex={0}>
          <p className="node-teaser">{teaser}</p>
          <div className="hover-detail node-body-detail" role="tooltip">
            <Markdown source={node.body} />
          </div>
        </div>
      </header>

      <div className="choices" data-count={node.choices.length}>
        <ul>
          {node.choices.map((c) => (
            <li key={c.id}>
              <button type="button" className="choice-btn" onClick={() => onChoose(c)}>
                <span className="choice-label">{c.label}</span>
                <ChoiceDetail choice={c} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ChoiceDetail({ choice }: { choice: Choice }) {
  const vulns = (choice.addsVulnIds ?? []).map((id) => vulnById[id]).filter(Boolean);
  const mits = (choice.addsMitigationIds ?? []).map((id) => mitigationById[id]).filter(Boolean);
  if (!vulns.length && !mits.length) return null;

  return (
    <div className="choice-detail hover-detail" role="tooltip">
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
      {mits.length > 0 && (
        <div className="detail-block">
          <span className="detail-heading">Mitigations</span>
          <ul>
            {mits.map((m) => (
              <li key={m.id}>
                <strong>{m.title}</strong>
                <span>{m.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
