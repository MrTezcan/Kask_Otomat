const fs = require('fs');
const file = 'src/app/user/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<div className=\{`h-\[60vh\] rounded-\[2rem\] overflow-hidden shadow-sm border border-slate-100 relative \$\{(.*?)\}`\}>[\s\S]*?<KioskMap userLocation=\{userLocation\} kiosks=\{kiosks\} \/>[\s\S]*?<\/div>\r?\n\s*<div className=\{`w-full bg-white.*?flex-col items-center justify-center min-h-\[42vh\].*?\`\}>/m;

const replacement = `                <div className={'h-[60vh] rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 relative ' + (activeTab === 'map' ? 'block' : 'hidden')}>
                    <KioskMap userLocation={userLocation} kiosks={kiosks} />
                </div>
                <div className={'w-full bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[42vh] ' + (activeTab === 'home' ? 'flex' : 'hidden')}>`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(file, content, 'utf8');