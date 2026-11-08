import type { HudPatch, HudState, RadarEntity, RadarState, ZoneDistance } from '../types';
import { asNumber, clamp } from './numbers';

const RADAR_TYPES = new Set(['player', 'enemy', 'ally', 'objective']);

function mergeZoneDistance(prev: ZoneDistance, patch: unknown): ZoneDistance {
  if (!patch || typeof patch !== 'object') {
    return prev;
  }

  const raw = patch as Record<string, unknown>;

  return {
    show: raw.show === undefined ? prev.show : Boolean(raw.show),
    distance:
      raw.distance === undefined
        ? prev.distance
        : Math.max(0, Math.floor(asNumber(raw.distance, prev.distance))),
  };
}

function sanitizeRadarEntities(value: unknown): RadarEntity[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const entities: RadarEntity[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const raw = item as Record<string, unknown>;
    const type = typeof raw.type === 'string' && RADAR_TYPES.has(raw.type) ? raw.type : 'objective';

    entities.push({
      id: raw.id === undefined ? `${type}-${entities.length}` : String(raw.id),
      x: asNumber(raw.x, 0),
      y: asNumber(raw.y, 0),
      type: type as RadarEntity['type'],
      label: raw.label === undefined ? undefined : String(raw.label),
      color: raw.color === undefined ? undefined : String(raw.color),
      opacity: raw.opacity === undefined ? undefined : clamp(asNumber(raw.opacity, 1), 0, 1),
      angle: raw.angle === undefined ? undefined : asNumber(raw.angle, 0),
    });

    if (entities.length >= 64) {
      break;
    }
  }

  return entities;
}

function mergeRadar(prev: RadarState | undefined, patch: unknown): RadarState | undefined {
  if (patch === undefined) {
    return prev;
  }

  if (!patch || typeof patch !== 'object') {
    return prev;
  }

  const raw = patch as Record<string, unknown>;
  const entities = sanitizeRadarEntities(raw.entities);

  return {
    entities: entities === null ? (prev ? prev.entities : []) : entities,
    rotation:
      raw.rotation === undefined
        ? prev
          ? prev.rotation
          : 0
        : asNumber(raw.rotation, prev ? prev.rotation : 0) % 360,
    x: raw.x === undefined ? (prev ? prev.x : 0) : asNumber(raw.x, prev ? prev.x : 0),
    y: raw.y === undefined ? (prev ? prev.y : 0) : asNumber(raw.y, prev ? prev.y : 0),
  };
}

export function mergeHud(prev: HudState, patch: HudPatch): HudState {
  const next: HudState = {
    money: patch.money === undefined ? prev.money : asNumber(patch.money, prev.money),
    weapon: patch.weapon === undefined ? prev.weapon : String(patch.weapon),
    weaponId:
      patch.weaponId === undefined
        ? prev.weaponId
        : Math.max(0, Math.floor(asNumber(patch.weaponId, prev.weaponId))),
    nickName: patch.nickName === undefined ? prev.nickName : String(patch.nickName),
    casePoints:
      patch.casePoints === undefined
        ? prev.casePoints
        : Math.max(0, Math.floor(asNumber(patch.casePoints, prev.casePoints))),
    serverId:
      patch.serverId === undefined
        ? prev.serverId
        : Math.max(0, Math.floor(asNumber(patch.serverId, prev.serverId))),
    ammoClip:
      patch.ammoClip === undefined
        ? prev.ammoClip
        : Math.max(0, Math.floor(asNumber(patch.ammoClip, prev.ammoClip))),
    ammoReserve:
      patch.ammoReserve === undefined
        ? prev.ammoReserve
        : Math.max(0, Math.floor(asNumber(patch.ammoReserve, prev.ammoReserve))),
    clipSize:
      patch.clipSize === undefined
        ? prev.clipSize
        : Math.max(1, Math.floor(asNumber(patch.clipSize, prev.clipSize))),
    hp: patch.hp === undefined ? prev.hp : clamp(asNumber(patch.hp, prev.hp), 0, 100),
    armor: patch.armor === undefined ? prev.armor : clamp(asNumber(patch.armor, prev.armor), 0, 100),
    hunger: patch.hunger === undefined ? prev.hunger : clamp(asNumber(patch.hunger, prev.hunger), 0, 100),
    breath: patch.breath === undefined ? prev.breath : clamp(asNumber(patch.breath, prev.breath), 0, 100),
    freeze: patch.freeze === undefined ? prev.freeze : clamp(asNumber(patch.freeze, prev.freeze), 0, 100),
    wanted: patch.wanted === undefined ? prev.wanted : clamp(Math.floor(asNumber(patch.wanted, prev.wanted)), 0, 6),
    online:
      patch.online === undefined
        ? prev.online
        : Math.max(0, Math.floor(asNumber(patch.online, prev.online))),
    id: patch.id === undefined ? prev.id : Math.max(0, Math.floor(asNumber(patch.id, prev.id))),
    fastHealCount:
      patch.fastHealCount === undefined
        ? prev.fastHealCount
        : Math.max(0, Math.floor(asNumber(patch.fastHealCount, prev.fastHealCount))),
    fastFoodCount:
      patch.fastFoodCount === undefined
        ? prev.fastFoodCount
        : Math.max(0, Math.floor(asNumber(patch.fastFoodCount, prev.fastFoodCount))),
    greenZone: patch.greenZone === undefined ? prev.greenZone : Boolean(patch.greenZone),
    fishingZone: patch.fishingZone === undefined ? prev.fishingZone : Boolean(patch.fishingZone),
    gps: patch.gps === undefined ? prev.gps : mergeZoneDistance(prev.gps, patch.gps),
    point: patch.point === undefined ? prev.point : mergeZoneDistance(prev.point, patch.point),
    capt: prev.capt,
    radar: prev.radar,
  };

  if (patch.capt) {
    const capt = patch.capt;
    next.capt = {
      visible: capt.visible === undefined ? prev.capt.visible : Boolean(capt.visible),
      timeLeft:
        capt.timeLeft === undefined
          ? prev.capt.timeLeft
          : Math.max(0, Math.floor(asNumber(capt.timeLeft, prev.capt.timeLeft))),
      territory:
        capt.territory === undefined
          ? prev.capt.territory
          : Math.max(0, Math.floor(asNumber(capt.territory, prev.capt.territory))),
      attackerName:
        capt.attackerName === undefined ? prev.capt.attackerName : String(capt.attackerName),
      attackerScore:
        capt.attackerScore === undefined
          ? prev.capt.attackerScore
          : Math.max(0, Math.floor(asNumber(capt.attackerScore, prev.capt.attackerScore))),
      attackerInZone:
        capt.attackerInZone === undefined
          ? prev.capt.attackerInZone
          : Math.max(0, Math.floor(asNumber(capt.attackerInZone, prev.capt.attackerInZone))),
      defenderName:
        capt.defenderName === undefined ? prev.capt.defenderName : String(capt.defenderName),
      defenderScore:
        capt.defenderScore === undefined
          ? prev.capt.defenderScore
          : Math.max(0, Math.floor(asNumber(capt.defenderScore, prev.capt.defenderScore))),
      defenderInZone:
        capt.defenderInZone === undefined
          ? prev.capt.defenderInZone
          : Math.max(0, Math.floor(asNumber(capt.defenderInZone, prev.capt.defenderInZone))),
    };
  }

  if (patch.radar !== undefined) {
    next.radar = mergeRadar(prev.radar, patch.radar);
  }

  if (next.ammoClip > next.clipSize) {
    next.clipSize = next.ammoClip;
  }

  return next;
}
