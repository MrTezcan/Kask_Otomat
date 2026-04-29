const fs = require('fs');
const p = 'C:/Users/PC/.gemini/antigravity/brain/5487fdf0-0c31-47e4-a90f-4cd3d9f32d01/Kask_Otomat_Tezcan/tablet-app/App.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(/filter: id=eq\.\\/g, "filter: 'id=eq.' + DEVICE_ID");
txt = txt.replace(/value=\{[\s\S]*?\/\/pay\?device_id=&amount=&perfume=\}/g, "value={`freshrider://pay?device_id=${DEVICE_ID}&amount=${totalAmount}&perfume=${wantsPerfume}`}");
txt = txt.replace(/value=\{https:\/\/freshrider\.com\/cc-pay\?device_id=&amount=&perfume=\}/g, "value={`https://freshrider.com/cc-pay?device_id=${DEVICE_ID}&amount=${totalAmount}&perfume=${wantsPerfume}`}");

fs.writeFileSync(p, txt);
console.log('App.tsx syntax fixed.');