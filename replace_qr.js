const fs = require('fs');
const file = 'src/app/user/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const \[qrDeviceId, setQrDeviceId\] = useState\(''\)\s+const \[paymentProcessing, setPaymentProcessing\] = useState\(false\)/,
    "const [qrDeviceId, setQrDeviceId] = useState('')\n    const [qrDynamicAmount, setQrDynamicAmount] = useState<number | null>(null)\n    const [qrWantsPerfume, setQrWantsPerfume] = useState<boolean>(false)\n    const [paymentProcessing, setPaymentProcessing] = useState(false)"
);

content = content.replace(
    /const device = devices\.find\(d => d\.id === qrDeviceId\)/,
    "const device = paymentConfirmDevice || devices.find(d => d.id === qrDeviceId)"
);

content = content.replace(
    /if \(\!qrDeviceId\) return alert\('Lütfen makine seçin.'\)\s+const device = paymentConfirmDevice \|\| devices\.find\(d => d\.id === qrDeviceId\)/,
    "const device = paymentConfirmDevice || devices.find(d => d.id === qrDeviceId)\n        if (!device) return alert('Lütfen makine seçin.')"
);

content = content.replace(
    /const finalPrice = device\.hizmet_fiyati \|\| 50/,
    "const finalPrice = qrDynamicAmount || device.hizmet_fiyati || 50"
);

content = content.replace(
    /description: device\.name \+ ' Kask Temizleme'/,
    "description: device.name + ' Kask Temizleme' + (qrWantsPerfume ? ' + Parfüm' : '')"
);

content = content.replace(
    /alert\('Ödeme başarılı! Makine çalışmaya başlıyor.'\)\s+setShowQrModal\(false\); setQrDeviceId\(''\); setBalance\(prev => prev - finalPrice\)/,
    "await supabase.from('device_commands').insert({\n                device_id: device.id,\n                command: 'START_WASH',\n                payload: { perfume: qrWantsPerfume, amount: finalPrice }\n            });\n            alert('Ödeme başarılı! Makine çalışmaya başlıyor.')\n            setShowQrModal(false); setQrDeviceId(''); setQrDynamicAmount(null); setQrWantsPerfume(false); setPaymentConfirmDevice(null); setBalance(prev => prev - finalPrice)"
);

const onScanStr = "onScan={(text) => {\n" +
"                                    let deviceIdToFind = text;\n" +
"                                    if (text.startsWith('freshrider://pay')) {\n" +
"                                        try {\n" +
"                                            const urlObj = new URL(text.replace('freshrider://', 'http://localhost/'));\n" +
"                                            deviceIdToFind = urlObj.searchParams.get('device_id') || '';\n" +
"                                            const amount = urlObj.searchParams.get('amount');\n" +
"                                            const perfume = urlObj.searchParams.get('perfume');\n" +
"                                            if (amount) setQrDynamicAmount(Number(amount));\n" +
"                                            setQrWantsPerfume(perfume === 'true');\n" +
"                                        } catch (e) { console.error(e); }\n" +
"                                    } else {\n" +
"                                        setQrDynamicAmount(null);\n" +
"                                        setQrWantsPerfume(false);\n" +
"                                    }\n" +
"                                    const found = devices.find(d => d.id === deviceIdToFind || d.name === deviceIdToFind)\n" +
"                                    if (found) {\n" +
"                                        setPaymentConfirmDevice(found)\n" +
"                                    } else {\n" +
"                                        alert('Gecersiz QR kod. Lutfen cihaz QR kodunu okutun.')\n" +
"                                    }\n" +
"                                }}";

content = content.replace(
    /onScan=\{\(text\) => \{[\s\S]*?\}\}/,
    onScanStr
);

content = content.replace(
    /Hizmet Ucreti<\/span>\s*<span className="font-black text-slate-800">\{paymentConfirmDevice\.hizmet_fiyati \|\| 50\} TL<\/span>/,
    "Hizmet Ucreti {qrWantsPerfume ? '(Parfümlü)' : ''}</span>\n                                    <span className=\"font-black text-slate-800\">{qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50} TL</span>"
);

content = content.replace(
    /balance >= \(paymentConfirmDevice\.hizmet_fiyati \|\| 50\)/g,
    "balance >= (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50)"
);

content = content.replace(
    /balance - \(paymentConfirmDevice\.hizmet_fiyati \|\| 50\)/g,
    "balance - (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50)"
);

content = content.replace(
    /balance < \(paymentConfirmDevice\.hizmet_fiyati \|\| 50\)/g,
    "balance < (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50)"
);

fs.writeFileSync(file, content, 'utf8');
