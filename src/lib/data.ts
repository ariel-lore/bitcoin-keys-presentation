import treeData from '../data/tree.json';
import vulnsData from '../data/vulnerabilities.json';
import mitsData from '../data/mitigations.json';
import pathsData from '../data/paths.json';
import metricsData from '../data/metrics.json';
import type {
  TreeFile,
  Vulnerability,
  Mitigation,
  RecommendedPath,
  MetricsFile,
  TreeNode,
  MetricKey,
} from '../types/schema';

export const tree = treeData as TreeFile;
export const vulnerabilities = vulnsData as Vulnerability[];
export const mitigations = mitsData as Mitigation[];
export const recommendedPaths = pathsData as RecommendedPath[];
export const metricsFile = metricsData as MetricsFile;

export const nodeById: Record<string, TreeNode> = Object.fromEntries(
  tree.nodes.map((n) => [n.id, n]),
);
export const vulnById: Record<string, Vulnerability> = Object.fromEntries(
  vulnerabilities.map((v) => [v.id, v]),
);
export const mitigationById: Record<string, Mitigation> = Object.fromEntries(
  mitigations.map((m) => [m.id, m]),
);

export function clampMetric(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function applyDeltas(
  current: Record<MetricKey, number>,
  deltas?: Partial<Record<MetricKey, number>>,
): Record<MetricKey, number> {
  if (!deltas) return { ...current };
  const next = { ...current };
  (Object.keys(deltas) as MetricKey[]).forEach((k) => {
    next[k] = clampMetric(next[k] + (deltas[k] ?? 0));
  });
  return next;
}

export function uniquePush(list: string[], ids: string[] | undefined): string[] {
  if (!ids?.length) return list;
  const set = new Set(list);
  ids.forEach((id) => set.add(id));
  return [...set];
}
