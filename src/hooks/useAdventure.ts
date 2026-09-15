import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdventureState,
  Choice,
  KeyFlag,
  Mitigation,
  ProcedureStep,
  RecommendedPath,
  TrailStep,
} from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { tree, nodeById, uniquePush, mitigationById, mitigationForVuln } from '../lib/data';

/** Survives React Strict Mode remount so we only bootstrap history once. */
let historyBootstrapped = false;

function emptyKeys() {
  return { hasPrivateKey: false, hasPublicKey: false, hasXpub: false };
}

function applyFlags(
  keys: { hasPrivateKey: boolean; hasPublicKey: boolean; hasXpub: boolean },
  flags: KeyFlag[] | undefined,
) {
  if (!flags?.length) return keys;
  const next = { ...keys };
  for (const f of flags) {
    if (f === 'privateKey') next.hasPrivateKey = true;
    if (f === 'publicKey') next.hasPublicKey = true;
    if (f === 'xpub') next.hasXpub = true;
  }
  return next;
}

function initialState(): AdventureState {
  return {
    currentNodeId: tree.startNodeId,
    trail: [
      {
        nodeId: tree.startNodeId,
        choiceId: null,
        choiceLabel: null,
        choiceDescription: null,
        addsVulnIds: [],
        kind: 'start',
      },
    ],
    vulnIds: [],
    mitigatedVulnIds: [],
    tags: [],
    procedureSteps: [],
    ...emptyKeys(),
  };
}

function applyChoice(prev: AdventureState, choice: Choice): AdventureState | null {
  const nextNode = nodeById[choice.nextNodeId];
  if (!nextNode) return null;
  const keys = applyFlags(
    {
      hasPrivateKey: prev.hasPrivateKey,
      hasPublicKey: prev.hasPublicKey,
      hasXpub: prev.hasXpub,
    },
    choice.setsFlags,
  );
  return {
    currentNodeId: choice.nextNodeId,
    trail: [
      ...prev.trail,
      {
        nodeId: choice.nextNodeId,
        choiceId: choice.id,
        choiceLabel: choice.label,
        choiceDescription: choice.description ?? null,
        addsVulnIds: choice.addsVulnIds ? [...choice.addsVulnIds] : [],
        kind: 'choice',
      },
    ],
    vulnIds: uniquePush(prev.vulnIds, choice.addsVulnIds),
    mitigatedVulnIds: prev.mitigatedVulnIds,
    tags: uniquePush(prev.tags, [...(choice.tags ?? []), ...(choice.capabilities ?? []), ...(choice.enables ?? [])]),
    procedureSteps: prev.procedureSteps,
    ...keys,
  };
}

