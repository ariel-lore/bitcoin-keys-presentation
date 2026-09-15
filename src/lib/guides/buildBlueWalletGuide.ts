import type { TreeNode } from '../../types/schema';
import { mandatory, multiChoice } from './helpers';

/** Self-custodied hot — BlueWallet detailed guide (bluewallet.io docs style). */
export function buildBlueWalletGuideNodes(): TreeNode[] {
  return [
    mandatory(
      'bw-install',
      'Install BlueWallet from the official source',
      'Install from the official App Store / Play Store / bluewallet.io — not random APK mirrors. Fake wallet apps steal seeds on first create.\n',
      {
        id: 'bw-install-official',
        label: 'Installed from official source',
        nextNodeId: 'bw-add-wallet',
        description: 'Confirm publisher / package name matches BlueWallet’s official listing.',
        addsVulnIds: ['fake-app-supply-chain', 'hot-malware'],
        tags: ['bluewallet', 'install'],
      },
      { category: 'Hot · BlueWallet', tags: ['bluewallet', 'hot'] },
    ),

    mandatory(
      'bw-add-wallet',
      'Add wallet → Bitcoin',
      'Create an on-chain **Bitcoin** wallet. Lightning via shared LNDHub is an optional branch with custodial-style risks — not the default here.\n',
      {
        id: 'bw-add-btc',
        label: 'Add Bitcoin wallet',
        nextNodeId: 'bw-wallet-type',
        description: 'Prefer on-chain Bitcoin wallet creation for self-custody. Lightning/LNDHub can be explored as a side branch.',
        tags: ['bluewallet'],
      },
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    multiChoice(
      'bw-wallet-type',
      'Wallet type?',
      'Advanced: choose the address format BlueWallet will derive. Native SegWit (BIP84) is the usual modern default; discourage single-address wallets.\n',
      [
        {
          id: 'bw-type-bip84',
          label: 'Native SegWit (BIP84)',
          nextNodeId: 'bw-create-wallet',
          description: 'bc1… addresses. Lower fees; standard for new BlueWallet Bitcoin wallets.',
          tags: ['bip84'],
        },
        {
          id: 'bw-type-bip49',
          label: 'Wrapped SegWit (BIP49)',
          nextNodeId: 'bw-create-wallet',
          description: '3… addresses for compatibility with older services.',
          tags: ['bip49'],
        },
        {
          id: 'bw-type-lightning',
          label: 'Lightning / LNDHub (optional branch)',
          nextNodeId: 'bw-lndhub-warn',
          description: 'Shared Lightning hubs may be custodial. On-chain Bitcoin wallet remains the primary self-custody path.',
          addsVulnIds: ['lndhub-custodial'],
          tags: ['lightning', 'lndhub'],
        },
      ],
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    multiChoice(
      'bw-lndhub-warn',
      'Lightning / LNDHub risks',
      'Using a hosted LNDHub means channel balances may sit with a service — closer to custodial Lightning than a BIP84 on-chain wallet.\n',
      [
        {
          id: 'bw-lndhub-back',
          label: 'Use on-chain Bitcoin wallet instead',
          nextNodeId: 'bw-create-wallet',
          description: 'Return to creating a self-custodied on-chain wallet.',
          clearsVulnIds: ['lndhub-custodial'],
        },
        {
          id: 'bw-lndhub-accept',
          label: 'Continue with Lightning hub anyway',
          nextNodeId: 'path-end-bluewallet-ln',
          description: 'Accept custodial-style Lightning risks for this educational branch.',
          setsFlags: ['publicKey'],
        },
      ],
      { category: 'Hot · BlueWallet', tags: ['bluewallet', 'lightning'] },
    ),

    {
      id: 'path-end-bluewallet-ln',
      title: 'Lightning hub path complete',
      body:
        '**Educational Lightning/LNDHub branch complete.** Treat balances as potentially custodial. For true self-custody, create an on-chain Bitcoin wallet instead.\n',
      category: 'Hot · BlueWallet',
      isSummary: true,
      tags: ['bluewallet', 'lightning', 'complete'],
      choices: [
        {
          id: 'pe-bw-ln-onchain',
          label: 'Create on-chain Bitcoin wallet',
          nextNodeId: 'bw-create-wallet',
          description: 'Switch to the self-custody BlueWallet path.',
        },
        {
          id: 'pe-bw-ln-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },

    mandatory(
      'bw-create-wallet',
      'Create wallet',
      'Generate the wallet in-app. This creates the seed / private key material on the phone (hot).\n',
      {
        id: 'bw-create-done',
        label: 'Wallet created',
        nextNodeId: 'bw-write-seed',
        description: 'App RNG produced a BIP39 recovery phrase. Back it up before funding.',
        addsVulnIds: ['hot-malware', 'unsafe-seed-gen-sw'],
        setsFlags: ['privateKey'],
        tags: ['bluewallet', 'seed'],
      },
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    mandatory(
      'bw-write-seed',
      'Write down the recovery phrase offline',
      'Copy the words onto offline media. **Do not** screenshot or sync the phrase to cloud notes.\n',
      {
        id: 'bw-seed-offline',
        label: 'Wrote recovery phrase offline',
        nextNodeId: 'bw-backup-medium',
        description: 'Words recorded away from cameras and network-synced apps.',
        addsVulnIds: ['seed-screenshot', 'speaking-seed', 'camera-seed'],
        tags: ['bluewallet', 'backup'],
      },
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    multiChoice(
      'bw-backup-medium',
      'Backup medium?',
      'Where will the recovery phrase live long-term?\n',
      [
        {
          id: 'bw-bak-paper',
          label: 'Paper',
          nextNodeId: 'bw-verify-backup',
          description: 'Paper is accessible but burns, floods, and fades.',
          addsVulnIds: ['paper-backup-degradation', 'physical-theft-seed', 'fire-flood-backup'],
          tags: ['backup-paper'],
        },
        {
          id: 'bw-bak-metal',
          label: 'Metal',
          nextNodeId: 'bw-verify-backup',
          description: 'Steel plates resist fire/flood better; still need theft/geographic planning.',
          addsVulnIds: ['physical-theft-seed'],
          tags: ['backup-metal'],
        },
        {
          id: 'bw-bak-other',
          label: 'Other offline medium',
          nextNodeId: 'bw-verify-backup',
          description: 'Laminated cards, engraved plates, etc. — still offline-only; digitize nothing.',
          addsVulnIds: ['physical-theft-seed', 'fire-flood-backup'],
          tags: ['backup-other'],
        },
      ],
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    mandatory(
      'bw-verify-backup',
      'Verify backup words in the app',
      'Confirm each word in BlueWallet **before** sending funds. An unverified backup is a future brick.\n',
      {
        id: 'bw-verify-done',
        label: 'Backup verified in app',
        nextNodeId: 'bw-receive',
        description: 'App checksum / word quiz passed (educational).',
        clearsVulnIds: ['no-backup'],
        tags: ['bluewallet', 'verify'],
      },
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    mandatory(
      'bw-receive',
      'Show receive address',
      'Reveal a receive address in BlueWallet. You can now receive on-chain bitcoin to this hot wallet.\n',
      {
        id: 'bw-receive-show',
        label: 'Receive address ready',
        nextNodeId: 'bw-test-receive',
        description: 'Public receive path available. Verify the first funded address carefully.',
        setsFlags: ['publicKey'],
        addsVulnIds: ['address-poisoning', 'watch-only-malware'],
        tags: ['bluewallet', 'receive'],
      },
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    multiChoice(
      'bw-test-receive',
      'Test receive a small amount?',
      'Optional: send a dust/test amount first, confirm it arrives, then use the wallet for real funds.\n',
      [
        {
          id: 'bw-test-yes',
          label: 'Yes — test receive small amount',
          nextNodeId: 'bw-send-flow',
          description: 'Practice receiving before storing meaningful value.',
          tags: ['test-receive'],
        },
        {
          id: 'bw-test-skip',
          label: 'Skip test receive',
          nextNodeId: 'bw-send-flow',
          description: 'Proceed without a test deposit.',
          tags: ['test-receive-skipped'],
        },
      ],
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    multiChoice(
      'bw-send-flow',
      'How will you send later?',
      'Sending from a hot phone wallet: paste carefully, check fees, and remember transactions are irreversible.\n',
      [
        {
          id: 'bw-send-continue',
          label: 'Continue — I understand send risks',
          nextNodeId: 'path-end-bluewallet',
          description:
            'Address paste malware, wrong fees under urgency, and irreversible mistakes remain relevant every spend.',
          addsVulnIds: ['clipboard-malware', 'fee-urgency', 'destination-unverified'],
          tags: ['send'],
        },
      ],
      { category: 'Hot · BlueWallet', tags: ['bluewallet'] },
    ),

    {
      id: 'path-end-bluewallet',
      title: 'BlueWallet hot setup complete',
      body:
        '**Setup complete.** You hold the **private key** (seed on phone) and can **receive** (public addresses). Hot-wallet malware and backup risks remain on the path. Move savings to cold storage when value grows.\n',
      category: 'Hot · BlueWallet',
      isSummary: true,
      tags: ['bluewallet', 'hot', 'complete'],
      choices: [
        {
          id: 'pe-bw-tool',
          label: 'Choose another hot / cold tool',
          nextNodeId: 'single-key',
          description: 'Pick a different single-key tool.',
        },
        {
          id: 'pe-bw-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },
  ];
}
