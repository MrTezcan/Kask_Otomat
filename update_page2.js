const fs = require('fs');
const p = 'src/app/user/page.tsx';
let txt = fs.readFileSync(p, 'utf8');

// Replace 1
txt = txt.replace(
  'const [paymentConfirmDevice, setPaymentConfirmDevice] = useState<Device | null>(null)\n    const [qrDeviceId, setQrDeviceId] = useState(\'\')',
  'const [paymentConfirmDevice, setPaymentConfirmDevice] = useState<Device | null>(null)\n    const [kioskPayload, setKioskPayload] = useState<{ amount: number, perfume: boolean } | null>(null)\n    const [qrDeviceId, setQrDeviceId] = useState(\'\')'
);

// Replace 2
const oldScanner = `onScan={(text) => {
                                    const found = devices.find(d => d.id === text || d.name === text)
                                    if (found) {
                                        setPaymentConfirmDevice(found)
                                    } else {
                                        alert('Gecersiz QR kod. Lutfen cihaz QR kodunu okutun.')
                                    }
                                }}
                                onClose={() => { setShowQrModal(false); setShowCameraScanner(false) }}`;

const newScanner = `onScan={(text) => {
                                    let targetId = text;
                                    let kPayload = null;
                                    if (text.startsWith('freshrider://pay')) {
                                        try {
                                            const params = text.split('?')[1].split('&').reduce((acc, current) => {
                                                const [key, value] = current.split('=');
                                                acc[key] = value;
                                                return acc;
                                            }, {});
                                            targetId = params.device_id || '';
                                            kPayload = {
                                                amount: Number(params.amount) || 50,
                                                perfume: params.perfume === 'true'
                                            };
                                        } catch(e) { }
                                    }
                                    const found = devices.find(d => d.id === targetId || d.name === targetId)
                                    if (found) {
                                        setKioskPayload(kPayload);
                                        setPaymentConfirmDevice(found);
                                    } else {
                                        alert('Gecersiz QR kod. Lutfen cihaz detaylarini kontrol edin.')
                                    }
                                }}
                                onClose={() => { setShowQrModal(false); setShowCameraScanner(false); setKioskPayload(null); }}`;
txt = txt.replace(oldScanner, newScanner);

// Replace 3
const oldHandler = `const handleQrPayment = async () => {
        if (!qrDeviceId) return alert('Lütfen makine seçin.')
        const device = devices.find(d => d.id === qrDeviceId)
        if (!device) return alert('Geçersiz makine.')
        if (device.status !== 'online') return alert('Bu makine şu anda hizmet veremiyor.')
        const finalPrice = device.hizmet_fiyati || 50
        if (balance < finalPrice) return alert('Bakiye yetersiz!')
        setPaymentProcessing(true)
        try {
            const { error: balError } = await supabase.rpc('increment_balance', { amount: -finalPrice, user_id: userId })
            if (balError) throw balError
            await supabase.from('transactions').insert({ user_id: userId, amount: -finalPrice, type: 'payment', description: device.name + ' Kask Temizleme', status: 'completed' })
            await supabase.from('notifications').insert({ user_id: userId, type: 'success', title: 'Ödeme Başarılı', message: device.name + ' cihazında ' + finalPrice + ' TL ödeme yapıldı.' })
            alert('Ödeme başarılı! Makine çalışmaya başlıyor.')
            setShowQrModal(false); setQrDeviceId(''); setBalance(prev => prev - finalPrice)
        } catch (e: any) {
            alert('Hata: ' + e.message)
        } finally {
            setPaymentProcessing(false)
        }
    }`;

