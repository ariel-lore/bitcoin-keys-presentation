import type { TreeNode } from '../../types/schema';
import { multiChoice, mandatory } from './helpers';

/**
 * Light hooks so metal backup, dice, Seedpicker/solitaire, Casa, air-gap phone,
 * Coldcard dice are not dead ends. Deep detail remains on guides A–E.
 */
export function buildBreadthHookNodes(): TreeNode[] {
  return [
    multiChoice(
      'tool-manual-extended',
      'Which manual entropy method?',
      'Physical entropy without trusting a single vendor RNG. Follow a reviewed procedure end-to-end.\n',
      [
        {
          id: 'manx-dice',
          label: 'Dice rolling',
          nextNodeId: 'seed-dice-method',
          description: 'Casino dice → BIP39 mapping (legacy dice branch).',
          addsVulnIds: ['biased-dice', 'dice-sort-bias'],
        },
        {
          id: 'manx-seedpicker',
          label: 'Seedpicker / manual word lists',
          nextNodeId: 'hook-seedpicker',
          description: 'Pick words from BIP39 with care — bias and transcription errors are real.',
          addsVulnIds: ['biased-word-mapping', 'insufficient-entropy'],
        },
        {
          id: 'manx-solitaire',
          label: 'Solitaire / card shuffle (Pontifex-style)',
          nextNodeId: 'hook-solitaire',
          description: 'Card-deck entropy rituals — easy to bias if the procedure is sloppy.',
          addsVulnIds: ['biased-word-mapping', 'insufficient-entropy'],
        },
        {
          id: 'manx-entropy-hw',
          label: 'Dice / entropy + hardware device',
          nextNodeId: 'seed-entropy-hw',
          description: 'Feed rolls into Coldcard / Seedsigner / etc. (legacy).',
        },
        {
          id: 'manx-metal-focus',
          label: 'I already have a seed — metal backup only',
          nextNodeId: 'hook-metal-backup',
          description: 'Focus on steel backup media risks.',
        },
      ],
      { category: 'Manual entropy', tags: ['entropy', 'breadth'] },
    ),

    multiChoice(
      'hook-seedpicker',
      'Seedpicker / manual BIP39',
      'Manually selecting BIP39 words is easy to bias (human “random”, incomplete lists, calculator apps). Prefer dice+device or audited hardware RNG when possible.\n',
      [
        {
          id: 'sp-to-checksum',
          label: 'Continue to checksum on air-gapped device',
          nextNodeId: 'seed-checksum',
          description: 'Compute the last word offline, then load into a signer.',
          addsVulnIds: ['intermediate-math-online'],
        },
        {
          id: 'sp-back',
          label: 'Choose another entropy method',
          nextNodeId: 'tool-manual-extended',
          description: 'Back to manual entropy menu.',
        },
      ],
      { category: 'Breadth · Seedpicker', tags: ['breadth'] },
    ),

    multiChoice(
      'hook-solitaire',
      'Solitaire / card entropy',
      'Card shuffles can work if the procedure is documented and unbiased — most improvised rituals are not. Prefer reviewed guides (or dice + hardware).\n',
      [
        {
          id: 'sol-to-cards',
          label: 'Use reviewed card procedure → checksum',
          nextNodeId: 'seed-cards',
          description: 'Legacy card procedure node.',
        },
        {
          id: 'sol-back',
          label: 'Choose another entropy method',
          nextNodeId: 'tool-manual-extended',
          description: 'Back to manual entropy menu.',
        },
      ],
      { category: 'Breadth · Solitaire', tags: ['breadth'] },
    ),

    multiChoice(
      'hook-metal-backup',
      'Metal seed backup',
      'Steel backups survive fire/flood better than paper. Punch/engrave carefully; test a sacrificial plate; still plan theft and geographic diversity.\n',
      [
        {
          id: 'metal-ok',
          label: 'Metal backup prepared (verified)',
          nextNodeId: 'receive-root',
          description: 'Continue to receiving with a durable offline backup.',
          addsVulnIds: ['physical-theft-seed'],
          clearsVulnIds: ['paper-backup-degradation', 'no-backup'],
          setsFlags: ['privateKey', 'publicKey'],
        },
        {
          id: 'metal-back',
          label: 'Back to cold tools',
          nextNodeId: 'sk-cold-hardware',
          description: 'Pick a signing device.',
        },
      ],
      { category: 'Breadth · Metal', tags: ['breadth', 'backup'] },
    ),

    multiChoice(
      'stub-collaborative',
      'Collaborative custody (Casa-style)',
      'Collaborative / key-agent custody means you hold keys alongside a provider (e.g. Casa). You are not fully self-sovereign; the agent can collude or freeze their key.\n\nDeep Casa onboarding is a stub in this build — use multisig DIY for the detailed 2-of-3 story.\n',
      [
        {
          id: 'collab-casa',
          label: 'Casa / similar key-agent (acknowledge risks)',
          nextNodeId: 'path-end-collaborative',
          description: 'Educational acknowledgment of collaborative custody tradeoffs.',
          addsVulnIds: ['key-agent-custody', 'collusion-multisig', 'withdrawal-freeze'],
          setsFlags: ['publicKey'],
          tags: ['casa'],
        },
        {
          id: 'collab-to-ms',
          label: 'DIY multisig instead (Seedsigner 2-of-3)',
          nextNodeId: 'ms-signing-devices',
          description: 'Open the detailed self-managed 2-of-3 multisig guide.',
        },
        {
          id: 'collab-back',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
      { category: 'Collaborative', tags: ['collaborative', 'stub'] },
    ),

    {
      id: 'path-end-collaborative',
      title: 'Collaborative custody acknowledged',
      body:
        '**Educational stub complete.** Collaborative custody can feel like multisig with a vendor cosigner. Counterparty and collusion risks remain. Expand this guide later for full Casa-like onboarding.\n',
      category: 'Collaborative',
      isSummary: true,
      tags: ['collaborative', 'complete'],
      choices: [
        {
          id: 'pe-collab-ms',
          label: 'Try DIY 2-of-3 multisig',
          nextNodeId: 'ms-signing-devices',
          description: 'Seedsigner + Sparrow detailed path.',
        },
        {
          id: 'pe-collab-model',
          label: 'Choose another custody model',
          nextNodeId: 'start',
          description: 'Return to the first question.',
        },
      ],
    },

    // Ensure Coldcard dice remains an obvious named hook from breadth
    mandatory(
      'hook-coldcard-dice-note',
      'Coldcard dice entropy',
      'On Coldcard, prefer **Dice rolls** during seed creation so entropy is user-visible. Continue via the Coldcard product path.\n',
      {
        id: 'cc-dice-hook-go',
        label: 'Open Coldcard setup',
        nextNodeId: 'product-coldcard',
        description: 'Product pick → generate with dice on device.',
        addsVulnIds: ['biased-dice', 'dice-sort-bias'],
      },
      { category: 'Breadth · Coldcard', tags: ['coldcard', 'dice', 'breadth'] },
    ),
  ];
}
