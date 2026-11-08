import type { CSSProperties } from 'react';
import { clamp } from '../lib/numbers';

interface HungerBarProps {
  value: number;
}

const trackStyle: CSSProperties = {
  position: 'relative',
  height: '10px',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
};

export function HungerBar({ value }: HungerBarProps) {
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
          backgroundImage: 'linear-gradient(90deg, #b45309 0%, #f59e0b 100%)',
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.55)',
          transition: 'width 360ms ease-out',
        }}
      />
    </div>
  );
}
