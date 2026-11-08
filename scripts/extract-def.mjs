import fs from 'node:fs';

const text = fs.readFileSync(
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/index.js',
  'utf8',
);

const patterns = [
  'window.getInterface=',
  'getInterface(e)',
  'getInterface=e=>',
  'getInterface=function',
  '$refs[e]',
];

for (const needle of patterns) {
  let index = 0;
  let count = 0;
  console.log('\n####', JSON.stringify(needle));
  while ((index = text.indexOf(needle, index)) !== -1 && count < 5) {
    console.log(text.slice(Math.max(0, index - 80), Math.min(text.length, index + 280)).replace(/\s+/g, ' '));
    console.log('---');
    index += needle.length;
    count += 1;
  }
}

const phone = fs.readFileSync(
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/Phone.js',
  'utf8',
);
let index = 0;
let count = 0;
console.log('\n#### callers of setSelfStats');
while ((index = phone.indexOf('setSelfStats', index)) !== -1 && count < 8) {
  console.log('\n--', index);
  console.log(phone.slice(Math.max(0, index - 300), Math.min(phone.length, index + 120)).replace(/\s+/g, ' '));
  index += 12;
  count += 1;
}
