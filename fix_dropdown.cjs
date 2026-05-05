const fs = require('fs');
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');
const lines = content.split('\n');

// Find start and end lines of the old dropdown block
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Glass dropdown')) {
    startLine = i;
  }
  if (startLine > 0 && i > startLine + 1) {
    // find closing </div> that closes the lp-dropdown div
    // count opens/closes from startLine+1 (the lp-dropdown div line)
    let depth = 0;
    for (let j = startLine + 1; j <= i; j++) {
      const opens = (lines[j].match(/<div/g) || []).length;
      const closes = (lines[j].match(/<\/div>/g) || []).length;
      depth += opens - closes;
    }
    if (depth === 0) { endLine = i; break; }
  }
}

console.log('startLine:', startLine, 'endLine:', endLine);
if (startLine < 0 || endLine < 0) { console.log('Lines not found!'); process.exit(1); }

const newBlock = [
  '                  {/* Glass dropdown */}',
  '                  <div className={`lp-dropdown${mobileNav ? \' open\' : \'\'}`}>',
  '                    <div className="lp-dropdown-label">Navigasi</div>',
  '                    <div className="lp-dropdown-item" onClick={() => { window.scrollTo({ top: 0, behavior: \'smooth\' }); setMobileNav(false); }}>',
  '                      <div className="lp-dropdown-item-icon"><Cloud size={15} color="#ec4899" /></div>',
  '                      Home',
  '                    </div>',
  '                    <div className="lp-dropdown-item" onClick={() => goto(infoRef)}>',
  '                      <div className="lp-dropdown-item-icon"><Activity size={15} color="#ec4899" /></div>',
  '                      Fitur Sensor',
  '                    </div>',
  '                    <div className="lp-dropdown-item" onClick={() => goto(teamRef)}>',
  '                      <div className="lp-dropdown-item-icon"><Shield size={15} color="#ec4899" /></div>',
  '                      Tim Pengembang',
  '                    </div>',
  '                    <div className="lp-dropdown-divider" />',
  '                    <div className="lp-dropdown-cta" onClick={() => { navigate(\'/login\'); setMobileNav(false); }}>',
  '                      <span>Akses Dashboard</span>',
  '                      <ArrowRight size={15} />',
  '                    </div>',
  '                  </div>',
];

lines.splice(startLine, endLine - startLine + 1, ...newBlock);
fs.writeFileSync('src/pages/LandingPage.tsx', lines.join('\n'), 'utf8');
console.log('SUCCESS: Dropdown JSX updated!');
