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
| `tree.json` | Decision nodes + choices |
| `vulnerabilities.json` | Risk catalog (`defaultMitigationId` pairs a mitigation) |
| `mitigations.json` | Hardening catalog (`addressesVulnIds`) |
| `paths.json` | Recommended walkthroughs |

Brand icons live in **`public/brands/`**.

### Choice fields

- `addsVulnIds` — risks introduced by the choice
- `icon` — optional path like `/brands/kraken.svg`
- `subtitle` — optional service line (e.g. `Exchange · Lightning`)
- `addsMitigationIds` — deprecated / ignored (mitigations are click-to-apply)

### Mitigation UX

Choices add vulnerabilities. The UI shows each open risk with its paired mitigation (via `defaultMitigationId` or `addressesVulnIds`). Click **Apply** on the mitigation to mark that risk secured (`mitigatedVulnIds`).

### Recommended paths (`paths.json`)

Each path has `choiceSequence`: ordered **choice ids** walked from `start`. Use **Paths** in the UI to auto-apply a walkthrough.

TypeScript types live in `src/types/schema.ts`.

## UX features

- **True slides**: each view fits the viewport; no page scrollbars
- **Wallet structure** start: Use a custodian · Self-custodied
- Compact trail + paired risk/mitigation icons; details on hover; click to secure
- **Browser Back / Forward** (History API + `?node=` deep-link)
- Recommended paths: Single custodian · Federated · Hot · Cold · Multisig

## Stack

Vite + React + TypeScript. No backend.

## License

Educational demo. Use freely for learning.
