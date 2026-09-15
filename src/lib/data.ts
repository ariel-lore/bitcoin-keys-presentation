import treeData from '../data/tree.json';
import vulnsData from '../data/vulnerabilities.json';
import mitsData from '../data/mitigations.json';
import pathsData from '../data/paths.json';
import custodiansData from '../data/custodians.json';
import type {
  TreeFile,
  Vulnerability,
  Mitigation,
  RecommendedPath,
  TreeNode,
  CustodianDef,
} from '../types/schema';
import { buildCustodianFlowNodes, buildStartNode } from './buildCustodianNodes';
import { buildAllGuideNodes, guideOwnedNodeIds } from './guides';
import { buildUnavoidableRiskCache } from './unavoidableRisks';

const custodians = custodiansData as CustodianDef[];

/**
 * Merge order:
 * 1. Generated start + custodian flow
 * 2. Guide builders (Fedi, BlueWallet, Trezor, multisig, hub, breadth)
 * 3. Remaining tree.json nodes not owned by (1)/(2)
 */
function mergeTree(raw: TreeFile): TreeFile {
  const custodianNodes = buildCustodianFlowNodes(custodians);
  const start = buildStartNode();
  const guideNodes = buildAllGuideNodes();
  const owned = new Set<string>([
    start.id,
    ...custodianNodes.map((n) => n.id),
    ...guideOwnedNodeIds(guideNodes),
    'custodian-mode',
    'stub-federated',
  ]);

  const obsoletePrefixes = ['auth-', 'creds-', 'kyc-'];
  // Drop legacy federated stubs replaced by guides
  const obsoleteExact = new Set([
    'fed-fedi',
    'fed-lightning',
    'custodian-mode',
  ]);

  const kept = raw.nodes.filter((n) => {
    if (owned.has(n.id)) return false;
    if (obsoleteExact.has(n.id)) return false;
    if (obsoletePrefixes.some((p) => n.id.startsWith(p))) return false;
    return true;
  });

  return {
    startNodeId: start.id,
    nodes: [start, ...custodianNodes, ...guideNodes, ...kept],
  };
}

export const tree = mergeTree(treeData as TreeFile);
export const vulnerabilities = vulnsData as Vulnerability[];
export const mitigations = mitsData as Mitigation[];
export const recommendedPaths = pathsData as RecommendedPath[];
export { custodians };

export const nodeById: Record<string, TreeNode> = Object.fromEntries(
  tree.nodes.map((n) => [n.id, n]),
);
export const vulnById: Record<string, Vulnerability> = Object.fromEntries(
  vulnerabilities.map((v) => [v.id, v]),
);
export const mitigationById: Record<string, Mitigation> = Object.fromEntries(
  mitigations.map((m) => [m.id, m]),
);

/** choiceId → unavoidable vuln ids (intersection of all continuations ∪ intrinsic adds). */
export const unavoidableRiskByChoiceId: Record<string, string[]> =
  buildUnavoidableRiskCache(tree.nodes);

/** First mitigation that addresses a vuln, preferring defaultMitigationId. */
export function mitigationForVuln(vulnId: string): Mitigation | undefined {
  const v = vulnById[vulnId];
  if (v?.defaultMitigationId) {
    const preferred = mitigationById[v.defaultMitigationId];
    if (preferred) return preferred;
  }
  return mitigations.find((m) => m.addressesVulnIds.includes(vulnId));
}

export function uniquePush(list: string[], ids: string[] | undefined): string[] {
  if (!ids?.length) return list;
  const set = new Set(list);
  ids.forEach((id) => set.add(id));
  return [...set];
}

export function uniqueRemove(list: string[], ids: string[] | undefined): string[] {
  if (!ids?.length) return list;
  const drop = new Set(ids);
  return list.filter((id) => !drop.has(id));
}

/** First sentence / short teaser for slide body (full text on hover). */
export function bodyTeaser(body: string, maxLen = 140): string {
  const plain = body
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  const sentence = plain.match(/^[^.!?]+[.!?]/)?.[0] ?? plain;
  if (sentence.length <= maxLen) return sentence.trim();
  return sentence.slice(0, maxLen - 1).trimEnd() + '…';
}

/** Initials fallback when a brand icon fails to load. */
export function brandInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
