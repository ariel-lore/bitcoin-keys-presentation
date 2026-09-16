import type { AdventureState, Choice, TreeNode } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser } from '../lib/data';
import { PathRiskList } from './PathRiskList';

export function SummaryView({
  node,
  state,
  onApplyMitigation,
  onJump,
  procedureMode = false,
}: {
  node: TreeNode;
  state: AdventureState;
  openVulnIds?: string[];
  onChoose?: (c: Choice) => void;
  onApplyMitigation: (vulnId: string) => void;
  onJump: (nodeId: string) => void;
  procedureMode?: boolean;
}) {
  const teaser = bodyTeaser(node.body);
  const sufficient = isSufficientToOperate(state);
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
      </header>

      <div className="node-scroll">
        <section className="summary-unified" aria-label="Setup path">
          <PathRiskList
            state={state}
            sufficientToOperate={sufficient}
            onJump={onJump}
            onApplyMitigation={onApplyMitigation}
            embedded
            presentation
          />
        </section>
      </div>
    </article>
  );
}
