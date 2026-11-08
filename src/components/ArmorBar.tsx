import type { CSSProperties } from 'react';
import { clamp } from '../lib/numbers';

interface ArmorBarProps {
  value: number;
}

const trackStyle: CSSProperties = {
  position: 'relative',
  height: '10px',
  width: '100%',
  overflow: 'hidden',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
};

export function ArmorBar({ value }: ArmorBarProps) {
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
          backgroundImage: 'linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.55)',
        }}
      />
    </div>
  );
}
