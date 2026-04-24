const fs = require("fs");
let content = fs.readFileSync("src/app/admin/page.tsx", "utf8");

// 1. Hide the aside on mobile (add hidden md:flex)
content = content.replace(
    `<aside className="w-full md:w-64 h-16 md:h-full bg-white border-b md:border-r border-slate-200 flex flex-row md:flex-col z-20 shadow-sm relative overflow-x-auto md:overflow-x-visible shrink-0 no-scrollbar custom-scrollbar-hide">`,
    `<aside className="hidden md:flex md:w-64 md:h-full bg-white md:border-r border-slate-200 md:flex-col z-20 shadow-sm shrink-0">`
);

// 2. Add mobile bottom navigation right before the closing </div> of the root div
// Find the closing of the main structure
const mobileNav = `
            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex justify-around items-center py-1">
                    <button onClick={() => setActiveTab('dashboard')} className={"flex flex-col items-center gap-0.5 p-2 flex-1 " + (activeTab === 'dashboard' ? 'text-brand-primary' : 'text-slate-400')}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Genel</span>
                    </button>
                    <button onClick={() => setActiveTab('devices')} className={"flex flex-col items-center gap-0.5 p-2 flex-1 " + (activeTab === 'devices' ? 'text-brand-primary' : 'text-slate-400')}>
                        <Server className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Cihazlar</span>
                    </button>
                    <button onClick={() => setActiveTab('customers')} className={"flex flex-col items-center gap-0.5 p-2 flex-1 " + (activeTab === 'customers' ? 'text-brand-primary' : 'text-slate-400')}>
                        <Users className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Musteriler</span>
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={"flex flex-col items-center gap-0.5 p-2 flex-1 " + (activeTab === 'finance' ? 'text-brand-primary' : 'text-slate-400')}>
                        <CreditCard className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Finans</span>
                    </button>
                    <button onClick={() => setActiveTab('support')} className={"flex flex-col items-center gap-0.5 p-2 flex-1 " + (activeTab === 'support' ? 'text-brand-primary' : 'text-slate-400')}>
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Destek</span>
                    </button>
                    <button onClick={() => setActiveTab('notifications')} className={"flex flex-col items-center gap-0.5 p-2 flex-1 " + (activeTab === 'notifications' ? 'text-brand-primary' : 'text-slate-400')}>
                        <Bell className="w-5 h-5" />
                        <span className="text-[9px] font-bold">Bildirim</span>
                    </button>
                </div>
            </nav>`;

// Insert mobile nav just before the final closing </div>
const lastClosingDiv = content.lastIndexOf('</div>\n    )\n}');
if (lastClosingDiv !== -1) {
    content = content.slice(0, lastClosingDiv) + mobileNav + '\n        ' + content.slice(lastClosingDiv);
    console.log('Mobile nav inserted');
} else {
    console.log('ERROR: could not find insertion point, trying alternate...');
    // Try alternate pattern
    const alt = content.lastIndexOf('        </div>\n    )\n}');
    if (alt !== -1) {
        content = content.slice(0, alt) + mobileNav + '\n' + content.slice(alt);
        console.log('Mobile nav inserted (alt)');
    } else {
        console.log('Searching for closing pattern...');
        const lines = content.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim() === '</div>') {
                console.log('Found last </div> at line ' + (i+1) + ': ' + lines[i]);
                break;
            }
        }
    }
}

fs.writeFileSync("src/app/admin/page.tsx", content, "utf8");
console.log('Done');