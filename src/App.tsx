import { useState } from 'react';
import { useAdventure } from './hooks/useAdventure';
import { DemoBanner } from './components/DemoBanner';
import { TrailStrip } from './components/Trail';
import { RiskMitigationStrip } from './components/ChipLists';
import { PathPanel } from './components/PathPanel';
import { NodeView } from './components/NodeView';
import { SummaryView } from './components/SummaryView';
import { SetupStatus } from './components/SetupStatus';

export default function App() {
  const adventure = useAdventure();
  const [pathsOpen, setPathsOpen] = useState(false);

  if (!adventure.currentNode) {
    return <div className="app-error">Missing node data. Check src/data/tree.json.</div>;
  }

  const isSummary = !!adventure.currentNode.isSummary;

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
          <SetupStatus state={adventure.state} />
          <RiskMitigationStrip
            vulnIds={adventure.state.vulnIds}
            mitigatedVulnIds={adventure.state.mitigatedVulnIds}
            onApplyMitigation={adventure.applyMitigationForVuln}
          />
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
        {isSummary ? (
          <SummaryView
            node={adventure.currentNode}
            state={adventure.state}
            openVulnIds={adventure.openVulnIds}
            onChoose={adventure.choose}
            onApplyMitigation={adventure.applyMitigationForVuln}
          />
        ) : (
          <NodeView
            node={adventure.currentNode}
            onChoose={adventure.choose}
            mitigatedVulnIds={adventure.state.mitigatedVulnIds}
            onApplyPreMitigation={adventure.applyPreMitigation}
          />
        )}
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
