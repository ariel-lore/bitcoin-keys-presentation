import type { AdventureState } from '../types/schema';
import { isSufficientToOperate } from '../types/schema';

/** Compact presenter-friendly setup / key-status indicator (labels only). */
export function SetupStatus({ state }: { state: AdventureState }) {
  const sufficient = isSufficientToOperate(state);
  const label = sufficient
    ? state.hasPrivateKey
      ? 'Sufficient to operate — risks remain'
      : 'Setup complete — custodial (no priv key)'
    : 'Setup: incomplete';

  return (
    <div className="setup-status" aria-label={label}>
      <span className={`setup-pill ${sufficient ? 'ready' : 'incomplete'}`}>{label}</span>
      <div className="key-badges" aria-label="Key material status (educational labels)">
        <span
          className={`key-badge ${state.hasPrivateKey ? 'on' : 'off'}`}
          title="Private key / signing material present (label only)"
        >
          Priv
        </span>
        <span
          className={`key-badge ${state.hasPublicKey || state.hasXpub ? 'on' : 'off'}`}
          title="Public key / xpub / address ready (label only)"
        >
          Pub{state.hasXpub ? '·xpub' : ''}
        </span>
      </div>
    </div>
  );
}
