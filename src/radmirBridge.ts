import type { CaptPatch, HudPatch } from './types';
import { weaponLabel } from './lib/weaponNames';

type InterfaceObject = Record<string, unknown>;
type MethodFactory = (getCurrent: () => Function | null) => Function;

interface HudInfoLike extends InterfaceObject {
  health?: unknown;
  armour?: unknown;
  armor?: unknown;
  money?: unknown;
  weapon?: unknown;
  ammoInClip?: unknown;
  totalAmmo?: unknown;
  hunger?: unknown;
  breath?: unknown;
  freeze?: unknown;
  wanted?: unknown;
  online?: unknown;
  id?: unknown;
  fastHealCount?: unknown;
  fastFoodCount?: unknown;
}

interface HudInterfaceLike extends InterfaceObject {
  info?: HudInfoLike;
  $watch?: (
    expression: unknown,
    callback: () => void,
    options?: InterfaceObject,
  ) => unknown;
}

interface CaptureValues {
  visible?: boolean;
  time?: unknown;
  attackerName?: unknown;
  attackerScore?: unknown;
  attackerInZone?: unknown;
  defenderName?: unknown;
  defenderScore?: unknown;
  defenderInZone?: unknown;
}

const HUD_STYLE_ID = 'radmir-stock-hud-hide';
const CAPTURE_NAME = 'Capture';
const STOCK_HUD_SELECTORS = [
  '.hud-hassle-info',
  '.hud-radmir-info',
  '.hud-mobile__info',
  '.capture-scoreboard',
];

const wrappedObjects = new WeakMap<object, object>();
const pendingPatches: HudPatch[] = [];

function isRecord(value: unknown): value is InterfaceObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().replace(',', '.');
    if (trimmed !== '') {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function toSeconds(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed === null) {
    return null;
  }

  const seconds = parsed > 100000 ? parsed / 1000 : parsed;
  return Math.max(0, Math.floor(seconds));
}

