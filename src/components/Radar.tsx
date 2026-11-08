import { MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { RadarEntity } from '../types';
import { useHud } from '../state/HudProvider';

const SIZE = 256;
const INSET = 5;
const WINDOW = SIZE - INSET * 2;

const MAP_WORLD_SIZE = 12000;
const MAP_PIXEL_SIZE = 6144;
const MAP_PX_PER_WORLD = MAP_PIXEL_SIZE / MAP_WORLD_SIZE;
const TILE_SIZE = 256;
const TILE_COUNT = MAP_PIXEL_SIZE / TILE_SIZE;
const TILE_HALF = TILE_COUNT / 2;
const TILE_AROUND = 2;

// One 256px map tile fills the radar window, matching the in-game minimap.
const MAP_SCALE = WINDOW / TILE_SIZE;
const RANGE = WINDOW / 2 / MAP_SCALE / MAP_PX_PER_WORLD;

const markerColor: Record<RadarEntity['type'], string> = {
  player: '#ffffff',
  ally: '#4d9dff',
  enemy: '#ff3b47',
  objective: '#f59e0b',
};

const markerGlow: Record<RadarEntity['type'], string> = {
  player: 'rgba(255, 255, 255, 0.9)',
  ally: 'rgba(77, 157, 255, 0.9)',
  enemy: 'rgba(255, 59, 71, 0.9)',
  objective: 'rgba(245, 158, 11, 0.9)',
};

const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const frameStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow:
    '0 0 0 3px rgba(18, 19, 23, 0.9), 0 0 0 4px rgba(255, 255, 255, 0.12), 0 10px 26px rgba(0, 0, 0, 0.55)',
  backgroundColor: '#0a0c0f',
};

const radarWrapStyle: CSSProperties = {
  position: 'relative',
  width: `${SIZE}px`,
  height: `${SIZE}px`,
};

const windowStyle: CSSProperties = {
  position: 'absolute',
  top: `${INSET}px`,
  right: `${INSET}px`,
  bottom: `${INSET}px`,
  left: `${INSET}px`,
  overflow: 'hidden',
  borderRadius: '12px',
  backgroundColor: '#0a0c0f',
};

const rotateStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  transformOrigin: '50% 50%',
};

const mapLayerStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: 0,
  height: 0,
  transformOrigin: '0 0',
};

const tintStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundImage:
    'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 62%, rgba(0, 0, 0, 0.35) 100%)',
};

const playerMarkerStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  marginLeft: '-14px',
  marginTop: '-14px',
  borderRadius: '50%',
  backgroundColor: '#f4e13c',
  border: '2px solid #ffffff',
  boxShadow: '0 0 10px rgba(244, 225, 60, 0.85)',
};

const barStyle: CSSProperties = {
  position: 'absolute',
  left: `calc(100% + 6px)`,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  height: '32px',
  padding: '0 14px',
  borderRadius: '8px',
  backgroundColor: 'rgba(20, 21, 25, 0.82)',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
};

const barLocationStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700,
};

const barWeaponStyle: CSSProperties = {
  marginLeft: '10px',
  color: '#f2c531',
  fontSize: '15px',
  fontWeight: 700,
};

const addressStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '8px',
  paddingLeft: '2px',
};

const addressTextStyle: CSSProperties = {
  marginLeft: '7px',
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.15,
};

const addressPrimaryStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700,
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
};

const addressSecondaryStyle: CSSProperties = {
  color: '#9aa0a8',
  fontSize: '13px',
  fontWeight: 600,
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
};

interface Tile {
  key: string;
  left: number;
  top: number;
  url: string;
}

function buildTiles(playerX: number, playerY: number): Tile[] {
  const baseX = Math.floor((playerX * MAP_PX_PER_WORLD) / TILE_SIZE);
  const baseY = Math.floor((-playerY * MAP_PX_PER_WORLD) / TILE_SIZE);
  const tiles: Tile[] = [];

  for (let dx = -TILE_AROUND; dx <= TILE_AROUND; dx += 1) {
    for (let dy = -TILE_AROUND; dy <= TILE_AROUND; dy += 1) {
      const tx = baseX + dx;
      const ty = baseY + dy;
      const imageX = TILE_HALF + tx;
      const imageY = TILE_HALF + ty;

      if (imageX < 0 || imageX >= TILE_COUNT || imageY < 0 || imageY >= TILE_COUNT) {
        continue;
      }

      tiles.push({
        key: `${imageX}_${imageY}`,
        left: tx * TILE_SIZE,
        top: ty * TILE_SIZE,
        url: `images/hud/map/${imageX}_${imageY}.png`,
      });
    }
  }

  return tiles;
}

