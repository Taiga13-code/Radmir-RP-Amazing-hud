import fs from 'node:fs';

const file = 'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/index.js';
const text = fs.readFileSync(file, 'utf8');
const needles = ['getInterface', 'setSelfStats', 'openInterface'];
for (const needle of needles) {
  let index = 0;
  let count = 0;
  console.log('\n####', needle, 'count', text.split(needle).length - 1);
  while ((index = text.indexOf(needle, index)) !== -1 && count < 6) {
    console.log('\n--', index);
    console.log(text.slice(Math.max(0, index - 160), Math.min(text.length, index + 220)).replace(/\s+/g, ' '));
    index += needle.length;
    count += 1;
  }
}
