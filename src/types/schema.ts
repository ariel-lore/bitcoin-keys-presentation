/** Schema for the Bitcoin custody interactive presentation data files. */

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  categories: string[];
  /** Preferred mitigation shown paired with this risk in the UI */
  defaultMitigationId?: string;
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
  /** Risks introduced by taking this choice */
  addsVulnIds?: string[];
  /** @deprecated Prefer click-to-apply mitigations paired with vulns; ignored by adventure state */
  addsMitigationIds?: string[];
  tags?: string[];
  /** Brand / service icon path under public/, e.g. /brands/kraken.svg */
  icon?: string;
  /** Short service line under the label, e.g. "Exchange · Lightning" */
  subtitle?: string;
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
  /** Ordered choice ids to auto-walk from start, OR ordered node ids */
  choiceSequence: string[];
  /** First node if not walking from root */
  startNodeId?: string;
  highlightColor: string;
}

export interface TreeFile {
  startNodeId: string;
  nodes: TreeNode[];
}

export interface TrailStep {
  nodeId: string;
  choiceId: string | null;
  choiceLabel: string | null;
}

export interface AdventureState {
  currentNodeId: string;
  /** History of steps for trail + undo */
  trail: TrailStep[];
  /** Accumulated vulnerability ids from choices */
  vulnIds: string[];
  /** Vulns the user has secured by applying paired mitigations */
  mitigatedVulnIds: string[];
  tags: string[];
}
