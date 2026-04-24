const fs = require('fs');
const p = 'src/app/admin/page.tsx';
let txt = fs.readFileSync(p, 'utf8');

// 1. Device Type
txt = txt.replace(
  "type Device = { id: string; name: string; location: string; latitude?: number; longitude?: number; status: 'online' | 'offline' | 'maintenance'; hizmet_fiyati: number; last_seen: string; firmware_version?: string; ota_status?: string; ota_updated_at?: string }",
  "type Device = { id: string; name: string; location: string; latitude?: number; longitude?: number; status: 'online' | 'offline' | 'maintenance'; hizmet_fiyati: number; last_seen: string; firmware_version?: string; ota_status?: string; ota_updated_at?: string; kiosk_video_url?: string; }"
);

// 2. Kiosk State Variables
txt = txt.replace(
  "const [newKioskName, setNewKioskName] = useState(''); const [newKioskAddress, setNewKioskAddress] = useState(''); const [newKioskPrice, setNewKioskPrice] = useState('50'); const [newKioskLocation, setNewKioskLocation] = useState<[number, number] | null>(null)",
  "const [newKioskName, setNewKioskName] = useState(''); const [newKioskAddress, setNewKioskAddress] = useState(''); const [newKioskPrice, setNewKioskPrice] = useState('50'); const [newKioskLocation, setNewKioskLocation] = useState<[number, number] | null>(null); const [newKioskVideoUrl, setNewKioskVideoUrl] = useState('');"
);

// 3. handleSaveKiosk
txt = txt.replace(
  "const data = { name: newKioskName, location: newKioskAddress, latitude: newKioskLocation[0], longitude: newKioskLocation[1], hizmet_fiyati: parseInt(newKioskPrice), last_seen: new Date().toISOString() }",
  "const data = { name: newKioskName, location: newKioskAddress, latitude: newKioskLocation[0], longitude: newKioskLocation[1], hizmet_fiyati: parseInt(newKioskPrice), last_seen: new Date().toISOString(), kiosk_video_url: newKioskVideoUrl }"
);

// 4. Edit triggers
// Add new
txt = txt.replace(
  "onClick={() => { setEditingDevice(null); setNewKioskLocation(null); setShowAddKioskModal(true) }}",
  "onClick={() => { setEditingDevice(null); setNewKioskLocation(null); setNewKioskVideoUrl(''); setShowAddKioskModal(true) }}"
);
// Edit existing
txt = txt.replace(
  "onClick={() => { setEditingDevice(device); setNewKioskName(device.name); setNewKioskPrice(device.hizmet_fiyati.toString()); setNewKioskLocation([device.latitude!, device.longitude!]); setNewKioskAddress(device.location); setShowAddKioskModal(true) }}",
  "onClick={() => { setEditingDevice(device); setNewKioskName(device.name); setNewKioskPrice(device.hizmet_fiyati.toString()); setNewKioskLocation([device.latitude!, device.longitude!]); setNewKioskAddress(device.location); setNewKioskVideoUrl(device.kiosk_video_url || ''); setShowAddKioskModal(true) }}"
);

// 5. Form Fields
txt = txt.replace(
  "<div><label className=\"text-xs font-bold text-slate-500 uppercase mb-1 block\">Hizmet Fiyati (TL)</label><input type=\"number\" value={newKioskPrice} onChange={e => setNewKioskPrice(e.target.value)} className=\"modern-input\" /></div>",
  "<div><label className=\"text-xs font-bold text-slate-500 uppercase mb-1 block\">Hizmet Fiyati (TL)</label><input type=\"number\" value={newKioskPrice} onChange={e => setNewKioskPrice(e.target.value)} className=\"modern-input\" /></div><div><label className=\"text-xs font-bold text-slate-500 uppercase mb-1 block\">Tablet Bekleme Videosu URL</label><input type=\"text\" value={newKioskVideoUrl} onChange={e => setNewKioskVideoUrl(e.target.value)} className=\"modern-input\" placeholder=\"https://...\" /></div>"
);

fs.writeFileSync(p, txt);
console.log('Admin Page Updated with Kiosk Video feature.');