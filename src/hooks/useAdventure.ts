import { useCallback, useMemo, useState } from 'react';
import type { AdventureState, Choice, MetricKey, RecommendedPath } from '../types/schema';
import {
  tree,
  nodeById,
  metricsFile,
  applyDeltas,
  uniquePush,
} from '../lib/data';

function initialState(): AdventureState {
  return {
    currentNodeId: tree.startNodeId,
    trail: [{ nodeId: tree.startNodeId, choiceId: null, choiceLabel: null }],
    vulnIds: [],
    mitigationIds: [],
    metrics: { ...metricsFile.initial },
    tags: [],
  };
}

export function useAdventure() {
  const [state, setState] = useState<AdventureState>(initialState);

  const currentNode = nodeById[state.currentNodeId];

  const choose = useCallback((choice: Choice) => {
    setState((prev) => {
      const nextNode = nodeById[choice.nextNodeId];
      if (!nextNode) return prev;
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
        metrics: applyDeltas(prev.metrics, choice.metricDeltas),
        tags: uniquePush(prev.tags, choice.tags),
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.trail.length <= 1) return prev;
      // Rebuild by replaying all but last choice from start
      const kept = prev.trail.slice(0, -1);
      let metrics: Record<MetricKey, number> = { ...metricsFile.initial };
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
        metrics = applyDeltas(metrics, choice.metricDeltas);
        vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
        mitigationIds = uniquePush(mitigationIds, choice.addsMitigationIds);
        tags = uniquePush(tags, choice.tags);
      }

      return {
        currentNodeId,
        trail: kept,
        vulnIds,
        mitigationIds,
        metrics,
        tags,
      };
    });
  }, []);

  const reset = useCallback(() => setState(initialState()), []);

  const jumpToNode = useCallback((nodeId: string) => {
    if (!nodeById[nodeId]) return;
    setState((prev) => ({
      ...prev,
      currentNodeId: nodeId,
      trail: [
        ...prev.trail,
        { nodeId, choiceId: null, choiceLabel: `Jump → ${nodeById[nodeId].title}` },
      ],
    }));
  }, []);

  const applyPath = useCallback((path: RecommendedPath) => {
    let metrics: Record<MetricKey, number> = { ...metricsFile.initial };
    let vulnIds: string[] = [];
    let mitigationIds: string[] = [];
    let tags: string[] = [];
    let currentNodeId = path.startNodeId ?? tree.startNodeId;
    const trail: AdventureState['trail'] = [
      { nodeId: currentNodeId, choiceId: null, choiceLabel: null },
    ];

    for (const choiceId of path.choiceSequence) {
      const node = nodeById[currentNodeId];
      const choice = node?.choices.find((c) => c.id === choiceId);
      if (!choice) break;
      currentNodeId = choice.nextNodeId;
      metrics = applyDeltas(metrics, choice.metricDeltas);
      vulnIds = uniquePush(vulnIds, choice.addsVulnIds);
      mitigationIds = uniquePush(mitigationIds, choice.addsMitigationIds);
      tags = uniquePush(tags, choice.tags);
      trail.push({
        nodeId: currentNodeId,
        choiceId: choice.id,
        choiceLabel: choice.label,
      });
    }

    setState({ currentNodeId, trail, vulnIds, mitigationIds, metrics, tags });
  }, []);

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
