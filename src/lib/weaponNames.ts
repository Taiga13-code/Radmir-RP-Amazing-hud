const WEAPON_NAMES: Record<number, string> = {
  0: 'Fist',
  1: 'Brass Knuckles',
  2: 'Golf Club',
  3: 'Nightstick',
  4: 'Knife',
  5: 'Baseball Bat',
  6: 'Shovel',
  7: 'Pool Cue',
  8: 'Katana',
  9: 'Chainsaw',
  10: 'Dildo',
  11: 'Dildo',
  12: 'Vibrator',
  13: 'Vibrator',
  14: 'Flowers',
  15: 'Cane',
  16: 'Grenade',
  17: 'Tear Gas',
  18: 'Molotov',
  22: 'Colt 45',
  23: 'Silenced Pistol',
  24: 'Desert Eagle',
  25: 'Shotgun',
  26: 'Sawed-Off',
  27: 'Combat Shotgun',
  28: 'Micro Uzi',
  29: 'MP5',
  30: 'AK-47',
  31: 'M4',
  32: 'Tec-9',
  33: 'Rifle',
  34: 'Sniper Rifle',
  35: 'RPG',
  36: 'Heatseeker',
  37: 'Flamethrower',
  38: 'Minigun',
  39: 'Satchel',
  40: 'Detonator',
  41: 'Spray Can',
  42: 'Fire Extinguisher',
  43: 'Camera',
  44: 'Night Vision',
  45: 'Infrared',
  46: 'Parachute',
};

export function weaponLabel(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '' && !/^\d+$/.test(value.trim())) {
    return value;
  }

  const id = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(id)) {
    return null;
  }

  return WEAPON_NAMES[id] ?? `Weapon ${id}`;
}
