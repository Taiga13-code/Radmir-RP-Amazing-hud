import type { CSSProperties, ReactNode } from 'react';

type Accent = 'red' | 'green' | 'blue' | 'orange';

interface SkewPlateProps {
  children: ReactNode;
  className?: string;
  accent?: Accent;
  style?: CSSProperties;
}

const plateStyle: CSSProperties = {
  backgroundColor: 'rgba(16, 18, 22, 0.9)',
  backgroundImage:
    'linear-gradient(155deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0) 46%, rgba(255, 255, 255, 0.035) 100%)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: '3px',
  boxShadow:
    '0 0 0 1px rgba(0, 0, 0, 0.4), 0 6px 20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  transform: 'skewX(-12deg)',
  position: 'relative',
  overflow: 'hidden',
  pointerEvents: 'none',
};

const sheenStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  pointerEvents: 'none',
  backgroundImage:
    'linear-gradient(115deg, transparent 42%, rgba(255, 255, 255, 0.055) 50%, transparent 58%)',
};

const innerStyle: CSSProperties = {
  transform: 'skewX(12deg)',
  position: 'relative',
  zIndex: 10,
};

const accentStyles: Record<Accent, CSSProperties> = {
  red: {
    backgroundColor: '#ef4444',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.55)',
  },
  green: {
    backgroundColor: '#22c55e',
    boxShadow: '0 0 10px rgba(34, 197, 94, 0.55)',
  },
  blue: {
    backgroundColor: '#3b82f6',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.55)',
  },
  orange: {
    backgroundColor: '#f59e0b',
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.55)',
  },
};

export function SkewPlate({ children, className = '', accent, style }: SkewPlateProps) {
  return (
    <div className={`cohtml-plate ${className}`} style={{ ...plateStyle, ...style }}>
      <div style={sheenStyle} />
      <div style={innerStyle}>
        {accent ? (
          <span
            style={{
              position: 'absolute',
              bottom: '6px',
              top: '6px',
              left: 0,
              width: '3px',
              ...accentStyles[accent],
            }}
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
