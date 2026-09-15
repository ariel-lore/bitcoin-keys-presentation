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
| `mitigations.json` | Hardening catalog (`addressesVulnIds`, optional `procedureStep`) |
| `paths.json` | Recommended walkthroughs |

Brand icons live in **`public/brands/`**.

### Choice fields

- `description` — human-readable explanation (1–3 short sentences) shown under the label
- `addsVulnIds` — risks introduced by the choice (shown under the option **and** nested under that step in Path & risks)
- `icon` — optional path like `/brands/ledger.svg`
- `subtitle` — optional service line (e.g. `Hardware · USB`)
- `setsFlags` — `privateKey` / `publicKey` / `xpub` (educational labels only)
- `enables` / `capabilities` — tool capability tags for differentiated follow-ups
- `addsMitigationIds` — deprecated / ignored (mitigations are click-to-apply)

### Hardware product selection

Brand picks (Ledger, Trezor, Coldcard, Bitkey, Seedsigner, Jade, …) go to a **"Which [brand] product?"** slide listing current models with short descriptions, then into that product’s seed / storage / PIN path.

### Node fields

- `title` — the question on the slide (large, centered)
- `preMitigationIds` — optional mitigations apply-able **on this slide before choosing**
- `isSummary` — end-of-path summary slide

### Mitigations & procedure steps

Mitigations may include `procedureStep: { title, description }`. Applying a **procedure** mitigation marks the risk secured **and** appends that step to `state.procedureSteps` (e.g. backup, inheritance, OPSEC).

Structural mitigations use `kind: "switchOption"` with `switchTo: { replaceChoiceTag|replaceChoiceId, targetNodeId, choiceLabel, clearsVulnIds }` — the UI says **Switch to…** and rewrites the trail toward another branch (e.g. single-key → multisig) instead of faking a procedure step.

### Key accumulation & sufficiency

Adventure state tracks `hasPrivateKey`, `hasPublicKey`, `hasXpub`.  
**Sufficient to operate** when private material is present **and** a public/xpub side is ready — even if risks remain.

When operable, the UI switches to a **procedure / setup** feel. After keys are sufficient, the adventure continues with **Receive → Send**; backup / inheritance / xpub-verify remain click-to-apply mitigations.

### Unified path + risks

`PathRiskList`:

- Vertical list of decisions (top → bottom); risks nest under the introducing step
- **Entire** sidebar expands/collapses as one unit (not per-step accordion)
- When expanded, the panel body is `overflow-y: auto` so it never breaks the slide viewport

### Browser history

**Browser Back / Forward** (History API + `?node=` deep-link): exactly one history entry per adventure choice; jumping backward in the path uses `replaceState` (no double-push). Back restores the previous full snapshot.

### Recommended paths (`paths.json`)

Each path has `choiceSequence`: ordered **choice ids** walked from `start`. Use **Paths** in the UI to auto-apply a walkthrough.

TypeScript types live in `src/types/schema.ts`.

## UX features

- **True slides**: each view fits the viewport; no page scrollbars when possible
- **Question titles**: every node asks a question (large, centered); choices are the answers with descriptions
- **Product lineup** after brand selection for major hardware vendors
- **Click-to-apply mitigations** that can append procedure steps
- Setup status + Priv/Pub badges (labels only, never real keys)

## Stack

Vite + React + TypeScript. No backend.

## License

Educational demo. Use freely for learning.