function parseJsonish(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const text = value.trim();
  if (text === '') {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function publish(patch: HudPatch): void {
  const handler = window.updateRadmirHud;

  if (typeof handler === 'function') {
    handler(patch);
    return;
  }

  pendingPatches.push(patch);
  if (pendingPatches.length > 120) {
    pendingPatches.shift();
  }
}

function flush(): void {
  const handler = window.updateRadmirHud;
  if (typeof handler !== 'function') {
    return;
  }

  const queued = pendingPatches.splice(0, pendingPatches.length);
  for (const patch of queued) {
    handler(patch);
  }
}

function customHudIsReady(): boolean {
  const root = document.getElementById('custom-radmir-hud-root');
  const plate = root?.querySelector<HTMLElement>('.cohtml-plate');
  if (!root || !plate) {
    return false;
  }

  const rect = plate.getBoundingClientRect();
  const style = window.getComputedStyle(plate);
  return (
    rect.width > 1 &&
    rect.height > 1 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || '1') > 0
  );
}

function installStockHudStyle(force = false): void {
  if (typeof document === 'undefined') {
    return;
  }

  const existingStyle = document.getElementById(HUD_STYLE_ID);
  const root = document.getElementById('custom-radmir-hud-root');
  const hasCustomRoot = Boolean(root && root.firstElementChild);

  // A previous build hid the stock HUD immediately. Remove that stale rule
  // before checking readiness so a hot-reloaded bundle can recover the HUD.
  if (!(force && hasCustomRoot) && !customHudIsReady()) {
    existingStyle?.remove();
    return;
  }

  // Fail open: ExecuteScript returning does not mean React rendered visibly.
  if (existingStyle) {
    return;
  }

  const host = document.head ?? document.documentElement;
  if (!host) {
    return;
  }

  const style = document.createElement('style');
  style.id = HUD_STYLE_ID;
  style.type = 'text/css';
  style.textContent = [
    `${STOCK_HUD_SELECTORS.join(',\n')} {`,
    '  display: none !important;',
    '}',
  ].join('\n');

  host.appendChild(style);
}

function buildInfoPatch(info: InterfaceObject): HudPatch {
  const patch: HudPatch = {};

  const health = toNumber(info.health);
  if (health !== null) {
    patch.hp = health;
  }

  const armour = toNumber(info.armour) ?? toNumber(info.armor);
  if (armour !== null) {
    patch.armor = armour;
  }

  const money = toNumber(info.money);
  if (money !== null) {
    patch.money = money;
  }

  const weapon = weaponLabel(info.weapon);
  if (weapon) {
    patch.weapon = weapon;
  }

  const weaponId = toNumber(info.weapon);
  if (weaponId !== null) {
    patch.weaponId = weaponId;
  }

  const ammoInClip = toNumber(info.ammoInClip);
  if (ammoInClip !== null) {
    patch.ammoClip = ammoInClip;
  }

  const totalAmmo = toNumber(info.totalAmmo);
  if (totalAmmo !== null) {
    patch.ammoReserve = totalAmmo;
  }

  const hunger = toNumber(info.hunger);
  if (hunger !== null) {
    patch.hunger = hunger;
  }

  const breath = toNumber(info.breath);
  if (breath !== null) {
    patch.breath = breath;
  }

  const freeze = toNumber(info.freeze);
  if (freeze !== null) {
    patch.freeze = freeze;
  }

  const wanted = toNumber(info.wanted);
  if (wanted !== null) {
    patch.wanted = wanted;
  }

  const online = toNumber(info.online);
  if (online !== null) {
    patch.online = online;
  }

  const id = toNumber(info.id);
  if (id !== null) {
    patch.id = id;
  }

  const fastHealCount = toNumber(info.fastHealCount);
  if (fastHealCount !== null) {
    patch.fastHealCount = fastHealCount;
  }

  const fastFoodCount = toNumber(info.fastFoodCount);
  if (fastFoodCount !== null) {
    patch.fastFoodCount = fastFoodCount;
  }

  return patch;
}

function publishInfo(info: HudInfoLike): void {
  const patch = buildInfoPatch(info);
  if (Object.keys(patch).length > 0) {
    publish(patch);
  }
}

function applyHudPayload(raw: unknown): void {
  const parsed = parseJsonish(raw);
  if (!isRecord(parsed)) {
    return;
  }

  const info = isRecord(parsed.info) ? parsed.info : parsed;
  const patch = buildInfoPatch(info);
  if (Object.keys(patch).length > 0) {
    publish(patch);
  }
}

function wrapInfo(info: HudInfoLike): HudInfoLike {
  const cached = wrappedObjects.get(info);
  if (cached) {
    return cached as HudInfoLike;
  }

  const proxy = new Proxy(info, {
    set(target, property, value) {
      const result = Reflect.set(target, property, value);
      publishInfo(target);
      return result;
    },
    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property);
      publishInfo(target);
      return result;
    },
  });

  wrappedObjects.set(info, proxy);
  return proxy;
}

function subscribeHud(hud: HudInterfaceLike): void {
  const watch = hud.$watch;
  if (typeof watch !== 'function') {
    return;
  }

  const callback = () => {
    if (isRecord(hud.info)) {
      publishInfo(hud.info as HudInfoLike);
    }
  };

  try {
    watch.call(hud, 'info', callback, { deep: true });
    return;
  } catch {
    // Some Vue builds only accept a getter function.
  }

  try {
    watch.call(hud, () => hud.info, callback, { deep: true });
  } catch {
    // The bridge still receives direct info property writes.
  }
}

function applyRadarZoneMethod(key: string, args: unknown[]): boolean {
  switch (key) {
    case 'showgreenzonetab':
      publish({ greenZone: true });
      return true;
    case 'hidegreenzonetab':
      publish({ greenZone: false });
      return true;
    case 'showfishingzone':
      publish({ fishingZone: true });
      return true;
    case 'hidefishingzone':
      publish({ fishingZone: false });
      return true;
    case 'showgps': {
      const distance = toNumber(args[0]) ?? 0;
      publish({ gps: { show: true, distance } });
      return true;
    }
    case 'hidegps':
      publish({ gps: { show: false, distance: 0 } });
      return true;
    case 'showpersonaltag': {
      const distance = toNumber(args[0]) ?? 0;
      publish({ point: { show: true, distance } });
      return true;
    }
    case 'hidepersonaltag':
      publish({ point: { show: false, distance: 0 } });
      return true;
    default:
      return false;
  }
}

