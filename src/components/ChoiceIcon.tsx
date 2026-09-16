import { useState } from 'react';
import type { Choice } from '../types/schema';
import { brandInitials } from '../lib/data';
import { resolveChoiceIcon } from '../lib/resolveChoiceIcon';

/** Always shows a visual for a choice — resolved icon, or letter fallback if file fails. */
export function ChoiceIcon({ choice }: { choice: Choice }) {
  const [failed, setFailed] = useState(false);
  const src = resolveChoiceIcon(choice);

  if (failed) {
    return (
      <span className="brand-icon brand-fallback" aria-hidden>
        {brandInitials(choice.label)}
      </span>
    );
  }

  return (
    <img
      className="brand-icon"
      src={src}
      alt=""
      width={28}
      height={28}
      onError={() => setFailed(true)}
    />
  );
}
