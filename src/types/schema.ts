/** Schema for the Bitcoin custody choose-your-own-adventure data files. */

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type MetricKey = 'convenience' | 'security' | 'complexity' | 'recoverability';

export interface MetricDeltas {
  convenience?: number;
  security?: number;
  complexity?: number;
  recoverability?: number;
}

export interface MetricDef {
  id: MetricKey;
  label: string;
  description: string;
  /** Higher is "better" for the user experience of this metric. */
  higherIsBetter: boolean;
  color: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  categories: string[];
}

export interface Mitigation {
  id: string;
  title: string;
  description: string;
  addressesVulnIds: string[];
}

export interface Choice {
  id: string;
  label: string;
  nextNodeId: string;
  addsVulnIds?: string[];
  addsMitigationIds?: string[];
  metricDeltas?: MetricDeltas;
  tags?: string[];
}

export interface TreeNode {
  id: string;
  title: string;
  body: string;
  choices: Choice[];
  /** Optional category badge shown in UI */
  category?: string;
  tags?: string[];
}

export interface RecommendedPath {
  id: string;
  name: string;
  summary: string;
  /** Ideal metric targets (0–100) for comparison */
  metricTargets: Record<MetricKey, number>;
  /** Ordered choice ids to auto-walk from start, OR ordered node ids */
  choiceSequence: string[];
  /** First node if not walking from root */
  startNodeId?: string;
  highlightColor: string;
}

export interface MetricsFile {
  initial: Record<MetricKey, number>;
  metrics: MetricDef[];
}

export interface TreeFile {
  startNodeId: string;
  nodes: TreeNode[];
}

export interface AdventureState {
  currentNodeId: string;
  /** History of {nodeId, choiceId} for trail + undo */
  trail: { nodeId: string; choiceId: string | null; choiceLabel: string | null }[];
  vulnIds: string[];
  mitigationIds: string[];
  metrics: Record<MetricKey, number>;
  tags: string[];
}
