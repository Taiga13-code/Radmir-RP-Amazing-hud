import type { CSSProperties } from 'react';
import { clamp } from '../lib/numbers';

interface HealthBarProps {
  value: number;
}

const trackStyle: CSSProperties = {
  position: 'relative',
  height: '10px',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
};

export function HealthBar({ value }: HealthBarProps) {
  const width = `${clamp(value, 0, 100)}%`;

  return (
    <div style={trackStyle}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width,
          backgroundColor: 'rgba(255, 255, 255, 0.22)',
          transition: 'width 360ms ease-out',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width,
          backgroundImage: 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)',
          boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
          transition: 'none',
        }}
      />
    </div>
  );
}
