import type { Choice, TreeNode } from '../types/schema';

/**
 * Unavoidable risks for a choice C:
 * enumerate all paths from C.next → terminal (summary / dead-end),
 * collect net vuln sets (adds − clears) including C.addsVulnIds,
 * return the intersection across those paths.
 *
 * Cached at load time: choiceId → vulnIds[].
 */

function uniqueSorted(ids: Iterable<string>): string[] {
  return [...new Set(ids)].sort();
}

function applyEdge(
  vulns: Set<string>,
  adds: string[] | undefined,
  clears: string[] | undefined,
): void {
  for (const id of adds ?? []) vulns.add(id);
  for (const id of clears ?? []) vulns.delete(id);
}

function isTerminal(node: TreeNode | undefined): boolean {
  if (!node) return true;
  if (node.isSummary) return true;
  if (!node.choices?.length) return true;
  return false;
}

/**
 * Exhaustive DFS of choice sequences from `nodeId` to a terminal node.
 * Does not follow edges out of summary nodes (avoids loops via "choose again").
 */
function enumeratePathsToTerminal(
  nodeId: string,
  nodeById: Record<string, TreeNode>,
  visited: Set<string>,
): Choice[][] {
  const node = nodeById[nodeId];
  if (isTerminal(node)) return [[]];

  if (visited.has(nodeId)) return [[]]; // cycle → treat as end
  const nextVisited = new Set(visited);
  nextVisited.add(nodeId);

  const paths: Choice[][] = [];
  for (const choice of node.choices) {
    const nextId = choice.nextNodeId;
    if (!nodeById[nextId]) {
      paths.push([choice]);
      continue;
    }
    const suffixes = enumeratePathsToTerminal(nextId, nodeById, nextVisited);
    for (const suffix of suffixes) {
      paths.push([choice, ...suffix]);
    }
  }
  return paths.length ? paths : [[]];
}

function netRisksForPath(initialAdds: string[] | undefined, path: Choice[]): Set<string> {
  const vulns = new Set<string>(initialAdds ?? []);
  for (const c of path) {
    applyEdge(vulns, c.addsVulnIds, c.clearsVulnIds);
  }
  return vulns;
}

function intersectSets(sets: Set<string>[]): string[] {
  if (sets.length === 0) return [];
  let acc = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const next = new Set<string>();
    for (const id of acc) {
      if (sets[i].has(id)) next.add(id);
    }
    acc = next;
  }
  return uniqueSorted(acc);
}

/** Build choiceId → unavoidable vuln ids for every choice in the tree. */
export function buildUnavoidableRiskCache(
  nodes: TreeNode[],
): Record<string, string[]> {
  const nodeById: Record<string, TreeNode> = Object.fromEntries(
    nodes.map((n) => [n.id, n]),
  );
  const cache: Record<string, string[]> = {};

  for (const node of nodes) {
    for (const choice of node.choices) {
      const paths = enumeratePathsToTerminal(choice.nextNodeId, nodeById, new Set());
      const pathSets = paths.map((p) => netRisksForPath(choice.addsVulnIds, p));
      // Intrinsic adds are already in every path set; union is redundant but explicit
      const unavoidable = new Set(intersectSets(pathSets));
      for (const id of choice.addsVulnIds ?? []) unavoidable.add(id);
      cache[choice.id] = uniqueSorted(unavoidable);
    }
  }

  return cache;
}

/** Lookup helper — empty array when unknown. */
export function unavoidableForChoice(
  cache: Record<string, string[]>,
  choiceId: string,
): string[] {
  return cache[choiceId] ?? [];
}
