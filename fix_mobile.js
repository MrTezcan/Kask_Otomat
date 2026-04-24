const fs = require('fs');
const file = 'src/app/user/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: The root div needs proper mobile layout - add overflow-x-hidden and fix padding
content = content.replace(
    'className="min-h-screen pb-24 relative bg-slate-50"',
    'className="min-h-screen pb-24 relative bg-slate-50 overflow-x-hidden"'
);

// Fix 2: Main area - ensure proper mobile padding and no horizontal overflow  
content = content.replace(
    'className="px-4 space-y-4 mt-4"',
    'className="px-4 space-y-4 mt-4 max-w-lg mx-auto"'
);

// Fix 3: Bottom nav - ensure it spans full width properly on mobile
content = content.replace(
    'className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pt-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-[9999]"',
    'className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pt-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-[9999]" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}'
);

// Fix 4: Bottom nav inner flex - use full width instead of max-w-sm
content = content.replace(
    'className="flex justify-around items-end pb-2 max-w-sm mx-auto"',
    'className="flex justify-around items-center pb-2 px-2"'
);

// Fix 5: QR card min-height is too large for small mobile screens
content = content.replace(
    'className="w-full bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[42vh]"',
    'className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center"'
);

// Fix 6: Header - remove px-6, use px-4 for consistency on mobile
content = content.replace(
    'className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-100"',
    'className="px-4 pt-safe pt-4 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-100"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');