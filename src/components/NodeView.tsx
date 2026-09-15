import type { TreeNode, Choice } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { vulnById, mitigationById } from '../lib/data';

export function NodeView({
  node,
  onChoose,
}: {
  node: TreeNode;
  onChoose: (c: Choice) => void;
}) {
  return (
    <article className="node-view">
      <header className="node-header">
        {node.category && <span className="badge">{node.category}</span>}
        <h1>{node.title}</h1>
      </header>
      <div className="node-body">
        <Markdown source={node.body} />
      </div>
      <div className="choices">
        <h2>Your choices</h2>
        <ul>
          {node.choices.map((c) => (
            <li key={c.id}>
              <button type="button" className="choice-btn" onClick={() => onChoose(c)}>
                <span className="choice-label">{c.label}</span>
                <ChoiceHints choice={c} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ChoiceHints({ choice }: { choice: Choice }) {
  const vulns = choice.addsVulnIds?.length ?? 0;
  const mits = choice.addsMitigationIds?.length ?? 0;
  const d = choice.metricDeltas;
  const deltas: string[] = [];
  if (d) {
    (['convenience', 'security', 'complexity', 'recoverability'] as const).forEach((k) => {
      const v = d[k];
      if (v) deltas.push(`${v > 0 ? '+' : ''}${v} ${k.slice(0, 4)}`);
    });
  }
  if (!vulns && !mits && !deltas.length) return null;
  return (
    <span className="choice-hints">
      {vulns > 0 && (
        <span className="hint vuln-hint" title={choice.addsVulnIds?.map((id) => vulnById[id]?.title).join(', ')}>
          +{vulns} vuln{vulns > 1 ? 's' : ''}
        </span>
      )}
      {mits > 0 && (
        <span className="hint mit-hint" title={choice.addsMitigationIds?.map((id) => mitigationById[id]?.title).join(', ')}>
          +{mits} mit{mits > 1 ? 's' : ''}
        </span>
      )}
      {deltas.map((t) => (
        <span key={t} className="hint delta-hint">
          {t}
        </span>
      ))}
    </span>
  );
}