function replayTrail(
  kept: TrailStep[],
  mitigatedVulnIds: string[],
  procedureSteps: ProcedureStep[],
): AdventureState {
  let vulnIds: string[] = [];
  let tags: string[] = [];
  let currentNodeId = tree.startNodeId;
  let keys = emptyKeys();
  const trail: TrailStep[] = kept.length
    ? [{ ...kept[0], kind: kept[0].kind ?? 'start', addsVulnIds: kept[0].addsVulnIds ?? [] }]
    : [
        {
          nodeId: tree.startNodeId,
          choiceId: null,
          choiceLabel: null,
          choiceDescription: null,
          addsVulnIds: [],
          kind: 'start',
        },
      ];

  if (kept.length) currentNodeId = kept[0].nodeId;

  for (let i = 1; i < kept.length; i++) {
    const step = kept[i];
    const prevNode = nodeById[trail[trail.length - 1].nodeId];
    const choice = prevNode?.choices.find((c) => c.id === step.choiceId);
    if (!choice) {
      // Synthetic switch / jump step: trust recorded nodeId and continue
      if (step.nodeId && nodeById[step.nodeId]) {
        currentNodeId = step.nodeId;
        vulnIds = uniquePush(vulnIds, step.addsVulnIds);
        trail.push({
          ...step,
          kind: step.kind ?? 'choice',
          addsVulnIds: step.addsVulnIds ? [...step.addsVulnIds] : [],
        });
      }
      continue;
    }
    currentNodeId = choice.nextNodeId;
    vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
    tags = uniquePush(tags, [...(choice.tags ?? []), ...(choice.capabilities ?? []), ...(choice.enables ?? [])]);
    keys = applyFlags(keys, choice.setsFlags);
    trail.push({
      nodeId: currentNodeId,
      choiceId: choice.id,
      choiceLabel: choice.label,
      choiceDescription: choice.description ?? null,
      addsVulnIds: choice.addsVulnIds ? [...choice.addsVulnIds] : [],
      kind: 'choice',
    });
  }

  const vulnSet = new Set(vulnIds);
  let keptMitigated = mitigatedVulnIds.filter((id) => vulnSet.has(id));

  const finalNode = nodeById[currentNodeId];
  if (finalNode?.preMitigationIds?.length) {
    for (const mid of finalNode.preMitigationIds) {
      const mit = mitigationById[mid];
      if (!mit?.addressesVulnIds?.length) continue;
      const addressed = mit.addressesVulnIds;
      if (!addressed.some((id) => mitigatedVulnIds.includes(id))) continue;
      vulnIds = uniquePush(vulnIds, addressed);
      keptMitigated = uniquePush(
        keptMitigated,
        addressed.filter((id) => mitigatedVulnIds.includes(id)),
      );
      tags = uniquePush(tags, ['ceremony-opsec', mid]);
    }
  }

  const keptProcedure = procedureSteps.filter(
    (ps) =>
      !ps.mitigatesVulnIds?.length ||
      ps.mitigatesVulnIds.some((id) => keptMitigated.includes(id)),
  );

  return {
    currentNodeId,
    trail,
    vulnIds,
    mitigatedVulnIds: keptMitigated,
    tags,
    procedureSteps: keptProcedure,
    ...keys,
  };
}

function walkPath(path: RecommendedPath): AdventureState {
  let vulnIds: string[] = [];
  let tags: string[] = [];
  let currentNodeId = path.startNodeId ?? tree.startNodeId;
  let keys = emptyKeys();
  const trail: TrailStep[] = [
    {
      nodeId: currentNodeId,
      choiceId: null,
      choiceLabel: null,
      choiceDescription: null,
      addsVulnIds: [],
      kind: 'start',
    },
  ];

  for (const choiceId of path.choiceSequence) {
    const node = nodeById[currentNodeId];
    const choice = node?.choices.find((c) => c.id === choiceId);
    if (!choice) break;
    currentNodeId = choice.nextNodeId;
    vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
    tags = uniquePush(tags, [...(choice.tags ?? []), ...(choice.capabilities ?? []), ...(choice.enables ?? [])]);
    keys = applyFlags(keys, choice.setsFlags);
    trail.push({
      nodeId: currentNodeId,
      choiceId: choice.id,
      choiceLabel: choice.label,
      choiceDescription: choice.description ?? null,
      addsVulnIds: choice.addsVulnIds ? [...choice.addsVulnIds] : [],
      kind: 'choice',
    });
  }

  return {
    currentNodeId,
    trail,
    vulnIds,
    mitigatedVulnIds: [],
    tags,
    procedureSteps: [],
    ...keys,
  };
}

function urlFor(nodeId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('node', nodeId);
  return `${url.pathname}${url.search}${url.hash}`;
}

function readNodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('node');
  return id && nodeById[id] ? id : null;
}

function snapshotValid(s: unknown): s is AdventureState {
  if (!s || typeof s !== 'object') return false;
  const st = s as AdventureState;
  return (
    typeof st.currentNodeId === 'string' &&
    !!nodeById[st.currentNodeId] &&
    Array.isArray(st.trail) &&
    Array.isArray(st.vulnIds) &&
    Array.isArray(st.mitigatedVulnIds)
  );
}

