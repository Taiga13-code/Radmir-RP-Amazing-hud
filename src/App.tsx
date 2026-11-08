import type { CSSProperties } from 'react';
import { CaptInformer } from './components/CaptInformer';
import { GameHud } from './components/GameHud';
import { KeyHints } from './components/KeyHints';
import { ScaledAnchor } from './components/ScaledAnchor';
import { useViewportScale } from './hooks/useViewportScale';
import { useHud } from './state/HudProvider';

const appStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  overflow: 'hidden',
  color: '#ffffff',
  pointerEvents: 'none',
};

const previewBackdropStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundImage:
    'radial-gradient(circle at 18% 12%, rgba(60, 70, 90, 0.35), transparent 34%), radial-gradient(circle at 82% 0%, rgba(30, 41, 59, 0.4), transparent 30%), linear-gradient(180deg, #171a1f 0%, #0a0b0d 70%)',
};

export function App() {
  const { scale, safe } = useViewportScale();
  const { preview } = useHud();
  const hudSafe = Math.max(4, Math.round(safe * 0.35));

  return (
    <div style={appStyle}>
      {preview ? <div style={previewBackdropStyle} /> : null}

      {/* Readiness marker: the ASI bridge hides the stock HUD only when a
          committed .cohtml-plate exists inside the custom root. */}
      <div
        className="cohtml-plate"
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '2px',
          height: '2px',
          opacity: 0.01,
          pointerEvents: 'none',
        }}
      />

      <ScaledAnchor origin="top right" scale={scale} safe={hudSafe}>
        <GameHud />
      </ScaledAnchor>

      <ScaledAnchor origin="bottom center" scale={scale} safe={safe}>
        <CaptInformer />
      </ScaledAnchor>

      <KeyHints />
    </div>
  );
}
