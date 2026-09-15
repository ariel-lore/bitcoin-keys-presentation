# Bitcoin Custody

Data-driven **interactive presentation / guide-builder** about Bitcoin custody and keys.
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

## How to edit content

| Location | Purpose |
|----------|---------|
| `src/data/custodians.json` | Custodian catalog → generated slides |
| `src/data/vulnerabilities.json` | Risk catalog |
| `src/data/mitigations.json` | Hardening / “choose another option” catalog |
| `src/data/paths.json` | Recommended walkthroughs (choice id sequences) |
| `src/data/tree.json` | Legacy / breadth nodes (Ledger, Jade, receive/send, …) |
| `src/data/guides/SOURCES.md` | Assumed public guide sources for detailed paths |
| `src/lib/buildCustodianNodes.ts` | Custodian flow builder |
| `src/lib/guides/*.ts` | **Detailed guide builders** (Fedi, BlueWallet, Trezor, multisig, hub, breadth) |

Brand icons live in **`public/brands/`**.

### Guide builders (detailed stories)

| Story | Entry | Builder |
|-------|-------|---------|
| **A. Federated · Fedi (member)** | Custody model → Federated | `buildFederatedGuide.ts` |
| **B. Hot · BlueWallet** | Self → Single → Hot → BlueWallet | `buildBlueWalletGuide.ts` |
| **C. Cold · Trezor + passphrase** | Self → Single → Cold → Trezor → single-share | `buildTrezorGuide.ts` |
| **D. Cold · Trezor 2-of-3 Shamir** | Same → Multi-share Backup | `buildTrezorGuide.ts` |
| **E. Multisig · Seedsigner 2-of-3 + Sparrow** | Self → Multisig → 2-of-3 → Seedsigner×3 | `buildMultisigGuide.ts` |

Hub + breadth hooks: `buildSelfCustodyHub.ts`, `buildBreadthHooks.ts` (metal backup, dice, Seedpicker/solitaire, Casa stub, air-gapped phone, Coldcard dice).

**Assumed sources:** see [`src/data/guides/SOURCES.md`](src/data/guides/SOURCES.md) (Fedi/Fedimint, bluewallet.io, Trezor Suite / Multi-share, SeedSigner + Sparrow).

### Custodian path (kept)

1. **Which custody model?** — Custodian attaches intrinsic risks (seizure, insolvency, hack, insider, debasement).
2. **Which custodian?** — from `custodians.json` (brand pick; unavoidable preview still shows mandatory downstream risks).
3. **Mandatory single-option steps** — credentials → KYC (when required) → 2FA.
4. **Completion** — `publicKey` only (no private key).

### Federated path (Fedi member)

Intrinsic on **Federated custody**: guardian collusion, debasement, halt/availability, cannot exit unilaterally, gateway censorship.

Then: Fedi app → official download → open app → join via invite **or** guardian stub → scan invite → social backup yes/skip → personal backup (mandatory before PIN) → enable PIN? → complete (**no PRIV**; PUB claim only).

### Self-custody hub

- **Single key** → **Hot** (BlueWallet detailed; phone/Core light) or **Cold** (Trezor detailed; Ledger/Coldcard/Seedsigner/Jade/Bitkey/air-gap/manual light).
- **Multisignature** → **2-of-3** detailed Seedsigner+Sparrow; other thresholds / Casa stubbed.

### UX conventions

- Question titles; **mandatory steps = single-choice pages**; real forks = multi-choice.
- Intrinsic vulns on choices; unavoidable-risk cache for previews; checklist path; “Choose another option” where structural.
- Slide **title fixed**; choices scroll underneath.
- Key flags: hot/self PRIV+PUB; Fedi no PRIV; hardware/Shamir/multisig PRIV+PUB (multisig also xpub).

### Unavoidable risk previews

At load time `src/lib/unavoidableRisks.ts` builds choiceId → vuln ids:

- Enumerate all paths from the choice’s `next` to a terminal/summary.
- Net risk = intrinsic adds + downstream adds − clears.
- Preview = intersection across paths (∪ intrinsic adds).

### Choice fields

- `description` — plain-English under the label
- `addsVulnIds` / `clearsVulnIds` — checklist locus + unavoidable cache
- `icon` / `subtitle` / `setsFlags` / `tags`

### Mitigations

| `kind` | UI |
|--------|-----|
| `guidance` | Text only |
| `chooseOtherOption` | Jump back — does **not** claim the risk is fixed |
| `switchOption` / `procedure` | Legacy structural / apply flows |

### Recommended paths (`paths.json`)

Walked by ordered **choice ids** from `start`:

- Custodian (Kraken, WoS)
- Federated (Fedi member)
- Hot BlueWallet
- Cold Trezor + passphrase
- Cold Trezor 2-of-3 Shamir
- Multisig Seedsigner + Sparrow

## Stack

Vite + React + TypeScript. No backend.

## License

Educational demo. Use freely for learning.
