/// <reference types="vite/client" />

import type { HudPatch } from './types';

declare global {
  const __HUD_BUILD__: string;

  interface RadmirHudBridge {
    publish: (patch: HudPatch) => void;
    flush: () => void;
    hideStockHud: (force?: boolean) => void;
  }

  interface Window {
    /**
     * Точка входа для ASI-плагина.
     * Принимает объект или JSON-строку.
     */
    updateRadmirHud?: (data: HudPatch | string) => void;
    getInterface?: (name: string) => unknown;
    openInterface?: (name: string, params?: unknown, ...rest: unknown[]) => unknown;
    closeInterface?: (name: string, ...rest: unknown[]) => unknown;
    getInterfaceStatus?: (name: string) => unknown;
    __radmirGetInterfacePatched?: boolean;
    __radmirHudBridge?: RadmirHudBridge;
    __radmirHudRoot?: { unmount: () => void };
    __radmirHudOnReady?: (force?: boolean) => void;
    __radmirHudReport?: (message: string, visible?: boolean) => void;
    __radmirCaptureVisible?: boolean;
    __radmirCaptureWatchdog?: number;
    __radmirPlayerMetaWatchdog?: number;
  }
}

export {};
