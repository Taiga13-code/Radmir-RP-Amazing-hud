import { Hand, Heart, Shield, Snowflake, UtensilsCrossed } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { formatClock, formatDate, formatNumber } from '../lib/format';
import { useHud } from '../state/HudProvider';
import { BreathMeter } from './BreathMeter';
import { WantedStars } from './WantedStars';

const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  paddingTop: '2px',
  paddingRight: '6px',
  pointerEvents: 'none',
};

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '6px',
};

const pillStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '36px',
  marginLeft: '8px',
  padding: '0 12px',
  borderRadius: '12px',
  backgroundColor: 'rgba(36, 37, 41, 0.72)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const clockStyle: CSSProperties = {
  fontWeight: 800,
};

const dateStyle: CSSProperties = {
  marginLeft: '8px',
  color: '#c9ccd2',
  fontWeight: 600,
};

const separatorStyle: CSSProperties = {
  margin: '0 8px',
  color: '#8a8e96',
};

const nameStyle: CSSProperties = {
  maxWidth: '220px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontWeight: 700,
};

const idBadgeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '32px',
  height: '20px',
  marginLeft: '8px',
  padding: '0 7px',
  borderRadius: '6px',
  backgroundColor: '#f2c531',
  color: '#181818',
  fontSize: '15px',
  fontWeight: 800,
};

const logoWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  marginTop: '2px',
  marginBottom: '4px',
};

const logoMainStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: '46px',
  fontWeight: 900,
  fontStyle: 'italic',
  lineHeight: 0.92,
  letterSpacing: '-0.02em',
  textShadow: '0 3px 8px rgba(0, 0, 0, 0.45)',
  transform: 'skewX(-6deg)',
};

const logoSubStyle: CSSProperties = {
  marginTop: '2px',
  color: '#2f6bff',
  fontSize: '15px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
};

const bodyStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  marginTop: '10px',
};

const leftColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginRight: '14px',
};

const weaponImageStyle: CSSProperties = {
  width: '142px',
  height: '126px',
  objectFit: 'contain',
  transform: 'rotate(-20deg) translateY(-6px)',
  filter: 'brightness(1.18) contrast(1.06) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.55))',
};

const fistStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '142px',
  height: '126px',
  filter: 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.55))',
};

const ammoPillStyle: CSSProperties = {
  ...pillStyle,
  marginLeft: 0,
  height: '38px',
  fontSize: '19px',
};

const rightColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
};

const rightPillStyle: CSSProperties = {
  ...pillStyle,
  marginLeft: 0,
  height: '38px',
  marginTop: '7px',
  fontSize: '19px',
};

const wantedStyle: CSSProperties = {
  ...rightPillStyle,
  marginTop: 0,
};

const wantedIconWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  marginLeft: '10px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
};

const hpPillStyle: CSSProperties = {
  ...rightPillStyle,
  minWidth: '190px',
};

const hungerPillStyle: CSSProperties = {
  ...rightPillStyle,
  height: '32px',
  fontSize: '16px',
};

const hpValueStyle: CSSProperties = {
  minWidth: '42px',
  fontSize: '22px',
  fontWeight: 800,
};

const hpTrackStyle: CSSProperties = {
  position: 'relative',
  flexGrow: 1,
  height: '6px',
  margin: '0 12px',
  borderRadius: '9999px',
  backgroundColor: 'rgba(255, 255, 255, 0.14)',
  overflow: 'hidden',
};

const hpFillStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  borderRadius: '9999px',
  backgroundImage: 'linear-gradient(90deg, #ff4d5e 0%, #e11d3a 100%)',
  boxShadow: '0 0 10px rgba(225, 29, 58, 0.75)',
  transition: 'width 260ms ease-out',
};

const moneyIconStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  marginLeft: '10px',
  borderRadius: '6px',
  backgroundColor: '#22c55e',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 800,
};

const statusRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginTop: '10px',
};

const freezePillStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '32px',
  marginLeft: '12px',
  padding: '0 12px',
  borderRadius: '10px',
  backgroundColor: 'rgba(24, 52, 74, 0.78)',
  color: '#e0f2fe',
  fontSize: '16px',
  fontWeight: 700,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
};

const freezeValueStyle: CSSProperties = {
  marginLeft: '6px',
};

export function GameHud() {
  const { hud } = useHud();
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hp = Math.max(0, Math.min(100, hud.hp));

  return (
    <div style={rootStyle}>
      <div style={topRowStyle}>
        <div style={pillStyle}>
          <span style={clockStyle}>{formatClock(clock)}</span>
          <span style={separatorStyle}>·</span>
          <span style={dateStyle}>{formatDate(clock)}</span>
        </div>
        <div style={pillStyle}>
          <span style={nameStyle}>{hud.nickName || 'Игрок'}</span>
          {hud.id > 0 ? <span style={idBadgeStyle}>{hud.id}</span> : null}
        </div>
      </div>

      <div style={logoWrapStyle}>
        <span style={logoMainStyle}>RADMIR</span>
        <span style={logoSubStyle}>Сервер {hud.serverId}</span>
      </div>

      <div style={bodyStyle}>
        <div style={leftColStyle}>
          {hud.weaponId > 0 ? (
            <img
              src={`images/hud/${hud.weaponId}.png`}
              alt=""
              style={weaponImageStyle}
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
              }}
            />
          ) : (
            <div style={fistStyle}>
              <Hand size={66} color="#e2e8f0" strokeWidth={1.6} />
            </div>
          )}
          <div style={ammoPillStyle}>
            <span>
              {hud.ammoClip}/{hud.ammoReserve}
            </span>
          </div>
        </div>

        <div style={rightColStyle}>
          <div style={wantedStyle}>
            <span>{Math.round(hud.armor)}</span>
            <span style={wantedIconWrapStyle}>
              <Shield size={14} color="#2a2a2e" strokeWidth={2.6} />
            </span>
          </div>

          <div style={hpPillStyle}>
            <span style={hpValueStyle}>{Math.round(hud.hp)}</span>
            <div style={hpTrackStyle}>
              <div style={{ ...hpFillStyle, width: `${hp}%` }} />
            </div>
            <Heart size={22} fill="#e8354a" color="#ff7787" strokeWidth={1.4} />
          </div>

          <div style={hungerPillStyle}>
            <span>{Math.round(hud.hunger)}</span>
            <UtensilsCrossed size={15} color="#f59e0b" strokeWidth={2.4} style={{ marginLeft: '8px' }} />
          </div>

          <div style={rightPillStyle}>
            <span>{formatNumber(hud.money)}</span>
            <span style={moneyIconStyle}>₽</span>
          </div>
        </div>
      </div>

      {hud.wanted > 0 || hud.freeze > 0 || hud.breath < 99 ? (
        <div style={statusRowStyle}>
          {hud.wanted > 0 ? <WantedStars value={hud.wanted} /> : null}
          {hud.freeze > 0 ? (
            <div style={freezePillStyle}>
              <Snowflake size={15} color="#7dd3fc" strokeWidth={2.4} />
              <span style={freezeValueStyle}>{Math.round(hud.freeze)}</span>
            </div>
          ) : null}
          {hud.breath < 99 ? <BreathMeter value={hud.breath} /> : null}
        </div>
      ) : null}
    </div>
  );
}
