import { useEffect, useState } from 'react';

export interface ViewportMetrics {
  width: number;
  height: number;
  scale: number;
  safe: number;
}

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

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

export function useViewportScale(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() => measure());

  useEffect(() => {
    const update = () => {
      setMetrics(measure());
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return metrics;
}
