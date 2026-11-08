import { Wind } from 'lucide-react';
import type { CSSProperties } from 'react';
import { clamp } from '../lib/numbers';

interface BreathMeterProps {
  value: number;
}

const SIZE = 54;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const rootStyle: CSSProperties = {
  position: 'relative',
  width: `${SIZE}px`,
  height: `${SIZE}px`,
};

const labelStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function BreathMeter({ value }: BreathMeterProps) {
  const pct = clamp(value, 0, 100);
  const dash = (pct / 100) * CIRCUMFERENCE;
  const urgent = pct < 30;

  return (
    <div style={rootStyle} title="Дыхание">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="rgba(16, 18, 22, 0.88)"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={urgent ? '#f87171' : '#38bdf8'}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            filter: `drop-shadow(0 0 5px ${urgent ? 'rgba(248, 113, 113, 0.8)' : 'rgba(56, 189, 248, 0.8)'})`,
            transition: 'stroke-dasharray 240ms linear',
          }}
        />
      </svg>
      <div style={labelStyle}>
        <Wind size={20} color="#e2e8f0" strokeWidth={2.2} />
      </div>
    </div>
  );
}
