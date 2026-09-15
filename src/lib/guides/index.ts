import type { TreeNode } from '../../types/schema';
import { buildFederatedGuideNodes } from './buildFederatedGuide';
import { buildBlueWalletGuideNodes } from './buildBlueWalletGuide';
import { buildTrezorGuideNodes } from './buildTrezorGuide';
import { buildMultisigGuideNodes } from './buildMultisigGuide';
import { buildSelfCustodyHubNodes } from './buildSelfCustodyHub';
import { buildBreadthHookNodes } from './buildBreadthHooks';

export { FEDERATED_INTRINSIC_VULNS } from './buildFederatedGuide';

/** All guide-builder nodes (replace colliding ids from tree.json). */
export function buildAllGuideNodes(): TreeNode[] {
  return [
    ...buildSelfCustodyHubNodes(),
    ...buildFederatedGuideNodes(),
    ...buildBlueWalletGuideNodes(),
    ...buildTrezorGuideNodes(),
    ...buildMultisigGuideNodes(),
    ...buildBreadthHookNodes(),
  ];
}

/** Node ids that guide builders own (drop matching tree.json / old stubs). */
export function guideOwnedNodeIds(nodes: TreeNode[]): Set<string> {
  return new Set(nodes.map((n) => n.id));
}
