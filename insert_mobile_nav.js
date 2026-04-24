const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const mobileNav = 
            {/* Mobile Bottom Navigation - only visible on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.07)]">
                <div className="grid grid-cols-6 items-center py-1">
                    <button onClick={() => setActiveTab('dashboard')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === 'dashboard' ? 'text-brand-primary' : 'text-slate-400')}>
                        <LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-bold">Genel</span>
                    </button>
                    <button onClick={() => setActiveTab('devices')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === 'devices' ? 'text-brand-primary' : 'text-slate-400')}>
                        <Server className="w-5 h-5" /><span className="text-[8px] font-bold">Cihazlar</span>
                    </button>
                    <button onClick={() => setActiveTab('customers')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === 'customers' ? 'text-brand-primary' : 'text-slate-400')}>
                        <Users className="w-5 h-5" /><span className="text-[8px] font-bold">Musteriler</span>
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === 'finance' ? 'text-brand-primary' : 'text-slate-400')}>
                        <CreditCard className="w-5 h-5" /><span className="text-[8px] font-bold">Finans</span>
                    </button>
                    <button onClick={() => setActiveTab('support')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === 'support' ? 'text-brand-primary' : 'text-slate-400')}>
                        <MessageSquare className="w-5 h-5" /><span className="text-[8px] font-bold">Destek</span>
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className={"flex flex-col items-center gap-0.5 p-2 " + (activeTab === 'notifications' ? 'text-brand-primary' : 'text-slate-400')}>
                        <Bell className="w-5 h-5" /><span className="text-[8px] font-bold">Bildirim</span>
                    </button>
                </div>
            </nav>;

// Replace the closing of root div (last </div> before ) } )
const target = '        </div>\n    )\n}';
const replacement = '        </div>\n' + mobileNav + '\n    )\n}';

if (content.includes(target)) {
    // Replace only the last occurrence
    const idx = content.lastIndexOf(target);
    content = content.slice(0, idx) + replacement + content.slice(idx + target.length);
    fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
    console.log('Mobile nav inserted successfully');
} else {
    console.log('target not found, checking CRLF...');
    const targetCRLF = '        </div>\r\n    )\r\n}';
    if (content.includes(targetCRLF)) {
        const idx = content.lastIndexOf(targetCRLF);
        const replacementCRLF = '        </div>\r\n' + mobileNav + '\r\n    )\r\n}';
        content = content.slice(0, idx) + replacementCRLF + content.slice(idx + targetCRLF.length);
        fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
        console.log('Mobile nav inserted (CRLF)');
    } else {
        // Just append before the last line
        const lines = content.split('\n');
        const lastDivIdx = lines.length - 5; // approximately
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('</div>') && lines[i+1] && lines[i+1].trim() === ')') {
                lines.splice(i + 1, 0, mobileNav);
                fs.writeFileSync('src/app/admin/page.tsx', lines.join('\n'), 'utf8');
                console.log('Mobile nav inserted at line ' + (i+1));
                break;
            }
        }
    }
}
