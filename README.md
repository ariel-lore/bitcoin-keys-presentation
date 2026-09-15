# Bitcoin Custody

Data-driven **interactive presentation** about Bitcoin custody and keys.
Each screen is a slide: pick a path; open **risks** accumulate under each choice with **mitigations** underneath (guidance text and/or **Choose another option** — not a magic “Apply” that pretends to erase structural risk).

**Educational demo only — not financial, legal, or investment advice.**

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production → dist/
npm run preview  # serve dist/
```

## How to edit content (no UI code)

All narrative lives under **`src/data/`**:

| File | Purpose |
|------|---------|
| `tree.json` | Decision nodes + choices (self-custody / legacy branches) |
| `custodians.json` | **Custodian path source of truth** (KYC / 2FA tags → generated slides) |
| `vulnerabilities.json` | Risk catalog (`defaultMitigationId` pairs a mitigation) |
| `mitigations.json` | Hardening catalog (`kind`, `returnToNodeId`, optional `procedureStep`) |
| `paths.json` | Recommended walkthroughs |

Brand icons live in **`public/brands/`**.

The **custodian user story** is rebuilt end-to-end. Federated / collaborative (and deep self-custody polish) may still be stubs or legacy placeholders.

### Custodian path (implemented)

1. **Which custody model?** — Custodian / Federated / Self-custodied / Collaborative  
   Selecting **Custodian** attaches intrinsic risks: government seizure, insolvency, external hack, rogue employee, debasement.
2. **Which custodian?** — Driven by `custodians.json`: Wallet of Satoshi, Bitcoin Well, Coinos, Bull Bitcoin, Kraken.
3. **What 2FA method?** — Conditional on that custodian’s `twoFactor` tags (skipped when mandatory + exactly one method, or when methods are empty).

**Completion:** `hasPublicKey: true`, `hasPrivateKey: false` — can receive & send via the account claim; you do not hold private keys.

### Research assumptions (KYC / 2FA tags)

Tags in `custodians.json` are **educational snapshots**, not live compliance guarantees. Products change; always verify on the vendor’s site.

| Custodian | KYC (modeled) | 2FA (modeled) |
|-----------|---------------|---------------|
| **Kraken** | Required | **Mandatory** for continued sign-in on many accounts; methods: authenticator, passkey, hardware key (not SMS/email sign-in) |
| **Bull Bitcoin** | Generally required for full services | **Optional** (encouraged); authenticator |
| **Bitcoin Well** | For buy / higher limits | **Optional**; authenticator |
| **Coinos** | None (username/password) | **Optional**; authenticator |
| **Wallet of Satoshi** (custodial LN) | Typically none | N/A / email login — no mandatory 2FA method list |

When `twoFactor.mandatory === true`, password-only takeover risks (`compromised-creds`, `credential-stuffing`) are **not** attached. Enabling an optional 2FA method **clears** those risks from the path; skipping 2FA leaves them.

### Choice fields

- `description` — plain-English explanation under the label
- `addsVulnIds` — risks introduced (shown under the option **and** nested under that step in Path & risks)
- `clearsVulnIds` — risks removed from accumulation (e.g. enabling 2FA)
- `icon` / `subtitle` / `setsFlags` / `enables` / `capabilities` — as before

### Mitigations

| `kind` | UI behavior |
|--------|-------------|
| `guidance` | Explanatory text only — **no** Apply |
| `chooseOtherOption` | **Choose another option** → jumps to `returnToNodeId` or the trail step that introduced the risk (does **not** claim the risk is fixed) |
| `switchOption` | Structural rewrite (legacy self-custody switches) |
| `procedure` | Legacy click-to-apply procedure step (still used on some self-custody paths) |

### Key accumulation & sufficiency

- **Self-custody:** private + (public \| xpub) → operable  
- **Custodial:** `publicKey` alone (no private key) → setup complete / can receive & send through the venue

### Unified path + risks

`PathRiskList`:

- Vertical list of decisions; risks nest under the introducing step; mitigations under each risk
- **Entire** sidebar expands/collapses as one unit
- When collapsed, the main slide expands; when expanded and long, the sidebar body scrolls

### Browser history

**Browser Back / Forward** (History API + `?node=` deep-link): one history entry per adventure choice; jumping backward uses `replaceState`.

### Recommended paths (`paths.json`)

Each path has `choiceSequence`: ordered **choice ids** walked from `start`.

TypeScript types live in `src/types/schema.ts`. Custodian slides are generated in `src/lib/buildCustodianNodes.ts` from `custodians.json`.

## Stack

Vite + React + TypeScript. No backend.

## License

Educational demo. Use freely for learning.
