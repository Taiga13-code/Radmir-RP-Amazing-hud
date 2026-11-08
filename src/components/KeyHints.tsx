import type { CSSProperties } from 'react';
import { useViewportScale } from '../hooks/useViewportScale';
import { useHud } from '../state/HudProvider';

const hintContainerStyle: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  zIndex: 20,
  maxWidth: '460px',
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  pointerEvents: 'none',
};

const hintPanelStyle: CSSProperties = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.14)',
  padding: '8px 12px',
};

const hintTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 600,
};

export function KeyHints() {
  const { preview } = useHud();
  const { width, height, scale, safe } = useViewportScale();

  if (!preview) {
    return null;
  }

  return (
    <div
      style={{
        ...hintContainerStyle,
        left: `${safe + Math.round(212 * scale)}px`,
        paddingLeft: '8px',
        paddingBottom: `${safe}px`,
      }}
    >
      <div className="cohtml-plate" style={hintPanelStyle}>
        <div style={hintTitleStyle}>
          {width}×{height} · scale {scale.toFixed(3)}
        </div>
        <div>Пробел — урон −25 HP (на 0% следующее нажатие лечит до 100)</div>
        <div>T — поменять счёт сторон местами</div>
        <div>R — выстрел, на пустой обойме перезарядка</div>
        <div>H — голод −20 · B — дыхание · W — звёзды розыска</div>
        <div>Z — безопасная зона · F — зона рыбалки</div>
      </div>
    </div>
  );
}