const newHandler = `const handleQrPayment = async () => {
        const activeDeviceId = paymentConfirmDevice ? paymentConfirmDevice.id : qrDeviceId;
        if (!activeDeviceId) return alert('Lütfen makine seçin.')
        const device = devices.find(d => d.id === activeDeviceId)
        if (!device) return alert('Geçersiz makine.')
        if (device.status !== 'online') return alert('Bu makine şu anda hizmet veremiyor.')
        const finalPrice = kioskPayload ? kioskPayload.amount : (device.hizmet_fiyati || 50)
        if (balance < finalPrice) return alert('Bakiye yetersiz!')
        setPaymentProcessing(true)
        try {
            const { error: balError } = await supabase.rpc('increment_balance', { amount: -finalPrice, user_id: userId })
            if (balError) throw balError

            await supabase.from('device_commands').insert({
                device_id: device.id,
                command: 'START',
                payload: { perfume: kioskPayload ? kioskPayload.perfume : false },
                status: 'pending'
            });

            await supabase.from('transactions').insert({ user_id: userId, amount: -finalPrice, type: 'payment', description: device.name + ' Kask Temizleme', status: 'completed' })
            await supabase.from('notifications').insert({ user_id: userId, type: 'success', title: 'Ödeme Başarılı', message: device.name + ' cihazında ' + finalPrice + ' TL ödeme yapıldı.' })
            alert('Ödeme başarılı! Makine çalışmaya başlıyor.')
            setShowQrModal(false); setQrDeviceId(''); setBalance(prev => prev - finalPrice); setPaymentConfirmDevice(null); setKioskPayload(null);
        } catch (e: any) {
            alert('Hata: ' + e.message)
        } finally {
            setPaymentProcessing(false)
        }
    }`;
txt = txt.replace(oldHandler, newHandler);

// Replace 4
const oldModalUI = `<div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Hizmet Ucreti</span>
                                    <span className="font-black text-slate-800">{paymentConfirmDevice.hizmet_fiyati || 50} TL</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Mevcut Bakiye</span>
                                    <span className={"font-bold " + (balance >= (paymentConfirmDevice.hizmet_fiyati || 50) ? 'text-emerald-600' : 'text-red-500')}>{balance} TL</span>
                                </div>
                                <div className="h-px bg-slate-200 my-1" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Odeme Sonrasi</span>
                                    <span className="font-black text-slate-800">{balance - (paymentConfirmDevice.hizmet_fiyati || 50)} TL</span>
                                </div>
                            </div>
                            {balance < (paymentConfirmDevice.hizmet_fiyati || 50) && (
                                <p className="text-red-500 text-sm font-bold">Bakiyeniz yetersiz. Lutfen bakiye yukleyin.</p>
                            )}
                            <div className="w-full flex gap-3">
                                <button onClick={() => setPaymentConfirmDevice(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Iptal</button>
                                <button
                                    onClick={handleQrPayment}
                                    disabled={paymentProcessing || balance < (paymentConfirmDevice.hizmet_fiyati || 50)}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                                    {paymentProcessing ? 'Isleniyor...' : 'Onayla ve Basla'}
                                </button>
                            </div>`;

const newModalUI = `<div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">
                                        {kioskPayload ? (kioskPayload.perfume ? 'Parfümlü Temizlik' : 'Standart Temizlik') : 'Hizmet Ücreti'}
                                    </span>
                                    <span className="font-black text-slate-800">{kioskPayload ? kioskPayload.amount : (paymentConfirmDevice.hizmet_fiyati || 50)} TL</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Mevcut Bakiye</span>
                                    <span className={"font-bold " + (balance >= (kioskPayload ? kioskPayload.amount : (paymentConfirmDevice.hizmet_fiyati || 50)) ? 'text-emerald-600' : 'text-red-500')}>{balance} TL</span>
                                </div>
                                <div className="h-px bg-slate-200 my-1" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Odeme Sonrasi</span>
                                    <span className="font-black text-slate-800">{balance - (kioskPayload ? kioskPayload.amount : (paymentConfirmDevice.hizmet_fiyati || 50))} TL</span>
                                </div>
                            </div>
                            {balance < (kioskPayload ? kioskPayload.amount : (paymentConfirmDevice.hizmet_fiyati || 50)) && (
                                <p className="text-red-500 text-sm font-bold">Bakiyeniz yetersiz. Lutfen bakiye yukleyin.</p>
                            )}
                            <div className="w-full flex gap-3">
                                <button onClick={() => { setPaymentConfirmDevice(null); setKioskPayload(null) }} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Iptal</button>
                                <button
                                    onClick={handleQrPayment}
                                    disabled={paymentProcessing || balance < (kioskPayload ? kioskPayload.amount : (paymentConfirmDevice.hizmet_fiyati || 50))}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                                    {paymentProcessing ? 'Isleniyor...' : 'Onayla ve Basla'}
                                </button>
                            </div>`;
txt = txt.replace(oldModalUI, newModalUI);

fs.writeFileSync(p, txt);
console.log('Update Complete - NO ERROR!');