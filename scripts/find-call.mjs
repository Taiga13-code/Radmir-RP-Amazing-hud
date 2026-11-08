import fs from 'node:fs';
import path from 'node:path';

const root = 'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources';
const needle = 'setSelfStats';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    const text = fs.readFileSync(full, 'utf8');
    let index = 0;
    let count = 0;
    while ((index = text.indexOf(needle, index)) !== -1) {
      count += 1;
      if (count <= 6) {
        console.log('\n', entry.name, index);
        console.log(text.slice(Math.max(0, index - 180), Math.min(text.length, index + 80)).replace(/\s+/g, ' '));
      }
      index += needle.length;
    }
    if (count) console.log('TOTAL', entry.name, count);
  }
}

walk(root);
