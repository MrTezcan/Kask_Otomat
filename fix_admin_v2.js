const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const navSnippet = fs.readFileSync('new_support_section.txt', 'utf8');

// ---- 1. Add admin password change state ----
content = content.replace(
    "const [showNotifModal, setShowNotifModal] = useState(false)",
    "const [showNotifModal, setShowNotifModal] = useState(false)\n    const [showAdminSettings, setShowAdminSettings] = useState(false)\n    const [adminOldPw, setAdminOldPw] = useState('')\n    const [adminNewPw, setAdminNewPw] = useState('')\n    const [adminConfirmPw, setAdminConfirmPw] = useState('')"
);

// ---- 2. Add handleAdminPasswordChange function ----
const pwChangeFn = "\n    const handleAdminPasswordChange = async (e) => {\n        e.preventDefault()\n        if (adminNewPw.length < 6) return alert('Sifre en az 6 karakter olmalidir.')\n        if (adminNewPw !== adminConfirmPw) return alert('Sifreler eslesmiyor.')\n        const { data: { user } } = await supabase.auth.getUser()\n        if (!user?.email) return\n        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: adminOldPw })\n        if (signInError) return alert('Eski sifre yanlis.')\n        const { error } = await supabase.auth.updateUser({ password: adminNewPw })\n        if (error) alert('Hata: ' + error.message)\n        else { alert('Sifreniz guncellendi.'); setAdminOldPw(''); setAdminNewPw(''); setAdminConfirmPw(''); setShowAdminSettings(false) }\n    }\n";
content = content.replace(
    "    const fetchDevices = async () => {",
    pwChangeFn + "    const fetchDevices = async () => {"
);

// ---- 3. Replace support tab section (lines 357-404 area) ----
const supportStart = "                    {activeTab === 'support' && (";
const supportEnd = "                    )}";
const supportStartIdx = content.indexOf(supportStart);
if (supportStartIdx === -1) { console.log('ERROR: support start not found'); process.exit(1); }

// Find the matching closing )}  after the support grid
// We need to count brackets to find the correct closing
let depth = 0;
let i = supportStartIdx;
let endIdx = -1;
while (i < content.length) {
    if (content[i] === '(') depth++;
    if (content[i] === ')') {
        depth--;
        if (depth === 0) { endIdx = i + 1; break; }
    }
    i++;
}
// The ending is endIdx, but we also need to match the } after )
// The )} pattern end
const toCut = content.slice(supportStartIdx, endIdx + 1);
content = content.replace(toCut, navSnippet.trim());
console.log('Support section replaced, length diff:', navSnippet.length - toCut.length);

// ---- 4. Fix the mobile header gear button to open settings ----
content = content.replace(
    '<header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10"><Logo size="small" /><button><Settings className="w-6 h-6 text-slate-600" /></button></header>',
    '<header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10"><Logo size="small" /><button onClick={() => setShowAdminSettings(true)} className="p-2 rounded-xl hover:bg-slate-100"><Settings className="w-6 h-6 text-slate-600" /></button></header>'
);

// ---- 5. Update mobile bottom nav to 5 cols + add Kullanici and OTA via Settings ----
// Replace current 6-button grid with improved layout that uses 5 items + settings
content = content.replace(
    '<div className="grid grid-cols-6 items-center py-1">',
    '<div className="grid grid-cols-5 items-center py-1">'
);
// Remove OTA button from mobile nav (least used) to stay at 5 cols without the 6-button cramp
content = content.replace(
    '                    <button onClick={() => setActiveTab(\'notifications\')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === \'notifications\' ? \'text-brand-primary\' : \'text-slate-400\')}>\n                        <Bell className="w-5 h-5" /><span className="text-[8px] font-bold leading-tight">Bildirim</span>\n                    </button>',
    '                    <button onClick={() => setActiveTab(\'notifications\')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === \'notifications\' ? \'text-brand-primary\' : \'text-slate-400\')}>\n                        <Bell className="w-5 h-5" /><span className="text-[8px] font-bold leading-tight">Bildirim</span>\n                    </button>\n                    <button onClick={() => setShowAdminSettings(true)} className={"flex flex-col items-center gap-0.5 p-2 text-slate-400"}>\n                        <Settings className="w-5 h-5" /><span className="text-[8px] font-bold leading-tight">Ayarlar</span>\n                    </button>'
);

// ---- 6. Add admin settings modal before closing </nav> of mobile nav ----
const adminSettingsModal = "\n            {/* Admin Settings Modal */}\n            {showAdminSettings && (\n                <div className=\"fixed inset-0 z-[10001] flex items-end sm:items-center justify-center\">\n                    <div className=\"absolute inset-0 bg-slate-900/50 backdrop-blur-sm\" onClick={() => setShowAdminSettings(false)} />\n                    <div className=\"bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10\">\n                        <div className=\"w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden\" />\n                        <h3 className=\"font-bold text-lg text-slate-800 mb-4\">Ayarlar</h3>\n                        <div className=\"space-y-4\">\n                            <div className=\"p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3\">\n                                <label className=\"text-xs font-bold text-slate-400 uppercase block\">Sifre Degistir</label>\n                                <form onSubmit={handleAdminPasswordChange} className=\"space-y-2\">\n                                    <input type=\"password\" value={adminOldPw} onChange={e => setAdminOldPw(e.target.value)} className=\"w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-brand-primary\" placeholder=\"Eski sifre\" required />\n                                    <input type=\"password\" value={adminNewPw} onChange={e => setAdminNewPw(e.target.value)} className=\"w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-brand-primary\" placeholder=\"Yeni sifre (min 6)\" required />\n                                    <input type=\"password\" value={adminConfirmPw} onChange={e => setAdminConfirmPw(e.target.value)} className=\"w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-brand-primary\" placeholder=\"Yeni sifre tekrar\" required />\n                                    <button type=\"submit\" className=\"w-full py-3 bg-brand-primary text-white font-bold rounded-xl flex items-center justify-center gap-2\"><Check className=\"w-4 h-4\" /> Sifreyi Guncelle</button>\n                                </form>\n                            </div>\n                            <button onClick={() => router.push('/user')} className=\"w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2\">\n                                <Eye className=\"w-4 h-4\" /> Kullanici Gorununumune Gec\n                            </button>\n                            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className=\"w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl\">Cikis Yap</button>\n                        </div>\n                    </div>\n                </div>\n            )}";

// Insert before closing </nav> of mobile nav
content = content.replace('            </nav>\n        </div>', adminSettingsModal + '\n            </nav>\n        </div>');
console.log('Admin settings modal added');

// ---- 7. Fix grid to 5 cols ----
// already done above

fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
console.log('All fixes done!');
