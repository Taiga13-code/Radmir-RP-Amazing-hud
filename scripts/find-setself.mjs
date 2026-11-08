import fs from 'node:fs';
import path from 'node:path';

const root = 'C:/Program Files (x86)/RADMIR Games/RADMIR CRMP/uiresources';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    const text = fs.readFileSync(full, 'utf8');
    const index = text.indexOf('setSelfStats');
    if (index === -1) continue;
    console.log('\nFILE', full, 'at', index);
    console.log(text.slice(Math.max(0, index - 250), Math.min(text.length, index + 350)).replace(/\n/g, ' '));
  }
}

walk(root);
