# Bitcoin Custody

Data-driven **interactive presentation** about Bitcoin custody and keys.
Each screen is a slide: pick a path; risks and hardening accumulate as compact icons (details on hover). No scoring meters — serious educational UX, not a game.

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
| `vulnerabilities.json` | Risk catalog |
| `mitigations.json` | Hardening catalog |
| `paths.json` | Recommended walkthroughs |

The React app only **renders** this data. To change copy, branches, or recommended paths: edit JSON, then refresh / rebuild.

### Node schema (`tree.json`)

```json
{
  "startNodeId": "start",
  "nodes": [
    {
      "id": "example",
      "title": "Title",
      "body": "Markdown-ish body (**bold**, lists). Full text shows on hover.",
      "category": "Optional badge",
      "choices": [
        {
          "id": "unique-choice-id",
          "label": "What the presenter clicks",
          "nextNodeId": "another-node-id",
          "addsVulnIds": ["phish-creds"],
          "addsMitigationIds": ["hw-2fa"],
          "tags": ["optional"]
        }
      ]
    }
  ]
}
```

### Vulnerabilities / mitigations

- Vulnerability: `id`, `title`, `description`, `severity` (`low|medium|high|critical`), `categories[]`
- Mitigation: `id`, `title`, `description`, `addressesVulnIds[]`

Choice `addsVulnIds` / `addsMitigationIds` must match these catalogs.

### Recommended paths (`paths.json`)

Each path has `choiceSequence`: ordered **choice ids** walked from `start` (or `startNodeId`). Use **Paths** in the UI to auto-apply a walkthrough.

TypeScript types live in `src/types/schema.ts`.

## UX features

- **True slides**: each view fits the viewport (`100dvh` × `100vw`); no page or panel scrollbars
- **Choices are the hero**: large, clear buttons; node body and risk/mitigation detail appear on **hover** (and keyboard focus)
- Compact trail + risk/hardening icons; full text on hover
- **Browser Back / Forward** navigate the decision history (History API + `?node=` deep-link)
- On-screen **Back**, **Paths**, and **Reset**
- Four highlighted paths: Custodial · Hot single-sig · Cold single-sig · Multisig
- Dark theme + Bitcoin orange — projector-friendly

## Stack

Vite + React + TypeScript. No backend. No crypto libraries required for this custody presentation.

## License

Educational demo. Use freely for learning.
