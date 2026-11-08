import type { ReactNode } from 'react';

interface ScaledAnchorProps {
  origin: 'top right' | 'top center' | 'bottom left' | 'bottom center';
  scale: number;
  safe: number;
  children: ReactNode;
}

export function ScaledAnchor({ origin, scale, safe, children }: ScaledAnchorProps) {
  if (origin === 'top right') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 20,
          pointerEvents: 'none',
          paddingTop: `${safe}px`,
          paddingRight: `${safe}px`,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top right',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (origin === 'bottom left') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          zIndex: 20,
          pointerEvents: 'none',
          paddingBottom: `${safe}px`,
          paddingLeft: `${safe}px`,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'bottom left',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (origin === 'bottom center') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          zIndex: 20,
          pointerEvents: 'none',
          paddingBottom: `${safe}px`,
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'bottom center',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        zIndex: 20,
        pointerEvents: 'none',
        paddingTop: `${safe}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
