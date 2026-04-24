const fs = require('fs');

// Read current admin page
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// ---- 1. Replace findCoordinates with GPS version ----
const gpsFn = fs.readFileSync('new_find_coords.txt', 'utf8');

// Use regex to find and replace the existing findCoordinates function
const fnRegex = /    const findCoordinates = async \(\) => \{[\s\S]*?finally \{ setIsGeocoding\(false\) \}\s*\}/;
if (fnRegex.test(content)) {
    content = content.replace(fnRegex, gpsFn.trim());
    console.log('GPS function replaced');
} else {
    console.log('findCoordinates regex not matched - trying line-based');
    // Find line by line
    const lines = content.split('\n');
    let start = -1, end = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const findCoordinates')) { start = i; }
        if (start >= 0 && lines[i].trim() === '}' && i > start + 3) { end = i; break; }
    }
    if (start >= 0 && end >= 0) {
        lines.splice(start, end - start + 1, ...gpsFn.trim().split('\n'));
        content = lines.join('\n');
        console.log('GPS function replaced (line-based) lines', start, 'to', end);
    } else {
        console.log('Could not find findCoordinates function');
    }
}

// ---- 2. Add settings modal right before the LAST </div> of root ----
// Check if modal already exists
if (content.includes('showAdminSettings && (')) {
    console.log('Modal already in file - skipping add');
} else {
    const modal = '\n            {/* Admin Settings Modal */}\n            {showAdminSettings && (\n                <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">\n                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAdminSettings(false)} />\n                    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 max-h-[90vh] overflow-y-auto">\n                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />\n                        <div className="flex justify-between items-center mb-5">\n                            <h3 className="font-bold text-lg text-slate-800">Ayarlar</h3>\n                            <button onClick={() => setShowAdminSettings(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>\n                        </div>\n                        <div className="space-y-4">\n                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">\n                                <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Dil / Language</label>\n                                <div className="grid grid-cols-2 gap-2">\n                                    <button onClick={() => setLanguage(\'tr\')} className={"py-2.5 rounded-xl text-sm font-bold transition-all " + (language === \'tr\' ? \'bg-white shadow-md text-brand-primary border border-brand-primary/20\' : \'text-slate-500 bg-white border border-slate-100\')}>Turkce</button>\n                                    <button onClick={() => setLanguage(\'en\')} className={"py-2.5 rounded-xl text-sm font-bold transition-all " + (language === \'en\' ? \'bg-white shadow-md text-brand-primary border border-brand-primary/20\' : \'text-slate-500 bg-white border border-slate-100\')}>English</button>\n                                </div>\n                            </div>\n                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">\n                                <label className="text-xs font-bold text-slate-400 uppercase block">Sifre Degistir</label>\n                                <form onSubmit={handleAdminPasswordChange} className="space-y-2">\n                                    <input type="password" value={adminOldPw} onChange={e => setAdminOldPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-brand-primary" placeholder="Eski sifre" required />\n                                    <input type="password" value={adminNewPw} onChange={e => setAdminNewPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-brand-primary" placeholder="Yeni sifre (min 6)" required />\n                                    <input type="password" value={adminConfirmPw} onChange={e => setAdminConfirmPw(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-brand-primary" placeholder="Yeni sifre tekrar" required />\n                                    <button type="submit" className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Sifreyi Guncelle</button>\n                                </form>\n                            </div>\n                            <button onClick={() => router.push(\'/user\')} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> Kullanici Gorununumune Gec</button>\n                            <button onClick={async () => { await supabase.auth.signOut(); router.push(\'/\') }} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl">Cikis Yap</button>\n                        </div>\n                    </div>\n                </div>\n            )}';
    
    // Find the last </div> before ) }
    const target = '        </div>\n    )\n}';
    const lastIdx = content.lastIndexOf(target);
    if (lastIdx !== -1) {
        content = content.slice(0, lastIdx) + modal + '\n' + target + content.slice(lastIdx + target.length);
        console.log('Modal inserted before closing div');
    } else {
        // Try CRLF
        const targetCRLF = '        </div>\r\n    )\r\n}';
        const lastIdxCRLF = content.lastIndexOf(targetCRLF);
        if (lastIdxCRLF !== -1) {
            content = content.slice(0, lastIdxCRLF) + modal + '\r\n' + targetCRLF + content.slice(lastIdxCRLF + targetCRLF.length);
            console.log('Modal inserted (CRLF)');
        } else {
            console.log('ERROR: Could not find closing div/return/}');
        }
    }
}

fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
console.log('Done');

// Verify
const check = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
if (check.includes('showAdminSettings && (')) console.log('OK: modal found in file');
if (check.includes('enableHighAccuracy')) console.log('OK: GPS found in file');