function markerStyle(entity: RadarEntity): CSSProperties {
  const distance = Math.sqrt(entity.x * entity.x + entity.y * entity.y);
  const factor = distance > RANGE ? RANGE / distance : 1;
  const left = 50 + (entity.x * factor * 50) / RANGE;
  const top = 50 - (entity.y * factor * 50) / RANGE;
  const clamped = distance > RANGE;
  const color = entity.color ?? markerColor[entity.type];
  const glow = entity.color ?? markerGlow[entity.type];
  const opacity = (entity.opacity ?? 1) * (clamped ? 0.5 : 1);

  if (entity.type === 'objective') {
    return {
      position: 'absolute',
      left: `${left}%`,
      top: `${top}%`,
      width: '11px',
      height: '11px',
      marginLeft: '-5.5px',
      marginTop: '-5.5px',
      borderRadius: '3px',
      backgroundColor: color,
      border: '1.5px solid rgba(255, 255, 255, 0.9)',
      boxShadow: `0 0 8px ${glow}`,
      opacity,
    };
  }

  // Nearby players: a nickname-coloured dot with a bright outline.
  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: '13px',
    height: '13px',
    marginLeft: '-6.5px',
    marginTop: '-6.5px',
    borderRadius: '50%',
    backgroundColor: color,
    border: '1.5px solid rgba(255, 255, 255, 0.92)',
    boxShadow: `0 0 8px ${glow}, 0 0 0 1px rgba(0, 0, 0, 0.45)`,
    opacity,
  };
}

function locationLabel(
  visible: boolean,
  territory: number,
  greenZone: boolean,
  fishingZone: boolean,
): string {
  if (visible && territory > 0) {
    return `Территория #${territory}`;
  }

  if (greenZone) {
    return 'Безопасная зона';
  }

  if (fishingZone) {
    return 'Зона для рыбалки';
  }

  return 'RADMIR';
}

export function Radar() {
  const { hud } = useHud();
  const radar = hud.radar;
  const rotation = radar ? radar.rotation : 0;
  const playerX = radar ? radar.x : 0;
  const playerY = radar ? radar.y : 0;
  const entities = radar ? radar.entities : [];
  const tiles = buildTiles(playerX, playerY);

  return (
    <div style={rootStyle}>
      <div style={radarWrapStyle}>
        <div style={frameStyle}>
          <div style={windowStyle}>
          <div style={{ ...rotateStyle, transform: `rotate(${-rotation}deg)` }}>
            <div
              style={{
                ...mapLayerStyle,
                filter: 'saturate(1.55) brightness(1.32) contrast(1.02)',
                transform: `scale(${MAP_SCALE}) translate(${-playerX * MAP_PX_PER_WORLD}px, ${
                  playerY * MAP_PX_PER_WORLD
                }px)`,
              }}
            >
              {tiles.map((tile) => (
                <div
                  key={tile.key}
                  style={{
                    position: 'absolute',
                    left: `${tile.left}px`,
                    top: `${tile.top}px`,
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                    backgroundImage: `url('${tile.url}')`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              ))}
            </div>

            {entities.map((entity) => (
              <div key={entity.id} style={markerStyle(entity)} />
            ))}
          </div>

          <div style={tintStyle} />

          <div style={playerMarkerStyle}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M6 1 L10 10 L6 8 L2 10 Z" fill="#111111" />
            </svg>
          </div>
        </div>
      </div>

      <div style={barStyle}>
        <span style={barLocationStyle}>
          {locationLabel(hud.capt.visible, hud.capt.territory, hud.greenZone, hud.fishingZone)}
        </span>
        <span style={barWeaponStyle}>{hud.weapon}</span>
      </div>
    </div>

    <div style={addressStyle}>
        <MapPin size={16} color="#ffffff" strokeWidth={2.4} />
        <div style={addressTextStyle}>
          <span style={addressPrimaryStyle}>Сервер {hud.serverId}</span>
          <span style={addressSecondaryStyle}>
            {hud.online > 1 ? `Онлайн ${hud.online}` : 'RADMIR CRMP'}
          </span>
        </div>
      </div>
    </div>
  );
}
