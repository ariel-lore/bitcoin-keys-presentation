/**
 * Trim tree.json: remove nodes owned by builders / obsolete stubs
 * using the same remove-set logic as src/lib/data.ts mergeTree.
 *
 * Usage: npx tsx scripts/trim-tree.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import custodiansData from '../src/data/custodians.json' with { type: 'json' };
import type { TreeFile, CustodianDef } from '../src/types/schema';
import { buildCustodianFlowNodes, buildStartNode } from '../src/lib/buildCustodianNodes.ts';
import { buildAllGuideNodes, guideOwnedNodeIds } from '../src/lib/guides/index.ts';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const treePath = resolve(workspace, 'src/data/tree.json');

const custodians = custodiansData as CustodianDef[];
const raw = JSON.parse(readFileSync(treePath, 'utf8')) as TreeFile;

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
const obsoleteExact = new Set([
  'fed-fedi',
  'fed-lightning',
  'custodian-mode',
]);

const removed: string[] = [];
const kept = raw.nodes.filter((n) => {
  if (
    owned.has(n.id) ||
    obsoleteExact.has(n.id) ||
    obsoletePrefixes.some((p) => n.id.startsWith(p))
  ) {
    removed.push(n.id);
    return false;
  }
  return true;
});

const out: TreeFile = {
  startNodeId: raw.startNodeId ?? start.id,
  nodes: kept,
};

writeFileSync(treePath, JSON.stringify(out, null, 2) + '\n', 'utf8');

console.log('before:', raw.nodes.length);
console.log('removed_count:', removed.length);
console.log('removed_ids:', removed.sort().join('\n'));
console.log('kept:', kept.length);
console.log('startNodeId:', out.startNodeId);