function afterHudMethod(hud: HudInterfaceLike, name: string, args: unknown[]): void {
  // Hud methods are only called after the player is in the world; this is the
  // reliable game-ready trigger and does not depend on login duration.
  window.__radmirHudOnReady?.(true);

  if (isRecord(hud.info)) {
    publishInfo(hud.info as HudInfoLike);
  }

  const key = name.toLowerCase();
  if (key === 'setinterfaceparams' || key === 'updateparams') {
    applyHudPayload(args[0]);
    return;
  }

  applyRadarZoneMethod(key, args);
}

function wrapHud(hud: HudInterfaceLike): HudInterfaceLike {
  const cached = wrappedObjects.get(hud);
  if (cached) {
    return cached as HudInterfaceLike;
  }

  // Receiving the real game Hud interface at menu time is not proof the world
  // is loaded; only mount if the stock in-game HUD already exists in the DOM.
  window.__radmirHudOnReady?.();
  installStockHudStyle();
  subscribeHud(hud);

  if (isRecord(hud.info)) {
    publishInfo(hud.info as HudInfoLike);
  }

  const proxy = new Proxy(hud, {
    get(target, property, receiver) {
      if (property === 'info') {
        const info = Reflect.get(target, property, receiver);
        return isRecord(info) ? wrapInfo(info as HudInfoLike) : info;
      }

      const value = Reflect.get(target, property, receiver);

      // Game updates may remove methods (e.g. hideInfo). Return a safe no-op
      // so callers like the stock UI scripts don't crash on undefined().
      if (value === undefined && typeof property === 'string') {
        return function () { return undefined; };
      }

      if (typeof value !== 'function') {
        return value;
      }

      return function (this: unknown, ...args: unknown[]) {
        const result = (value as (...callArgs: unknown[]) => unknown).apply(target, args);
        if (typeof property === 'string') {
          afterHudMethod(target, property, args);
        }
        return result;
      };
    },
    set(target, property, value) {
      const result = Reflect.set(target, property, value);
      if (property === 'info' && isRecord(value)) {
        publishInfo(value as HudInfoLike);
      }
      return result;
    },
  });

  wrappedObjects.set(hud, proxy);
  return proxy;
}

function publishCapture(values: CaptureValues): void {
  const capt: CaptPatch = {};

  if (values.visible !== undefined) {
    capt.visible = values.visible;
  }

  const seconds = toSeconds(values.time);
  if (seconds !== null) {
    capt.timeLeft = seconds;
  }

  const attackerName = toText(values.attackerName);
  if (attackerName !== undefined) {
    capt.attackerName = attackerName;
  }

  const defenderName = toText(values.defenderName);
  if (defenderName !== undefined) {
    capt.defenderName = defenderName;
  }

  const attackerScore = toNumber(values.attackerScore);
  if (attackerScore !== null) {
    capt.attackerScore = Math.max(0, Math.floor(attackerScore));
  }

  const defenderScore = toNumber(values.defenderScore);
  if (defenderScore !== null) {
    capt.defenderScore = Math.max(0, Math.floor(defenderScore));
  }

  const attackerInZone = toNumber(values.attackerInZone);
  if (attackerInZone !== null) {
    capt.attackerInZone = Math.max(0, Math.floor(attackerInZone));
  }

  const defenderInZone = toNumber(values.defenderInZone);
  if (defenderInZone !== null) {
    capt.defenderInZone = Math.max(0, Math.floor(defenderInZone));
  }

  if (Object.keys(capt).length === 0) {
    return;
  }

  if (capt.visible !== undefined) {
    window.__radmirCaptureVisible = capt.visible;
  }

  publish({ capt });
}

function pickRecord(source: InterfaceObject, keys: string[]): InterfaceObject | undefined {
  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return undefined;
}