function normalizeLegacy(s: AdventureState & { mitigationIds?: string[] }): AdventureState {
  return {
    currentNodeId: s.currentNodeId,
    trail: (s.trail ?? []).map((t) => ({
      ...t,
      choiceDescription: t.choiceDescription ?? null,
      addsVulnIds: t.addsVulnIds ?? [],
      kind: t.kind ?? (t.choiceId ? 'choice' : 'start'),
    })),
    vulnIds: s.vulnIds ?? [],
    mitigatedVulnIds: s.mitigatedVulnIds ?? [],
    tags: s.tags ?? [],
    hasPrivateKey: !!s.hasPrivateKey,
    hasPublicKey: !!s.hasPublicKey,
    hasXpub: !!s.hasXpub,
    procedureSteps: s.procedureSteps ?? [],
  };
}

function appendProcedureFromMitigation(
  prev: AdventureState,
  mitigationId: string,
  vulnIds: string[],
): ProcedureStep[] {
  const mit = mitigationById[mitigationId];
  if (!mit?.procedureStep) return prev.procedureSteps;
  if (mit.kind === 'switchOption') return prev.procedureSteps;
  const stepId = `${mit.id}:${vulnIds.sort().join(',')}`;
  if (prev.procedureSteps.some((p) => p.id === stepId || p.fromMitigationId === mit.id)) {
    if (prev.procedureSteps.some((p) => p.id === stepId)) return prev.procedureSteps;
  }
  return [
    ...prev.procedureSteps,
    {
      id: stepId,
      title: mit.procedureStep.title,
      description: mit.procedureStep.description,
      fromMitigationId: mit.id,
      mitigatesVulnIds: [...vulnIds],
    },
  ];
}

/** Find trail index of the structural choice to replace (the step AFTER that choice was taken). */
function findReplaceTrailIndex(prev: AdventureState, mit: Mitigation): number {
  const spec = mit.switchTo;
  if (!spec) return -1;

  for (let i = 1; i < prev.trail.length; i++) {
    const step = prev.trail[i];
    if (spec.replaceChoiceId && step.choiceId === spec.replaceChoiceId) return i;

    if (spec.replaceChoiceTag) {
      const parent = nodeById[prev.trail[i - 1].nodeId];
      const choice = parent?.choices.find((c) => c.id === step.choiceId);
      if (choice?.tags?.includes(spec.replaceChoiceTag)) return i;
      // Also match tags recorded on adventure state via that choice
      if (step.choiceId && choice?.tags?.includes(spec.replaceChoiceTag)) return i;
    }
  }

  // Fallback: scan all nodes' choices by id even if parent replay differs
  if (spec.replaceChoiceId) {
    for (let i = 1; i < prev.trail.length; i++) {
      if (prev.trail[i].choiceId === spec.replaceChoiceId) return i;
    }
  }
  return -1;
}

function applySwitchMitigation(prev: AdventureState, mit: Mitigation, vulnId: string): AdventureState | null {
  const spec = mit.switchTo;
  if (!spec?.targetNodeId || !nodeById[spec.targetNodeId]) return null;

  const replaceIdx = findReplaceTrailIndex(prev, mit);
  let base: AdventureState;
  if (replaceIdx > 0) {
    base = replayTrail(prev.trail.slice(0, replaceIdx), prev.mitigatedVulnIds, prev.procedureSteps);
  } else {
    // Could not locate conflicting step — jump forward from current state without inventing a fake procedure step
    base = { ...prev };
  }

  const clears = spec.clearsVulnIds ?? mit.addressesVulnIds ?? [];
  const target = nodeById[spec.targetNodeId];
  const label = spec.choiceLabel ?? mit.title;
  const choiceId = spec.choiceId ?? `switch:${mit.id}`;

  // Drop cleared vulns from accumulation; mark addressed ones mitigated
  const vulnIds = base.vulnIds.filter((id) => !clears.includes(id));
  const mitigatedVulnIds = uniquePush(
    base.mitigatedVulnIds.filter((id) => !clears.includes(id)),
    [vulnId, ...clears.filter((id) => prev.vulnIds.includes(id) || id === vulnId)],
  ).filter((id) => vulnIds.includes(id) || id === vulnId);

  // If single-point-key etc. already removed from vulnIds, still track mitigation of the clicked vuln
  // Keep clicked vuln in list only if still present; switch clears structural ones
  const finalVulns = uniquePush(vulnIds, []);
  // Ensure we don't re-add cleared ids
  const cleanedVulns = finalVulns.filter((id) => !clears.includes(id));

  // Tags: remove replaced structural tag if any
  let tags = base.tags.filter((t) => t !== spec.replaceChoiceTag);
  tags = uniquePush(tags, [...(spec.addsTags ?? []), mit.id, 'structure-switch']);

  const next: AdventureState = {
    ...base,
    currentNodeId: spec.targetNodeId,
    trail: [
      ...base.trail,
      {
        nodeId: spec.targetNodeId,
        choiceId,
        choiceLabel: label,
        choiceDescription: mit.description,
        addsVulnIds: [],
        kind: 'choice',
        mitigationId: mit.id,
      },
    ],
    vulnIds: cleanedVulns,
    // Keep mitigated ids that still appear OR were cleared by the switch (show as secured if somehow still listed)
    mitigatedVulnIds: uniquePush(
      mitigatedVulnIds.filter((id) => cleanedVulns.includes(id)),
      [],
    ),
    tags,
    // Do not append procedure step for switches
    procedureSteps: base.procedureSteps.filter((ps) => ps.fromMitigationId !== mit.id),
  };

  // Title context: if target has a meaningful first question, we're on it
  void target;
  return next;
}

