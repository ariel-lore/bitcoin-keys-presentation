import type { TreeNode } from '../../types/schema';
import { multiChoice } from './helpers';

/**
 * Rewires self-custody entry: spending authorization (single / thresholds) →
 * Hot vs Cold → Manual vs Hardware → tools.
 * Detailed guides: BlueWallet (hot), Trezor (cold), Seedsigner multisig.
 * Other tools keep light hooks into legacy tree.json nodes where useful.
 */
export function buildSelfCustodyHubNodes(): TreeNode[] {
  return [
    multiChoice(
      'self-custody',
      'How will spending be authorized?',
      'You hold the keys. Structure matters: one key alone, or an m-of-n multisignature threshold.\n',
      [
        {
          id: 'sf-single',
          label: 'Single key',
          nextNodeId: 'single-key',
          description: 'One seed / device can spend. Simpler ops; single point of failure.',
          addsVulnIds: ['single-point-key'],
          tags: ['single-sig'],
        },
        {
          id: 'ms-2of3',
          label: '2-of-3 Multisig',
          nextNodeId: 'ms-signing-devices',
          description: 'Any two of three keys spend. Common DIY collaborative setup.',
          tags: ['2of3', 'multisig'],
        },
        {
          id: 'ms-3of5',
          label: '3-of-5 Multisig',
          nextNodeId: 'ms-threshold-stub',
          description: 'Higher threshold stub — expand later; 2-of-3 has the deep walkthrough.',
          tags: ['stub', 'multisig'],
        },
        {
          id: 'ms-other-thresh',
          label: 'Other threshold',
          nextNodeId: 'ms-threshold-stub',
          description: 'Custom m-of-n stub.',
          tags: ['stub', 'multisig'],
        },
      ],
      { category: 'Self-custody', tags: ['self-custody'] },
    ),

    multiChoice(
      'single-key',
      'Hot wallet or cold / air-gapped?',
      'Hot keys live on internet-connected phones/PCs. Cold keys stay on hardware or air-gapped signers.\n',
      [
        {
          id: 'sk-hot',
          label: 'Hot wallet',
          nextNodeId: 'sk-hot-tools',
          description: 'Convenient spending; malware and seed-handling dominate risk.',
          addsVulnIds: ['hot-malware'],
          tags: ['hot'],
        },
        {
          id: 'sk-cold',
          label: 'Cold / air-gapped',
          nextNodeId: 'sk-cold',
          description: 'Hardware or offline signers. Stronger malware resistance when used correctly.',
          tags: ['cold'],
        },
      ],
      { category: 'Self-custody', tags: ['single-sig'] },
    ),

    multiChoice(
      'sk-hot-tools',
      'Which hot wallet?',
      'BlueWallet has the detailed guide. Other hot tools are light hooks.\n',
      [
        {
          id: 'sk-blue',
          label: 'BlueWallet',
          icon: '/brands/bluewallet.svg',
          subtitle: 'Mobile · on-chain (detailed guide)',
          nextNodeId: 'bw-install',
          description: 'Primary hot-wallet walkthrough based on bluewallet.io docs.',
          addsVulnIds: ['hot-malware', 'seed-phishing-support'],
          tags: ['bluewallet'],
        },
        {
          id: 'sk-phone',
          label: 'Smartphone (other app)',
          icon: '/brands/smartphone.svg',
          subtitle: 'Light hook',
          nextNodeId: 'tool-smartphone',
          description: 'Generic phone wallet path (legacy shorter branch).',
          addsVulnIds: ['hot-malware', 'seed-phishing-support'],
        },
        {
          id: 'sk-core',
          label: 'Bitcoin Core / Bitcoin-Qt',
          icon: '/brands/bitcoincore.svg',
          subtitle: 'Light hook',
          nextNodeId: 'tool-bitcoincore',
          description: 'Desktop hot or dedicated PC (legacy branch).',
          addsVulnIds: ['hot-malware'],
        },
      ],
      { category: 'Hot', tags: ['hot'] },
    ),

    multiChoice(
      'sk-cold',
      'How will you generate the cold seed?',
      'Manual entropy ceremonies vs generating on a hardware / air-gapped device.\n',
      [
        {
          id: 'sk-manual',
          label: 'Manual seed generation',
          icon: '/brands/manual-seed.svg',
          subtitle: 'Dice · Solitaire · Seedpicker',
          nextNodeId: 'tool-manual-extended',
          description: 'Physical entropy ceremonies including dice and manual word picking.',
          tags: ['manual', 'entropy'],
        },
        {
          id: 'sk-cold-hw',
          label: 'Hardware seed generation',
          icon: '/icons/hardware-wallet.svg',
          subtitle: 'Trezor · Ledger · Coldcard · air-gapped',
          nextNodeId: 'sk-cold-hardware',
          description: 'Generate the seed on a hardware wallet or air-gapped signer.',
          tags: ['hardware', 'cold'],
        },
      ],
      { category: 'Cold', tags: ['cold'] },
    ),

    multiChoice(
      'sk-cold-hardware',
      'Which hardware / air-gapped device?',
      'Trezor has detailed passphrase and Multi-share guides. Others are wired light hooks (not dead ends).\n',
      [
        {
          id: 'sk-trezor',
          label: 'Trezor',
          icon: '/brands/trezor.svg',
          subtitle: 'Passphrase + Shamir detailed guides',
          nextNodeId: 'product-trezor',
          description: 'Hardware wallet with Trezor Suite — deep create/backup/passphrase/Shamir flows.',
          addsVulnIds: ['supply-chain-device'],
          tags: ['trezor'],
        },
        {
          id: 'sk-ledger',
          label: 'Ledger',
          icon: '/brands/ledger.svg',
          subtitle: 'Light hook',
          nextNodeId: 'product-ledger',
          description: 'Legacy Ledger product → entropy → protect path.',
          addsVulnIds: ['supply-chain-device'],
        },
        {
          id: 'sk-coldcard',
          label: 'Coldcard',
          icon: '/brands/coldcard.svg',
          subtitle: 'Dice entropy hook',
          nextNodeId: 'product-coldcard',
          description: 'Coldcard with on-device dice option (legacy + dice hook).',
          addsVulnIds: ['supply-chain-device'],
        },
        {
          id: 'sk-seedsigner',
          label: 'Seedsigner (single-sig)',
          icon: '/brands/seedsigner.svg',
          subtitle: 'Air-gapped · light hook',
          nextNodeId: 'product-seedsigner',
          description: 'Single-key Seedsigner path. For 2-of-3 multisig, choose 2-of-3 Multisig at spending authorization.',
        },
        {
          id: 'sk-jade',
          label: 'Blockstream Jade',
          icon: '/brands/jade.svg',
          subtitle: 'Light hook',
          nextNodeId: 'product-jade',
          addsVulnIds: ['supply-chain-device'],
        },
        {
          id: 'sk-bitkey',
          label: 'Bitkey',
          icon: '/brands/bitkey.svg',
          subtitle: 'Light hook',
          nextNodeId: 'product-bitkey',
          addsVulnIds: ['hot-malware', 'supply-chain-device'],
        },
        {
          id: 'sk-airphone',
          label: 'Air-gapped smartphone',
          icon: '/brands/airgap-phone.svg',
          subtitle: 'Light hook',
          nextNodeId: 'tool-airgap-phone',
          description: 'Offline phone signer path.',
          addsVulnIds: ['break-airgap-install'],
        },
      ],
      { category: 'Cold · Hardware', tags: ['cold', 'hardware'] },
    ),
  ];
}