function applyCaptureParams(raw: unknown): void {
  const parsed = parseJsonish(raw);

  if (Array.isArray(parsed)) {
    const [attackerName, attackerScore, defenderName, defenderScore, seconds] = parsed;
    publishCapture({
      visible: true,
      attackerName,
      attackerScore,
      defenderName,
      defenderScore,
      time: seconds,
    });
    return;
  }

  if (!isRecord(parsed)) {
    return;
  }

  const attacker = pickRecord(parsed, [
    'attackerTeam',
    'attackTeam',
    'attackers',
    'attacker',
    'attack',
    'alliesTeam',
    'allies',
    'ourTeam',
    'team1',
    'teamA',
  ]);
  const defender = pickRecord(parsed, [
    'defenderTeam',
    'defenseTeam',
    'defenders',
    'defender',
    'defense',
    'enemyTeam',
    'enemy',
    'theirTeam',
    'team2',
    'teamB',
  ]);

  publishCapture({
    visible: parsed.visible === undefined ? true : Boolean(parsed.visible),
    time: parsed.seconds ?? parsed.time ?? parsed.timeLeft,
    attackerName: attacker?.name ?? parsed.attackerName ?? parsed.attackName ?? parsed.ourName ?? parsed.alliesName,
    attackerScore:
      attacker?.kills ?? parsed.attackerScore ?? parsed.attackScore ?? parsed.ourScore ?? parsed.alliesKills,
    attackerInZone: attacker?.inZone ?? parsed.attackerInZone ?? parsed.attackInZone ?? parsed.ourInZone,
    defenderName:
      defender?.name ?? parsed.defenderName ?? parsed.defenseName ?? parsed.enemyName ?? parsed.enemiesName,
    defenderScore:
      defender?.kills ?? parsed.defenderScore ?? parsed.defenseScore ?? parsed.enemyScore ?? parsed.enemyKills,
    defenderInZone:
      defender?.inZone ?? parsed.defenderInZone ?? parsed.defenseInZone ?? parsed.enemyInZone,
  });
}

function afterCaptureMethod(name: string, args: unknown[]): void {
  switch (name.toLowerCase()) {
    case 'updatescoreboard': {
      publishCapture({
        visible: true,
        time: args[0],
        attackerScore: args[1],
        defenderScore: args[2],
      });
      return;
    }
    case 'updatescoreboardkills': {
      publishCapture({
        visible: true,
        attackerScore: args[0],
        defenderScore: args[1],
      });
      return;
    }
    case 'updatescoreboardtime': {
      publishCapture({
        visible: true,
        time: args[0],
      });
      return;
    }
    case 'close': {
      publishCapture({ visible: false });
      return;
    }
    case 'setinterfaceparams':
    case 'updateparams': {
      applyCaptureParams(args[0]);
      return;
    }
    default:
      return;
  }
}

function wrapCapture(capture: InterfaceObject): InterfaceObject {
  const cached = wrappedObjects.get(capture);
  if (cached) {
    return cached as InterfaceObject;
  }

  const proxy = new Proxy(capture, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (typeof value === 'function') {
        return function (this: unknown, ...args: unknown[]) {
          const result = (value as (...callArgs: unknown[]) => unknown).apply(target, args);
          if (typeof property === 'string') {
            afterCaptureMethod(property, args);
          }
          return result;
        };
      }

      if (property === 'open' && isRecord(value)) {
        const params = value.params;
        if (params !== undefined) {
          applyCaptureParams(params);
        }
      }

      return value;
    },
    set(target, property, value) {
      const result = Reflect.set(target, property, value);
      if (property === 'open' && isRecord(value) && value.params !== undefined) {
        applyCaptureParams(value.params);
      }
      return result;
    },
  });

  wrappedObjects.set(capture, proxy);
  return proxy;
}

function isCaptureName(name: string): boolean {
  return name === CAPTURE_NAME || /capture/i.test(name);
}

function wrapInterface(name: string, iface: unknown): unknown {
  if (!isRecord(iface)) {
    return iface;
  }

  if (name === 'Hud') {
    return wrapHud(iface as HudInterfaceLike);
  }

  if (isCaptureName(name)) {
    return wrapCapture(iface);
  }

  return iface;
}

function makeGetInterfaceWrapper(getCurrent: () => Function | null): Function {
  return function (this: unknown, name: string) {
    const current = getCurrent();
    if (!current) {
      return false;
    }

    const iface = current.call(window, name);
    return wrapInterface(String(name), iface);
  };
}

function makeOpenInterfaceWrapper(getCurrent: () => Function | null): Function {
  return function (this: unknown, name: string, params?: unknown, ...rest: unknown[]) {
    if (isCaptureName(String(name))) {
      applyCaptureParams(params);
    }

    const current = getCurrent();
    if (!current) {
      return undefined;
    }

    return current.apply(window, [name, params, ...rest]);
  };
}

function makeCloseInterfaceWrapper(getCurrent: () => Function | null): Function {
  return function (this: unknown, name: string, ...rest: unknown[]) {
    if (isCaptureName(String(name))) {
      publishCapture({ visible: false });
    }

    const current = getCurrent();
    if (!current) {
      return undefined;
    }

    return current.apply(window, [name, ...rest]);
  };
}

