import type { Choice, TreeNode } from '../../types/schema';

/** Single-option mandatory continue page. */
export function mandatory(
  id: string,
  title: string,
  body: string,
  choice: Choice,
  extra?: Partial<Pick<TreeNode, 'category' | 'tags' | 'preMitigationIds'>>,
): TreeNode {
  const fullBody = body.trimStart().startsWith('**Mandatory')
    ? body
    : `**Mandatory step.** ${body}`;
  return {
    id,
    title,
    body: fullBody,
    category: extra?.category ?? 'Setup',
    tags: extra?.tags,
    preMitigationIds: extra?.preMitigationIds,
    choices: [choice],
  };
}

export function multiChoice(
  id: string,
  title: string,
  body: string,
  choices: Choice[],
  extra?: Partial<Pick<TreeNode, 'category' | 'tags' | 'preMitigationIds' | 'isSummary'>>,
): TreeNode {
  return {
    id,
    title,
    body,
    category: extra?.category ?? 'Setup',
    tags: extra?.tags,
    preMitigationIds: extra?.preMitigationIds,
    isSummary: extra?.isSummary,
    choices,
  };
}
