# Bitcoin Custody Adventure

Data-driven **choose-your-own-adventure** about Bitcoin custody and keys.
Not a linear slide deck: you pick paths; choices, vulnerabilities, and mitigations **accumulate**; meters update for convenience / security / complexity / recoverability.

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
| `metrics.json` | Meter definitions + starting scores |

The React app only **renders** this data. To change copy, branches, scores, or recommended paths: edit JSON, then refresh / rebuild.

### Node schema (`tree.json`)

```json
{
  "startNodeId": "start",
  "nodes": [
    {
      "id": "example",
      "title": "Title",
      "body": "Markdown-ish body (**bold**, lists).",
      "category": "Optional badge",
      "choices": [
        {
          "id": "unique-choice-id",
          "label": "What the user clicks",
          "nextNodeId": "another-node-id",
          "addsVulnIds": ["phish-creds"],
          "addsMitigationIds": ["hw-2fa"],
          "metricDeltas": {
            "convenience": -5,
            "security": 10,
            "complexity": 5,
            "recoverability": 0
          },
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

Each path has `choiceSequence`: ordered **choice ids** walked from `start` (or `startNodeId`). Use **Walk path** in the UI to auto-apply.

TypeScript types live in `src/types/schema.ts`.

## UX features

- Interactive decision **tree** (not linear slides)
- Visible **choice trail** with jump-back
- Accumulating **vulnerability** and **mitigation** chips
- Running **meters** (0–100)
- Four highlighted paths: Custodial · Hot single-sig · Cold single-sig · Multisig
- **Undo** last choice / **Reset**
- Dark theme + Bitcoin orange

## Stack

Vite + React + TypeScript. No backend. No crypto libraries required for this custody adventure.

## License

Educational demo. Use freely for learning.
