import { recommendedPaths } from '../lib/data';
import type { RecommendedPath } from '../types/schema';

export function PathPanel({
  activePathId,
  onApply,
  onSelectCompare,
}: {
  activePathId: string | null;
  onApply: (path: RecommendedPath) => void;
  onSelectCompare: (path: RecommendedPath | null) => void;
}) {
  return (
    <div className="paths">
      <h2>Recommended paths</h2>
      <p className="muted small">Jump to a curated walkthrough, or select to compare metric targets.</p>
      <ul className="path-list">
        {recommendedPaths.map((p) => (
          <li key={p.id} className={activePathId === p.id ? 'active' : ''}>
            <button
              type="button"
              className="path-card"
              style={{ borderLeftColor: p.highlightColor }}
              onClick={() => onSelectCompare(p)}
            >
              <strong>{p.name}</strong>
              <span className="path-summary">{p.summary}</span>
              <span className="path-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply(p);
                  }}
                >
                  Walk path
                </button>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
