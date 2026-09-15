import type { Choice, CustodianDef, TreeNode, TwoFactorMethod } from '../types/schema';

const INTRINSIC_CUSTODIAN_VULNS = [
  'gov-seizure',
  'insolvency',
  'custodian-hack',
  'insider-theft',
  'debasement',
] as const;

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

/** Auth-related risks attached when picking this custodian. */
export function authVulnsForCustodian(c: CustodianDef): string[] {
  const vulns: string[] = [
    'loss-of-credentials',
    'phish-creds',
    'withdrawal-freeze',
    'government-subpoena',
  ];
  if (kycRequired(c)) vulns.push('privacy-leak-kyc');
  // Password-only takeover risks only when 2FA is NOT mandatory
  if (!c.twoFactor.mandatory) {
    vulns.push('compromised-creds', 'credential-stuffing');
  }
  return vulns;
}

function needsAuthChooser(c: CustodianDef): boolean {
  const methods = c.twoFactor.methods;
  if (c.twoFactor.mandatory && methods.length === 1) return false;
  if (c.twoFactor.mandatory && methods.length > 1) return true;
  // Optional: still offer enabling a method (and continue-without)
  if (!c.twoFactor.mandatory && methods.length >= 1) return true;
  return false;
}

function impliedMethodVulns(c: CustodianDef): string[] {
  // Mandatory + exactly one method: attach that method's risk on custodian pick
  if (c.twoFactor.mandatory && c.twoFactor.methods.length === 1) {
    const m = METHOD_META[c.twoFactor.methods[0]];
    return m ? [m.vulnId] : [];
  }
  return [];
}

function custodianDescription(c: CustodianDef): string {
  const base =
    c.notes?.split('.')[0]?.trim() ??
    `Use ${c.name} as the custodian for this educational path.`;
  return `${base}.`;
}

function buildCustodianChoice(c: CustodianDef): Choice {
  const chooser = needsAuthChooser(c);
  const adds = [...authVulnsForCustodian(c), ...impliedMethodVulns(c)];
  return {
    id: `sc-${c.id}`,
    label: c.name,
    icon: c.icon,
    subtitle: serviceSubtitle(c),
    nextNodeId: chooser ? `auth-${c.id}` : 'path-end-custodial',
    addsVulnIds: adds,
    tags: [c.id, 'custodial', 'custodian-pick'],
    // Completes here only when no 2FA chooser is needed
    setsFlags: chooser ? undefined : ['publicKey'],
    description: custodianDescription(c),
  };
}

function buildAuthNode(c: CustodianDef): TreeNode {
  const methods = c.twoFactor.methods;
  const choices: Choice[] = methods.map((mid) => {
    const meta = METHOD_META[mid];
    return {
      id: `auth-${c.id}-${meta.id}`,
      label: meta.label,
      nextNodeId: 'path-end-custodial',
      description: meta.description,
      addsVulnIds: [meta.vulnId],
      // Enabling 2FA clears password-only takeover risks left from optional-2FA pick
      clearsVulnIds: ['compromised-creds', 'credential-stuffing'],
      tags: ['2fa-enabled', mid],
      setsFlags: ['publicKey'],
    };
  });

  if (!c.twoFactor.mandatory) {
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

  const tfaNote = c.twoFactor.mandatory
    ? `${c.name} treats sign-in 2FA as required. Pick one of the methods this service offers.`
    : `${c.name} makes 2FA optional. Enabling a method reduces password-only takeover risk; skipping leaves those risks on the path.`;

  return {
    id: `auth-${c.id}`,
    title: `What 2FA method for ${c.name}?`,
    body: `${tfaNote}\n\nEducational labels only — verify current options on the live product.\n`,
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

  const authNodes = custodians.filter(needsAuthChooser).map(buildAuthNode);

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

  return [singleCustodian, ...authNodes, summary, stubFederated, stubCollaborative];
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
