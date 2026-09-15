import { metricsFile } from '../lib/data';
import type { MetricKey } from '../types/schema';

export function MetricMeters({
  metrics,
  targets,
}: {
  metrics: Record<MetricKey, number>;
  targets?: Record<MetricKey, number> | null;
}) {
  return (
    <div className="meters" aria-label="Running scores">
      {metricsFile.metrics.map((m) => (
        <div key={m.id} className="meter" title={m.description}>
          <div className="meter-label">
            <span>{m.label}</span>
            <span className="meter-value">{metrics[m.id]}</span>
          </div>
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{
                width: `${metrics[m.id]}%`,
                background: m.color,
              }}
            />
            {targets && (
              <div
                className="meter-target"
                style={{ left: `${targets[m.id]}%`, borderColor: m.color }}
                title={`Path target: ${targets[m.id]}`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
