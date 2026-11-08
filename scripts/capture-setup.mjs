import fs from 'node:fs';

const text = fs.readFileSync(
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/Capture.js',
  'utf8',
);

const needles = [
  'setInterfaceParams',
  'allies:',
  'enemy:',
  'teams',
  'role',
  'side',
  'icon',
  'name:',
  'kills',
  'inZone',
];

for (const needle of needles) {
  let at = 0;
  let n = 0;
  console.log('\n####', needle);
  while ((at = text.indexOf(needle, at)) !== -1 && n < 5) {
    console.log(text.slice(Math.max(0, at - 100), Math.min(text.length, at + 180)).replace(/\s+/g, ' '));
    console.log('---');
    at += needle.length;
    n += 1;
  }
}
