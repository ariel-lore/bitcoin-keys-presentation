import type { Choice, CustodianDef, TreeNode, TwoFactorMethod } from '../types/schema';

const INTRINSIC_CUSTODIAN_VULNS = [
  'gov-seizure',
  'insolvency',
  'custodian-hack',
  'insider-theft',
  'debasement',
] as const;

const PASSWORD_CREDS_VULNS = [
  'loss-of-credentials',
  'phish-creds',
  'compromised-creds',
  'credential-stuffing',
] as const;

const EMAIL_AUTH_VULNS = [
  'loss-of-credentials',
  'phish-creds',
  'email-credential-compromise',
] as const;

const KYC_VULNS = [
  'government-subpoena',
  'withdrawal-freeze',
  'data-breach',
] as const;

/** Password-only takeover risks cleared when a 2FA method is enabled. */
const CLEARED_BY_2FA = ['compromised-creds', 'credential-stuffing'] as const;

const METHOD_META: Record<
  TwoFactorMethod,
  { id: string; label: string; description: string; vulnId: string }
> = {
  authenticator: {
    id: 'authenticator',
    label: 'Authenticator app (TOTP)',
    description:
      'A code app on your phone (Google Authenticator, Aegis, etc.). Better than SMS, but losing the phone without a backup can lock you out.',
    vulnId: 'phone-loss',
  },
  passkey: {
    id: 'passkey',
    label: 'Passkey',
    description:
      'Device-bound or synced passkey (WebAuthn). Strong phishing resistance; risk shifts to device loss or sync-account compromise.',
    vulnId: 'passkey-device-loss',
  },
  hardware_key: {
    id: 'hardware_key',
    label: 'Hardware security key',
    description:
      'A physical FIDO2/U2F key. Excellent phishing resistance; losing the only key without a spare is painful.',
    vulnId: 'hardware-key-loss',
  },
  sms: {
    id: 'sms',
    label: 'SMS one-time code',
    description:
      'Codes sent by text message. Convenient but vulnerable to SIM-swap attacks.',
    vulnId: 'sim-swap',
  },
  email_otp: {
    id: 'email_otp',
    label: 'Email one-time code',
    description:
      'Codes sent to your email. Attackers who take over the inbox can often take over the account.',
    vulnId: 'email-credential-compromise',
  },
};

function serviceSubtitle(c: CustodianDef): string {
  const parts = c.services.map((s) =>
    s
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  );
  const kyc =
    c.kyc === 'required'
      ? 'KYC required'
      : c.kyc === 'for_buy_limits'
        ? 'KYC for buy / limits'
        : 'No KYC (typical)';
  const tfa = c.twoFactor.mandatory
    ? '2FA mandatory'
    : c.twoFactor.methods.length
      ? '2FA optional'
      : c.authModel === 'email'
        ? 'Email login'
        : '2FA N/A';
  return `${parts.join(' · ')} · ${kyc} · ${tfa}`;
}

function kycRequired(c: CustodianDef): boolean {
  return c.kyc === 'required' || c.kyc === 'for_buy_limits';
}

function isEmailAuth(c: CustodianDef): boolean {
  return c.authModel === 'email';
}

/** Whether this custodian gets a 2FA step page (mandatory or optional with methods). */
function needsTwoFactorStep(c: CustodianDef): boolean {
  if (c.twoFactor.methods.length === 0) return false;
  // Mandatory always; optional when at least one method (clean enable / skip page)
  return true;
}

function custodianDescription(c: CustodianDef): string {
  const base =
    c.notes?.split('.')[0]?.trim() ??
    `Use ${c.name} as the custodian for this educational path.`;
  return `${base}.`;
}

function credsNodeId(c: CustodianDef): string {
  return `creds-${c.id}`;
}

function kycNodeId(c: CustodianDef): string {
  return `kyc-${c.id}`;
}

function authNodeId(c: CustodianDef): string {
  return `auth-${c.id}`;
}

/** Next node after credentials (KYC → 2FA → complete). */
function afterCreds(c: CustodianDef): string {
  if (kycRequired(c)) return kycNodeId(c);
  if (needsTwoFactorStep(c)) return authNodeId(c);
  return 'path-end-custodial';
}

/** Next node after KYC. */
function afterKyc(c: CustodianDef): string {
  if (needsTwoFactorStep(c)) return authNodeId(c);
  return 'path-end-custodial';
}

function buildCustodianChoice(c: CustodianDef): Choice {
  return {
    id: `sc-${c.id}`,
    label: c.name,
    icon: c.icon,
    subtitle: serviceSubtitle(c),
    nextNodeId: credsNodeId(c),
    // Brand pick: risks live on mandatory downstream steps (unavoidable preview computes them)
    addsVulnIds: [],
    tags: [c.id, 'custodial', 'custodian-pick'],
    description: custodianDescription(c),
  };
}

