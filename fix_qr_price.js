const fs = require("fs");
let content = fs.readFileSync("src/app/user/page.tsx", "utf8");

// 1. Add hizmet_fiyati to the Device type
content = content.replace(
    `type Device = {
    id: string
    name: string
    location: string
    latitude?: number
    longitude?: number
    status: 'online' | 'offline' | 'maintenance'
}`,
    `type Device = {
    id: string
    name: string
    location: string
    latitude?: number
    longitude?: number
    status: 'online' | 'offline' | 'maintenance'
    hizmet_fiyati: number
}`
);

// 2. Add QrScanner dynamic import after KioskMap
content = content.replace(
    `const KioskMap = nextDynamic(() => import('@/components/KioskMap'), { ssr: false })`,
    `const KioskMap = nextDynamic(() => import('@/components/KioskMap'), { ssr: false })
const QrScannerComponent = nextDynamic(() => import('@/components/QrScanner'), { ssr: false })`
);

// 3. Add showCameraScanner state after showQrModal
content = content.replace(
    `    const [showQrModal, setShowQrModal] = useState(false)`,
    `    const [showQrModal, setShowQrModal] = useState(false)
    const [showCameraScanner, setShowCameraScanner] = useState(false)`
);

// 4. Fix handleQrPayment to use hizmet_fiyati
content = content.replace(
    `        const finalPrice = 50`,
    `        const finalPrice = device.hizmet_fiyati || 50`
);

// 5. Fix button text from hardcoded 50 TL to use device price
content = content.replace(
    `{paymentProcessing ? '\\u0130\\u015fleniyor...' : '50 TL \\u00d6de ve Ba\\u015flat'}`,
    `{paymentProcessing ? '\\u0130\\u015fleniyor...' : (devices.find(d => d.id === qrDeviceId)?.hizmet_fiyati || 50) + ' TL \\u00d6de ve Ba\\u015flat'}`
);

// 6. Fix dropdown to show real prices
content = content.replace(
    `                                    {devices.filter(d => d.status === 'online').map(d => (
                                        <option key={d.id} value={d.id}>{d.name} - 50 TL</option>
                                    ))}`,
    `                                    {devices.filter(d => d.status === 'online').map(d => (
                                        <option key={d.id} value={d.id}>{d.name} - {d.hizmet_fiyati || 50} TL</option>
                                    ))}`
);

// 7. Add QR scan button next to manual select dropdown in modal
// Find the select div and add camera button before it
const cameraBtn = `
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => setShowCameraScanner(!showCameraScanner)}
                                    className="flex-1 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-200 text-sm flex items-center justify-center gap-2 active:scale-95">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 7h.01M7 12h.01M12 7h.01M12 12h.01M17 7h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01" /></svg>
                                    {showCameraScanner ? 'QR Kapat' : 'Kamera ile Tara'}
                                </button>
                            </div>
                            {showCameraScanner && (
                                <div className="mb-3">
                                    <QrScannerComponent
                                        onScan={(text) => {
                                            // QR code should contain device id
                                            const matched = devices.find(d => d.id === text || d.name === text)
                                            if (matched) {
                                                setQrDeviceId(matched.id)
                                                setShowCameraScanner(false)
                                            } else {
                                                alert('QR Kod tan\\u0131nmad\\u0131. Manuel se\\u00e7im yap\\u0131n.')
                                                setShowCameraScanner(false)
                                            }
                                        }}
                                        onClose={() => setShowCameraScanner(false)}
                                    />
                                </div>
                            )}`;

content = content.replace(
    `                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Makine Se\\u00e7</label>`,
    `                        <div className="space-y-4">
                            ${cameraBtn}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Manuel Se\\u00e7</label>`
);

fs.writeFileSync("src/app/user/page.tsx", content, "utf8");
console.log("Done! Checking...");

// Verify key changes
const c = fs.readFileSync("src/app/user/page.tsx", "utf8");
if (c.includes("hizmet_fiyati")) console.log("OK: hizmet_fiyati found");
if (c.includes("QrScannerComponent")) console.log("OK: QrScannerComponent found");
if (c.includes("showCameraScanner")) console.log("OK: showCameraScanner found");