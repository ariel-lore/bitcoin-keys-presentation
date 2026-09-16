import type { Choice } from '../types/schema';
import choiceIcons from '../data/choiceIcons.json';

type ChoiceIconsData = {
  version: number;
  defaultIcon: string;
  byId: Record<string, string>;
  tagRules: { tags: string[]; icon: string }[];
  keywordRules: { pattern: string; flags: string; icon: string }[];
};

const data = choiceIcons as ChoiceIconsData;

/**
 * Resolve a presentation icon path for any choice.
 * Prefer explicit `choice.icon` (brand assets), then byId map, then tag/keyword rules, then default.
 */
export function resolveChoiceIcon(choice: Pick<Choice, 'id' | 'label' | 'icon' | 'tags' | 'nextNodeId'>): string {
  if (choice.icon) return choice.icon;

  const mapped = data.byId[choice.id];
  if (mapped) return mapped;

  const tags = choice.tags ?? [];
  let best: { icon: string; score: number } | null = null;
  for (const rule of data.tagRules) {
    const hits = rule.tags.filter((t) => tags.includes(t)).length;
    if (hits === 0) continue;
    const all = hits === rule.tags.length;
    const score = hits * 10 + rule.tags.length + (all ? 50 : 0);
    if (!best || score > best.score) best = { icon: rule.icon, score };
  }

  const label = choice.label ?? '';
  for (const rule of data.keywordRules) {
    try {
      const re = new RegExp(rule.pattern, rule.flags);
      if (re.test(label)) {
        if (best && best.score >= 55) break;
        return rule.icon;
      }
    } catch {
      /* ignore bad pattern */
    }
  }
  if (best) return best.icon;

  const next = choice.nextNodeId ?? '';
  if (next === 'start') return '/icons/explore.svg';
  if (next.includes('receive')) return '/icons/receive.svg';
  if (next.includes('send')) return '/icons/send.svg';
  if (next.includes('backup')) return '/icons/backup.svg';
  if (next.includes('multisig')) return '/icons/multisig.svg';
  if (next.includes('passphrase')) return '/icons/passphrase.svg';
  if (next.includes('summary') || next.startsWith('path-end')) return '/icons/summary.svg';

  return data.defaultIcon;
}

/** Icon names / paths known to exist under public/ (for coverage scripts). */
export function listMappedChoiceIds(): string[] {
  return Object.keys(data.byId);
}
