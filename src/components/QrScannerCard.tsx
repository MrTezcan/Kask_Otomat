import React from 'react';
import { QrCode } from 'lucide-react';

export default function QrScannerCard({ onScan }: { onScan: () => void }) {
    return (
        <div className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[40vh] animate-fade-in-up mt-4">
            <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                <QrCode className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">QR �deme</h3>
            <p className="text-slate-500 text-center text-sm mb-6 max-w-[250px]">Kask otomat�n�n �zerindeki QR kodu okutun veya makine kodunu girerek �demenizi yap�n.</p>
            <button onClick={onScan} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5" /> Kod Girerek �de
            </button>
        </div>
    );
}
