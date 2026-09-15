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

export interface ProcedureStepDef {
  title: string;
  description: string;
}

/** Structural switch: replace a prior trail decision and jump into another branch. */
export interface SwitchToSpec {
  /** Prefer matching a past choice by id when present */
  replaceChoiceId?: string;
  /** Or find the trail step whose choice carried this tag */
  replaceChoiceTag?: string;
  /** Node to land on after replacing the conflicting decision */
  targetNodeId: string;
  /** Label recorded on the replacement trail step */
  choiceLabel?: string;
  /** Synthetic choice id for the replacement step */
  choiceId?: string;
  /** Vulns removed (and treated as addressed) by the structural change */
  clearsVulnIds?: string[];
  /** Tags to add after the switch */
  addsTags?: string[];
}

export interface Mitigation {
  id: string;
  title: string;
  description: string;
  addressesVulnIds: string[];
  /**
   * procedure = append a setup step (default).
   * switchOption = rewrite the path toward another structural branch (not a fake procedure step).
   */
  kind?: 'procedure' | 'switchOption';
  /** When kind is switchOption */
  switchTo?: SwitchToSpec;
  /** When applied as procedure-style, append this step to the user's procedure / setup document */
  procedureStep?: ProcedureStepDef;
}

export interface Choice {
  id: string;
  label: string;
  nextNodeId: string;
  /** Human-readable explanation shown under the label (1–3 short sentences) */
  description?: string;
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
  /**
   * Mitigations selectable on this slide before choosing an answer
   * (e.g. ceremony OPSEC). Apply adds addressed vulns + marks them mitigated.
   */
  preMitigationIds?: string[];
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

export type TrailStepKind = 'start' | 'choice' | 'mitigation';

export interface TrailStep {
  nodeId: string;
  choiceId: string | null;
  choiceLabel: string | null;
  choiceDescription?: string | null;
  /** Risks introduced by this decision (step-scoped) */
  addsVulnIds?: string[];
  kind?: TrailStepKind;
  /** For mitigation steps appended to the procedure */
  mitigationId?: string | null;
}

/** A procedure / setup step added when a mitigation is applied (or mirrored from trail). */
export interface ProcedureStep {
  id: string;
  title: string;
  description: string;
  fromMitigationId?: string;
  mitigatesVulnIds?: string[];
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
  /** Procedure steps appended when mitigations with procedureStep are applied */
  procedureSteps: ProcedureStep[];
}

/** Derived: private present AND (public or xpub) — operable even if vulnerable */
export function isSufficientToOperate(s: Pick<AdventureState, 'hasPrivateKey' | 'hasPublicKey' | 'hasXpub'>): boolean {
  return s.hasPrivateKey && (s.hasPublicKey || s.hasXpub);
}