export function useAdventure() {
  const [state, setState] = useState<AdventureState>(() => {
    const fromUrl = readNodeFromUrl();
    if (fromUrl && fromUrl !== tree.startNodeId) {
      return {
        currentNodeId: fromUrl,
        trail: [
          {
            nodeId: fromUrl,
            choiceId: null,
            choiceLabel: null,
            choiceDescription: null,
            addsVulnIds: [],
            kind: 'start',
          },
        ],
        vulnIds: [],
        mitigatedVulnIds: [],
        tags: [],
        procedureSteps: [],
        ...emptyKeys(),
      };
    }
    return initialState();
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!historyBootstrapped) {
      const snap = stateRef.current;
      window.history.replaceState(snap, '', urlFor(snap.currentNodeId));
      historyBootstrapped = true;
    }

    const onPop = (e: PopStateEvent) => {
      if (snapshotValid(e.state)) {
        setState(normalizeLegacy(e.state));
        return;
      }
      const cur = stateRef.current;
      if (cur.trail.length > 1) {
        const next = replayTrail(cur.trail.slice(0, -1), cur.mitigatedVulnIds, cur.procedureSteps);
        setState(next);
        window.history.replaceState(next, '', urlFor(next.currentNodeId));
      } else {
        const next = initialState();
        setState(next);
        window.history.replaceState(next, '', urlFor(next.currentNodeId));
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const choose = useCallback((choice: Choice) => {
    const prev = stateRef.current;
    const next = applyChoice(prev, choice);
    if (!next) return;
    setState(next);
    window.history.pushState(next, '', urlFor(next.currentNodeId));
  }, []);

  const applyMitigationForVuln = useCallback((vulnId: string) => {
    const prev = stateRef.current;
    if (!prev.vulnIds.includes(vulnId) || prev.mitigatedVulnIds.includes(vulnId)) {
      return;
    }
    const mit = mitigationForVuln(vulnId);
    if (!mit) {
      const next: AdventureState = {
        ...prev,
        mitigatedVulnIds: uniquePush(prev.mitigatedVulnIds, [vulnId]),
      };
      setState(next);
      window.history.replaceState(next, '', urlFor(next.currentNodeId));
      return;
    }

    if (mit.kind === 'switchOption' && mit.switchTo) {
      const switched = applySwitchMitigation(prev, mit, vulnId);
      if (switched) {
        setState(switched);
        // Structural navigation: push so browser Back restores prior structure
        window.history.pushState(switched, '', urlFor(switched.currentNodeId));
        return;
      }
    }

    // Xpub-verify style mitigations can mark public side ready
    let keys = {
      hasPrivateKey: prev.hasPrivateKey,
      hasPublicKey: prev.hasPublicKey,
      hasXpub: prev.hasXpub,
    };
    if (mit.id === 'xpub-watcher-match' || mit.id === 'verify-address-on-device') {
      keys = applyFlags(keys, ['publicKey', 'xpub']);
    }

    const procedureSteps = appendProcedureFromMitigation(prev, mit.id, [vulnId]);
    const next: AdventureState = {
      ...prev,
      ...keys,
      mitigatedVulnIds: uniquePush(prev.mitigatedVulnIds, [vulnId]),
      procedureSteps,
    };
    setState(next);
    window.history.replaceState(next, '', urlFor(next.currentNodeId));
  }, []);

  /**
   * Apply a node pre-mitigation while staying on the same question.
   * Adds addressed vulns (so they appear nested under ceremony steps) and marks them mitigated.
   */
  const applyPreMitigation = useCallback((mitigationId: string) => {
    const mit = mitigationById[mitigationId];
    if (!mit) return;
    if (mit.kind === 'switchOption') {
      // Pre-mits should be procedure-style; ignore switches here
      return;
    }
    const prev = stateRef.current;
    const addressed = mit.addressesVulnIds ?? [];
    if (!addressed.length) return;
    const already = addressed.every((id) => prev.mitigatedVulnIds.includes(id));
    if (already) return;
    const procedureSteps = appendProcedureFromMitigation(prev, mitigationId, addressed);
    const next: AdventureState = {
      ...prev,
      vulnIds: uniquePush(prev.vulnIds, addressed),
      mitigatedVulnIds: uniquePush(prev.mitigatedVulnIds, addressed),
      tags: uniquePush(prev.tags, ['ceremony-opsec', mitigationId]),
      procedureSteps,
    };
    setState(next);
    window.history.replaceState(next, '', urlFor(next.currentNodeId));
  }, []);

  const undo = useCallback(() => {
    if (stateRef.current.trail.length <= 1) return;
    window.history.back();
  }, []);

  const reset = useCallback(() => {
    const next = initialState();
    setState(next);
    window.history.replaceState(next, '', urlFor(next.currentNodeId));
  }, []);

  const jumpToNode = useCallback((nodeId: string) => {
    if (!nodeById[nodeId]) return;
    const prev = stateRef.current;
    const idx = prev.trail.findIndex((t) => t.nodeId === nodeId && t.kind !== 'mitigation');
    let next: AdventureState;
    if (idx >= 0) {
      next = replayTrail(prev.trail.slice(0, idx + 1), prev.mitigatedVulnIds, prev.procedureSteps);
      setState(next);
      // Jumping backward: replaceState only — never push a duplicate history entry.
      window.history.replaceState(next, '', urlFor(next.currentNodeId));
      return;
    }
    next = {
      ...prev,
      currentNodeId: nodeId,
      trail: [
        ...prev.trail,
        {
          nodeId,
          choiceId: null,
          choiceLabel: `Jump → ${nodeById[nodeId].title}`,
          choiceDescription: null,
          addsVulnIds: [],
          kind: 'choice',
        },
      ],
    };
    setState(next);
    window.history.pushState(next, '', urlFor(next.currentNodeId));
  }, []);

  const applyPath = useCallback((path: RecommendedPath) => {
    const next = walkPath(path);
    setState(next);
    window.history.pushState(next, '', urlFor(next.currentNodeId));
  }, []);

  const canUndo = state.trail.length > 1;

  const openVulnIds = useMemo(
    () => state.vulnIds.filter((id) => !state.mitigatedVulnIds.includes(id)),
    [state.vulnIds, state.mitigatedVulnIds],
  );

  const sufficientToOperate = useMemo(() => isSufficientToOperate(state), [state]);

  const currentNode = nodeById[state.currentNodeId];

  return useMemo(
    () => ({
      state,
      currentNode,
      choose,
      undo,
      reset,
      jumpToNode,
      applyPath,
      applyMitigationForVuln,
      applyPreMitigation,
      canUndo,
      openVulnIds,
      sufficientToOperate,
    }),
    [
      state,
      currentNode,
      choose,
      undo,
      reset,
      jumpToNode,
      applyPath,
      applyMitigationForVuln,
      applyPreMitigation,
      canUndo,
      openVulnIds,
      sufficientToOperate,
    ],
  );
}
