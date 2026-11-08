import type { HudState } from '../types';

export function consumeOrReload(prev: HudState): HudState {
  if (prev.ammoClip > 0) {
    return {
      ...prev,
      ammoClip: prev.ammoClip - 1,
    };
  }

  const missing = Math.max(0, prev.clipSize - prev.ammoClip);
  const loaded = Math.min(missing, prev.ammoReserve);

  return {
    ...prev,
    ammoClip: prev.ammoClip + loaded,
    ammoReserve: prev.ammoReserve - loaded,
  };
}
