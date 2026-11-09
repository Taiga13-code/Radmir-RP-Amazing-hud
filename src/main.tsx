import { Component, StrictMode } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installRadmirBridge } from './radmirBridge';
import { HudProvider } from './state/HudProvider';
import './index.css';

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
    window.__radmirHudReport?.(`React render error: ${error.stack || error.message}\n${info.componentStack || ''}`, true);
  }

  render(): ReactNode {
    if (this.state.error) {
      return null;
    }

    return this.props.children;
  }
}

function mountHud(): void {
  try {
    window.__radmirHudReport?.('mountHud() called', false);
  } catch (e) {
    console.log('[RADMIR HUD] mountHud called');
  }

  if (hudMounted) {
    return;
  }

  const parent = document.body;
  if (!parent) {
    try {
      window.__radmirHudReport?.('mountHud: no document.body', true);
    } catch (e) {
      console.error('[RADMIR HUD] no document.body');
    }
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

  document.getElementById(HOST_ID)?.remove();

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

  // Cohtml's task scheduler can defer React 18 concurrent work indefinitely.
  // Commit the initial HUD synchronously so the ASI can verify it immediately.
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
  hudReadyObserver?.disconnect();
  hudReadyObserver = undefined;
  // flushSync committing without throwing means React produced the HUD tree,
  // so the stock HUD can be hidden safely even if layout is not measurable yet.
  window.__radmirHudBridge?.hideStockHud(true);

  const plate = host.querySelector<HTMLElement>('.cohtml-plate');
  if (plate) {
    // Cohtml's getBoundingClientRect() can report zero sizes for fixed layers,
    // so the presence of the committed plate node is the reliable signal.
    window.__radmirHudReport?.('Custom HUD rendered and committed.', false);
  } else {
    window.__radmirHudReport?.('React committed but no HUD plate node exists. Check for a React render error above.', true);
  }
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
    window.__radmirHudReport?.('boot() called', false);
  } catch (e) {
    console.log('[RADMIR HUD] boot called');
  }

  if (hudBooted) {
    return;
  }

  if (!document.body) {
    // Cohtml may execute this before body exists or after DOMContentLoaded.
    // Observe the actual DOM creation event instead of guessing with a timeout.
    if (!documentObserver && typeof MutationObserver === 'function' && document.documentElement) {
      documentObserver = new MutationObserver(() => {
        if (document.body) {
          documentObserver?.disconnect();
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
  
  try {
    window.__radmirHudReport?.('installing RadmirBridge', false);
  } catch (e) {
    console.log('[RADMIR HUD] installing bridge');
  }
  
  installRadmirBridge();
  window.__radmirHudOnReady = onGameHudReady;
  
  try {
    window.__radmirHudReport?.('waiting for game HUD trigger', false);
  } catch (e) {
    console.log('[RADMIR HUD] waiting for trigger');
  }
  
  waitForGameHudTrigger();
}

try {
  window.__radmirHudReport?.('Bundle evaluated; waiting for the game Hud interface trigger.', false);
} catch (e) {
  console.log('[RADMIR HUD] Bundle evaluated');
}

boot();
