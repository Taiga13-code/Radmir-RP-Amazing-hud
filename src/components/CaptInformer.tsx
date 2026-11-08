import { Skull } from 'lucide-react';
import type { CSSProperties } from 'react';
import { formatTime } from '../lib/format';
import { useHud } from '../state/HudProvider';

const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pointerEvents: 'none',
};

const mainRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const teamStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '170px',
};

const scoreRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const scoreStyle: CSSProperties = {
  margin: '0 8px',
  color: '#ffffff',
  fontSize: '30px',
  fontWeight: 800,
  lineHeight: 1,
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.65)',
};

const labelStyle: CSSProperties = {
  marginTop: '2px',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 600,
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.65)',
};

const gangStyle: CSSProperties = {
  marginTop: '2px',
  maxWidth: '160px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontSize: '16px',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  textShadow: '0 2px 6px rgba(0, 0, 0, 0.65)',
};

const gangAllyStyle: CSSProperties = {
  ...gangStyle,
  color: '#8cc4ff',
};

const gangEnemyStyle: CSSProperties = {
  ...gangStyle,
  color: '#ff9a9a',
};

const centerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '220px',
};

const captionStyle: CSSProperties = {
  color: '#b8b8b8',
  fontSize: '18px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.7)',
};

const timerStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: '58px',
  fontWeight: 900,
  lineHeight: 1.05,
  letterSpacing: '0.01em',
  textShadow: '0 3px 10px rgba(0, 0, 0, 0.7)',
};

const urgentStyle: CSSProperties = {
  ...timerStyle,
  color: '#ffb74d',
};

const dividerStyle: CSSProperties = {
  width: '700px',
  height: '1.5px',
  marginTop: '6px',
  backgroundImage:
    'linear-gradient(90deg, rgba(245, 158, 11, 0) 0%, rgba(245, 158, 11, 0.85) 18%, rgba(245, 158, 11, 0.85) 82%, rgba(245, 158, 11, 0) 100%)',
};

function BlueShield() {
  return (
    <svg width="58" height="66" viewBox="0 0 58 66" style={{ transform: 'rotate(-6deg)', marginRight: '4px' }}>
      <defs>
        <linearGradient id="capt-shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#69b3ff" />
          <stop offset="55%" stopColor="#2f7cf6" />
          <stop offset="100%" stopColor="#1a4fd0" />
        </linearGradient>
      </defs>
      <path
        d="M29 2 L53 11 V33 C53 48 43 58 29 64 C15 58 5 48 5 33 V11 Z"
        fill="url(#capt-shield-grad)"
        stroke="#a9d0ff"
        strokeWidth="2"
      />
      <path d="M29 15 V48" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <path d="M19 27 H39" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function RedEmblem() {
  const rays = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    rays.push(
      <line
        key={index}
        x1={28 + Math.cos(angle) * 17}
        y1={28 + Math.sin(angle) * 17}
        x2={28 + Math.cos(angle) * 25}
        y2={28 + Math.sin(angle) * 25}
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />,
    );
  }

  return (
    <svg width="58" height="58" viewBox="0 0 56 56" style={{ marginLeft: '4px' }}>
      <circle cx="28" cy="28" r="26" fill="#e11d2a" />
      {rays}
      <circle cx="28" cy="25" r="9.5" fill="#ffffff" />
      <rect x="22.5" y="32" width="11" height="7" rx="1.5" fill="#ffffff" />
      <circle cx="24.5" cy="24.5" r="2.2" fill="#e11d2a" />
      <circle cx="31.5" cy="24.5" r="2.2" fill="#e11d2a" />
      <path d="M25 35.5 H31" stroke="#e11d2a" strokeWidth="1.6" />
    </svg>
  );
}

export function CaptInformer() {
  const { hud, shownTime } = useHud();
  const capt = hud.capt;

  if (!capt.visible) {
    return null;
  }

  const urgent = shownTime < 60;

  return (
    <div style={rootStyle}>
      <div style={mainRowStyle}>
        <BlueShield />

        <div style={teamStyle}>
          <div style={scoreRowStyle}>
            <span style={scoreStyle}>{capt.defenderScore}</span>
            <Skull size={18} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div style={labelStyle}>Защита</div>
          {capt.defenderName ? <div style={gangAllyStyle}>{capt.defenderName}</div> : null}
        </div>

        <div style={centerStyle}>
          <div style={captionStyle}>Оставшееся время</div>
          <div className={urgent ? 'capt-blink' : undefined} style={urgent ? urgentStyle : timerStyle}>
            {formatTime(shownTime)}
          </div>
        </div>

        <div style={teamStyle}>
          <div style={scoreRowStyle}>
            <Skull size={18} color="#ffffff" strokeWidth={2.2} />
            <span style={scoreStyle}>{capt.attackerScore}</span>
          </div>
          <div style={labelStyle}>Атака</div>
          {capt.attackerName ? <div style={gangEnemyStyle}>{capt.attackerName}</div> : null}
        </div>

        <RedEmblem />
      </div>

      <div style={dividerStyle} />
    </div>
  );
}
