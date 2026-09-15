# Bitcoin Custody

Data-driven **interactive presentation** about Bitcoin custody and keys.
Each screen is a slide: pick a path; open **risks** accumulate with a **paired mitigation** you can click to apply. No scoring meters — serious educational UX, not a game.

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
| `tree.json` | Decision nodes + choices (`title` = question; `isSummary` = end slide) |
| `vulnerabilities.json` | Risk catalog (`defaultMitigationId` pairs a mitigation) |
| `mitigations.json` | Hardening catalog (`addressesVulnIds`) |
| `paths.json` | Recommended walkthroughs |

Brand icons live in **`public/brands/`**.

### Choice fields

- `addsVulnIds` — risks introduced by the choice
- `icon` — optional path like `/brands/ledger.svg`
- `subtitle` — optional service line (e.g. `Hardware · USB`)
- `setsFlags` — `privateKey` / `publicKey` / `xpub` (educational labels only)
- `enables` / `capabilities` — tool capability tags for differentiated follow-ups
- `addsMitigationIds` — deprecated / ignored (mitigations are click-to-apply)

### Key accumulation & sufficiency

Adventure state tracks `hasPrivateKey`, `hasPublicKey`, `hasXpub`.  
**Sufficient to operate** when private material is present **and** a public/xpub side is ready — even if risks remain. The top bar shows setup status + Priv/Pub badges (labels only, never real keys).

### End of path = summary

When a path reaches an operable setup, the slide is a **summary** (`isSummary: true`): path trail, open vulns with Apply, applied mitigations, and hardening choices. There is **no** bounce back to “Wallet structure” — only a discreet optional “Explore another structure…”. Default is stay and mitigate.

### Mitigation UX

Choices add vulnerabilities. The UI shows each open risk with its paired mitigation. Click **Apply** to mark that risk secured (`mitigatedVulnIds`).

### Recommended paths (`paths.json`)

Each path has `choiceSequence`: ordered **choice ids** walked from `start`. Use **Paths** in the UI to auto-apply a walkthrough.

TypeScript types live in `src/types/schema.ts`.

## UX features

- **True slides**: each view fits the viewport; no page scrollbars
- **Question titles**: every node asks a question; choices are the answers
- **Self-custody → single key → tools** (Ledger, Trezor, Coldcard, Bitkey, Seedsigner, Jade, Tails, phone, air-gapped phone, BlueWallet, Bitcoin Core, manual) with logos and differentiated follow-ups
- Compact trail + setup status + paired risk/mitigation icons; details on hover; click to secure
- **Browser Back / Forward** (History API + `?node=` deep-link)

## Stack

Vite + React + TypeScript. No backend.

## License

Educational demo. Use freely for learning.
