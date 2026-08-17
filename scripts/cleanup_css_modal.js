const fs = require('fs');
const filePath = 'src/components/CreateTableModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content
  .replace(/emerald/g, 'neutral')
  .replace(/bg-slate-900/g, 'bg-[#0a0a0a]')
  .replace(/bg-slate-950/g, 'bg-[#000000]')
  .replace(/text-slate-400/g, 'text-neutral-400')
  .replace(/text-slate-500/g, 'text-neutral-500')
  .replace(/border-slate-800/g, 'border-[#222]')
  .replace(/border-slate-700/g, 'border-[#333]')
  .replace(/glass-card/g, 'bg-[#000000]')
  .replace(/rounded-2xl/g, 'rounded-lg')
  .replace(/rounded-xl/g, 'rounded-lg');

fs.writeFileSync(filePath, content);
console.log("Replaced modal colors.");
