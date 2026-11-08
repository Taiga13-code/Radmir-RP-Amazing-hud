import fs from 'node:fs';

const files = [
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/Phone.js',
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/Player.js',
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/index7.js',
];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of ['Защита', 'Атака']) {
    let at = 0;
    let n = 0;
    while ((at = text.indexOf(needle, at)) !== -1 && n < 6) {
      console.log('\n', file.split('/').pop(), needle, at);
      console.log(text.slice(Math.max(0, at - 200), Math.min(text.length, at + 200)).replace(/\s+/g, ' '));
      at += needle.length;
      n += 1;
    }
  }
}
