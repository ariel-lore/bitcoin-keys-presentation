import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdventureState, Choice, KeyFlag, RecommendedPath, TrailStep } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';
import { tree, nodeById, uniquePush } from '../lib/data';

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
  const keptMitigated = mitigatedVulnIds.filter((id) => vulnSet.has(id));

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

  const ready = useRef(false);

  useEffect(() => {
    const snap = state;
    window.history.replaceState(snap, '', urlFor(snap.currentNodeId));
    ready.current = true;
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (snapshotValid(e.state)) {
        setState(normalizeLegacy(e.state));
      } else if (e.state && typeof e.state === 'object' && Array.isArray((e.state as AdventureState).vulnIds)) {
        setState(normalizeLegacy(e.state as AdventureState));
      } else {
        const fromUrl = readNodeFromUrl();
        setState(
          fromUrl
            ? {
                currentNodeId: fromUrl,
                trail: [{ nodeId: fromUrl, choiceId: null, choiceLabel: null }],
                vulnIds: [],
                mitigatedVulnIds: [],
                tags: [],
                ...emptyKeys(),
              }
            : initialState(),
        );
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const push = useCallback((next: AdventureState) => {
    setState(next);
    if (ready.current) {
      window.history.pushState(next, '', urlFor(next.currentNodeId));
    }
  }, []);

  const replace = useCallback((next: AdventureState) => {
    setState(next);
    if (ready.current) {
      window.history.replaceState(next, '', urlFor(next.currentNodeId));
    }
  }, []);

  const currentNode = nodeById[state.currentNodeId];

  const choose = useCallback((choice: Choice) => {
    setState((prev) => {
      const next = applyChoice(prev, choice);
      if (!next) return prev;
      if (ready.current) {
        window.history.pushState(next, '', urlFor(next.currentNodeId));
      }
      return next;
    });
  }, []);

  const applyMitigationForVuln = useCallback((vulnId: string) => {
    setState((prev) => {
      if (!prev.vulnIds.includes(vulnId) || prev.mitigatedVulnIds.includes(vulnId)) {
        return prev;
      }
      const next: AdventureState = {
        ...prev,
        mitigatedVulnIds: uniquePush(prev.mitigatedVulnIds, [vulnId]),
      };
      if (ready.current) {
        window.history.replaceState(next, '', urlFor(next.currentNodeId));
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (state.trail.length <= 1) return;
    window.history.back();
  }, [state.trail.length]);

  const reset = useCallback(() => {
    replace(initialState());
  }, [replace]);

  const jumpToNode = useCallback((nodeId: string) => {
    if (!nodeById[nodeId]) return;
    setState((prev) => {
      const idx = prev.trail.findIndex((t) => t.nodeId === nodeId);
      if (idx >= 0) {
        const next = replayTrail(prev.trail.slice(0, idx + 1), prev.mitigatedVulnIds);
        if (ready.current) {
          window.history.pushState(next, '', urlFor(next.currentNodeId));
        }
        return next;
      }
      const next: AdventureState = {
        ...prev,
        currentNodeId: nodeId,
        trail: [
          ...prev.trail,
          { nodeId, choiceId: null, choiceLabel: `Jump → ${nodeById[nodeId].title}` },
        ],
      };
      if (ready.current) {
        window.history.pushState(next, '', urlFor(next.currentNodeId));
      }
      return next;
    });
  }, []);

  const applyPath = useCallback(
    (path: RecommendedPath) => {
      push(walkPath(path));
    },
    [push],
  );

  const canUndo = state.trail.length > 1;

  const openVulnIds = useMemo(
    () => state.vulnIds.filter((id) => !state.mitigatedVulnIds.includes(id)),
    [state.vulnIds, state.mitigatedVulnIds],
  );

  const sufficientToOperate = useMemo(() => isSufficientToOperate(state), [state]);

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
      canUndo,
      openVulnIds,
      sufficientToOperate,
    ],
  );
}
