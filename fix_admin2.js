const fs = require('fs');
const file = 'src/app/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const data = \{ name: newKioskName, location: newKioskAddress, latitude: newKioskLocation\[0\], longitude: newKioskLocation\[1\], hizmet_fiyati: parseInt\(newKioskPrice\), last_seen: new Date\(\)\.toISOString\(\) \}/,
  "const data = { name: newKioskName, location: newKioskAddress, latitude: newKioskLocation[0], longitude: newKioskLocation[1], hizmet_fiyati: parseInt(newKioskPrice), last_seen: new Date().toISOString(), video_url: newKioskVideoUrl }"
);

fs.writeFileSync(file, content, 'utf8');
