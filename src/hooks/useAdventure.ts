import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdventureState, Choice, KeyFlag, RecommendedPath, TrailStep } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { tree, nodeById, uniquePush, mitigationById } from '../lib/data';

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
    trail: [{ nodeId: tree.startNodeId, choiceId: null, choiceLabel: null }],
    vulnIds: [],
    mitigatedVulnIds: [],
    tags: [],
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
      },
    ],
    vulnIds: uniquePush(prev.vulnIds, choice.addsVulnIds),
    mitigatedVulnIds: prev.mitigatedVulnIds,
    tags: uniquePush(prev.tags, [...(choice.tags ?? []), ...(choice.capabilities ?? []), ...(choice.enables ?? [])]),
    ...keys,
  };
}

function replayTrail(kept: TrailStep[], mitigatedVulnIds: string[]): AdventureState {
  let vulnIds: string[] = [];
  let tags: string[] = [];
  let currentNodeId = tree.startNodeId;
  let keys = emptyKeys();

  for (let i = 1; i < kept.length; i++) {
    const step = kept[i];
    const prevNode = nodeById[kept[i - 1].nodeId];
    const choice = prevNode?.choices.find((c) => c.id === step.choiceId);
    if (!choice) continue;
    currentNodeId = choice.nextNodeId;
    vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
    tags = uniquePush(tags, [...(choice.tags ?? []), ...(choice.capabilities ?? []), ...(choice.enables ?? [])]);
    keys = applyFlags(keys, choice.setsFlags);
  }

  const vulnSet = new Set(vulnIds);
  let keptMitigated = mitigatedVulnIds.filter((id) => vulnSet.has(id));

  // Restore pre-mitigations that were applied on the restored node.
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

  return {
    currentNodeId,
    trail: kept,
    vulnIds,
    mitigatedVulnIds: keptMitigated,
    tags,
    ...keys,
  };
}

function walkPath(path: RecommendedPath): AdventureState {
  let vulnIds: string[] = [];
  let tags: string[] = [];
  let currentNodeId = path.startNodeId ?? tree.startNodeId;
  let keys = emptyKeys();
  const trail: TrailStep[] = [{ nodeId: currentNodeId, choiceId: null, choiceLabel: null }];

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
    });
  }

  return { currentNodeId, trail, vulnIds, mitigatedVulnIds: [], tags, ...keys };
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
    trail: s.trail,
    vulnIds: s.vulnIds ?? [],
    mitigatedVulnIds: s.mitigatedVulnIds ?? [],
    tags: s.tags ?? [],
    hasPrivateKey: !!s.hasPrivateKey,
    hasPublicKey: !!s.hasPublicKey,
    hasXpub: !!s.hasXpub,
  };
}

export function useAdventure() {
  const [state, setState] = useState<AdventureState>(() => {
    const fromUrl = readNodeFromUrl();
    if (fromUrl && fromUrl !== tree.startNodeId) {
      return {
        currentNodeId: fromUrl,
        trail: [{ nodeId: fromUrl, choiceId: null, choiceLabel: null }],
        vulnIds: [],
        mitigatedVulnIds: [],
        tags: [],
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
      // Never restore a truncated URL-only trail mid-session.
      // If history entry is null/invalid, step back one via trail replay.
      const cur = stateRef.current;
      if (cur.trail.length > 1) {
        const next = replayTrail(cur.trail.slice(0, -1), cur.mitigatedVulnIds);
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
    const next: AdventureState = {
      ...prev,
      mitigatedVulnIds: uniquePush(prev.mitigatedVulnIds, [vulnId]),
    };
    setState(next);
    window.history.replaceState(next, '', urlFor(next.currentNodeId));
  }, []);

  /**
   * Apply a node pre-mitigation while staying on the same question.
   * Adds addressed vulns (so they appear in the risk strip) and marks them mitigated.
   */
  const applyPreMitigation = useCallback((mitigationId: string) => {
    const mit = mitigationById[mitigationId];
    if (!mit) return;
    const prev = stateRef.current;
    const addressed = mit.addressesVulnIds ?? [];
    if (!addressed.length) return;
    const already = addressed.every((id) => prev.mitigatedVulnIds.includes(id));
    if (already) return;
    const next: AdventureState = {
      ...prev,
      vulnIds: uniquePush(prev.vulnIds, addressed),
      mitigatedVulnIds: uniquePush(prev.mitigatedVulnIds, addressed),
      tags: uniquePush(prev.tags, ['ceremony-opsec', mitigationId]),
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
    const idx = prev.trail.findIndex((t) => t.nodeId === nodeId);
    let next: AdventureState;
    if (idx >= 0) {
      next = replayTrail(prev.trail.slice(0, idx + 1), prev.mitigatedVulnIds);
      const stepsBack = prev.trail.length - 1 - idx;
      setState(next);
      if (stepsBack > 0) {
        // Prefer walking history so Back/Forward stay consistent.
        // replaceState after go would race; push a fresh snapshot instead when
        // jumping mid-trail via UI (trail click) — one entry for the restored step.
        window.history.pushState(next, '', urlFor(next.currentNodeId));
      }
      return;
    }
    next = {
      ...prev,
      currentNodeId: nodeId,
      trail: [
        ...prev.trail,
        { nodeId, choiceId: null, choiceLabel: `Jump → ${nodeById[nodeId].title}` },
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
