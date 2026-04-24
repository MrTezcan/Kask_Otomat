const fs = require('fs');
const file = 'src/app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const data = \{ name: newKioskName, location: newKioskAddress, latitude: newKioskLocation\[0\], longitude: newKioskLocation\[1\], hizmet_fiyati: parseInt\(newKioskPrice\), last_seen: new Date\(\)\.toISOString\(\), kiosk_video_url: newKioskVideoUrl \}/,
  "const data = { name: newKioskName, location: newKioskAddress, latitude: newKioskLocation[0], longitude: newKioskLocation[1], hizmet_fiyati: parseInt(newKioskPrice), last_seen: new Date().toISOString() }"
);

content = content.replace(
  /const \{ error \} = editingDevice \? await supabase\.from\('devices'\)\.update\(data\)\.eq\('id', editingDevice\.id\) : await supabase\.from\('devices'\)\.insert\(\[\{ \.\.\.data, status: 'online' \}\]\)/,
  "let error;\n        if (editingDevice) {\n             const res = await supabase.from('devices').update(data).eq('id', editingDevice.id)\n             error = res.error\n        } else {\n             const res = await supabase.from('devices').insert([{ ...data, status: 'online' }])\n             error = res.error\n        }"
);

content = content.replace(
  /if \(\!error\) \{ alert\('Kaydedildi'\); setShowAddKioskModal\(false\); setEditingDevice\(null\); fetchDevices\(\) \}/,
  "if (!error) { \n             alert('Kaydedildi'); \n             setShowAddKioskModal(false); \n             setEditingDevice(null); \n             fetchDevices() \n        } else {\n             alert('Hata olustu: ' + error.message)\n             console.error('Supabase Error:', error)\n        }"
);

fs.writeFileSync(file, content, 'utf8');
