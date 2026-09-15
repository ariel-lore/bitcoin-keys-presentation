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
          const isStart = i === 0 && !step.choiceLabel;
          const label = isStart
            ? (node?.title ?? 'Start')
            : (step.choiceLabel ?? node?.title ?? step.nodeId);
          const isLast = i === trail.length - 1;
          const question = node?.title ?? step.nodeId;
          return (
            <li key={`${step.nodeId}-${i}`} className={isLast ? 'current' : ''}>
              {i > 0 && <span className="trail-sep" aria-hidden />}
              <button
                type="button"
                className="trail-chip"
                tabIndex={0}
                onClick={() => onJump(step.nodeId)}
                aria-current={isLast ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${label}`}
                title={question}
              >
                <span className="trail-chip-label">{label}</span>
                <div className="hover-detail" role="tooltip">
                  <strong>{label}</strong>
                  <p>{isStart ? 'Starting question' : `→ ${question}`}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
