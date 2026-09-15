import type { Choice, TreeNode } from '../../types/schema';
import { mandatory, multiChoice } from './helpers';

const TREZOR_PRODUCTS: { id: string; label: string; subtitle?: string }[] = [
  { id: 'safe3', label: 'Safe 3', subtitle: 'Current · passphrase + Shamir capable' },
  { id: 'safe5', label: 'Safe 5', subtitle: 'Current · touch' },
  { id: 'safe7', label: 'Safe 7', subtitle: 'Current · flagship' },
  { id: 'model-one', label: 'Model One (legacy)', subtitle: 'Older device' },
  { id: 'model-t', label: 'Model T (legacy)', subtitle: 'Discontinued / legacy' },
];

/** Trezor cold guides: passphrase BIP39 path + 2-of-3 SLIP39 Shamir path. */
export function buildTrezorGuideNodes(): TreeNode[] {
  const productChoices: Choice[] = TREZOR_PRODUCTS.map((p) => ({
    id: `pt-${p.id}`,
    label: p.label,
    subtitle: p.subtitle,
    icon: '/brands/trezor.svg',
    nextNodeId: 'trz-install-suite',
    description: `Set up a Trezor ${p.label} with Trezor Suite (educational path).`,
    tags: ['trezor', p.id],
    addsVulnIds: ['supply-chain-device'],
  }));

  const nodes: TreeNode[] = [
    multiChoice(
      'product-trezor',
      'Which Trezor product?',
      'Choose the device you will initialize. Current Safe-line devices support passphrase wallets and Multi-share Backup (SLIP39) per Trezor docs.\n',
      productChoices,
      { category: 'Cold · Trezor', tags: ['trezor', 'cold'] },
    ),

    mandatory(
      'trz-install-suite',
      'Install Trezor Suite from the official site',
      'Download Suite only from trezor.io (or the vendor’s documented official channel). Fake suites phish seeds and PINs.\n',
      {
        id: 'trz-suite-official',
        label: 'Trezor Suite installed from official site',
        nextNodeId: 'trz-connect-firmware',
        description: 'Verify HTTPS / publisher before running the installer.',
        addsVulnIds: ['fake-app-supply-chain'],
        tags: ['trezor', 'suite'],
      },
      { category: 'Cold · Trezor', tags: ['trezor'] },
    ),

    mandatory(
      'trz-connect-firmware',
      'Connect device / install firmware',
      'Plug in the device and install or update **official** firmware through Suite. Unofficial firmware can steal keys.\n',
      {
        id: 'trz-fw-official',
        label: 'Official firmware installed',
        nextNodeId: 'trz-verify-auth',
        description: 'Complete firmware install/update only via signed official channel.',
        addsVulnIds: ['fake-firmware', 'supply-chain-device'],
        tags: ['trezor', 'firmware'],
      },
      { category: 'Cold · Trezor', tags: ['trezor'] },
    ),

    mandatory(
      'trz-verify-auth',
      'Verify device authenticity',
      'When Suite offers authenticity / holographic checks, complete them before creating a wallet.\n',
      {
        id: 'trz-auth-ok',
        label: 'Device authenticity verified',
        nextNodeId: 'trz-create-or-recover',
        description: 'Authenticity check passed (or documented as unavailable on this legacy model).',
        tags: ['trezor', 'authenticity'],
      },
      { category: 'Cold · Trezor', tags: ['trezor'] },
    ),

    multiChoice(
      'trz-create-or-recover',
      'Create new wallet or recover?',
      'This guide focuses on **creating** a new wallet. Recovery is a different ceremony (still never type the seed into a computer).\n',
      [
        {
          id: 'trz-create-new',
          label: 'Create new wallet',
          nextNodeId: 'trz-backup-type',
          description: 'Initialize a fresh seed on the device.',
          tags: ['create'],
        },
        {
          id: 'trz-recover',
          label: 'Recover existing wallet (stub)',
          nextNodeId: 'trz-recover-stub',
          description: 'Short stub — prefer create path for the detailed stories.',
          tags: ['recover', 'stub'],
        },
      ],
      { category: 'Cold · Trezor', tags: ['trezor'] },
    ),

    multiChoice(
      'trz-recover-stub',
      'Recover on Trezor',
      'Recovery enters shares/words **on the device**, never into Suite on the computer. Full recovery UX is not expanded here.\n',
      [
        {
          id: 'trz-recover-to-create',
          label: 'Create a new wallet instead',
          nextNodeId: 'trz-backup-type',
          description: 'Follow the create + backup guide.',
        },
        {
          id: 'trz-recover-back',
          label: 'Choose another tool',
          nextNodeId: 'single-key',
          description: 'Leave Trezor setup.',
        },
      ],
      { category: 'Cold · Trezor', tags: ['trezor', 'stub'] },
    ),

    multiChoice(
      'trz-backup-type',
      'Backup type?',
      'Trezor supports a **single-share** BIP39/SLIP39 backup or **Multi-share Backup** (Shamir / SLIP39). Passphrase story uses single-share BIP39; Shamir story uses multi-share.\n',
      [
        {
          id: 'trz-bak-single',
          label: 'Single-share BIP39 / SLIP39',
          nextNodeId: 'trz-word-count',
          description: 'One recovery seed (plus optional passphrase later). Standard passphrase-wallet path.',
          tags: ['bip39', 'single-share'],
        },
        {
          id: 'trz-bak-multi',
          label: 'Multi-share Backup (Shamir / SLIP39)',
          nextNodeId: 'trz-shamir-threshold',
          description: 'Split into multiple shares with a threshold (e.g. 2-of-3). Detailed Shamir story continues.',
          tags: ['slip39', 'shamir'],
        },
      ],
      { category: 'Cold · Trezor', tags: ['trezor'] },
    ),

    // ——— Passphrase / single-share path ———
    multiChoice(
      'trz-word-count',
      'How many seed words?',
      'Choose a length your device/product allows. 12/20/24 are common BIP39 lengths depending on model and backup type.\n',
      [
        {
          id: 'trz-words-12',
          label: '12 words',
          nextNodeId: 'trz-write-seed',
          description: 'Shorter BIP39 mnemonic (where offered).',
        },
        {
          id: 'trz-words-20',
          label: '20 words',
          nextNodeId: 'trz-write-seed',
          description: 'Some Trezor backup modes use 20-word shares/seeds.',
        },
        {
          id: 'trz-words-24',
          label: '24 words',
          nextNodeId: 'trz-write-seed',
          description: 'Full BIP39 strength commonly recommended for single-share.',
        },
      ],
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor', 'bip39'] },
    ),

    mandatory(
      'trz-write-seed',
      'Write seed words from the device screen only',
      'Copy words **only** from the Trezor display. Never type or photograph them on the computer.\n',
      {
        id: 'trz-seed-written',
        label: 'Seed written from device screen',
        nextNodeId: 'trz-confirm-backup',
        description: 'Offline paper/metal copy made while watching the device.',
        addsVulnIds: ['seed-screenshot', 'camera-seed', 'speaking-seed', 'digitize-seed-shares'],
        setsFlags: ['privateKey'],
        tags: ['trezor', 'seed'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-confirm-backup',
      'Confirm backup / verify words',
      'Complete Suite/device backup confirmation so every word is checked before continuing.\n',
      {
        id: 'trz-backup-verified',
        label: 'Backup confirmed on device',
        nextNodeId: 'trz-set-pin',
        description: 'Verification quiz / confirmation finished.',
        clearsVulnIds: ['no-backup'],
        tags: ['trezor', 'verify'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-set-pin',
      'Set device PIN',
      'Choose a strong PIN on the device. Weak PINs, shoulder-surfing, and wipe-after-N-failures all matter.\n',
      {
        id: 'trz-pin-set',
        label: 'Device PIN set',
        nextNodeId: 'trz-enable-passphrase',
        description: 'PIN entered on-device without observers when possible.',
        addsVulnIds: ['weak-device-pin', 'shoulder-surfing-pin', 'pin-wipe-lockout'],
        tags: ['trezor', 'pin'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-enable-passphrase',
      'Enable passphrase in Suite settings',
      'Turn on passphrase (BIP39 passphrase / “25th word”) in Trezor Suite settings so hidden wallets are available.\n',
      {
        id: 'trz-pass-enabled',
        label: 'Passphrase feature enabled',
        nextNodeId: 'trz-open-passphrase',
        description: 'Suite passphrase toggle on; next you open a passphrase-protected wallet.',
        tags: ['trezor', 'passphrase'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-open-passphrase',
      'Open passphrase wallet / enter passphrase on device',
      'Enter the passphrase **on the device** (not the host keyboard when possible). Wrong passphrase → empty wallet with no warning. Store passphrase separately from the seed.\n',
      {
        id: 'trz-pass-entered',
        label: 'Passphrase wallet opened on device',
        nextNodeId: 'trz-test-passphrase',
        description: 'Hidden wallet accessed; passphrase never stored with the seed backup.',
        addsVulnIds: ['passphrase-lost', 'wrong-passphrase-empty', 'shoulder-surfing-pin'],
        tags: ['trezor', 'passphrase'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-test-passphrase',
      'Test passphrase wallet empty, then confirm',
      'Open the wallet, confirm it is empty (or expected), practice reopening with the same passphrase, then proceed.\n',
      {
        id: 'trz-pass-tested',
        label: 'Passphrase wallet tested',
        nextNodeId: 'trz-store-passphrase',
        description: 'Dry-run reopen succeeded before funding.',
        tags: ['trezor', 'passphrase', 'test'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-store-passphrase',
      'Store passphrase separately from seed',
      'Keep the passphrase backup in a **different** place from the seed words so one theft does not yield both.\n',
      {
        id: 'trz-pass-stored-separate',
        label: 'Passphrase stored separately from seed',
        nextNodeId: 'trz-export-receive',
        description: 'Geographic / container separation documented.',
        tags: ['trezor', 'passphrase', 'storage'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    mandatory(
      'trz-export-receive',
      'Export / verify receive on device (+ watch-only)',
      'Show a receive address on the Trezor screen and match it in Suite / watch-only before depositing.\n',
      {
        id: 'trz-receive-verified',
        label: 'Receive address verified on device',
        nextNodeId: 'path-end-trezor-passphrase',
        description: 'On-device address matches Suite. Ready to receive.',
        setsFlags: ['publicKey'],
        addsVulnIds: ['watch-only-malware', 'xpub-privacy'],
        tags: ['trezor', 'receive'],
      },
      { category: 'Cold · Trezor · Passphrase', tags: ['trezor'] },
    ),

    {
      id: 'path-end-trezor-passphrase',
      title: 'Trezor + passphrase setup complete',
      body:
        '**Setup complete.** Private key lives on the Trezor (seed + passphrase); public receive path verified. Losing the passphrase loses the wallet even with the seed.\n',
      category: 'Cold · Trezor',
      isSummary: true,
      tags: ['trezor', 'passphrase', 'complete'],
      choices: [
        {
          id: 'pe-trz-p-shamir',
          label: 'Explore Multi-share Backup instead',
          nextNodeId: 'trz-backup-type',
          description: 'Compare the Shamir 2-of-3 story (new adventure choices from backup type).',
        },
        {
          id: 'pe-trz-p-tool',
          label: 'Choose another cold tool',
          nextNodeId: 'sk-cold',
          description: 'Pick a different cold wallet.',
        },
        {
          id: 'pe-trz-p-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },
  ];

  // ——— Shamir 2-of-3 path ———
  nodes.push(
    mandatory(
      'trz-shamir-threshold',
      'Set 3 shares, threshold 2 on device',
      'Configure Multi-share Backup as **3 shares / threshold 2** so any two shares recover the wallet.\n',
      {
        id: 'trz-shamir-3of2',
        label: '3 shares · threshold 2 configured',
        nextNodeId: 'trz-share-1-write',
        description: 'Device will display three 20-word shares; any two recombine.',
        tags: ['shamir', 'slip39'],
      },
      { category: 'Cold · Trezor · Shamir', tags: ['trezor', 'shamir'] },
    ),
  );

  for (let i = 1; i <= 3; i++) {
    const nextWrite = i < 3 ? `trz-share-${i}-verify` : `trz-share-${i}-verify`;
    const afterVerify = i < 3 ? `trz-share-${i + 1}-write` : 'trz-share-store-1';
    nodes.push(
      mandatory(
        `trz-share-${i}-write`,
        `Write share ${i} (20 words) from the device`,
        `Copy share ${i} **only** from the Trezor screen onto offline media. Do not photograph.\n`,
        {
          id: `trz-share-${i}-written`,
          label: `Share ${i} written from device`,
          nextNodeId: nextWrite,
          description: `Twenty words for share ${i} recorded offline.`,
          addsVulnIds: i === 1 ? ['digitize-seed-shares', 'camera-seed', 'speaking-seed'] : ['digitize-seed-shares'],
          setsFlags: i === 1 ? ['privateKey'] : undefined,
          tags: ['shamir', `share-${i}`],
        },
        { category: 'Cold · Trezor · Shamir', tags: ['trezor', 'shamir'] },
      ),
      mandatory(
        `trz-share-${i}-verify`,
        `Verify share ${i}`,
        `Confirm share ${i} on the device before continuing to the next share.\n`,
        {
          id: `trz-share-${i}-verified`,
          label: `Share ${i} verified`,
          nextNodeId: afterVerify,
          description: `Device confirmation for share ${i} complete.`,
          tags: ['shamir', `share-${i}`],
        },
        { category: 'Cold · Trezor · Shamir', tags: ['trezor', 'shamir'] },
      ),
    );
  }

  nodes.push(
    multiChoice(
      'trz-share-store-1',
      'Where to store share 1?',
      'Default story: keep share 1 at **Home**. Geographic concentration still matters if all shares stay in one country.\n',
      [
        {
          id: 'trz-s1-home',
          label: 'Home',
          nextNodeId: 'trz-share-store-2',
          description: 'Share 1 at home (default for this guide).',
          addsVulnIds: ['physical-theft-seed', 'fire-flood-backup', 'geo-jurisdiction-concentration'],
          tags: ['share-1-home'],
        },
        {
          id: 'trz-s1-elsewhere',
          label: 'Somewhere else',
          nextNodeId: 'trz-share-store-2',
          description: 'Alternate location — still plan independence from shares 2 and 3.',
          addsVulnIds: ['physical-theft-seed', 'geo-jurisdiction-concentration'],
        },
      ],
      { category: 'Cold · Trezor · Shamir', tags: ['shamir'] },
    ),

    multiChoice(
      'trz-share-store-2',
      'Where to store share 2?',
      'Default story: **Physical storage** (safe deposit / vault).\n',
      [
        {
          id: 'trz-s2-physical',
          label: 'Physical storage (safe deposit / vault)',
          nextNodeId: 'trz-share-store-3',
          description: 'Share 2 in institutional physical storage (default).',
          addsVulnIds: ['safe-deposit-access', 'geo-jurisdiction-concentration'],
          tags: ['share-2-physical'],
        },
        {
          id: 'trz-s2-elsewhere',
          label: 'Somewhere else',
          nextNodeId: 'trz-share-store-3',
          description: 'Alternate second location.',
          addsVulnIds: ['physical-theft-seed'],
        },
      ],
      { category: 'Cold · Trezor · Shamir', tags: ['shamir'] },
    ),

    multiChoice(
      'trz-share-store-3',
      'Where to store share 3?',
      'Default story: entrust share 3 to a **family member** (coercion and relationship risk apply).\n',
      [
        {
          id: 'trz-s3-family',
          label: 'Family member',
          nextNodeId: 'trz-never-digitize',
          description: 'Share 3 with family (default for this guide).',
          addsVulnIds: ['family-storage-coercion', 'geo-jurisdiction-concentration'],
          tags: ['share-3-family'],
        },
        {
          id: 'trz-s3-elsewhere',
          label: 'Somewhere else',
          nextNodeId: 'trz-never-digitize',
          description: 'Alternate third location.',
          addsVulnIds: ['physical-theft-seed'],
        },
      ],
      { category: 'Cold · Trezor · Shamir', tags: ['shamir'] },
    ),

    mandatory(
      'trz-never-digitize',
      'Never photograph / digitize shares',
      'Commit to keeping all shares offline-only. Digitized shares become hot secrets.\n',
      {
        id: 'trz-no-photos',
        label: 'Confirmed — shares stay offline',
        nextNodeId: 'trz-shamir-receive',
        description: 'No photos, scans, or cloud copies of any share.',
        tags: ['shamir', 'opsec'],
      },
      { category: 'Cold · Trezor · Shamir', tags: ['shamir'] },
    ),

    mandatory(
      'trz-shamir-receive',
      'Receive / verify address with device',
      'Verify a receive address on the Trezor against Suite before depositing into the Shamir-backed wallet.\n',
      {
        id: 'trz-shamir-recv-ok',
        label: 'Receive address verified on device',
        nextNodeId: 'trz-shamir-spend-later',
        description: 'PUB path ready; spending later needs any 2 of 3 shares.',
        setsFlags: ['publicKey'],
        addsVulnIds: ['watch-only-malware'],
        tags: ['shamir', 'receive'],
      },
      { category: 'Cold · Trezor · Shamir', tags: ['shamir'] },
    ),

    multiChoice(
      'trz-shamir-spend-later',
      'How will you spend later?',
      'To spend, **recombine on Trezor** using any 2-of-3 shares (staggered recovery). Keep the last unused share private. Avoid typing shares into a general-purpose computer.\n',
      [
        {
          id: 'trz-recombine-trezor',
          label: 'Recombine on Trezor (any 2-of-3)',
          nextNodeId: 'path-end-trezor-shamir',
          description:
            'Staggered recovery on-device: bring two shares to the Trezor; host malware risk if you ever type shares into a PC.',
          addsVulnIds: ['recombine-host-malware'],
          tags: ['shamir', 'spend'],
        },
      ],
      { category: 'Cold · Trezor · Shamir', tags: ['shamir'] },
    ),

    {
      id: 'path-end-trezor-shamir',
      title: 'Trezor Multi-share (2-of-3) complete',
      body:
        '**Setup complete.** Private key is **threshold-reconstructable** (any 2 of 3 shares). Public receive path verified. Single-share theft should not spend — two-share collusion or loss patterns still can.\n',
      category: 'Cold · Trezor',
      isSummary: true,
      tags: ['trezor', 'shamir', 'complete'],
      choices: [
        {
          id: 'pe-trz-s-pass',
          label: 'Compare single-share + passphrase path',
          nextNodeId: 'trz-backup-type',
          description: 'Try the passphrase story from backup type.',
        },
        {
          id: 'pe-trz-s-tool',
          label: 'Choose another cold tool',
          nextNodeId: 'sk-cold',
          description: 'Pick a different cold wallet.',
        },
        {
          id: 'pe-trz-s-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },
  );

  return nodes;
}
