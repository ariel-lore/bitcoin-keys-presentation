import { vulnById, mitigationForVuln } from '../lib/data';
import type { Severity } from '../types/schema';

const severityClass: Record<Severity, string> = {
  low: 'sev-low',
  medium: 'sev-medium',
  high: 'sev-high',
  critical: 'sev-critical',
};

/**
 * Compact risk row: each risk is paired with its mitigation.
 * Click the mitigation control to mark that risk as secured.
 */
export function RiskMitigationStrip({
  vulnIds,
  mitigatedVulnIds,
  onApplyMitigation,
}: {
  vulnIds: string[];
  mitigatedVulnIds: string[];
  onApplyMitigation: (vulnId: string) => void;
}) {
  if (vulnIds.length === 0) return null;

  const mitigated = new Set(mitigatedVulnIds);

  return (
    <div className="status-strip risk-mit-strip" aria-label={`Risks: ${vulnIds.length}`}>
      <span className="strip-label">Risks</span>
      <ul className="icon-row">
        {vulnIds.map((id) => {
          const v = vulnById[id];
          if (!v) return null;
          const mit = mitigationForVuln(id);
          const isMitigated = mitigated.has(id);
          return (
            <li
              key={id}
              className={`icon-chip risk-pair ${isMitigated ? 'mitigated' : 'open'} ${severityClass[v.severity]}`}
              tabIndex={0}
            >
              <span className="icon-chip-label" aria-hidden>
                {isMitigated ? '✓' : '⚠'}
              </span>
              <span className="sr-only">
                {v.title}
                {isMitigated ? ' (mitigated)' : mit ? ` — mitigate with ${mit.title}` : ''}
              </span>
              <div className="hover-detail risk-detail" role="tooltip">
                <strong>{v.title}</strong>
                <em className="sev-tag">{v.severity}{isMitigated ? ' · secured' : ''}</em>
                <p>{v.description}</p>
                {mit && (
                  <div className="paired-mit">
                    <span className="detail-heading">Mitigation</span>
                    <strong className="mit-title">{mit.title}</strong>
                    <p>{mit.description}</p>
                    {!isMitigated ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary apply-mit-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onApplyMitigation(id);
                        }}
                      >
                        Apply · secure this risk
                      </button>
                    ) : (
                      <span className="mit-applied">Applied</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
