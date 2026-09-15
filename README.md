# Bitcoin Custody

Data-driven **interactive presentation** about Bitcoin custody and keys.
Each screen is a slide: pick a path; **unavoidable** risks preview under each upcoming choice; the path sidebar is a **checklist** showing where each risk was introduced.

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
2. **Which custodian?** — Driven by `custodians.json` (brand pick usually has **empty** `addsVulnIds`; unavoidable preview still shows risks every mandatory downstream step forces).
3. **Mandatory single-option steps** (one page each — click to progress):
   - **Provide email and password** (or email for Wallet of Satoshi) — owns credential risks (`loss-of-credentials`, `phish-creds`, `compromised-creds`, `credential-stuffing`).
   - **Provide personal information (KYC)** when `kyc` is required / for buy limits — owns `government-subpoena`, `withdrawal-freeze`, `data-breach`.
   - **2FA** — mandatory multi-method chooser, mandatory single-method page, or optional enable/skip when methods exist.
4. **Completion** — `hasPublicKey: true`, `hasPrivateKey: false`.

**Example — Bull Bitcoin:** email/password → KYC → optional 2FA → complete.  
**Example — Kraken:** email/password → KYC → What 2FA method? → complete (mandatory 2FA **clears** `compromised-creds` / `credential-stuffing` via `clearsVulnIds`).  
**Example — Coinos:** email/password → optional 2FA (no KYC). **WoS:** email auth step → complete.

### Unavoidable risk previews

Choice cards no longer dump raw `addsVulnIds`. At load time `src/lib/unavoidableRisks.ts` builds a cache:

- For each choice C → node `next`, enumerate all paths from `next` to a terminal/summary.
- Net risk set per path = C’s intrinsic adds plus downstream adds, minus `clearsVulnIds`.
- **Unavoidable preview** = intersection across those paths (∪ C’s intrinsic adds).

Avoidable branch-only risks stay off the preview under C.

### Research assumptions (KYC / 2FA tags)

Tags in `custodians.json` are **educational snapshots**, not live compliance guarantees. Products change; always verify on the vendor’s site.

| Custodian | KYC (modeled) | 2FA (modeled) |
|-----------|---------------|---------------|
| **Kraken** | Required | **Mandatory**; authenticator, passkey, hardware key |
| **Bull Bitcoin** | Required | **Optional**; authenticator |
| **Bitcoin Well** | For buy / higher limits | **Optional**; authenticator |
| **Coinos** | None | **Optional**; authenticator |
| **Wallet of Satoshi** | Typically none | Email login — no 2FA method list |

### Choice fields

- `description` — plain-English explanation under the label
- `addsVulnIds` — risks **introduced at this step** (checklist locus; also feed the unavoidable cache)
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

### Layout / scroll

- Slide **title stays fixed** at the top of the main pane; choices / summary body scroll underneath (`overflow-y: auto`).
- Path sidebar and “Open risks” panels scroll internally; prefer not scrolling the whole window.

### Unified path checklist

`PathRiskList`:

- Checklist of steps taken; risks nest under the **introducing** step
- Unavoidable previews appear only on **upcoming** choice buttons
- Entire sidebar expands/collapses; when expanded and long, the sidebar body scrolls

### Browser history

**Browser Back / Forward** (History API + `?node=` deep-link): one history entry per adventure choice; jumping backward uses `replaceState`.

### Recommended paths (`paths.json`)

Each path has `choiceSequence`: ordered **choice ids** walked from `start`.

TypeScript types live in `src/types/schema.ts`. Custodian slides are generated in `src/lib/buildCustodianNodes.ts` from `custodians.json`.

## Stack

Vite + React + TypeScript. No backend.

## License

Educational demo. Use freely for learning.
