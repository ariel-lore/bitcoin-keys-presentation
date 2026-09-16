/**
 * Assert every merged-tree choice resolves to an icon path whose file exists.
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tree } from '../src/lib/data.ts';
import { resolveChoiceIcon } from '../src/lib/resolveChoiceIcon.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

let total = 0;
let missingPath = 0;
let missingFile = 0;
const problems: string[] = [];

for (const node of tree.nodes) {
  for (const c of node.choices) {
    total++;
    const path = resolveChoiceIcon(c);
    if (!path) {
      missingPath++;
      problems.push(`${c.id}: no resolvable path (label=${c.label})`);
      continue;
    }
    // paths are like /brands/x.svg or /icons/y.svg
    const file = join(publicDir, path.replace(/^\//, ''));
    if (!existsSync(file)) {
      missingFile++;
      problems.push(`${c.id}: file missing for ${path}`);
    }
  }
}

console.log(`Choices: ${total}`);
console.log(`Without resolvable path: ${missingPath}`);
console.log(`With path but missing file: ${missingFile}`);
if (problems.length) {
  console.error(problems.slice(0, 40).join('\n'));
  if (problems.length > 40) console.error(`… and ${problems.length - 40} more`);
  process.exit(1);
}
console.log('OK: 0 choices without a resolvable icon path');
