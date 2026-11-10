import { useEffect, useState } from 'react';

export interface ViewportMetrics {
  width: number;
  height: number;
  scale: number;
  safe: number;
}

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

// Interior transitions resize the game UI view in bursts and may report
// transitional sizes (or skip the final resize event entirely). Committing
// every event made the HUD jump around ("убегает") inside interiors, so
// measurements are debounced and re-taken at commit time, with a slow poll
// as a self-healing fallback.
const COMMIT_DELAY_MS = 250;
const POLL_INTERVAL_MS = 1000;

function measure(): ViewportMetrics {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  const aspect = width / Math.max(height, 1);

  let safe = Math.round(Math.min(width, height) * 0.02);

  if (aspect < 1.45) {
    safe = Math.round(Math.min(width, height) * 0.034);
  } else if (aspect > 2.15) {
    safe = Math.round(height * 0.03);
  }

  safe = Math.max(12, Math.min(safe, 56));

  return { width, height, scale, safe };
}

function sameSize(a: ViewportMetrics, b: ViewportMetrics): boolean {
  return a.width === b.width && a.height === b.height;
}

export function useViewportScale(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() => measure());

  useEffect(() => {
    let commitTimer: number | undefined;
    let pollTimer: number | undefined;

    const commit = () => {
      const fresh = measure();
      setMetrics((prev) => (sameSize(prev, fresh) ? prev : fresh));
    };

    const scheduleCommit = () => {
      if (commitTimer !== undefined) {
        window.clearTimeout(commitTimer);
      }
      commitTimer = window.setTimeout(commit, COMMIT_DELAY_MS);
    };

    // Some view resizes (e.g. interior enter/exit) never fire a resize
    // event, so re-check the real size periodically.
    pollTimer = window.setInterval(scheduleCommit, POLL_INTERVAL_MS);

    scheduleCommit();
    window.addEventListener('resize', scheduleCommit);
    window.visualViewport?.addEventListener('resize', scheduleCommit);

    return () => {
      if (commitTimer !== undefined) {
        window.clearTimeout(commitTimer);
      }
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
      }
      window.removeEventListener('resize', scheduleCommit);
      window.visualViewport?.removeEventListener('resize', scheduleCommit);
    };
  }, []);

  return metrics;
}
