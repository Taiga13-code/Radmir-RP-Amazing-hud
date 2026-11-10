export interface CaptState {
  visible: boolean;
  timeLeft: number;
  territory: number;
  attackerName: string;
  attackerScore: number;
  attackerInZone: number;
  defenderName: string;
  defenderScore: number;
  defenderInZone: number;
}

export interface RadarEntity {
  id: string;
  x: number;
  y: number;
  type: 'player' | 'enemy' | 'ally' | 'objective';
  label?: string;
  color?: string;
  opacity?: number;
  angle?: number;
}

export interface RadarState {
  entities: RadarEntity[];
  rotation: number;
  x: number;
  y: number;
}

export interface ZoneDistance {
  show: boolean;
  distance: number;
}

export interface HudState {
  money: number;
  weapon: string;
  weaponId: number;
  nickName: string;
  casePoints: number;
  serverId: number;
  ammoClip: number;
  ammoReserve: number;
  clipSize: number;
  hp: number;
  armor: number;
  hunger: number;
  breath: number;
  freeze: number;
  wanted: number;
  online: number;
  id: number;
  fastHealCount: number;
  fastFoodCount: number;
  greenZone: boolean;
  fishingZone: boolean;
  gps: ZoneDistance;
  point: ZoneDistance;
  capt: CaptState;
  radar?: RadarState;
  /** Полноэкранное меню открыто — HUD скрыт. */
  hidden: boolean;
}

export interface CaptPatch {
  visible?: boolean;
  timeLeft?: number;
  territory?: number;
  attackerName?: string;
  attackerScore?: number;
  attackerInZone?: number;
  defenderName?: string;
  defenderScore?: number;
  defenderInZone?: number;
}

export interface HudPatch {
  money?: number;
  weapon?: string;
  weaponId?: number;
  nickName?: string;
  casePoints?: number;
  serverId?: number;
  ammoClip?: number;
  ammoReserve?: number;
  clipSize?: number;
  hp?: number;
  armor?: number;
  hunger?: number;
  breath?: number;
  freeze?: number;
  wanted?: number;
  online?: number;
  id?: number;
  fastHealCount?: number;
  fastFoodCount?: number;
  greenZone?: boolean;
  fishingZone?: boolean;
  gps?: ZoneDistance;
  point?: ZoneDistance;
  capt?: CaptPatch;
  radar?: RadarState;
  /** true — скрыть HUD (полноэкранное меню), false — показать. */
  hidden?: boolean;
}

export const INITIAL_HUD: HudState = {
  money: 2450800,
  weapon: 'Desert Eagle',
  weaponId: 24,
  nickName: 'Maloy Homesword',
  casePoints: 33,
  serverId: 16,
  ammoClip: 7,
  ammoReserve: 140,
  clipSize: 7,
  hp: 100,
  armor: 78,
  hunger: 62,
  breath: 100,
  freeze: 0,
  wanted: 0,
  online: 1450,
  id: 365,
  fastHealCount: 3,
  fastFoodCount: 2,
  greenZone: true,
  fishingZone: false,
  gps: { show: true, distance: 1292 },
  point: { show: true, distance: 253 },
  capt: {
    visible: true,
    timeLeft: 2 * 60 + 17,
    territory: 142,
    attackerName: 'BALLAS',
    attackerScore: 3,
    attackerInZone: 4,
    defenderName: 'WINX',
    defenderScore: 1,
    defenderInZone: 2,
  },
  hidden: false,
  radar: {
    rotation: 32,
    x: 1240,
    y: -880,
    entities: [
      { id: 'ally-1', x: -38, y: 26, type: 'ally' },
      { id: 'enemy-1', x: 54, y: 42, type: 'enemy' },
      { id: 'enemy-2', x: 18, y: -62, type: 'enemy' },
      { id: 'obj-1', x: -12, y: -84, type: 'objective', label: 'A' },
    ],
  },
};
