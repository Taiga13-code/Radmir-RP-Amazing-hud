import { Component, StrictMode } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installRadmirBridge } from './radmirBridge';
import { HudProvider } from './state/HudProvider';
import './index.css';

// Install bridge IMMEDIATELY, before game caches getInterface('Hud')
installRadmirBridge();

const HOST_ID = 'custom-radmir-hud-root';
const STOCK_HUD_SELECTOR = '.hud-radmir-info, .hud-hassle-info, .hud-mobile__info';
let hudMounted = false;
let hudBooted = false;
let hudReadyObserver: MutationObserver | undefined;
let documentObserver: MutationObserver | undefined;

interface HudErrorBoundaryState {
  error: Error | null;
}

class HudErrorBoundary extends Component<{ children: ReactNode }, HudErrorBoundaryState> {
  state: HudErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): HudErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (window.__radmirHudReport) {
      window.__radmirHudReport(`React render error: ${error.stack || error.message}\n${info.componentStack || ''}`, true);
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return null;
    }

    return this.props.children;
  }
}

function mountHud(): void {
  if (hudMounted) {
    return;
  }

  const parent = document.body;
  if (!parent) {
    return;
  }

  const previousRoot = window.__radmirHudRoot;
  if (previousRoot) {
    try {
      previousRoot.unmount();
    } catch (error) {
      console.warn('[RADMIR HUD] не удалось размонтировать прошлый корень', error);
    }
    window.__radmirHudRoot = undefined;
  }

  const previousHost = document.getElementById(HOST_ID);
  if (previousHost) previousHost.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.right = '0';
  host.style.bottom = '0';
  host.style.left = '0';
  host.style.width = '100%';
  host.style.height = '100%';
  host.style.pointerEvents = 'none';
  host.style.overflow = 'hidden';
  host.style.zIndex = '9999';
  host.dataset.build = __HUD_BUILD__;
  parent.appendChild(host);

  const root = createRoot(host);
  window.__radmirHudRoot = root;

  flushSync(() => {
    root.render(
      <StrictMode>
        <HudErrorBoundary>
          <HudProvider>
            <App />
          </HudProvider>
        </HudErrorBoundary>
      </StrictMode>,
    );
  });

  hudMounted = true;
  if (hudReadyObserver) hudReadyObserver.disconnect();
  hudReadyObserver = undefined;
  if (window.__radmirHudBridge) window.__radmirHudBridge.hideStockHud(true);
}

function onGameHudReady(force = false): void {
  if (!document.body) {
    return;
  }

  if (!force && !document.querySelector(STOCK_HUD_SELECTOR)) {
    return;
  }

  mountHud();
}

// @ts-ignore unused but kept for potential future use
function waitForGameHudTrigger(): void {
  if (!document.body || hudMounted) {
    return;
  }

  // The game can remain at the login/loading screen for an arbitrary time.
  // Wait for the actual stock HUD node; do not infer readiness from elapsed time.
  if (document.querySelector(STOCK_HUD_SELECTOR)) {
    onGameHudReady();
    return;
  }

  if (!hudReadyObserver) {
    if (typeof MutationObserver !== 'function') {
      onGameHudReady();
      return;
    }

    hudReadyObserver = new MutationObserver(() => {
      if (document.querySelector(STOCK_HUD_SELECTOR)) {
        onGameHudReady();
      }
    });
    hudReadyObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function boot(): void {
  try {
    if (hudBooted) {
      return;
    }

    if (!document.body) {
      if (!documentObserver && typeof MutationObserver === 'function' && document.documentElement) {
        documentObserver = new MutationObserver(() => {
          if (document.body) {
            if (documentObserver) documentObserver.disconnect();
            documentObserver = undefined;
            boot();
          }
        });
        documentObserver.observe(document.documentElement, { childList: true, subtree: true });
      }
      document.addEventListener('DOMContentLoaded', boot, { once: true });
      document.addEventListener('readystatechange', boot);
      return;
    }

    hudBooted = true;
    window.__radmirHudOnReady = onGameHudReady;

    // Game update may have renamed stock HUD nodes, so mount immediately.
    onGameHudReady(true);
  } catch (_err) {
    // Swallow errors to prevent breaking the game UI.
  }
}

boot();
