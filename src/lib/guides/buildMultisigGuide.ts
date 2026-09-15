import type { TreeNode } from '../../types/schema';
import { mandatory, multiChoice } from './helpers';

const KEY_STORAGE: Record<number, { label: string; choiceId: string; vulns: string[]; tag: string; desc: string }> = {
  1: {
    label: 'Family',
    choiceId: 'ms-ss-k1-family',
    vulns: ['family-storage-coercion', 'physical-theft-seed'],
    tag: 'key1-family',
    desc: 'Key 1 stored with family (user story default).',
  },
  2: {
    label: 'Home',
    choiceId: 'ms-ss-k2-home',
    vulns: ['physical-theft-seed', 'fire-flood-backup'],
    tag: 'key2-home',
    desc: 'Key 2 stored at home (user story default).',
  },
  3: {
    label: 'Nearby physical storage',
    choiceId: 'ms-ss-k3-physical',
    vulns: ['safe-deposit-access', 'physical-theft-seed', 'geo-jurisdiction-concentration'],
    tag: 'key3-physical',
    desc: 'Key 3 in nearby physical storage (user story default).',
  },
};

/** Seedsigner-only 2-of-3 + Sparrow + descriptors at 3 locations. */
export function buildMultisigGuideNodes(): TreeNode[] {
  const nodes: TreeNode[] = [
    multiChoice(
      'multisig',
      'What multisig threshold?',
      '**m-of-n** keys required to spend. This detailed guide focuses on **2-of-3**; other thresholds stay as light hooks.\n',
      [
        {
          id: 'ms-2of3',
          label: '2-of-3',
          nextNodeId: 'ms-signing-devices',
          description: 'Any two of three keys spend. Common DIY collaborative setup.',
          tags: ['2of3'],
        },
        {
          id: 'ms-3of5',
          label: '3-of-5 (light hook)',
          nextNodeId: 'ms-threshold-stub',
          description: 'Higher threshold stub — expand later; 2-of-3 has the deep walkthrough.',
          tags: ['stub'],
        },
        {
          id: 'ms-other-thresh',
          label: 'Other threshold (light hook)',
          nextNodeId: 'ms-threshold-stub',
          description: 'Custom m-of-n stub.',
          tags: ['stub'],
        },
      ],
      { category: 'Multisig', tags: ['multisig'] },
    ),

    multiChoice(
      'ms-threshold-stub',
      'Other thresholds',
      'Only **2-of-3** is fully expanded in this build. Return there for Seedsigner + Sparrow detail.\n',
      [
        {
          id: 'ms-stub-to-2of3',
          label: 'Use 2-of-3 instead',
          nextNodeId: 'ms-signing-devices',
          description: 'Open the detailed path.',
        },
        {
          id: 'ms-stub-back',
          label: 'Choose another custody structure',
          nextNodeId: 'self-custody',
          description: 'Back to single key vs multisig.',
        },
      ],
      { category: 'Multisig · Stub', tags: ['stub'] },
    ),

    multiChoice(
      'ms-signing-devices',
      'Signing devices?',
      'Independence improves when vendors differ. This user story uses **Seedsigner for all three keys** (same-vendor risk attached).\n',
      [
        {
          id: 'ms-dev-seedsigner-all',
          label: 'Seedsigner for all three keys',
          icon: '/brands/seedsigner.svg',
          subtitle: 'Air-gapped · QR · same vendor',
          nextNodeId: 'ms-ss-k1-entropy',
          description:
            'Stateless air-gapped signers for every cosigner. Convenient and reproducible — correlated firmware/supply risk.',
          addsVulnIds: ['same-vendor-multisig'],
          tags: ['seedsigner', 'same-vendor'],
        },
        {
          id: 'ms-dev-multi-vendor',
          label: 'Multi-vendor mix (light hook)',
          nextNodeId: 'ms-multivendor-stub',
          description: 'Mix Seedsigner / Coldcard / Trezor etc. — stub linking to legacy diverse path.',
          tags: ['multi-vendor', 'stub'],
        },
        {
          id: 'ms-dev-casa',
          label: 'Casa / collaborative provider (stub)',
          nextNodeId: 'stub-collaborative',
          description: 'Key-agent collaborative custody — see collaborative stub.',
          addsVulnIds: ['key-agent-custody', 'collusion-multisig'],
          tags: ['casa', 'collaborative'],
        },
      ],
      { category: 'Multisig · 2-of-3', tags: ['multisig'] },
    ),

    multiChoice(
      'ms-multivendor-stub',
      'Multi-vendor multisig',
      'Mixing vendors reduces same-vendor correlation. Full multi-vendor ceremony is not expanded here — use Seedsigner-all for the detailed story, or legacy diverse nodes.\n',
      [
        {
          id: 'ms-mv-to-ss',
          label: 'Seedsigner-only detailed path',
          nextNodeId: 'ms-ss-k1-entropy',
          description: 'Follow the deep Seedsigner + Sparrow guide.',
          addsVulnIds: ['same-vendor-multisig'],
        },
        {
          id: 'ms-mv-legacy',
          label: 'Open legacy diverse multisig notes',
          nextNodeId: 'multisig-diverse',
          description: 'Existing shorter diverse-vendor branch from tree.json.',
        },
      ],
      { category: 'Multisig · Stub', tags: ['stub'] },
    ),
  ];

  for (let k = 1; k <= 3; k++) {
    const store = KEY_STORAGE[k];
    const nextEntropy = k < 3 ? `ms-ss-k${k + 1}-entropy` : 'ms-ss-install-sparrow';
    nodes.push(
      multiChoice(
        `ms-ss-k${k}-entropy`,
        `Key ${k}: how to generate entropy?`,
        `Generate seed ${k} on Seedsigner. Dice adds user entropy; device RNG is faster.\n`,
        [
          {
            id: `ms-ss-k${k}-dice`,
            label: 'Dice entropy',
            nextNodeId: `ms-ss-k${k}-backup`,
            description: 'Roll dice per Seedsigner prompts; watch for biased dice / sorting mistakes.',
            addsVulnIds: ['dice-sort-bias', 'biased-dice'],
            setsFlags: k === 1 ? ['privateKey'] : undefined,
            tags: [`key-${k}`, 'dice'],
          },
          {
            id: `ms-ss-k${k}-rng`,
            label: 'Device RNG',
            nextNodeId: `ms-ss-k${k}-backup`,
            description: 'Trust Seedsigner RNG for this key.',
            addsVulnIds: ['insufficient-entropy', 'firmware-rng-defect'],
            setsFlags: k === 1 ? ['privateKey'] : undefined,
            tags: [`key-${k}`, 'rng'],
          },
        ],
        { category: `Multisig · Key ${k}`, tags: ['seedsigner', `key-${k}`] },
      ),

      mandatory(
        `ms-ss-k${k}-backup`,
        `Key ${k}: write seed / SeedQR backup & verify`,
        `Backup seed ${k} as words and/or SeedQR, then verify the backup on Seedsigner before power-off.\n`,
        {
          id: `ms-ss-k${k}-bak-done`,
          label: `Key ${k} backup written & verified`,
          nextNodeId: `ms-ss-k${k}-store`,
          description: 'Offline backup verified; device remains stateless between sessions.',
          addsVulnIds: ['digitize-seed-shares', 'seed-screenshot'],
          tags: [`key-${k}`, 'backup'],
        },
        { category: `Multisig · Key ${k}`, tags: ['seedsigner'] },
      ),

      multiChoice(
        `ms-ss-k${k}-store`,
        `Where is key ${k} stored?`,
        `User story default for key ${k}: **${store.label}**.\n`,
        [
          {
            id: store.choiceId,
            label: store.label,
            nextNodeId: nextEntropy,
            description: store.desc,
            addsVulnIds: store.vulns,
            tags: [store.tag],
          },
          {
            id: `ms-ss-k${k}-store-other`,
            label: 'Somewhere else',
            nextNodeId: nextEntropy,
            description: 'Alternate location — still keep keys geographically independent.',
            addsVulnIds: ['physical-theft-seed', 'geo-jurisdiction-concentration'],
          },
        ],
        { category: `Multisig · Key ${k}`, tags: ['seedsigner'] },
      ),
    );
  }

  nodes.push(
    mandatory(
      'ms-ss-install-sparrow',
      'Install Sparrow from the official source',
      'Download Sparrow Wallet only from sparrowwallet.com (verify signatures). Fake builds can steal xpubs and craft malicious PSBTs.\n',
      {
        id: 'ms-ss-sparrow-ok',
        label: 'Sparrow installed from official source',
        nextNodeId: 'ms-ss-create-wallet',
        description: 'Signature / checksum verification done (educational).',
        addsVulnIds: ['fake-app-supply-chain'],
        tags: ['sparrow'],
      },
      { category: 'Multisig · Sparrow', tags: ['sparrow'] },
    ),

    mandatory(
      'ms-ss-create-wallet',
      'Create multisig wallet 2-of-3 native SegWit',
      'In Sparrow: New wallet → Multi-signature → 2 of 3 → Native SegWit (P2WSH).\n',
      {
        id: 'ms-ss-wallet-created',
        label: '2-of-3 native SegWit wallet created',
        nextNodeId: 'ms-ss-xpub-1',
        description: 'Empty multisig policy ready for three cosigner xpubs.',
        tags: ['sparrow', 'p2wsh'],
      },
      { category: 'Multisig · Sparrow', tags: ['sparrow'] },
    ),
  );

  for (let k = 1; k <= 3; k++) {
    const next = k < 3 ? `ms-ss-xpub-${k + 1}` : 'ms-ss-export-descriptor';
    nodes.push(
      mandatory(
        `ms-ss-xpub-${k}`,
        `Cosigner ${k}: export xpub from Seedsigner → import to Sparrow`,
        `Export the XPUB/QR for key ${k} on Seedsigner and import it as cosigner ${k} in Sparrow. xpubs reveal all addresses for that key policy.\n`,
        {
          id: `ms-ss-xpub-${k}-done`,
          label: `Cosigner ${k} xpub imported`,
          nextNodeId: next,
          description: 'QR transfer complete without typing seed into the computer.',
          addsVulnIds: ['xpub-privacy'],
          tags: ['xpub', `key-${k}`],
        },
        { category: 'Multisig · Sparrow', tags: ['sparrow', 'seedsigner'] },
      ),
    );
  }

  nodes.push(
    mandatory(
      'ms-ss-export-descriptor',
      'Export wallet descriptor immediately',
      'Export the Sparrow output descriptor / wallet config as soon as all cosigners are present. You need it to reconstruct the watch wallet.\n',
      {
        id: 'ms-ss-desc-exported',
        label: 'Wallet descriptor exported',
        nextNodeId: 'ms-ss-copy-descriptor',
        description: 'Descriptor saved for distribution to the three locations.',
        addsVulnIds: ['xpub-privacy'],
        setsFlags: ['xpub'],
        tags: ['descriptor'],
      },
      { category: 'Multisig · Sparrow', tags: ['sparrow'] },
    ),

    mandatory(
      'ms-ss-copy-descriptor',
      'Copy descriptor to all three locations',
      'Place a copy of the descriptor at **each** of the three key locations (with the seeds per this user story).\n\n**Guide tension:** some multisig guides say *do not* store the descriptor with seeds. This path **follows the user story** (descriptor at three locations) and attaches privacy/theft tradeoff risks.\n',
      {
        id: 'ms-ss-desc-distributed',
        label: 'Descriptor copied to all three locations',
        nextNodeId: 'ms-ss-verify-receive',
        description:
          'Recovery is easier if one site is lost; a thief who finds seed + descriptor understands the full wallet.',
        addsVulnIds: ['descriptor-with-seeds', 'xpub-privacy'],
        tags: ['descriptor', 'storage'],
      },
      { category: 'Multisig · Sparrow', tags: ['sparrow'] },
    ),

    mandatory(
      'ms-ss-verify-receive',
      'Verify receive address on Seedsigners vs Sparrow',
      'Generate a receive address in Sparrow and confirm the same address on the Seedsigners (multisig address verification) before depositing.\n',
      {
        id: 'ms-ss-recv-ok',
        label: 'Receive address verified on signers',
        nextNodeId: 'ms-ss-send-later',
        description: 'PUB path confirmed across coordinator and signers.',
        setsFlags: ['publicKey'],
        addsVulnIds: ['watch-only-malware', 'derivation-path-mismatch'],
        tags: ['receive'],
      },
      { category: 'Multisig · Sparrow', tags: ['sparrow', 'seedsigner'] },
    ),

    multiChoice(
      'ms-ss-send-later',
      'How will you send later?',
      'Spending uses **PSBT over QR**: create in Sparrow → sign with any 2 of 3 Seedsigners → finalize & broadcast.\n',
      [
        {
          id: 'ms-ss-psbt-qr',
          label: 'PSBT QR — sign with 2-of-3 Seedsigners',
          nextNodeId: 'path-end-multisig-seedsigner',
          description:
            'Air-gapped PSBT flow. Verify full destination and amount on each signing device; clipboard malware still matters on the coordinator PC.',
          addsVulnIds: ['clipboard-malware', 'destination-unverified', 'fee-urgency'],
          tags: ['psbt', 'send'],
        },
      ],
      { category: 'Multisig · Spend', tags: ['multisig'] },
    ),

    {
      id: 'path-end-multisig-seedsigner',
      title: 'Seedsigner 2-of-3 + Sparrow complete',
      body:
        '**Setup complete.** You can receive (verified multisig addresses) and spend with any **2-of-3** Seedsigner signatures via PSBT. Private key material is split across three backups; same-vendor and descriptor-colocation tradeoffs remain on the path.\n',
      category: 'Multisig',
      isSummary: true,
      tags: ['multisig', 'seedsigner', 'complete'],
      choices: [
        {
          id: 'pe-ms-ss-devices',
          label: 'Choose different signing devices',
          nextNodeId: 'ms-signing-devices',
          description: 'Revisit device mix.',
        },
        {
          id: 'pe-ms-ss-structure',
          label: 'Choose single key instead',
          nextNodeId: 'self-custody',
          description: 'Back to single vs multi.',
        },
        {
          id: 'pe-ms-ss-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },
  );

  return nodes;
}