function buildCredsNode(c: CustodianDef): TreeNode {
  const email = isEmailAuth(c);
  const next = afterCreds(c);
  const completes = next === 'path-end-custodial';
  const vulns: string[] = email ? [...EMAIL_AUTH_VULNS] : [...PASSWORD_CREDS_VULNS];
  // Non-KYC venues can still freeze withdrawals — attach here when no KYC page
  if (!kycRequired(c)) {
    vulns.push('withdrawal-freeze');
  }

  const choice: Choice = {
    id: `creds-${c.id}-provide`,
    label: email ? 'Provide email' : 'Provide email and password',
    nextNodeId: next,
    description: email
      ? `Sign in / recover ${c.name} with an email address. Losing the inbox or falling for phishing can cost the account.`
      : `Create login credentials for ${c.name}. Password reuse, phishing, and stuffing attacks become relevant until stronger auth is in place.`,
    addsVulnIds: vulns,
    tags: ['custodial', 'auth-creds', c.id],
    setsFlags: completes ? ['publicKey'] : undefined,
  };

  return {
    id: credsNodeId(c),
    title: email ? `Sign in to ${c.name}` : `Create ${c.name} login`,
    body: email
      ? `**Mandatory step.** ${c.name} uses email-oriented login / recovery. Click continue after providing an email (educational — no real account).\n`
      : `**Mandatory step.** Register with an email and password. Click continue once credentials are “provided” (educational — no real account).\n`,
    category: 'Custodial · Auth',
    tags: ['custodial', 'auth-creds', c.id],
    choices: [choice],
  };
}

function buildKycNode(c: CustodianDef): TreeNode {
  const next = afterKyc(c);
  const completes = next === 'path-end-custodial';
  const choice: Choice = {
    id: `kyc-${c.id}-provide`,
    label: 'Provide personal information (KYC)',
    nextNodeId: next,
    description: `Submit identity documents and personal data required by ${c.name}. This ties your legal identity (and often balances) to the account.`,
    addsVulnIds: [...KYC_VULNS],
    tags: ['custodial', 'kyc', c.id],
    setsFlags: completes ? ['publicKey'] : undefined,
  };

  return {
    id: kycNodeId(c),
    title: `KYC for ${c.name}`,
    body: `**Mandatory step.** ${c.name} requires personal information (KYC) for this path. Click continue after “providing” documents (educational — no real upload).\n`,
    category: 'Custodial · KYC',
    tags: ['custodial', 'kyc', c.id],
    choices: [choice],
  };
}

function buildAuthNode(c: CustodianDef): TreeNode {
  const methods = c.twoFactor.methods;
  const mandatory = c.twoFactor.mandatory;
  const single = mandatory && methods.length === 1;

  const choices: Choice[] = methods.map((mid) => {
    const meta = METHOD_META[mid];
    return {
      id: `auth-${c.id}-${meta.id}`,
      label: single ? `Enable ${meta.label}` : meta.label,
      nextNodeId: 'path-end-custodial',
      description: meta.description,
      addsVulnIds: [meta.vulnId],
      clearsVulnIds: [...CLEARED_BY_2FA],
      tags: ['2fa-enabled', mid],
      setsFlags: ['publicKey'],
    };
  });

  if (!mandatory) {
    choices.push({
      id: `auth-${c.id}-skip`,
      label: 'Continue without 2FA',
      nextNodeId: 'path-end-custodial',
      description:
        'Finish setup with password (or email) only. Compromised-credential and stuffing risks stay on your path.',
      addsVulnIds: [],
      tags: ['2fa-skipped'],
      setsFlags: ['publicKey'],
    });
  }

  let title: string;
  let body: string;
  if (single) {
    const meta = METHOD_META[methods[0]];
    title = `Enable 2FA for ${c.name}`;
    body = `**Mandatory step.** ${c.name} requires ${meta.label}. Click continue to enable it (educational).\n`;
  } else if (mandatory) {
    title = `What 2FA method for ${c.name}?`;
    body = `${c.name} treats sign-in 2FA as required. Pick one of the methods this service offers.\n\nEducational labels only — verify current options on the live product.\n`;
  } else {
    title = `Enable 2FA for ${c.name}?`;
    body = `${c.name} makes 2FA optional. Enabling a method reduces password-only takeover risk; skipping leaves those risks on the path.\n\nEducational labels only — verify current options on the live product.\n`;
  }

  return {
    id: authNodeId(c),
    title,
    body,
    category: 'Custodial · Auth',
    tags: ['custodial', '2fa', c.id],
    choices,
  };
}