function installFunctionAccessor(name: string, factory: MethodFactory): void {
  const target = window as unknown as InterfaceObject;
  const descriptor = Object.getOwnPropertyDescriptor(target, name);

  if (descriptor && descriptor.configurable === false) {
    return;
  }

  let current: Function | null =
    typeof target[name] === 'function' ? (target[name] as Function) : null;

  const wrapper = factory(() => current);

  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: true,
    get: () => wrapper,
    set: (value: unknown) => {
      current = typeof value === 'function' ? (value as Function) : null;
    },
  });

  let checks = 0;
  const guard = window.setInterval(() => {
    checks += 1;

    if (checks > 1200) {
      window.clearInterval(guard);
      return;
    }

    if ((target[name] as Function | undefined) !== wrapper) {
      window.clearInterval(guard);
      installFunctionAccessor(name, factory);
    }
  }, 500);
}

interface StoreLike {
  $store?: {
    getters?: Record<string, unknown>;
    state?: Record<string, unknown>;
  };
}

let lastPlayerMetaKey = '';

function readStoreGetter(getter: string): unknown {
  const app = (window as unknown as { App?: StoreLike }).App;
  const getters = app?.$store?.getters;

  if (!getters) {
    return undefined;
  }

  try {
    return getters[getter];
  } catch {
    return undefined;
  }
}

function readStoreState(section: string, key: string): unknown {
  const app = (window as unknown as { App?: StoreLike }).App;
  const state = app?.$store?.state?.[section];

  if (!state || typeof state !== 'object') {
    return undefined;
  }

  try {
    return (state as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function publishPlayerMeta(): void {
  const nickName =
    toText(readStoreGetter('player/nickName')) ??
    toText(readStoreState('player', 'nickName'));
  const casePoints =
    toNumber(readStoreGetter('player/casePoints')) ??
    toNumber(readStoreState('player', 'casePoints'));
  const serverId =
    toNumber(readStoreGetter('player/serverId')) ??
    toNumber(readStoreState('player', 'currentServer'));

  const meta: HudPatch = {};

  if (nickName !== undefined && nickName.trim() !== '') {
    meta.nickName = nickName;
  }

  if (casePoints !== null) {
    meta.casePoints = casePoints;
  }

  if (serverId !== null) {
    meta.serverId = serverId;
  }

  const key = `${meta.nickName ?? ''}|${meta.casePoints ?? ''}|${meta.serverId ?? ''}`;
  if (key === lastPlayerMetaKey) {
    return;
  }

  if (Object.keys(meta).length === 0) {
    return;
  }

  lastPlayerMetaKey = key;
  publish(meta);
}

function startPlayerMetaWatch(): void {
  if (window.__radmirPlayerMetaWatchdog) {
    return;
  }

  publishPlayerMeta();
  window.__radmirPlayerMetaWatchdog = window.setInterval(publishPlayerMeta, 1000);
}

function startCaptureWatchdog(): void {
  if (window.__radmirCaptureWatchdog) {
    return;
  }

  const id = window.setInterval(() => {
    if (!window.__radmirCaptureVisible) {
      return;
    }

    const status = window.getInterfaceStatus;
    if (typeof status !== 'function') {
      return;
    }

    let value: unknown;
    try {
      value = status.call(window, CAPTURE_NAME);
    } catch {
      return;
    }

    if (value === false) {
      publishCapture({ visible: false });
    }
  }, 500);

  window.__radmirCaptureWatchdog = id;
}

export function installRadmirBridge(): void {
  if (window.__radmirGetInterfacePatched) {
    window.__radmirHudBridge?.flush();
    return;
  }

  window.__radmirGetInterfacePatched = true;
  // Remove the chat restyle injected by earlier builds.
  document.getElementById('radmir-custom-chat-style')?.remove();
  installStockHudStyle();

  window.__radmirHudBridge = {
    publish,
    flush,
    hideStockHud: (force = false) => installStockHudStyle(force),
  };

  installFunctionAccessor('getInterface', makeGetInterfaceWrapper);
  installFunctionAccessor('openInterface', makeOpenInterfaceWrapper);
  installFunctionAccessor('closeInterface', makeCloseInterfaceWrapper);

  startCaptureWatchdog();
  startPlayerMetaWatch();
}
