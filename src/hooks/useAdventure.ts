import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdventureState, Choice, RecommendedPath, TrailStep } from '../types/schema';
import { tree, nodeById, uniquePush } from '../lib/data';

function initialState(): AdventureState {
  return {
    currentNodeId: tree.startNodeId,
    trail: [{ nodeId: tree.startNodeId, choiceId: null, choiceLabel: null }],
    vulnIds: [],
    mitigationIds: [],
    tags: [],
  };
}

function applyChoice(prev: AdventureState, choice: Choice): AdventureState | null {
  const nextNode = nodeById[choice.nextNodeId];
  if (!nextNode) return null;
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
    mitigationIds: uniquePush(prev.mitigationIds, choice.addsMitigationIds),
    tags: uniquePush(prev.tags, choice.tags),
  };
}

function replayTrail(kept: TrailStep[]): AdventureState {
  let vulnIds: string[] = [];
  let mitigationIds: string[] = [];
  let tags: string[] = [];
  let currentNodeId = tree.startNodeId;

  for (let i = 1; i < kept.length; i++) {
    const step = kept[i];
    const prevNode = nodeById[kept[i - 1].nodeId];
    const choice = prevNode?.choices.find((c) => c.id === step.choiceId);
    if (!choice) continue;
    currentNodeId = choice.nextNodeId;
    vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
    mitigationIds = uniquePush(mitigationIds, choice.addsMitigationIds);
    tags = uniquePush(tags, choice.tags);
  }

  return {
    currentNodeId,
    trail: kept,
    vulnIds,
    mitigationIds,
    tags,
  };
}

function walkPath(path: RecommendedPath): AdventureState {
  let vulnIds: string[] = [];
  let mitigationIds: string[] = [];
  let tags: string[] = [];
  let currentNodeId = path.startNodeId ?? tree.startNodeId;
  const trail: TrailStep[] = [{ nodeId: currentNodeId, choiceId: null, choiceLabel: null }];

  for (const choiceId of path.choiceSequence) {
    const node = nodeById[currentNodeId];
    const choice = node?.choices.find((c) => c.id === choiceId);
    if (!choice) break;
    currentNodeId = choice.nextNodeId;
    vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
    mitigationIds = uniquePush(mitigationIds, choice.addsMitigationIds);
    tags = uniquePush(tags, choice.tags);
    trail.push({
      nodeId: currentNodeId,
      choiceId: choice.id,
      choiceLabel: choice.label,
    });
  }

  return { currentNodeId, trail, vulnIds, mitigationIds, tags };
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
    Array.isArray(st.mitigationIds)
  );
}

export function useAdventure() {
  const [state, setState] = useState<AdventureState>(() => {
    const fromUrl = readNodeFromUrl();
    if (fromUrl && fromUrl !== tree.startNodeId) {
      // Deep-link: land on node without fabricated trail history
      return {
        currentNodeId: fromUrl,
        trail: [{ nodeId: fromUrl, choiceId: null, choiceLabel: null }],
        vulnIds: [],
        mitigationIds: [],
        tags: [],
      };
    }
    return initialState();
  });

  const ready = useRef(false);

  // Seed history with current state once
  useEffect(() => {
    const snap = state;
    window.history.replaceState(snap, '', urlFor(snap.currentNodeId));
    ready.current = true;
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (snapshotValid(e.state)) {
        setState(e.state);
      } else {
        const fromUrl = readNodeFromUrl();
        setState(
          fromUrl
            ? {
                currentNodeId: fromUrl,
                trail: [{ nodeId: fromUrl, choiceId: null, choiceLabel: null }],
                vulnIds: [],
                mitigationIds: [],
                tags: [],
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

  const choose = useCallback(
    (choice: Choice) => {
      setState((prev) => {
        const next = applyChoice(prev, choice);
        if (!next) return prev;
        if (ready.current) {
          window.history.pushState(next, '', urlFor(next.currentNodeId));
        }
        return next;
      });
    },
    [],
  );

  /** Undo via browser history when possible so Back/Forward stay aligned. */
  const undo = useCallback(() => {
    if (state.trail.length <= 1) return;
    window.history.back();
  }, [state.trail.length]);

  const reset = useCallback(() => {
    replace(initialState());
  }, [replace]);

  const jumpToNode = useCallback(
    (nodeId: string) => {
      if (!nodeById[nodeId]) return;
      setState((prev) => {
        const idx = prev.trail.findIndex((t) => t.nodeId === nodeId);
        if (idx >= 0) {
          const next = replayTrail(prev.trail.slice(0, idx + 1));
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
    },
    [],
  );

  const applyPath = useCallback(
    (path: RecommendedPath) => {
      push(walkPath(path));
    },
    [push],
  );

  const canUndo = state.trail.length > 1;

  return useMemo(
    () => ({
      state,
      currentNode,
      choose,
      undo,
      reset,
      jumpToNode,
      applyPath,
      canUndo,
    }),
    [state, currentNode, choose, undo, reset, jumpToNode, applyPath, canUndo],
  );
}
