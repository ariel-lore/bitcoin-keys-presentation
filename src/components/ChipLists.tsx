import { vulnById, mitigationById } from '../lib/data';
import type { Severity } from '../types/schema';

const severityClass: Record<Severity, string> = {
  low: 'sev-low',
  medium: 'sev-medium',
  high: 'sev-high',
  critical: 'sev-critical',
};

export function VulnList({ ids }: { ids: string[] }) {
  return (
    <div className="chip-panel">
      <h2>Vulnerabilities ({ids.length})</h2>
      {ids.length === 0 ? (
        <p className="muted">None yet — choices may add risks.</p>
      ) : (
        <ul className="chip-list">
          {ids.map((id) => {
            const v = vulnById[id];
            if (!v) return null;
            return (
              <li key={id} className={`chip vuln ${severityClass[v.severity]}`} title={v.description}>
                <span className="chip-sev">{v.severity}</span>
                <span className="chip-title">{v.title}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MitigationList({ ids }: { ids: string[] }) {
  return (
    <div className="chip-panel">
      <h2>Mitigations ({ids.length})</h2>
      {ids.length === 0 ? (
        <p className="muted">None yet — hardening choices add these.</p>
      ) : (
        <ul className="chip-list">
          {ids.map((id) => {
            const m = mitigationById[id];
            if (!m) return null;
            return (
              <li key={id} className="chip mit" title={m.description}>
                <span className="chip-title">{m.title}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