export const CUSTODIAN_INTRINSIC_VULNS = [...INTRINSIC_CUSTODIAN_VULNS];

/** Build / replace custodian flow nodes from custodians.json. */
export function buildCustodianFlowNodes(custodians: CustodianDef[]): TreeNode[] {
  const singleCustodian: TreeNode = {
    id: 'single-custodian',
    title: 'Which custodian?',
    body:
      'Pick a recognizable hosted service. Research tags (KYC / 2FA) are educational snapshots — offerings change; verify yourself.\n',
    category: 'Custodial',
    tags: ['custodial'],
    choices: custodians.map(buildCustodianChoice),
  };

  const credsNodes = custodians.map(buildCredsNode);
  const kycNodes = custodians.filter(kycRequired).map(buildKycNode);
  const authNodes = custodians.filter(needsTwoFactorStep).map(buildAuthNode);

  const summary: TreeNode = {
    id: 'path-end-custodial',
    title: 'Custodial setup complete',
    body:
      '**Setup complete for this educational path.**\n\nYou can **receive** and **send** through the custodian account. You do **not** hold the private keys — the service does. Counterparty and auth risks remain on your path unless you choose another option.\n',
    category: 'Custodial',
    isSummary: true,
    tags: ['custodial', 'complete'],
    choices: [
      {
        id: 'pe-c-another-custodian',
        label: 'Choose a different custodian',
        nextNodeId: 'single-custodian',
        description: 'Go back and pick another hosted service.',
      },
      {
        id: 'pe-c-another-model',
        label: 'Choose another custody model',
        nextNodeId: 'start',
        description: 'Return to Custodian / Federated / Self / Collaborative.',
      },
    ],
  };

  const stubFederated: TreeNode = {
    id: 'stub-federated',
    title: 'Federated custody',
    body:
      'Coming from other user stories — not rebuilt yet.\n\nA federation or community shares custody under threshold rules (e.g. Fedi-style). Explore the older federated branch from Paths, or return to the custody-model question.\n',
    category: 'Placeholder',
    tags: ['federation', 'stub'],
    choices: [
      {
        id: 'stub-fed-back',
        label: 'Choose another custody model',
        nextNodeId: 'start',
        description: 'Return to the first question.',
      },
      {
        id: 'stub-fed-legacy',
        label: 'Open legacy federated flow',
        nextNodeId: 'federated-custody',
        description: 'Existing placeholder path (not the rebuilt user story).',
      },
    ],
  };

  const stubCollaborative: TreeNode = {
    id: 'stub-collaborative',
    title: 'Collaborative custody',
    body:
      'Coming from other user stories — not rebuilt yet.\n\nCollaborative custody usually means you hold keys with a co-signer or key-agent service (not full single-custodian hosting).\n',
    category: 'Placeholder',
    tags: ['collaborative', 'stub'],
    choices: [
      {
        id: 'stub-collab-back',
        label: 'Choose another custody model',
        nextNodeId: 'start',
        description: 'Return to the first question.',
      },
    ],
  };

  return [
    singleCustodian,
    ...credsNodes,
    ...kycNodes,
    ...authNodes,
    summary,
    stubFederated,
    stubCollaborative,
  ];
}

export function buildStartNode(): TreeNode {
  return {
    id: 'start',
    title: 'Which custody model?',
    body:
      '**Educational presentation — not financial advice.**\n\nWho holds the keys that authorize spending?\n',
    category: 'Start',
    choices: [
      {
        id: 'start-custodian',
        label: 'Custodian',
        nextNodeId: 'single-custodian',
        tags: ['custodial'],
        description:
          'A company or hosted wallet holds the keys that spend your bitcoin. Convenient account recovery — and counterparty risk.',
        addsVulnIds: [...INTRINSIC_CUSTODIAN_VULNS],
      },
      {
        id: 'start-federated',
        label: 'Federated custody',
        nextNodeId: 'stub-federated',
        tags: ['federation'],
        description:
          'A group or federation shares custody under threshold rules. Coming from another user story — stub for now.',
      },
      {
        id: 'start-self',
        label: 'Self-custodied',
        nextNodeId: 'self-custody',
        tags: ['self-custody'],
        description:
          'You (or a group you choose) hold the keys. You are responsible for backups, devices, and recovery.',
      },
      {
        id: 'start-collaborative',
        label: 'Collaborative custody',
        nextNodeId: 'stub-collaborative',
        tags: ['collaborative'],
        description:
          'You keep keys alongside a co-signer or key-agent. Coming from another user story — stub for now.',
      },
    ],
  };
}
