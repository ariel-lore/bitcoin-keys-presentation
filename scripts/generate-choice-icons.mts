/**
 * Generates public/icons/*.svg concept icons and src/data/choiceIcons.json
 * covering every choice that lacks an explicit brand icon.
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const ORANGE = '#f7931a';
const ORANGE_DIM = '#c47510';
const MUTED = '#8b97ab';
const TEXT = '#e8edf5';
const BG = '#141820';
const GREEN = '#22c55e';
const RED = '#ef4444';
const BLUE = '#38bdf8';
const PURPLE = '#a78bfa';

function svg(body: string, vb = '0 0 64 64'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none">${body}</svg>\n`;
}

function frame(inner: string): string {
  return `<rect width="64" height="64" rx="12" fill="${BG}" stroke="#2a3344" stroke-width="1.5"/>${inner}`;
}

/** Simple geometric concept icons — original, not trademark logos */
const ICONS: Record<string, string> = {
  'default': frame(`<circle cx="32" cy="32" r="14" fill="${ORANGE}"/><text x="32" y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="18" fill="#1a1005">₿</text>`),

  'custodian': frame(`<rect x="16" y="22" width="32" height="26" rx="2" stroke="${ORANGE}" stroke-width="2.5"/><path d="M20 22 V18 H44 V22" stroke="${ORANGE}" stroke-width="2.5"/><path d="M24 30 h4v10h-4zm12 0h4v10h-4zM28 48h8" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'federation': frame(`<circle cx="32" cy="20" r="6" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="18" cy="42" r="6" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="46" cy="42" r="6" stroke="${ORANGE}" stroke-width="2.5"/><path d="M32 26 L20 36 M32 26 L44 36 M24 42 H40" stroke="${MUTED}" stroke-width="2"/>`),

  'self-custody': frame(`<circle cx="32" cy="22" r="8" stroke="${ORANGE}" stroke-width="2.5"/><path d="M20 48c0-8 5.5-12 12-12s12 4 12 12" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="36" r="5" stroke="${GREEN}" stroke-width="2"/><path d="M40 33v6M37.5 36h5" stroke="${GREEN}" stroke-width="1.5" stroke-linecap="round"/>`),

  'collaborative': frame(`<circle cx="22" cy="24" r="7" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="42" cy="24" r="7" stroke="${ORANGE}" stroke-width="2.5"/><path d="M14 48c0-6 4-10 8-10s8 4 8 10M34 48c0-6 4-10 8-10s8 4 8 10" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/><path d="M28 30h8" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round"/>`),

  'single-key': frame(`<circle cx="26" cy="26" r="10" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="26" cy="26" r="3.5" fill="${ORANGE}"/><path d="M34 32 L48 46 M42 46h6v-6" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'multisig': frame(`<circle cx="20" cy="28" r="7" stroke="${ORANGE}" stroke-width="2"/><circle cx="32" cy="22" r="7" stroke="${ORANGE}" stroke-width="2"/><circle cx="44" cy="28" r="7" stroke="${ORANGE}" stroke-width="2"/><path d="M20 35v10M32 29v16M44 35v10" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/><path d="M16 48h32" stroke="${GREEN}" stroke-width="2" stroke-linecap="round"/>`),

  'hot': frame(`<path d="M32 12c4 8-2 10 2 18 6-4 10 2 10 10a12 12 0 01-24 0c0-8 6-12 8-16 0-4 2-8 4-12z" stroke="${ORANGE}" stroke-width="2.5" fill="none"/><path d="M28 44c0-4 2-6 4-8" stroke="${ORANGE_DIM}" stroke-width="2" stroke-linecap="round"/>`),

  'cold': frame(`<path d="M32 14v36M18 22l28 20M46 22L18 42" stroke="${BLUE}" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="${BG}" stroke="${BLUE}" stroke-width="2"/>`),

  'email': frame(`<rect x="12" y="18" width="40" height="28" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><path d="M14 20 L32 34 L50 20" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'password': frame(`<rect x="18" y="28" width="28" height="20" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><path d="M24 28v-6a8 8 0 0116 0v6" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="38" r="2.5" fill="${ORANGE}"/>`),

  'kyc': frame(`<rect x="16" y="14" width="32" height="36" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="26" r="6" stroke="${MUTED}" stroke-width="2"/><path d="M22 42c2-5 6-7 10-7s8 2 10 7" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/><rect x="38" y="40" width="8" height="6" rx="1" fill="${GREEN}"/>`),

  'totp': frame(`<rect x="22" y="10" width="20" height="44" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><rect x="26" y="18" width="12" height="8" rx="1" fill="${ORANGE}" opacity="0.35"/><text x="32" y="40" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8" font-weight="700" fill="${TEXT}">246</text>`),

  'passkey': frame(`<path d="M32 14c-8 0-14 6-14 14 0 10 14 24 14 24s14-14 14-24c0-8-6-14-14-14z" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="28" r="5" stroke="${GREEN}" stroke-width="2"/><path d="M32 33v5" stroke="${GREEN}" stroke-width="2" stroke-linecap="round"/>`),

  'hardware-key': frame(`<rect x="10" y="26" width="36" height="14" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="20" cy="33" r="3" fill="${ORANGE}"/><path d="M46 30h8M46 34h8M46 38h6" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'skip': frame(`<circle cx="32" cy="32" r="18" stroke="${ORANGE_DIM}" stroke-width="2.5"/><path d="M26 24l16 8-16 8V24z" fill="${ORANGE_DIM}"/><path d="M44 24v16" stroke="${ORANGE_DIM}" stroke-width="2.5" stroke-linecap="round"/>`),

  'warning': frame(`<path d="M32 12 L54 50 H10 Z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 26v12" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="44" r="2" fill="${ORANGE}"/>`),

  'download': frame(`<path d="M32 14v28M22 32l10 12 10-12" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 48h32" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/>`),

  'qr-invite': frame(`<rect x="12" y="12" width="18" height="18" rx="2" stroke="${ORANGE}" stroke-width="2"/><rect x="34" y="12" width="18" height="18" rx="2" stroke="${ORANGE}" stroke-width="2"/><rect x="12" y="34" width="18" height="18" rx="2" stroke="${ORANGE}" stroke-width="2"/><rect x="36" y="36" width="6" height="6" fill="${ORANGE}"/><rect x="46" y="36" width="6" height="6" fill="${ORANGE}"/><rect x="36" y="46" width="6" height="6" fill="${ORANGE}"/><rect x="46" y="46" width="6" height="6" fill="${MUTED}"/>`),

  'social-backup': frame(`<circle cx="22" cy="22" r="6" stroke="${ORANGE}" stroke-width="2"/><circle cx="42" cy="22" r="6" stroke="${ORANGE}" stroke-width="2"/><circle cx="32" cy="36" r="6" stroke="${ORANGE}" stroke-width="2"/><path d="M32 18v12M26 24l6 6 6-6" stroke="${GREEN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 50h32" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'pin': frame(`<rect x="16" y="14" width="32" height="36" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="24" cy="26" r="2.5" fill="${MUTED}"/><circle cx="32" cy="26" r="2.5" fill="${MUTED}"/><circle cx="40" cy="26" r="2.5" fill="${MUTED}"/><circle cx="24" cy="36" r="2.5" fill="${MUTED}"/><circle cx="32" cy="36" r="2.5" fill="${ORANGE}"/><circle cx="40" cy="36" r="2.5" fill="${MUTED}"/><circle cx="32" cy="46" r="2.5" fill="${MUTED}"/>`),

  'paper': frame(`<path d="M20 12h18l8 8v32H20V12z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 12v8h8" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 30h12M26 38h12M26 46h8" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'metal': frame(`<rect x="10" y="22" width="44" height="24" rx="2" stroke="${ORANGE}" stroke-width="2.5"/><path d="M16 30h8M28 30h8M40 30h8M16 38h32" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'dice': frame(`<rect x="14" y="14" width="36" height="36" rx="6" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="24" cy="24" r="3" fill="${ORANGE}"/><circle cx="40" cy="24" r="3" fill="${ORANGE}"/><circle cx="32" cy="32" r="3" fill="${ORANGE}"/><circle cx="24" cy="40" r="3" fill="${ORANGE}"/><circle cx="40" cy="40" r="3" fill="${ORANGE}"/>`),

  'cards': frame(`<rect x="18" y="12" width="22" height="32" rx="2" stroke="${MUTED}" stroke-width="2" transform="rotate(-12 29 28)"/><rect x="22" y="16" width="22" height="32" rx="2" stroke="${ORANGE}" stroke-width="2.5"/><path d="M29 28h8M33 24v8" stroke="${ORANGE}" stroke-width="2" stroke-linecap="round"/>`),

  'home': frame(`<path d="M12 30 L32 14 L52 30" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 28v22h28V28" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><rect x="28" y="36" width="8" height="14" fill="${MUTED}"/>`),

  'family': frame(`<circle cx="24" cy="20" r="6" stroke="${ORANGE}" stroke-width="2"/><circle cx="40" cy="22" r="5" stroke="${ORANGE}" stroke-width="2"/><path d="M14 48c0-7 4.5-11 10-11s10 4 10 11" stroke="${ORANGE}" stroke-width="2" stroke-linecap="round"/><path d="M34 48c0-5 3-9 7-9s7 4 7 9" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'vault': frame(`<rect x="12" y="16" width="40" height="36" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="34" r="8" stroke="${MUTED}" stroke-width="2.5"/><circle cx="32" cy="34" r="2.5" fill="${ORANGE}"/><path d="M32 26v-4M40 34h4M32 42v4M24 34h-4" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'hardware-wallet': frame(`<rect x="18" y="10" width="28" height="44" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><rect x="24" y="18" width="16" height="10" rx="1" stroke="${MUTED}" stroke-width="2"/><circle cx="32" cy="40" r="4" stroke="${GREEN}" stroke-width="2"/>`),

  'seed': frame(`<path d="M32 48 V28" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><path d="M32 30c-10-2-14-12-10-18 8 2 12 10 10 18z" stroke="${GREEN}" stroke-width="2"/><path d="M32 34c10-2 14-10 10-16-8 2-12 8-10 16z" stroke="${GREEN}" stroke-width="2"/><circle cx="32" cy="50" r="3" fill="${ORANGE_DIM}"/>`),

  'passphrase': frame(`<rect x="14" y="30" width="36" height="18" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><path d="M22 30v-6a10 10 0 0120 0v6" stroke="${ORANGE}" stroke-width="2.5"/><path d="M20 40h24" stroke="${PURPLE}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3"/>`),

  'verify': frame(`<circle cx="32" cy="32" r="18" stroke="${GREEN}" stroke-width="2.5"/><path d="M22 32l8 8 14-16" stroke="${GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),

  'receive': frame(`<path d="M32 14v28M22 32l10 12 10-12" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="48" width="32" height="6" rx="2" fill="${MUTED}"/>`),

  'send': frame(`<path d="M32 50V22M22 32l10-12 10 12" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="10" width="32" height="6" rx="2" fill="${MUTED}"/>`),

  'another': frame(`<path d="M20 28a14 14 0 0124-6l4-4v12H36l4-4a10 10 0 00-16 4" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 36a14 14 0 01-24 6l-4 4V34h12l-4 4a10 10 0 0016-4" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'continue': frame(`<circle cx="32" cy="32" r="18" stroke="${ORANGE}" stroke-width="2.5"/><path d="M28 22l12 10-12 10" stroke="${ORANGE}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),

  'check': frame(`<path d="M14 32l12 12 24-26" stroke="${GREEN}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'lightning': frame(`<path d="M36 10 L22 34h12L28 54l18-28H34L36 10z" fill="${ORANGE}" stroke="${ORANGE}" stroke-linejoin="round"/>`),

  'sparrow': frame(`<path d="M14 36c8-16 20-22 36-20-6 4-10 10-12 16 6 0 12 2 16 8-10 2-18 0-24-4-4 6-10 10-18 12 2-4 4-8 2-12z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round" fill="none"/>`),

  'descriptor': frame(`<path d="M20 16 L12 32l8 16M44 16l8 16-8 16" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 48 L36 16" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/>`),

  'shamir-share': frame(`<circle cx="32" cy="32" r="18" stroke="${ORANGE}" stroke-width="2.5"/><path d="M32 14v18l14 10" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><path d="M32 32 L18 42" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'install': frame(`<rect x="18" y="28" width="28" height="22" rx="2" stroke="${ORANGE}" stroke-width="2.5"/><path d="M32 12v20M24 24l8 10 8-10" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'create': frame(`<circle cx="32" cy="32" r="18" stroke="${ORANGE}" stroke-width="2.5"/><path d="M32 20v24M20 32h24" stroke="${ORANGE}" stroke-width="3" stroke-linecap="round"/>`),

  'recover': frame(`<path d="M44 28a14 14 0 10-4 14" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><path d="M44 18v12H32" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'firmware': frame(`<rect x="18" y="18" width="28" height="28" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><path d="M26 18v-4M38 18v-4M26 50v4M38 50v4M18 26h-4M18 38h-4M50 26h4M50 38h4" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/><rect x="26" y="26" width="12" height="12" fill="${ORANGE}" opacity="0.4"/>`),

  'authenticity': frame(`<path d="M32 10l16 8v14c0 12-8 20-16 24-8-4-16-12-16-24V18l16-8z" stroke="${GREEN}" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 32l6 6 12-12" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  'summary': frame(`<rect x="14" y="12" width="36" height="40" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><path d="M22 24h20M22 32h20M22 40h12" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/><circle cx="44" cy="40" r="3" fill="${GREEN}"/>`),

  'phone': frame(`<rect x="22" y="8" width="20" height="48" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="48" r="2.5" fill="${MUTED}"/>`),

  'pc': frame(`<rect x="10" y="14" width="44" height="28" rx="2" stroke="${ORANGE}" stroke-width="2.5"/><path d="M24 48h16M32 42v6" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/><rect x="16" y="20" width="32" height="16" fill="${MUTED}" opacity="0.25"/>`),

  'airgap': frame(`<rect x="14" y="20" width="16" height="24" rx="2" stroke="${ORANGE}" stroke-width="2"/><rect x="34" y="20" width="16" height="24" rx="2" stroke="${ORANGE}" stroke-width="2"/><path d="M30 32h4" stroke="${RED}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 3"/><circle cx="22" cy="48" r="2" fill="${MUTED}"/><circle cx="42" cy="48" r="2" fill="${MUTED}"/>`),

  'elsewhere': frame(`<circle cx="32" cy="28" r="10" stroke="${ORANGE}" stroke-width="2.5"/><path d="M32 18c6 8 6 16 0 20-6-4-6-12 0-20z" stroke="${ORANGE}" stroke-width="2"/><circle cx="32" cy="26" r="2.5" fill="${ORANGE}"/><path d="M20 48h24" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'inheritance': frame(`<path d="M18 14h28v36l-14-8-14 8V14z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 26h12M26 34h12" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'signing': frame(`<path d="M14 44l22-22 8 8-22 22H14v-8z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 26l8 8" stroke="${MUTED}" stroke-width="2"/><path d="M42 18l6 6" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round"/>`),

  'xpub': frame(`<rect x="12" y="20" width="24" height="24" rx="3" stroke="${ORANGE}" stroke-width="2.5"/><path d="M36 28h12v16H28v-4" stroke="${GREEN}" stroke-width="2.5" stroke-linejoin="round"/><path d="M40 24l8 8M48 24l-8 8" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'wallet': frame(`<rect x="12" y="18" width="40" height="30" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><path d="M12 28h40" stroke="${MUTED}" stroke-width="2"/><circle cx="44" cy="38" r="3" fill="${ORANGE}"/>`),

  'explore': frame(`<circle cx="32" cy="32" r="18" stroke="${ORANGE}" stroke-width="2.5"/><polygon points="32,18 38,32 32,46 26,32" fill="${ORANGE}" opacity="0.35" stroke="${ORANGE}" stroke-width="1.5"/><circle cx="32" cy="32" r="3" fill="${TEXT}"/>`),

  'back': frame(`<circle cx="32" cy="32" r="18" stroke="${MUTED}" stroke-width="2.5"/><path d="M36 22l-12 10 12 10" stroke="${MUTED}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),

  'yes': frame(`<circle cx="32" cy="32" r="18" stroke="${GREEN}" stroke-width="2.5"/><path d="M22 32l7 7 13-14" stroke="${GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),

  'no': frame(`<circle cx="32" cy="32" r="18" stroke="${RED}" stroke-width="2.5"/><path d="M24 24l16 16M40 24L24 40" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>`),

  'sms': frame(`<rect x="12" y="16" width="40" height="28" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><path d="M24 44l8-8h12" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 26h24M20 34h14" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'words': frame(`<path d="M14 18h36M14 28h28M14 38h32M14 48h20" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="28" r="4" fill="${GREEN}"/>`),

  'glacier': frame(`<path d="M8 48 L24 18 L32 34 L40 14 L56 48 Z" stroke="${BLUE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 48h48" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'opsec': frame(`<circle cx="32" cy="32" r="10" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="32" r="4" fill="${ORANGE}"/><path d="M8 32c8-14 24-20 48 0-8 14-24 20-48 0z" stroke="${MUTED}" stroke-width="2"/><path d="M16 16l32 32" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`),

  'watch-only': frame(`<path d="M8 32c8-14 24-20 48 0-8 14-24 20-48 0z" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="32" r="8" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="32" r="3" fill="${MUTED}"/>`),

  'psbt': frame(`<rect x="10" y="22" width="18" height="20" rx="2" stroke="${ORANGE}" stroke-width="2"/><rect x="36" y="22" width="18" height="20" rx="2" stroke="${GREEN}" stroke-width="2"/><path d="M28 32h8M34 28l6 4-6 4" stroke="${ORANGE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),

  'offline': frame(`<path d="M16 36a16 16 0 0132 0" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/><path d="M22 40a10 10 0 0120 0" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="46" r="3" fill="${MUTED}"/><path d="M18 18l28 28" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`),

  'backup': frame(`<path d="M20 24h24v28H20V24z" stroke="${ORANGE}" stroke-width="2.5"/><path d="M24 24v-6h16v6" stroke="${ORANGE}" stroke-width="2.5"/><path d="M28 34h8M28 42h8" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'bitcoin': frame(`<circle cx="32" cy="32" r="18" fill="${ORANGE}"/><text x="32" y="40" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="22" fill="#1a1005">₿</text>`),

  'threshold': frame(`<rect x="12" y="36" width="10" height="14" rx="1" fill="${ORANGE}"/><rect x="27" y="28" width="10" height="22" rx="1" fill="${ORANGE}"/><rect x="42" y="20" width="10" height="30" rx="1" fill="${MUTED}" opacity="0.45"/><path d="M12 16h40" stroke="${GREEN}" stroke-width="2" stroke-dasharray="4 3"/>`),

  'coin': frame(`<circle cx="28" cy="30" r="14" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="38" cy="36" r="14" stroke="${MUTED}" stroke-width="2.5"/><text x="28" y="34" text-anchor="middle" font-size="10" fill="${ORANGE}" font-weight="700">H</text>`),

  'camera': frame(`<rect x="10" y="20" width="44" height="28" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="34" r="8" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="32" cy="34" r="3" fill="${MUTED}"/><path d="M22 20l4-6h12l4 6" stroke="${MUTED}" stroke-width="2" stroke-linejoin="round"/>`),

  'cloud': frame(`<path d="M22 42h24a10 10 0 000-20 12 12 0 00-22-4A8 8 0 0022 42z" stroke="${BLUE}" stroke-width="2.5"/>`),

  'sd-card': frame(`<path d="M20 14h18l8 8v28H20V14z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 14v8M32 14v8M38 14v8" stroke="${MUTED}" stroke-width="2"/>`),

  'usb': frame(`<path d="M32 12v20M24 20l8-8 8 8" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="24" y="32" width="16" height="20" rx="2" stroke="${ORANGE}" stroke-width="2.5"/>`),

  'electrum': frame(`<circle cx="32" cy="32" r="18" stroke="${ORANGE}" stroke-width="2.5"/><path d="M22 32h20M32 22v20" stroke="${ORANGE}" stroke-width="2.5" stroke-linecap="round"/><path d="M24 24l16 16M40 24L24 40" stroke="${MUTED}" stroke-width="1.5" opacity="0.5"/>`),

  'segwit': frame(`<path d="M14 40 L32 14 L50 40 Z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 40h20" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="30" r="4" fill="${ORANGE}"/>`),

  'playbook': frame(`<rect x="14" y="12" width="28" height="40" rx="2" stroke="${ORANGE}" stroke-width="2.5"/><rect x="22" y="16" width="28" height="40" rx="2" stroke="${MUTED}" stroke-width="2"/><path d="M28 28h16M28 36h12" stroke="${MUTED}" stroke-width="2" stroke-linecap="round"/>`),

  'diversity': frame(`<circle cx="20" cy="28" r="8" stroke="${ORANGE}" stroke-width="2"/><circle cx="44" cy="28" r="8" stroke="${BLUE}" stroke-width="2"/><circle cx="32" cy="44" r="8" stroke="${GREEN}" stroke-width="2"/>`),

  'rng': frame(`<rect x="14" y="18" width="36" height="28" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><text x="32" y="38" text-anchor="middle" font-family="ui-monospace,monospace" font-size="12" font-weight="700" fill="${TEXT}">RNG</text>`),

  'test': frame(`<path d="M24 12h16v12l-4 8v20H28V32l-4-8V12z" stroke="${ORANGE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 48h8" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round"/>`),

  'open-app': frame(`<rect x="16" y="14" width="32" height="36" rx="4" stroke="${ORANGE}" stroke-width="2.5"/><path d="M28 40h8" stroke="${MUTED}" stroke-width="2.5" stroke-linecap="round"/><path d="M26 26l6-6 6 6M32 20v14" stroke="${GREEN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
};

for (const [name, body] of Object.entries(ICONS)) {
  writeFileSync(join(iconsDir, `${name}.svg`), svg(body));
}

console.log(`Wrote ${Object.keys(ICONS).length} icons to public/icons/`);

// ——— Build choice icon assignment ———
// Import merged tree via dynamic approach: we'll assign using heuristics
// and write byId for every choice without explicit icon.

type ChoiceLike = {
  id: string;
  label: string;
  icon?: string | null;
  tags?: string[];
  nextNodeId?: string;
  subtitle?: string | null;
  capabilities?: string[];
};

function iconPath(name: string): string {
  return `/icons/${name}.svg`;
}

const TAG_RULES: { tags: string[]; icon: string }[] = [
  { tags: ['custodial'], icon: 'custodian' },
  { tags: ['federation'], icon: 'federation' },
  { tags: ['self-custody'], icon: 'self-custody' },
  { tags: ['collaborative'], icon: 'collaborative' },
  { tags: ['single-sig'], icon: 'single-key' },
  { tags: ['multisig'], icon: 'multisig' },
  { tags: ['hot'], icon: 'hot' },
  { tags: ['cold'], icon: 'cold' },
  { tags: ['airgap'], icon: 'airgap' },
  { tags: ['auth-creds'], icon: 'email' },
  { tags: ['kyc'], icon: 'kyc' },
  { tags: ['authenticator'], icon: 'totp' },
  { tags: ['passkey'], icon: 'passkey' },
  { tags: ['hardware_key'], icon: 'hardware-key' },
  { tags: ['2fa-skipped'], icon: 'skip' },
  { tags: ['install'], icon: 'download' },
  { tags: ['invite', 'join'], icon: 'qr-invite' },
  { tags: ['social-backup'], icon: 'social-backup' },
  { tags: ['social-backup-skipped'], icon: 'skip' },
  { tags: ['pin'], icon: 'pin' },
  { tags: ['pin-skipped'], icon: 'skip' },
  { tags: ['backup-paper', 'paper'], icon: 'paper' },
  { tags: ['backup-metal', 'paper-metal'], icon: 'metal' },
  { tags: ['backup-other'], icon: 'backup' },
  { tags: ['backup'], icon: 'backup' },
  { tags: ['dice'], icon: 'dice' },
  { tags: ['cards'], icon: 'cards' },
  { tags: ['lightning', 'lndhub'], icon: 'lightning' },
  { tags: ['shamir', 'slip39'], icon: 'shamir-share' },
  { tags: ['bip39', 'seed'], icon: 'seed' },
  { tags: ['passphrase'], icon: 'passphrase' },
  { tags: ['verify', 'authenticity'], icon: 'verify' },
  { tags: ['receive'], icon: 'receive' },
  { tags: ['send', 'psbt'], icon: 'send' },
  { tags: ['descriptor'], icon: 'descriptor' },
  { tags: ['sparrow'], icon: 'sparrow' },
  { tags: ['xpub'], icon: 'xpub' },
  { tags: ['watch-only'], icon: 'watch-only' },
  { tags: ['firmware'], icon: 'firmware' },
  { tags: ['create'], icon: 'create' },
  { tags: ['recover'], icon: 'recover' },
  { tags: ['rng', 'device-rng'], icon: 'rng' },
  { tags: ['user-entropy'], icon: 'dice' },
  { tags: ['coin-flips'], icon: 'coin' },
  { tags: ['test-receive', 'test'], icon: 'test' },
  { tags: ['test-receive-skipped'], icon: 'skip' },
  { tags: ['stub'], icon: 'warning' },
  { tags: ['opsec'], icon: 'opsec' },
  { tags: ['suite'], icon: 'install' },
  { tags: ['bip84', 'bip49', 'p2wsh'], icon: 'segwit' },
  { tags: ['electrum'], icon: 'electrum' },
  { tags: ['sd-card'], icon: 'sd-card' },
  { tags: ['casa'], icon: 'collaborative' },
  { tags: ['guardian'], icon: 'federation' },
  { tags: ['2of3'], icon: 'threshold' },
  { tags: ['multi-vendor'], icon: 'diversity' },
];

const KEYWORD_RULES: { re: RegExp; icon: string }[] = [
  { re: /\bcustodian\b/i, icon: 'custodian' },
  { re: /\bfederat/i, icon: 'federation' },
  { re: /\bself-?custod/i, icon: 'self-custody' },
  { re: /\bcollaborative\b/i, icon: 'collaborative' },
  { re: /\bsingle key\b/i, icon: 'single-key' },
  { re: /\bmultisig|\bmulti-?signature|\b2-of-3|\b3-of-5/i, icon: 'multisig' },
  { re: /\bhot wallet|\bhot:/i, icon: 'hot' },
  { re: /\bcold|\bair-?gapp/i, icon: 'cold' },
  { re: /\bemail and password|\bpassword\b/i, icon: 'password' },
  { re: /\bprovide email\b|\bemail\b/i, icon: 'email' },
  { re: /\bKYC\b|\bpersonal information/i, icon: 'kyc' },
  { re: /\bTOTP|\bAuthenticator/i, icon: 'totp' },
  { re: /\bPasskey\b/i, icon: 'passkey' },
  { re: /\bHardware security key\b/i, icon: 'hardware-key' },
  { re: /\bwithout 2FA|\bSkip\b|\bskip\b/i, icon: 'skip' },
  { re: /\bInstall|\binstalled from official|\bdownload/i, icon: 'download' },
  { re: /\bQR|\binvite/i, icon: 'qr-invite' },
  { re: /\bsocial backup/i, icon: 'social-backup' },
  { re: /\bPIN\b/i, icon: 'pin' },
  { re: /\bPaper\b/i, icon: 'paper' },
  { re: /\bMetal\b/i, icon: 'metal' },
  { re: /\bdice\b/i, icon: 'dice' },
  { re: /\bcards?\b|\bSolitaire|\bPontifex/i, icon: 'cards' },
  { re: /\bLightning\b/i, icon: 'lightning' },
  { re: /\bShamir|\bMulti-share|\bshare\b/i, icon: 'shamir-share' },
  { re: /\bpassphrase\b/i, icon: 'passphrase' },
  { re: /\bverif/i, icon: 'verify' },
  { re: /\breceive\b/i, icon: 'receive' },
  { re: /\bsend\b|\bPSBT\b/i, icon: 'send' },
  { re: /\bdescriptor\b/i, icon: 'descriptor' },
  { re: /\bSparrow\b/i, icon: 'sparrow' },
  { re: /\bxpub\b/i, icon: 'xpub' },
  { re: /\bwatch-?only\b/i, icon: 'watch-only' },
  { re: /\bfirmware\b/i, icon: 'firmware' },
  { re: /\bauthenticity\b/i, icon: 'authenticity' },
  { re: /\bCreate new|\bcreate\b|\bWallet created|\bAdd Bitcoin/i, icon: 'create' },
  { re: /\bRecover\b|\brecovery\b/i, icon: 'recover' },
  { re: /\banother\b|\bdifferent\b|\bChange\b|\bExplore another|\bChoose another/i, icon: 'another' },
  { re: /\bsummary\b|\bOpen path/i, icon: 'summary' },
  { re: /\bContinue\b|\bProceed\b|\bNext:/i, icon: 'continue' },
  { re: /\bYes\b|✓/i, icon: 'yes' },
  { re: /\bNo\b|— simpler|\bSkip extra/i, icon: 'no' },
  { re: /\bBack\b|\binstead\b|\bReturn\b|\bRevisit\b/i, icon: 'back' },
  { re: /\bHome\b/i, icon: 'home' },
  { re: /\bFamily\b/i, icon: 'family' },
  { re: /\bvault\b|\bsafe deposit|\bPhysical storage|\bNearby physical/i, icon: 'vault' },
  { re: /\bSomewhere else\b/i, icon: 'elsewhere' },
  { re: /\binheritance\b/i, icon: 'inheritance' },
  { re: /\bsigning\b|\bsign with/i, icon: 'signing' },
  { re: /\b12 words|\b20 words|\b24 words|\bword/i, icon: 'words' },
  { re: /\bGlacier|\bceremony\b/i, icon: 'glacier' },
  { re: /\bOPSEC|\bno photos|\bsilence|\bno cameras/i, icon: 'opsec' },
  { re: /\bRNG\b|\bentropy\b/i, icon: 'rng' },
  { re: /\bcamera|\bimage entropy/i, icon: 'camera' },
  { re: /\bcloud\b/i, icon: 'cloud' },
  { re: /\bUSB ferry|\bUSB\b/i, icon: 'usb' },
  { re: /\bSD\b/i, icon: 'sd-card' },
  { re: /\bElectrum\b/i, icon: 'electrum' },
  { re: /\bSegWit|\bBIP84|\bBIP49|\bnative SegWit|\bWrapped/i, icon: 'segwit' },
  { re: /\bplaybook\b/i, icon: 'playbook' },
  { re: /\bdiversif|\bvendor/i, icon: 'diversity' },
  { re: /\bthreshold|\b2-of-3|\b3-of-5/i, icon: 'threshold' },
  { re: /\bcoin flips?\b/i, icon: 'coin' },
  { re: /\bseed\b|\bBIP39\b|\brecovery phrase/i, icon: 'seed' },
  { re: /\bbackup\b/i, icon: 'backup' },
  { re: /\bhardware\b|\bdevice\b|\bTrezor Suite|\bfirmware/i, icon: 'hardware-wallet' },
  { re: /\bphone\b|\bmobile\b/i, icon: 'phone' },
  { re: /\bPC\b|\bmachine\b|\bonline PC/i, icon: 'pc' },
  { re: /\bwallet\b/i, icon: 'wallet' },
  { re: /\bBitcoin\b|\bon-chain\b/i, icon: 'bitcoin' },
  { re: /\bOpen Fedi|\bOpen\b|\bprofile\b/i, icon: 'open-app' },
  { re: /\btest\b/i, icon: 'test' },
  { re: /\bwarn|\bstub|\backnowledge risks/i, icon: 'warning' },
  { re: /\boptional\b|\bharden/i, icon: 'continue' },
  { re: /\bHow will you/i, icon: 'explore' },
  { re: /\bConsider\b|\bExplore\b/i, icon: 'explore' },
  { re: /\bWeak\b|\bMinimize\b|\bStandard setup/i, icon: 'warning' },
  { re: /\bConfirmed\b|\bcompleted\b|\bready\b|\bwritten\b|\bset\b|\benabled\b|\bopened\b|\bstored\b|\bimported\b|\bexported\b|\bdistributed\b|\bconfigured\b|\bprepared\b|\btested\b/i, icon: 'check' },
];

function resolveByRules(c: ChoiceLike): string {
  const tags = c.tags ?? [];
  // Prefer more specific tag matches (later rules override earlier in our list — check all, take first match of longest tag set)
  let best: { icon: string; score: number } | null = null;
  for (const rule of TAG_RULES) {
    if (rule.tags.every((t) => tags.includes(t)) || rule.tags.some((t) => tags.includes(t))) {
      const score = rule.tags.filter((t) => tags.includes(t)).length * 10 + rule.tags.length;
      // Prefer exact-ish: if all tags match, boost
      const all = rule.tags.every((t) => tags.includes(t));
      const s = score + (all ? 50 : 0);
      if (!best || s > best.score) best = { icon: rule.icon, score: s };
    }
  }
  // Keyword on label — first match wins (ordered by specificity in list)
  const label = c.label ?? '';
  for (const rule of KEYWORD_RULES) {
    if (rule.re.test(label)) {
      // If we have a strong tag match, prefer it unless keyword is very specific
      if (best && best.score >= 55) break;
      return iconPath(rule.icon);
    }
  }
  if (best) return iconPath(best.icon);

  // nextNodeId heuristics
  const next = c.nextNodeId ?? '';
  if (next === 'start') return iconPath('explore');
  if (next.includes('receive')) return iconPath('receive');
  if (next.includes('send')) return iconPath('send');
  if (next.includes('backup')) return iconPath('backup');
  if (next.includes('multisig')) return iconPath('multisig');
  if (next.includes('passphrase')) return iconPath('passphrase');
  if (next.includes('summary') || next.startsWith('path-end')) return iconPath('summary');

  return iconPath('default');
}

// Prefer live merged tree; fall back to /tmp snapshot when regenerating offline.
import { readFileSync } from 'node:fs';

let allChoices: ChoiceLike[];
try {
  const { tree } = await import('../src/lib/data.ts');
  allChoices = [];
  for (const n of tree.nodes) {
    for (const c of n.choices) {
      allChoices.push(c);
    }
  }
} catch {
  allChoices = JSON.parse(readFileSync('/tmp/all-choices.json', 'utf8'));
}

const byId: Record<string, string> = {};
const tagRulesExport = TAG_RULES.map((r) => ({
  tags: r.tags,
  icon: iconPath(r.icon),
}));
const keywordRulesExport = KEYWORD_RULES.map((r) => ({
  pattern: r.re.source,
  flags: r.re.flags,
  icon: iconPath(r.icon),
}));

let assigned = 0;
for (const c of allChoices) {
  if (c.icon) continue; // keep brand icons; resolver prefers explicit
  const path = resolveByRules(c);
  byId[c.id] = path;
  assigned++;
}

const data = {
  version: 1,
  defaultIcon: iconPath('default'),
  byId,
  tagRules: tagRulesExport,
  keywordRules: keywordRulesExport,
};

writeFileSync(join(root, 'src/data/choiceIcons.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`Assigned icons to ${assigned} choices in choiceIcons.json`);
console.log(`Icon files: ${readdirSync(iconsDir).length}`);
