import { useState } from 'react';
import { useAdventure } from './hooks/useAdventure';
import { DemoBanner } from './components/DemoBanner';
import { MetricMeters } from './components/MetricMeters';
import { Trail } from './components/Trail';
import { VulnList, MitigationList } from './components/ChipLists';
import { PathPanel } from './components/PathPanel';
import { NodeView } from './components/NodeView';
import type { RecommendedPath } from './types/schema';

export default function App() {
  const adventure = useAdventure();
  const [comparePath, setComparePath] = useState<RecommendedPath | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'trail' | 'paths'>('paths');

  if (!adventure.currentNode) {
    return <div className="app-error">Missing node data. Check src/data/tree.json.</div>;
  }

  return (
    <div className="app">
      <DemoBanner />
      <header className="topbar">
        <div className="brand">
          <span className="btc-mark">₿</span>
          <div>
            <h1 className="app-title">Bitcoin Custody Adventure</h1>
            <p className="app-sub">Choose-your-own-adventure · data-driven</p>
          </div>
        </div>
        <div className="top-actions">
          <button type="button" className="btn" disabled={!adventure.canUndo} onClick={adventure.undo}>
            Undo last choice
          </button>
          <button type="button" className="btn" onClick={adventure.reset}>
            Reset
          </button>
        </div>
      </header>

      <MetricMeters metrics={adventure.state.metrics} targets={comparePath?.metricTargets} />
      {comparePath && (
        <p className="compare-hint">
          Comparing targets for <strong style={{ color: comparePath.highlightColor }}>{comparePath.name}</strong>
          {' · '}
          <button type="button" className="linkish" onClick={() => setComparePath(null)}>
            clear
          </button>
        </p>
      )}

      <div className="layout">
        <main className="main">
          <NodeView node={adventure.currentNode} onChoose={adventure.choose} />
        </main>

        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              type="button"
              className={sidebarTab === 'paths' ? 'active' : ''}
              onClick={() => setSidebarTab('paths')}
            >
              Paths
            </button>
            <button
              type="button"
              className={sidebarTab === 'trail' ? 'active' : ''}
              onClick={() => setSidebarTab('trail')}
            >
              Trail ({adventure.state.trail.length})
            </button>
          </div>
          {sidebarTab === 'paths' ? (
            <PathPanel
              activePathId={comparePath?.id ?? null}
              onApply={(p) => {
                adventure.applyPath(p);
                setComparePath(p);
              }}
              onSelectCompare={setComparePath}
            />
          ) : (
            <Trail trail={adventure.state.trail} onJump={adventure.jumpToNode} />
          )}
          <VulnList ids={adventure.state.vulnIds} />
          <MitigationList ids={adventure.state.mitigationIds} />
        </aside>
      </div>
    </div>
  );
}
