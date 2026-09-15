import type { AdventureState } from '../types/schema';
import { nodeById } from '../lib/data';

export function Trail({
  trail,
  onJump,
}: {
  trail: AdventureState['trail'];
  onJump: (nodeId: string) => void;
}) {
  return (
    <div className="trail">
      <h2>Choice trail</h2>
      <ol>
        {trail.map((step, i) => {
          const node = nodeById[step.nodeId];
          return (
            <li key={`${step.nodeId}-${i}`}>
              <button type="button" className="trail-item" onClick={() => onJump(step.nodeId)}>
                <span className="trail-idx">{i + 1}</span>
                <span className="trail-text">
                  {step.choiceLabel ? (
                    <>
                      <span className="trail-choice">{step.choiceLabel}</span>
                      <span className="trail-node">→ {node?.title ?? step.nodeId}</span>
                    </>
                  ) : (
                    <span className="trail-node">{node?.title ?? step.nodeId}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
