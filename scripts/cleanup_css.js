const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content
    .replace(/text-cyan-400/g, 'text-neutral-300')
    .replace(/bg-cyan-500/g, 'bg-white text-black')
    .replace(/bg-slate-900\/60/g, 'bg-[#0a0a0a]')
    .replace(/bg-slate-950\/50/g, 'bg-[#000000]')
    .replace(/bg-slate-950\/40/g, 'bg-[#000000]')
    .replace(/bg-slate-950/g, 'bg-[#000000]')
    .replace(/text-slate-400/g, 'text-neutral-400')
    .replace(/text-slate-500/g, 'text-neutral-500')
    .replace(/text-slate-300/g, 'text-neutral-300')
    .replace(/border-slate-800/g, 'border-[#222]')
    .replace(/border-slate-700/g, 'border-[#333]')
    .replace(/glass-card/g, 'bg-[#000000] border border-[#222] shadow-sm')
    .replace(/rounded-xl/g, 'rounded-lg')
    .replace(/rounded-2xl/g, 'rounded-lg');
  
  fs.writeFileSync(filePath, content);
}

['src/components/PlatformAccessView.tsx', 'src/components/OverviewView.tsx', 'src/components/TableDataView.tsx', 'src/components/Sidebar.tsx', 'src/components/Navbar.tsx', 'src/components/TableSchemaView.tsx', 'src/components/SqlQueryView.tsx'].forEach(p => {
  if (fs.existsSync(p)) replaceInFile(p);
});
console.log("Replaced colors.");
