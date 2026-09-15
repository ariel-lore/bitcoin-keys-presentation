import type { AdventureState } from '../types/schema';
import { nodeById } from '../lib/data';

export function TrailStrip({
  trail,
  onJump,
}: {
  trail: AdventureState['trail'];
  onJump: (nodeId: string) => void;
}) {
  return (
    <nav className="trail-strip" aria-label="Choice trail">
      <ol>
        {trail.map((step, i) => {
          const node = nodeById[step.nodeId];
          const label = step.choiceLabel ?? node?.title ?? step.nodeId;
          const isLast = i === trail.length - 1;
          return (
            <li key={`${step.nodeId}-${i}`} className={isLast ? 'current' : ''}>
              <button
                type="button"
                className="trail-dot"
                tabIndex={0}
                onClick={() => onJump(step.nodeId)}
                aria-current={isLast ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${label}`}
              >
                <span aria-hidden>{i + 1}</span>
                <div className="hover-detail" role="tooltip">
                  {step.choiceLabel ? (
                    <>
                      <strong>{step.choiceLabel}</strong>
                      <p>→ {node?.title ?? step.nodeId}</p>
                    </>
                  ) : (
                    <strong>{node?.title ?? step.nodeId}</strong>
                  )}
                </div>
              </button>
              {i < trail.length - 1 && <span className="trail-sep" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
