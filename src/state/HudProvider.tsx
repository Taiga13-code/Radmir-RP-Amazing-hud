import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { consumeOrReload } from '../lib/ammo';
import { mergeHud } from '../lib/mergeHud';
import { isBrowserPreview } from '../lib/preview';
import { INITIAL_HUD } from '../types';
import type { HudPatch, HudState } from '../types';

interface HudContextValue {
  hud: HudState;
  shownTime: number;
  preview: boolean;
  apply: (patch: HudPatch) => void;
}

const HudContext = createContext<HudContextValue | null>(null);

interface HudProviderProps {
  children: ReactNode;
}

function createInitialHud(preview: boolean): HudState {
  if (preview) {
    return INITIAL_HUD;
  }

  return {
    money: 0,
    weapon: '—',
    weaponId: 0,
    nickName: '',
    casePoints: 0,
    serverId: 0,
    ammoClip: 0,
    ammoReserve: 0,
    clipSize: 1,
    hp: 100,
    armor: 0,
    hunger: 100,
    breath: 100,
    freeze: 0,
    wanted: 0,
    online: 0,
    id: 0,
    fastHealCount: 0,
    fastFoodCount: 0,
    greenZone: false,
    fishingZone: false,
    gps: { show: false, distance: 0 },
    point: { show: false, distance: 0 },
    capt: {
      visible: false,
      timeLeft: 0,
      territory: 0,
      attackerName: '—',
      attackerScore: 0,
      attackerInZone: 0,
      defenderName: '—',
      defenderScore: 0,
      defenderInZone: 0,
    },
  };
}

export function HudProvider({ children }: HudProviderProps) {
  const preview = isBrowserPreview();
  const [hud, setHud] = useState<HudState>(() => createInitialHud(preview));
  const [captSyncedAt, setCaptSyncedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const apply = useCallback((patch: HudPatch) => {
    setHud((prev) => mergeHud(prev, patch));

    if (patch.capt?.timeLeft !== undefined) {
      setCaptSyncedAt(Date.now());
    }
  }, []);

  useEffect(() => {
    const handler = (data: HudPatch | string) => {
      try {
        const patch = typeof data === 'string' ? (JSON.parse(data) as HudPatch) : data;

        if (!patch || typeof patch !== 'object') {
          return;
        }

        apply(patch);
      } catch (error) {
        console.error('[updateRadmirHud] Не удалось разобрать данные', error);
      }
    };

    window.updateRadmirHud = handler;
    window.__radmirHudBridge?.flush();

    return () => {
      if (window.updateRadmirHud === handler) {
        delete window.updateRadmirHud;
      }
    };
  }, [apply]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!preview) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        setHud((prev) => ({
          ...prev,
          hp: prev.hp <= 0 ? 100 : Math.max(0, prev.hp - 25),
        }));
        return;
      }

      if (event.code === 'KeyT') {
        event.preventDefault();
        setHud((prev) => ({
          ...prev,
          capt: {
            ...prev.capt,
            attackerScore: prev.capt.defenderScore,
            defenderScore: prev.capt.attackerScore,
          },
        }));
        return;
      }

      if (event.code === 'KeyR') {
        event.preventDefault();
        setHud((prev) => consumeOrReload(prev));
        return;
      }

      if (event.code === 'KeyH') {
        event.preventDefault();
        setHud((prev) => ({
          ...prev,
          hunger: prev.hunger <= 0 ? 100 : Math.max(0, prev.hunger - 20),
        }));
        return;
      }

      if (event.code === 'KeyB') {
        event.preventDefault();
        setHud((prev) => ({ ...prev, breath: prev.breath < 99 ? 100 : 60 }));
        return;
      }

      if (event.code === 'KeyW') {
        event.preventDefault();
        setHud((prev) => ({ ...prev, wanted: (prev.wanted + 1) % 7 }));
        return;
      }

      if (event.code === 'KeyZ') {
        event.preventDefault();
        setHud((prev) => ({ ...prev, greenZone: !prev.greenZone, fishingZone: false }));
        return;
      }

      if (event.code === 'KeyF') {
        event.preventDefault();
        setHud((prev) => ({ ...prev, fishingZone: !prev.fishingZone, greenZone: false }));
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [preview]);

  const shownTime = Math.max(0, hud.capt.timeLeft - (now - captSyncedAt) / 1000);

  const value = useMemo<HudContextValue>(
    () => ({
      hud,
      shownTime,
      preview,
      apply,
    }),
    [hud, shownTime, preview, apply],
  );

  return <HudContext.Provider value={value}>{children}</HudContext.Provider>;
}

export function useHud(): HudContextValue {
  const value = useContext(HudContext);

  if (!value) {
    throw new Error('useHud должен вызываться внутри HudProvider');
  }

  return value;
}
