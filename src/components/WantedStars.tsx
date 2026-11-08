import type { CSSProperties } from 'react';
import { clamp } from '../lib/numbers';

interface WantedStarsProps {
  value: number;
}

const MAX_STARS = 6;

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const starStyle: CSSProperties = {
  width: '14px',
  height: '14px',
  marginLeft: '2px',
};

const activeColor = '#fbbf24';
const activeGlow = 'rgba(251, 191, 36, 0.9)';
const inactiveColor = 'rgba(255, 255, 255, 0.22)';

function Star({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={starStyle}>
      <path
        d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.57l-5.9 3.11 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z"
        fill={active ? activeColor : inactiveColor}
        style={active ? { filter: `drop-shadow(0 0 3px ${activeGlow})` } : undefined}
      />
    </svg>
  );
}

export function WantedStars({ value }: WantedStarsProps) {
  const stars = clamp(Math.floor(value), 0, MAX_STARS);

  if (stars <= 0) {
    return null;
  }

  return (
    <div style={rowStyle}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <Star key={index} active={index < stars} />
      ))}
    </div>
  );
}
