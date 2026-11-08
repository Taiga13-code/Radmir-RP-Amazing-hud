import fs from 'node:fs';

const phone = fs.readFileSync(
  'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets/Phone.js',
  'utf8',
);
const index = phone.indexOf('setSelfStats');
console.log(phone.slice(index, index + 900));

console.log('\n\n==== family capture sides ====');
const needles = ['Защита', 'Атака', 'defenseTeam', 'attackTeam', 'isAttack', 'attacker', 'defender', 'sideType'];
function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    let at = 0;
    let n = 0;
    while ((at = text.indexOf(needle, at)) !== -1 && n < 3) {
      console.log('\n', file.split(/[/\\]/).pop(), needle, at);
      console.log(text.slice(Math.max(0, at - 120), Math.min(text.length, at + 160)).replace(/\s+/g, ' '));
      at += needle.length;
      n += 1;
    }
  }
}

const root = 'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources/assets';
for (const name of fs.readdirSync(root)) {
  if (!name.endsWith('.js')) continue;
  const full = root + '/' + name;
  const text = fs.readFileSync(full, 'utf8');
  if (text.includes('Защита') || text.includes('Атака')) {
    console.log('HAS LABEL', name);
  }
}
