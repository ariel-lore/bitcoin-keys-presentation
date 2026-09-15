import type { TreeNode } from '../../types/schema';
import { mandatory, multiChoice } from './helpers';

/** Intrinsic federation risks attached when choosing Federated custody. */
export const FEDERATED_INTRINSIC_VULNS = [
  'fed-collusion',
  'debasement',
  'fed-halt-availability',
  'fed-no-unilateral-exit',
  'gateway-censorship',
] as const;

/** Fedi member-joining guide (not running guardians). */
export function buildFederatedGuideNodes(): TreeNode[] {
  return [
    multiChoice(
      'federated-custody',
      'Which federation app?',
      'Pick the client you will use to join a Fedimint-style federation as a **member** (not as a guardian operator).\n\nEducational path mirrors public Fedi / Fedimint setup guides — verify current UX on the live product.\n',
      [
        {
          id: 'fed-app-fedi',
          label: 'Fedi',
          icon: '/brands/fedi.svg',
          subtitle: 'Fedimint member app · primary path',
          nextNodeId: 'fedi-download',
          description:
            'Official Fedi mobile app for joining existing federations via invite. You hold a claim inside the federation — not on-chain private keys.',
          tags: ['fedi', 'federation'],
        },
        {
          id: 'fed-app-other',
          label: 'Other Fedimint client (stub)',
          nextNodeId: 'fed-other-stub',
          description:
            'Other community clients exist. This educational build focuses on Fedi; treat this as a short stub.',
          tags: ['federation', 'stub'],
        },
      ],
      { category: 'Federated', tags: ['federation'] },
    ),

    mandatory(
      'fedi-download',
      'Download Fedi from the official store / site',
      'Install only from the official App Store / Play Store listing or the URL published on the project’s official site. Fake apps are a common supply-chain attack.\n',
      {
        id: 'fedi-dl-official',
        label: 'Installed from official source',
        nextNodeId: 'fedi-create-account',
        description: 'Confirm the publisher / package matches the official Fedi listing before opening the app.',
        addsVulnIds: ['fake-app-supply-chain'],
        tags: ['fedi', 'install'],
      },
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    mandatory(
      'fedi-create-account',
      'Create account / open the app',
      'Open Fedi and create or open your local profile. No on-chain seed is generated here — recovery depends on federation backups and invites.\n',
      {
        id: 'fedi-open-app',
        label: 'Open Fedi / create profile',
        nextNodeId: 'fedi-how-join',
        description: 'Continue once the app is open with a fresh or restored local profile (educational).',
        tags: ['fedi'],
      },
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    multiChoice(
      'fedi-how-join',
      'How do you join?',
      'Most members join an **existing** federation with an invite link or QR from guardians / community. Running your own federation is an advanced guardian path.\n',
      [
        {
          id: 'fedi-join-existing',
          label: 'Join existing federation via invite link / QR',
          nextNodeId: 'fedi-scan-invite',
          description:
            'Scan or open an invite provided by federation guardians. Verify it out-of-band before trusting balances.',
          tags: ['fedi', 'join'],
        },
        {
          id: 'fedi-run-own',
          label: 'Create / run own federation (advanced)',
          nextNodeId: 'fedi-guardian-stub',
          description:
            'Guardian setup (servers, thresholds, guardians) is out of scope for the member-joining story — short stub only.',
          tags: ['fedi', 'guardian', 'stub'],
          addsVulnIds: ['fed-key-loss'],
        },
      ],
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    mandatory(
      'fedi-scan-invite',
      'Scan / open the federation invite',
      'Open the invite link or scan the QR. A malicious invite joins you to the wrong (or attacker-controlled) federation.\n',
      {
        id: 'fedi-invite-open',
        label: 'Invite scanned / opened',
        nextNodeId: 'fedi-social-backup',
        description: 'Confirm federation name and guardians match what you expected before depositing value.',
        addsVulnIds: ['malicious-invite'],
        tags: ['fedi', 'invite'],
      },
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    multiChoice(
      'fedi-social-backup',
      'Set up Social Backup?',
      'Fedi can split recovery across trusted federation members (**social backup**). Skipping keeps recovery risk on your device / personal backup alone.\n',
      [
        {
          id: 'fedi-social-enable',
          label: 'Enable social backup (choose trusted members)',
          nextNodeId: 'fedi-personal-backup',
          description:
            'Select people you trust under coercion. They help recover your claim if you lose the device — and could abuse recovery if they collude.',
          addsVulnIds: ['social-backup-trustees'],
          tags: ['fedi', 'social-backup'],
        },
        {
          id: 'fedi-social-skip',
          label: 'Skip social backup',
          nextNodeId: 'fedi-personal-backup',
          description:
            'Do not enroll social recovery. Device loss without a personal backup is more likely to mean permanent loss of the federation claim.',
          addsVulnIds: ['fed-key-loss', 'no-backup'],
          tags: ['fedi', 'social-backup-skipped'],
        },
      ],
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    mandatory(
      'fedi-personal-backup',
      'Complete personal backup before PIN',
      'Fedi requires a **personal backup** before enabling a PIN. Do this offline-aware step so a locked app does not strand an unbacked claim.\n',
      {
        id: 'fedi-personal-bak-done',
        label: 'Personal backup completed',
        nextNodeId: 'fedi-enable-pin',
        description: 'Follow in-app backup prompts (educational). Skipping is not offered on this path because the product gates PIN behind backup.',
        clearsVulnIds: ['no-backup'],
        tags: ['fedi', 'backup'],
      },
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    multiChoice(
      'fedi-enable-pin',
      'Enable PIN?',
      'After backup, you can lock the app with a PIN. A weak PIN or shoulder-surfing still matters on a phone.\n',
      [
        {
          id: 'fedi-pin-yes',
          label: 'Yes — enable PIN (after backup)',
          nextNodeId: 'path-end-federated',
          description: 'Set an app PIN now that personal backup exists.',
          addsVulnIds: ['weak-device-pin', 'shoulder-surfing-pin'],
          tags: ['fedi', 'pin'],
          setsFlags: ['publicKey'],
        },
        {
          id: 'fedi-pin-skip',
          label: 'Skip PIN',
          nextNodeId: 'path-end-federated',
          description: 'Leave the app unlocked by PIN. Physical access to the phone is enough to spend the federation balance.',
          addsVulnIds: ['physical-theft-seed'],
          tags: ['fedi', 'pin-skipped'],
          setsFlags: ['publicKey'],
        },
      ],
      { category: 'Federated · Fedi', tags: ['fedi'] },
    ),

    {
      id: 'path-end-federated',
      title: 'Federated setup complete',
      body:
        '**Setup complete for this educational path.**\n\nYou can **receive** and **send** inside the federation (ecash / Lightning via gateways). You do **not** hold on-chain private keys for that balance — guardians and federation rules do. Intrinsic federation risks remain on your path.\n',
      category: 'Federated',
      isSummary: true,
      tags: ['federation', 'complete', 'fedi'],
      choices: [
        {
          id: 'pe-f-another-app',
          label: 'Choose another federation app',
          nextNodeId: 'federated-custody',
          description: 'Pick a different client.',
        },
        {
          id: 'pe-f-another-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },

    multiChoice(
      'fedi-guardian-stub',
      'Guardian / run-your-own federation',
      'Running guardians means operating Fedimint servers, choosing thresholds, and coordinating operators — a different guide from **member joining**.\n\nThis stub stops here so the member path stays accurate.\n',
      [
        {
          id: 'fedi-guardian-back-join',
          label: 'Join an existing federation instead',
          nextNodeId: 'fedi-scan-invite',
          description: 'Return to the member invite flow.',
        },
        {
          id: 'fedi-guardian-back-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Leave federated setup.',
        },
      ],
      { category: 'Federated · Stub', tags: ['federation', 'stub'] },
    ),

    multiChoice(
      'fed-other-stub',
      'Other Fedimint clients',
      'Community Fedimint clients beyond Fedi are not expanded in this build. Prefer the Fedi path for the detailed member-joining story.\n',
      [
        {
          id: 'fed-other-to-fedi',
          label: 'Use Fedi instead',
          nextNodeId: 'fedi-download',
          description: 'Continue with the primary Fedi guide.',
        },
        {
          id: 'fed-other-back',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
      { category: 'Federated · Stub', tags: ['federation', 'stub'] },
    ),
  ];
}
