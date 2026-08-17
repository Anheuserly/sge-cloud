const fs = require('fs');

const file = 'src/app/api/admin/normalize-phones/route.ts';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
const result = [];
let state = 'normal'; // normal, ours, theirs

for (const line of lines) {
  if (line.startsWith('<<<<<<< HEAD')) {
    state = 'ours';
  } else if (line.startsWith('=======')) {
    state = 'theirs';
  } else if (line.startsWith('>>>>>>>')) {
    state = 'normal';
  } else {
    if (state === 'normal' || state === 'theirs') {
      result.push(line);
    }
  }
}

fs.writeFileSync(file, result.join('\n'));
console.log('Resolved conflicts using theirs.');
