import treeData from '../data/tree.json';
import vulnsData from '../data/vulnerabilities.json';
import mitsData from '../data/mitigations.json';
import pathsData from '../data/paths.json';
import type {
  TreeFile,
  Vulnerability,
  Mitigation,
  RecommendedPath,
  TreeNode,
} from '../types/schema';

export const tree = treeData as TreeFile;
export const vulnerabilities = vulnsData as Vulnerability[];
export const mitigations = mitsData as Mitigation[];
export const recommendedPaths = pathsData as RecommendedPath[];

export const nodeById: Record<string, TreeNode> = Object.fromEntries(
  tree.nodes.map((n) => [n.id, n]),
);
export const vulnById: Record<string, Vulnerability> = Object.fromEntries(
  vulnerabilities.map((v) => [v.id, v]),
);
export const mitigationById: Record<string, Mitigation> = Object.fromEntries(
  mitigations.map((m) => [m.id, m]),
);

export function uniquePush(list: string[], ids: string[] | undefined): string[] {
  if (!ids?.length) return list;
  const set = new Set(list);
  ids.forEach((id) => set.add(id));
  return [...set];
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
