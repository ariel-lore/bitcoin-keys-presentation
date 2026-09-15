import { useState } from 'react';
import { useAdventure } from './hooks/useAdventure';
import { DemoBanner } from './components/DemoBanner';
import { TrailStrip } from './components/Trail';
import { VulnStrip, MitigationStrip } from './components/ChipLists';
import { PathPanel } from './components/PathPanel';
import { NodeView } from './components/NodeView';

export default function App() {
  const adventure = useAdventure();
  const [pathsOpen, setPathsOpen] = useState(false);

  if (!adventure.currentNode) {
    return <div className="app-error">Missing node data. Check src/data/tree.json.</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="btc-mark" aria-hidden>
            ₿
          </span>
          <div>
            <h1 className="app-title">Bitcoin Custody</h1>
            <p className="app-sub">Interactive presentation</p>
          </div>
        </div>

        <TrailStrip trail={adventure.state.trail} onJump={adventure.jumpToNode} />

        <div className="status-cluster">
          <VulnStrip ids={adventure.state.vulnIds} />
          <MitigationStrip ids={adventure.state.mitigationIds} />
        </div>

        <div className="top-actions">
          <button type="button" className="btn" disabled={!adventure.canUndo} onClick={adventure.undo}>
            Back
          </button>
          <button type="button" className="btn" onClick={() => setPathsOpen(true)}>
            Paths
          </button>
          <button type="button" className="btn" onClick={adventure.reset}>
            Reset
          </button>
        </div>
      </header>

      <main className="slide">
        <NodeView node={adventure.currentNode} onChoose={adventure.choose} />
      </main>

      <footer className="slide-footer">
        <DemoBanner />
      </footer>

      <PathPanel
        open={pathsOpen}
        onClose={() => setPathsOpen(false)}
        onApply={adventure.applyPath}
      />
    </div>
  );
}
