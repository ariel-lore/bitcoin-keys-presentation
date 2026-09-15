import { recommendedPaths } from '../lib/data';
import type { RecommendedPath } from '../types/schema';

export function PathPanel({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (path: RecommendedPath) => void;
}) {
  if (!open) return null;

  return (
    <div className="path-overlay" role="dialog" aria-modal="true" aria-label="Recommended paths">
      <button type="button" className="path-backdrop" aria-label="Close" onClick={onClose} />
      <div className="path-sheet">
        <header className="path-sheet-head">
          <h2>Recommended paths</h2>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </header>
        <ul className="path-list">
          {recommendedPaths.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="path-card"
                style={{ borderLeftColor: p.highlightColor }}
                onClick={() => {
                  onApply(p);
                  onClose();
                }}
              >
                <strong>{p.name}</strong>
                <span className="path-summary">{p.summary}</span>
                <span className="path-cta">Walk this path →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
