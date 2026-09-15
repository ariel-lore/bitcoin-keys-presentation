import { vulnById, mitigationById } from '../lib/data';
import type { Severity } from '../types/schema';

const severityClass: Record<Severity, string> = {
  low: 'sev-low',
  medium: 'sev-medium',
  high: 'sev-high',
  critical: 'sev-critical',
};

export function VulnStrip({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="status-strip" aria-label={`Vulnerabilities: ${ids.length}`}>
      <span className="strip-label">Risks</span>
      <ul className="icon-row">
        {ids.map((id) => {
          const v = vulnById[id];
          if (!v) return null;
          return (
            <li key={id} className={`icon-chip vuln ${severityClass[v.severity]}`} tabIndex={0}>
              <span className="icon-chip-label" aria-hidden>
                ⚠
              </span>
              <span className="sr-only">{v.title}</span>
              <div className="hover-detail" role="tooltip">
                <strong>{v.title}</strong>
                <em className="sev-tag">{v.severity}</em>
                <p>{v.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MitigationStrip({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="status-strip" aria-label={`Mitigations: ${ids.length}`}>
      <span className="strip-label">Hardening</span>
      <ul className="icon-row">
        {ids.map((id) => {
          const m = mitigationById[id];
          if (!m) return null;
          return (
            <li key={id} className="icon-chip mit" tabIndex={0}>
              <span className="icon-chip-label" aria-hidden>
                ✓
              </span>
              <span className="sr-only">{m.title}</span>
              <div className="hover-detail" role="tooltip">
                <strong>{m.title}</strong>
                <p>{m.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
