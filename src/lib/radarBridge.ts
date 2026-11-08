import type { RadarEntity, RadarState } from '../types';

const MAX_ENTITIES = 64;

interface EngineLike {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface StoreLike {
  $store?: {
    getters?: Record<string, unknown>;
  };
}

interface StorePosition {
  x: number;
  y: number;
  angle: number;
}

type RadarListener = (radar: RadarState) => void;

function toNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function classify(r: number, g: number, b: number): RadarEntity['type'] {
  if (r > 165 && g < 150 && b < 150) {
    return 'enemy';
  }
  if (g > 150 && r < 170) {
    return 'ally';
  }
  return 'objective';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePlayers(raw: unknown, playerX: number, playerY: number): RadarEntity[] {
  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (isRecord(parsed) && Array.isArray(parsed.players)) {
    parsed = parsed.players;
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const entities: RadarEntity[] = [];

  parsed.forEach((entry, index) => {
    let x: number;
    let y: number;
    let angle = 0;
    let r = 120;
    let g = 220;
    let b = 255;
    let alpha = 1;

    if (Array.isArray(entry) && entry.length >= 2) {
      x = toNumber(entry[0]);
      y = toNumber(entry[1]);
      angle = toNumber(entry[2]);
      r = toNumber(entry[3], 120);
      g = toNumber(entry[4], 220);
      b = toNumber(entry[5], 255);
      alpha = Math.min(1, Math.max(0, toNumber(entry[6], 255) / 255));
    } else if (isRecord(entry)) {
      x = toNumber(entry.x);
      y = toNumber(entry.y);
      angle = toNumber(entry.angle);
      r = toNumber(entry.r ?? entry.red, 120);
      g = toNumber(entry.g ?? entry.green, 220);
      b = toNumber(entry.b ?? entry.blue, 255);
      alpha = Math.min(1, Math.max(0, toNumber(entry.opacity ?? entry.a, 1)));
    } else {
      return;
    }

    entities.push({
      id: `p${index}`,
      x: x - playerX,
      y: y - playerY,
      angle,
      type: classify(r, g, b),
      color: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
      opacity: Math.max(0.45, alpha),
    });
  });

  return entities;
}

function readEngine(): EngineLike | null {
  const engine = (window as unknown as { engine?: EngineLike }).engine;
  if (!engine || typeof engine.on !== 'function') {
    return null;
  }
  return engine;
}

function readStorePosition(): StorePosition | null {
  const app = (window as unknown as { App?: StoreLike }).App;
  const getters = app?.$store?.getters;

  if (!getters) {
    return null;
  }

  try {
    const position = getters['player/position'];
    if (position && typeof position === 'object') {
      const record = position as Record<string, unknown>;
      const x = Number(record.x);
      const y = Number(record.y);
      const angle = Number(record.angle);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return { x, y, angle: Number.isFinite(angle) ? angle : 0 };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function attachRadarBridge(listener: RadarListener): () => void {
  let disposed = false;
  let engine: EngineLike | null = null;
  let pollId: number | null = null;
  let positionPollId: number | null = null;
  let lastPublishedKey = '';

  let hasEnginePosition = false;
  let rotation = 0;
  let engineX = 0;
  let engineY = 0;
  let rawPlayers: unknown = '';
  const markers = new Map<string, RadarEntity>();

  const publish = () => {
    if (disposed) {
      return;
    }

    const storePosition = readStorePosition();
    const playerX = hasEnginePosition ? engineX : storePosition ? storePosition.x : 0;
    const playerY = hasEnginePosition ? engineY : storePosition ? storePosition.y : 0;

    // The store angle is the player's heading in degrees; using it keeps the map
    // heading-up even when the engine does not emit a camera rotation.
    const nextRotation =
      storePosition && Number.isFinite(storePosition.angle) && storePosition.angle !== 0
        ? storePosition.angle
        : rotation;

    const players = parsePlayers(rawPlayers, playerX, playerY);

    // UpdateRadar delivers absolute world coordinates for both nearby players
    // and static radar objects. The React radar draws everything relative to the
    // player, so convert markers here (players are converted in parsePlayers).
    const relativeMarkers = [...markers.values()].map((marker) => ({
      ...marker,
      x: marker.x - playerX,
      y: marker.y - playerY,
    }));
    const entities = [...players, ...relativeMarkers].slice(0, MAX_ENTITIES);
    const radar: RadarState = { rotation: nextRotation, x: playerX, y: playerY, entities };

    const key =
      `${Math.round(playerX)}|${Math.round(playerY)}|${Math.round(nextRotation)}|` +
      entities.map((entity) => `${Math.round(entity.x)},${Math.round(entity.y)}`).join(';');
    if (key === lastPublishedKey) {
      return;
    }

    lastPublishedKey = key;
    listener(radar);
  };

  const handleUpdate = (...args: unknown[]) => {
    hasEnginePosition = true;
    engineX = toNumber(args[0], engineX);
    engineY = toNumber(args[1], engineY);
    rotation = toNumber(args[3], rotation);
    rawPlayers = args[5];
    publish();
  };

  const handleCreate = (...args: unknown[]) => {
    const name = args[0];
    if (name === undefined || name === null) {
      return;
    }

    const id = String(name);
    const icon = typeof args[3] === 'string' ? args[3] : '';

    markers.set(id, {
      id: `m-${id}`,
      x: toNumber(args[1]),
      y: toNumber(args[2]),
      type: 'objective',
      label: icon.replace(/^.*\//, '').replace(/\.png$/i, ''),
      color: '#f59e0b',
      opacity: 1,
    });

    publish();
  };

  const handleRemove = (...args: unknown[]) => {
    const name = args[0];
    if (name === undefined || name === null) {
      return;
    }

    markers.delete(String(name));
    publish();
  };

  const attach = (): boolean => {
    const found = readEngine();
    if (!found) {
      return false;
    }

    engine = found;
    engine.on('UpdateRadar', handleUpdate);
    engine.on('CreateRadarObject', handleCreate);
    engine.on('RemoveRadarObject', handleRemove);
    return true;
  };

  if (!attach()) {
    pollId = window.setInterval(() => {
      if (attach() && pollId !== null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    }, 500);
  }

  // Keep the heading and the store position fresh even without engine events.
  positionPollId = window.setInterval(publish, 200);

  publish();

  return () => {
    disposed = true;

    if (pollId !== null) {
      window.clearInterval(pollId);
      pollId = null;
    }

    if (positionPollId !== null) {
      window.clearInterval(positionPollId);
      positionPollId = null;
    }

    if (engine && typeof engine.off === 'function') {
      engine.off('UpdateRadar', handleUpdate);
      engine.off('CreateRadarObject', handleCreate);
      engine.off('RemoveRadarObject', handleRemove);
    }
  };
}
