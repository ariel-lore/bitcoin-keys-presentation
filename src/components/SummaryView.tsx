import type { AdventureState, Choice, TreeNode } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { Markdown } from '../lib/markdown';
import { bodyTeaser } from '../lib/data';
import { ChoiceIcon } from './ChoiceIcon';
import { PathRiskList } from './PathRiskList';

export function SummaryView({
  node,
  state,
  openVulnIds,
  onChoose,
  onApplyMitigation,
  onJump,
  procedureMode = false,
}: {
  node: TreeNode;
  state: AdventureState;
  openVulnIds: string[];
  onChoose: (c: Choice) => void;
  onApplyMitigation: (vulnId: string) => void;
  onJump: (nodeId: string) => void;
  /** When true, render as setup/procedure document rather than question chrome */
  procedureMode?: boolean;
}) {
  const teaser = bodyTeaser(node.body);
  const sufficient = isSufficientToOperate(state);
  const remaining = openVulnIds.length;
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
        {/* Single consolidated checklist + risks (left aside is hidden on summary) */}
        <section className="summary-unified" aria-label="Setup checklist and open risks">
          <PathRiskList
            state={state}
            sufficientToOperate={sufficient}
            onJump={onJump}
            onApplyMitigation={onApplyMitigation}
            embedded
            presentation
          />
        </section>

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
