/** Schema for the Bitcoin custody interactive presentation data files. */

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type KeyFlag = 'privateKey' | 'publicKey' | 'xpub';

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
  /**
   * Key-material flags this choice sets (educational labels only — never real keys).
   * privateKey = can sign/spend; publicKey/xpub = receive/watch ready.
   */
  setsFlags?: KeyFlag[];
  /** Capabilities this tool/choice unlocks for follow-up slides */
  enables?: string[];
  /** Descriptive capability tags (hardware, hot, airgap, bip39, …) */
  capabilities?: string[];
}

export interface TreeNode {
  id: string;
  /** Must be the question being asked on this slide */
  title: string;
  body: string;
  choices: Choice[];
  /** Optional category badge shown in UI */
  category?: string;
  tags?: string[];
  /** When true, render end-of-path SummaryView (trail + vulns + harden) */
  isSummary?: boolean;
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
  /** Educational key-status labels (never real key material) */
  hasPrivateKey: boolean;
  hasPublicKey: boolean;
  hasXpub: boolean;
}

/** Derived: private present AND (public or xpub) — operable even if vulnerable */
export function isSufficientToOperate(s: Pick<AdventureState, 'hasPrivateKey' | 'hasPublicKey' | 'hasXpub'>): boolean {
  return s.hasPrivateKey && (s.hasPublicKey || s.hasXpub);
}
