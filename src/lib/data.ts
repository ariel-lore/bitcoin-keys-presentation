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

const custodians = custodiansData as CustodianDef[];

/** Replace start + custodian flow nodes with data-driven versions; keep other paths. */
function mergeTree(raw: TreeFile): TreeFile {
  const generated = buildCustodianFlowNodes(custodians);
  const start = buildStartNode();
  const replaceIds = new Set([start.id, ...generated.map((n) => n.id), 'custodian-mode']);
  // Drop obsolete custodian-mode and any auth-* / single-custodian / path-end-custodial from static JSON
  const obsoletePrefixes = ['auth-'];
  const kept = raw.nodes.filter((n) => {
    if (replaceIds.has(n.id)) return false;
    if (n.id === 'custodian-mode') return false;
    if (n.id === 'single-custodian' || n.id === 'path-end-custodial') return false;
    if (obsoletePrefixes.some((p) => n.id.startsWith(p))) return false;
    return true;
  });
  return {
    startNodeId: start.id,
    nodes: [start, ...generated, ...kept],
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
