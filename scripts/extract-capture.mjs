import fs from 'node:fs';

const file = 'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/Capture.js';
const text = fs.readFileSync(file, 'utf8');
const needles = [
  'setSelfStats',
  'Защита',
  'Атака',
  'defense',
  'attack',
  'alliesTeam',
  'enemyTeam',
  'updateScoreboard',
  'isDefender',
  'defender',
  'attacker',
  'selfTeam',
  'teamSide',
];

for (const needle of needles) {
  let index = 0;
  let count = 0;
  while ((index = text.indexOf(needle, index)) !== -1 && count < 4) {
    const start = Math.max(0, index - 180);
    const end = Math.min(text.length, index + needle.length + 220);
    console.log('\n==', needle, 'at', index);
    console.log(text.slice(start, end).replace(/\n/g, ' '));
    index += needle.length;
    count += 1;
  }
  if (count === 0) {
    console.log('\n==', needle, 'NOT FOUND');
  }
}
