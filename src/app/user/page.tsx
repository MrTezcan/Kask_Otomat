'use client'
// Deployment Trigger: Final UI & Handshake Fix
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Bell, ChevronRight, MapPin, User, Wallet, Check, QrCode, Sliders, Menu, X, Send } from 'lucide-react'
import nextDynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

const KioskMap = nextDynamic(() => import('@/components/KioskMap'), { ssr: false })
const QrScannerComponent = nextDynamic(() => import('@/components/QrScanner'), { ssr: false })

type Device = {
    id: string
    name: string
    location: string
    latitude?: number
    longitude?: number
    status: 'online' | 'offline' | 'maintenance'
    hizmet_fiyati: number
    last_seen?: string
    parfum_fiyati?: number
}

export default function UserDashboard() {
    const router = useRouter()
    const { language, setLanguage } = useLanguage()

    const getInitialTab = (): 'home' | 'map' => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.replace('#', '')
            if (hash === 'map') return 'map'
        }
        return 'home'
    }
    const [activeTab, setActiveTabState] = useState<'home' | 'map'>(getInitialTab)
    const setActiveTab = (tab: 'home' | 'map') => {
        setActiveTabState(tab)
        window.location.hash = tab
    }
    const [showQrModal, setShowQrModal] = useState(false)
    const [showCameraScanner, setShowCameraScanner] = useState(false)
    const [paymentConfirmDevice, setPaymentConfirmDevice] = useState<Device | null>(null)
    const [qrDeviceId, setQrDeviceId] = useState('')
    const [qrDynamicAmount, setQrDynamicAmount] = useState<number | null>(null)
    const [qrWantsPerfume, setQrWantsPerfume] = useState<boolean>(false)
    const [paymentProcessing, setPaymentProcessing] = useState<string | false>(false)
    const [balance, setBalance] = useState(0)
    const [name, setName] = useState('')
    const [userId, setUserId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [showSettings, setShowSettings] = useState(false)
    const [settingsTab, setSettingsTab] = useState<'account' | 'support'>('account')
    const [userLocation, setUserLocation] = useState<[number, number]>([41.0082, 28.9784])
    const [devices, setDevices] = useState<Device[]>([])
    const [ticketSubject, setTicketSubject] = useState('')
    const [ticketMessage, setTicketMessage] = useState('')
    const [tickets, setTickets] = useState<any[]>([])
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [chatReplies, setChatReplies] = useState<any[]>([])
    const chatScrollRef = useRef<HTMLDivElement>(null)
    const [chatInput, setChatInput] = useState('')
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
    }

    const kiosks = devices.map((device, index) => {
        const lat = device.latitude || (41.0082 + (index * 0.005))
        const lng = device.longitude || (28.9784 + (index * 0.005))
        return { id: device.id, name: device.name, lat, lng, status: device.status, distance: userLocation ? calculateDistance(userLocation[0], userLocation[1], lat, lng) : 0 }
    })

    useEffect(() => {
        fetchProfile()
        fetchDevices()
        const sub = supabase.channel('user-bal').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => setBalance(payload.new.balance)).subscribe()
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                () => { }, { enableHighAccuracy: true, timeout: 5000 }
            )
            navigator.geolocation.watchPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                () => { }, { enableHighAccuracy: true }
            )
        }
        return () => { supabase.removeChannel(sub) }
    }, [])

    useEffect(() => { if (showSettings && settingsTab === 'support') fetchTickets() }, [settingsTab, showSettings])

    useEffect(() => {
        if (!userId) return
        const fetchNotifications = async () => {
            const { data: notifs } = await supabase.from('notifications')
                .select('*').or(`user_id.eq.${userId},user_id.is.null`)
                .order('created_at', { ascending: false }).limit(20)
            const { data: reads } = await supabase.from('notification_reads').select('notification_id').eq('user_id', userId)
            const readIds = new Set((reads || []).map((r: any) => r.notification_id))
            if (notifs) {
                const merged = notifs.map((n: any) => ({ ...n, is_read: n.user_id ? n.is_read : readIds.has(n.id) }))
                merged.sort((a: any, b: any) => Number(a.is_read) - Number(b.is_read) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                setNotifications(merged)
            }
        }
        fetchNotifications()
        const ticketSub = supabase.channel('user-tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${userId}` }, () => { fetchTickets() }).subscribe()
        const notifSub = supabase.channel('user-notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => { if (payload.new.user_id === userId || payload.new.user_id === null) fetchNotifications() }).subscribe()
        const chatSub = supabase.channel('user-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies' }, (payload: any) => {
            if (selectedTicket && payload.new.ticket_id === selectedTicket.id) fetchReplies(selectedTicket.id)
        }).subscribe()
        return () => { supabase.removeChannel(ticketSub); supabase.removeChannel(notifSub); supabase.removeChannel(chatSub) }
    }, [userId, selectedTicket])

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) { setName(data.full_name || user.email?.split('@')[0]); setUserId(user.id); setBalance(data.balance); if (data.role === 'admin') setIsAdmin(true) }
    }

    const fetchDevices = async () => {
        const { data } = await supabase.from('devices').select('*')
        if (data) setDevices(data)
    }

    const fetchTickets = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        if (data) setTickets(data)
    }

    const fetchReplies = async (ticketId: string) => {
        const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
        if (data) { setChatReplies(data); setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight }, 50) }
    }

    const handleQrPayment = async () => {
        const device = paymentConfirmDevice || devices.find(d => d.id === qrDeviceId)
        if (!device) return alert('Lütfen makine seçin.')
        if (device.status !== 'online') return alert('Bu makine şu anda hizmet veremiyor.')
        
        // Cihaz çevrimdışı kontrolü (5 dakikadan eski ping)
        if (device.last_seen) {
            const lastSeenDate = new Date(device.last_seen);
            const now = new Date();
            if (now.getTime() - lastSeenDate.getTime() > 5 * 60 * 1000) {
                return alert('Makine ile bağlantı kurulamıyor. Makine kapalı veya interneti kesik olabilir.');
            }
        }

        const finalPrice = qrDynamicAmount || device.hizmet_fiyati || 50
        if (balance < finalPrice) return alert('Bakiye yetersiz!')
        
        setPaymentProcessing('processing')
        try {
            // 1. Bakiyeyi çek
            const { error: balError } = await supabase.rpc('increment_balance', { amount: -finalPrice, user_id: userId })
            if (balError) throw balError
            
            // 2. İşlemi kaydet
            await supabase.from('transactions').insert({ user_id: userId, amount: -finalPrice, type: 'payment', description: device.name + ' Kask Temizleme' + (qrWantsPerfume ? ' + Parfüm' : ''), status: 'completed', payment_method: 'wallet', device_id: device.id })
            
            // 3. Komutu gönder
            const { data: cmdData, error: cmdError } = await supabase.from('device_commands').insert({
                device_id: device.id,
                command: 'START_WASH',
                payload: { perfume: qrWantsPerfume, amount: finalPrice, perfume_price: (device.parfum_fiyati || 5) }
            }).select();

            if (cmdError) throw cmdError;

            // 4. Bağlantı Bekleme (Double Handshake)
            setPaymentProcessing('connecting');
            
            const handshakeResult = await new Promise((resolve) => {
                let isResolved = false;
                
                let pollingInterval: any;
                const safeResolve = (val: string) => {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeoutId);
                    if (pollingInterval) clearInterval(pollingInterval);
                    resolve(val);
                };

                let timeoutId = setTimeout(() => {
                    safeResolve('timeout');
                }, 45000); // 45 saniye bekle

                // 1. POLLING (GARANTI YONTEM): Her 2 saniyede bir manuel kontrol et
                pollingInterval = setInterval(async () => {
                    const { data: checkData } = await supabase
                        .from('device_commands')
                        .select('status, executed_at')
                        .eq('id', cmdData?.[0]?.id)
                        .single();
                    
                    if (checkData && (checkData.executed_at || checkData.status === 'processing' || checkData.status === 'completed')) {
                        console.log('[Handshake] Polling ile basari tespit edildi!');
                        safeResolve('success');
                    }
                    
                    // Ayrica cihazın work_status durumuna da bak
                    const { data: devCheck } = await supabase
                        .from('devices')
                        .select('work_status')
                        .eq('id', device.id)
                        .single();
                    
                    if (devCheck && devCheck.work_status && devCheck.work_status !== 'idle') {
                        console.log('[Handshake] Polling ile cihaz durumu degisimi tespit edildi!');
                        safeResolve('success');
                    }
                }, 2000);

                // 2. REALTIME (HIZLI YONTEM): Degisiklik geldigi an yakala
                supabase.channel('handshake_' + device.id)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices', filter: `id=eq.${device.id}` }, (payload) => {
                        if (payload.new.work_status && payload.new.work_status !== 'idle') {
                            safeResolve('success');
                        }
                    })
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_commands', filter: `id=eq.${cmdData?.[0]?.id}` }, (payload) => {
                        if (payload.new.executed_at || payload.new.status === 'processing' || payload.new.status === 'completed') {
                            safeResolve('success');
                        }
                    })
                    .subscribe();
            });

            supabase.removeAllChannels(); // Dinlemeyi kapat

            if (handshakeResult === 'timeout') {
                // İADE İŞLEMİ (REFUND)
                setPaymentProcessing('refunding');
                await supabase.rpc('increment_balance', { amount: finalPrice, user_id: userId });
                await supabase.from('transactions').insert({ user_id: userId, amount: finalPrice, type: 'deposit', description: 'İade: Makine Yanıt Vermedi', status: 'completed', payment_method: 'wallet', device_id: device.id });
                await supabase.from('device_commands').update({ status: 'failed', error_msg: 'Handshake timeout' }).eq('id', cmdData[0].id);
                
                alert('Makine yanıt vermedi. İşlem iptal edildi ve paranız cüzdanınıza iade edildi.');
                fetchProfile(); // Bakiyeyi yenile
            } else {
                // BAŞARILI
                await supabase.from('notifications').insert({ user_id: userId, type: 'success', title: 'İşlem Başladı', message: device.name + ' cihazında yıkama başladı.' });
                alert('İşlem başladı! Makine çalışıyor.');
            }

            setShowQrModal(false); setQrDeviceId(''); setQrDynamicAmount(null); setQrWantsPerfume(false); setPaymentConfirmDevice(null);
            fetchProfile(); // Bakiyeyi yenile
        } catch (e: any) {
            alert('Hata: ' + e.message)
            fetchProfile();
        } finally {
            setPaymentProcessing(false)
        }
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase.from('tickets').insert({ user_id: user.id, subject: ticketSubject, message: ticketMessage })
        if (!error) { setTicketSubject(''); setTicketMessage(''); fetchTickets() }
    }

    const handleSendReply = async () => {
        if (!chatInput || !selectedTicket) return
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('ticket_replies').insert({ ticket_id: selectedTicket.id, user_id: user?.id, message: chatInput, is_admin: false })
        if (!error) { setChatInput(''); fetchReplies(selectedTicket.id) }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 6) return alert('Şifre en az 6 karakter olmalıdır.')
        if (newPassword !== confirmPassword) return alert('Yeni şifreler eşleşmiyor.')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) return
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword })
        if (signInError) return alert('Eski şifre yanlış.')
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) { alert('Şifre güncellenirken hata: ' + error.message) }
        else { alert('Şifreniz güncellendi.'); setOldPassword(''); setNewPassword(''); setConfirmPassword('') }
    }

    const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

    const markAsRead = async (notif: any) => {
        if (!notif.is_read) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
            if (notif.user_id) {
                await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
            } else {
                await supabase.from('notification_reads').upsert({ user_id: userId, notification_id: notif.id }, { onConflict: 'user_id,notification_id' })
            }
        }
        if (notif.metadata?.ticket_id) {
            const ticket = tickets.find(t => t.id === notif.metadata.ticket_id)
            if (ticket) { setSelectedTicket(ticket); fetchReplies(ticket.id); setSettingsTab('support'); setShowSettings(true); setShowNotifications(false) }
        } else { setSelectedNotification(notif) }
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    }

    return (
        <div className="min-h-screen bg-slate-50" style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <header className="px-4 pt-4 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">{name.charAt(0).toUpperCase()}</div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Merhaba</p>
                        <h1 className="text-lg font-bold text-slate-800 leading-none">{name}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isAdmin && <button onClick={() => router.push('/admin')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Sliders className="w-5 h-5" /></button>}
                    <button onClick={() => setShowNotifications(true)} className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 relative">
                        <Bell className="w-5 h-5" />
                        {notifications.some(n => !n.is_read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    </button>
                    <button onClick={() => { setShowSettings(true); setSettingsTab('account') }} className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600"><Menu className="w-5 h-5" /></button>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 pt-4 space-y-4">
                {/* Balance Card */}
                <div className="w-full p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">CÜZDANIM</span>
                            <Wallet className="w-5 h-5 text-indigo-200" />
                        </div>
                        <h2 className="text-4xl font-black mb-6 tracking-tight">{balance} <span className="text-2xl font-medium opacity-80">TL</span></h2>
                        <button onClick={() => router.push('/user/wallet')} className="w-full py-3 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold hover:bg-white/30">
                            + Bakiye Ekle
                        </button>
                    </div>
                </div>

                {/* Map Tab */}
                {activeTab === 'map' && (
                    <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-100" style={{ height: '55vh' }}>
                        <KioskMap userLocation={userLocation} kiosks={kiosks} />
                    </div>
                )}

                {/* QR Payment - Home Tab */}
                {activeTab === 'home' && (
                    <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-10">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <QrCode className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">QR Ödeme</h3>
                        <p className="text-slate-500 text-center text-sm mb-6 max-w-xs leading-relaxed">
                            Kask otomatinin üzerindeki QR kodu okutun veya makine kodunu girerek ödemenizi yapın.
                        </p>
                        <button
                            onClick={() => setShowQrModal(true)}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <QrCode className="w-5 h-5" />
                            Kod Girerek Öde
                        </button>
                    </div>
                )}
            </main>

            {/* QR Odeme Modal - Kamera Oncelikli */}
            {showQrModal && !paymentConfirmDevice && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowQrModal(false); setShowCameraScanner(false) }}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-slate-800">QR ile Ode</h3>
                            <button onClick={() => { setShowQrModal(false); setShowCameraScanner(false) }} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            {/* Camera Scanner - auto open */}
                            <QrScannerComponent
                                onScan={(text) => {
                                    let deviceIdToFind = text;
                                    if (text.startsWith('freshrider://pay')) {
                                        try {
                                            const urlObj = new URL(text.replace('freshrider://', 'http://localhost/'));
                                            deviceIdToFind = urlObj.searchParams.get('device_id') || '';
                                            const amount = urlObj.searchParams.get('amount');
                                            const perfume = urlObj.searchParams.get('perfume');
                                            if (amount) setQrDynamicAmount(Number(amount));
                                            setQrWantsPerfume(perfume === 'true');
                                        } catch (e) { console.error(e); }
                                    } else {
                                        setQrDynamicAmount(null);
                                        setQrWantsPerfume(false);
                                    }
                                    const found = devices.find(d => d.id === deviceIdToFind || d.name === deviceIdToFind)
                                    if (found) {
                                        setPaymentConfirmDevice(found)
                                    } else {
                                        alert('Gecersiz QR kod. Lutfen cihaz QR kodunu okutun.')
                                    }
                                }}
                                onClose={() => { setShowQrModal(false); setShowCameraScanner(false) }}
                            />
                            <div className="relative flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400 font-bold">or</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                            {/* Manual fallback */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Manuel Makine Sec</label>
                                <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium text-sm"
                                    value={qrDeviceId}
                                    onChange={(e) => {
                                        const d = devices.find(dev => dev.id === e.target.value)
                                        if (d) setPaymentConfirmDevice(d)
                                    }}>
                                    <option value="">Secim yapın...</option>
                                    {devices.filter(d => d.status === 'online').map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Odeme Onay Modali */}
            {paymentConfirmDevice && (
                <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !paymentProcessing && setPaymentConfirmDevice(null)}></div>
                    <div className="bg-white w-full sm:max-w-sm sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden"></div>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                                <QrCode className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Makine</p>
                                <h3 className="text-xl font-black text-slate-800">{paymentConfirmDevice.name}</h3>
                            </div>
                            <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Hizmet Ucreti {qrWantsPerfume ? '(Parfümlü)' : ''}</span>
                                    <span className="font-black text-slate-800">{qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50} TL</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Mevcut Bakiye</span>
                                    <span className={"font-bold " + (balance >= (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50) ? 'text-emerald-600' : 'text-red-500')}>{balance} TL</span>
                                </div>
                                <div className="h-px bg-slate-200 my-1" />
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Odeme Sonrasi</span>
                                    <span className="font-black text-slate-800">{balance - (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50)} TL</span>
                                </div>
                            </div>
                            {balance < (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50) && (
                                <p className="text-red-500 text-sm font-bold">Bakiyeniz yetersiz. Lutfen bakiye yukleyin.</p>
                            )}
                            <div className="w-full flex gap-3">
                                <button onClick={() => !paymentProcessing && setPaymentConfirmDevice(null)} disabled={!!paymentProcessing} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50">Iptal</button>
                                <button
                                    onClick={handleQrPayment}
                                    disabled={!!paymentProcessing || balance < (qrDynamicAmount || paymentConfirmDevice.hizmet_fiyati || 50)}
                                    className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                                    {paymentProcessing === 'processing' ? 'İşleniyor...' : paymentProcessing === 'connecting' ? 'Makine Bekleniyor...' : paymentProcessing === 'refunding' ? 'İade Ediliyor...' : 'Onayla ve Başla'}
                                </button>
                            </div>
                            {paymentProcessing === 'connecting' && (
                                <p className="text-xs text-indigo-600 font-bold animate-pulse mt-2">Lütfen makine onaylayana kadar (max 30sn) uygulamadan çıkmayın...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10 overflow-y-auto flex flex-col" style={{ maxHeight: '80vh', paddingBottom: '2rem' }}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden shrink-0"></div>
                        {selectedTicket && (
                            <div className="mb-4 flex items-center gap-2">
                                <button onClick={() => setSelectedTicket(null)} className="p-2 bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                                <span className="font-bold text-slate-800">Sohbeti Kapat</span>
                            </div>
                        )}
                        {!selectedTicket ? (
                            <>
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-2 shrink-0">
                                    <button onClick={() => setSettingsTab('account')} className={'pb-2 text-sm font-bold ' + (settingsTab === 'account' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400')}>Profil Ayarları</button>
                                    <button onClick={() => setSettingsTab('support')} className={'pb-2 text-sm font-bold ' + (settingsTab === 'support' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400')}>Destek</button>
                                </div>
                                {settingsTab === 'account' ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase block">Ad Soyad</label>
                                            <div className="flex gap-2">
                                                <input value={name} onChange={e => setName(e.target.value)} className="modern-input flex-1" placeholder="Ad Soyad" />
                                                <button onClick={async () => { const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', userId); if (!error) alert('Profil güncellendi') }} className="bg-indigo-600 text-white p-3 rounded-xl active:scale-95"><Check className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase block">Şifre Değiştir</label>
                                            <form onSubmit={handlePasswordChange} className="space-y-2">
                                                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="modern-input w-full" placeholder="Eski şifre" required />
                                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="modern-input w-full" placeholder="Yeni şifre (min 6 karakter)" required />
                                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="modern-input w-full" placeholder="Yeni şifre tekrar" required />
                                                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold active:scale-95 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Şifreyi Güncelle</button>
                                            </form>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Dil</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setLanguage('tr')} className={'py-2 rounded-xl text-sm font-bold ' + (language === 'tr' ? 'bg-white shadow text-indigo-600' : 'text-slate-500')}>Türkçe</button>
                                                <button onClick={() => setLanguage('en')} className={'py-2 rounded-xl text-sm font-bold ' + (language === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-500')}>English</button>
                                            </div>
                                        </div>
                                        <button onClick={handleLogout} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors">Çıkış Yap</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <form onSubmit={handleCreateTicket} className="space-y-3">
                                            <input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Konu" className="modern-input" required />
                                            <textarea value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Mesajınız..." className="modern-input" rows={3} required />
                                            <button type="submit" className="btn-primary w-full bg-emerald-500">Talep Gönder</button>
                                        </form>
                                        <div className="space-y-3">
                                            {tickets.map(ticket => (
                                                <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); fetchReplies(ticket.id) }} className="p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 active:scale-95 transition-all">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-slate-700 text-sm">{ticket.subject}</span>
                                                        <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + (ticket.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}>{ticket.status}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{ticket.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col" style={{ height: '60vh' }}>
                                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 p-4">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">S</div>
                                        <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 max-w-[85%]"><p className="font-bold text-xs mb-1">Başlangıç Mesajı</p>{selectedTicket.message}</div>
                                    </div>
                                    {chatReplies.map(reply => (
                                        <div key={reply.id} className={'flex gap-3 ' + (!reply.is_admin ? 'justify-end' : '')}>
                                            {reply.is_admin && <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600">A</div>}
                                            <div className={'p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ' + (!reply.is_admin ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none')}>
                                                <p className={'font-bold text-xs mb-1 ' + (!reply.is_admin ? 'text-white/80' : 'text-indigo-600')}>{reply.is_admin ? 'Destek' : 'Ben'}</p>
                                                {reply.message}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-4" />
                                </div>
                                <div className="flex gap-2 p-4 border-t border-slate-100 shrink-0">
                                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Mesajınızı yazın..." className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400" />
                                    <button onClick={handleSendReply} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95"><Send className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {showNotifications && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowNotifications(false); setSelectedNotification(null) }}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10 overflow-y-auto" style={{ maxHeight: '80vh' }}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
                        {selectedNotification ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={() => setSelectedNotification(null)} className="p-2 bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                                    <h3 className="font-bold text-slate-800">{selectedNotification.title}</h3>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">{selectedNotification.message}</p>
                                <p className="text-xs text-slate-400 mt-4">{new Date(selectedNotification.created_at).toLocaleString('tr-TR')}</p>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-xl text-slate-800">Bildirimler</h3>
                                    <button onClick={markAllAsRead} className="text-xs text-indigo-600 font-bold">Tümünü Oku</button>
                                </div>
                                <div className="space-y-2">
                                    {notifications.length === 0 && <p className="text-slate-400 text-center py-8 text-sm">Bildirim yok</p>}
                                    {notifications.map(notif => (
                                        <div key={notif.id} onClick={() => markAsRead(notif)} className={'p-4 rounded-xl cursor-pointer transition-all ' + (notif.is_read ? 'bg-slate-50' : 'bg-indigo-50 border border-indigo-100')}>
                                            <div className="flex items-start gap-3">
                                                <div className={'w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ' + (notif.is_read ? 'bg-transparent' : 'bg-indigo-500')}></div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{notif.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-[9999] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center py-2 px-2">
                    <button className="flex flex-col items-center gap-1 p-2 flex-1" onClick={() => setActiveTab('home')}>
                        {activeTab === 'home' && <div className="w-10 h-0.5 bg-indigo-600 rounded-full"></div>}
                        <Activity className={'w-6 h-6 ' + (activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400')} />
                        <span className={'text-[10px] font-bold ' + (activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400')}>Ana Sayfa</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 flex-1" onClick={() => setActiveTab('map')}>
                        {activeTab === 'map' && <div className="w-10 h-0.5 bg-indigo-600 rounded-full"></div>}
                        <MapPin className={'w-6 h-6 ' + (activeTab === 'map' ? 'text-indigo-600' : 'text-slate-400')} />
                        <span className={'text-[10px] font-medium ' + (activeTab === 'map' ? 'text-indigo-600' : 'text-slate-400')}>Harita</span>
                    </button>
                    <button onClick={() => router.push('/user/wallet')} className="flex flex-col items-center gap-1 p-2 flex-1 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Wallet className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Cüzdanım</span>
                    </button>
                    <button onClick={() => { setShowSettings(true); setSettingsTab('account') }} className="flex flex-col items-center gap-1 p-2 flex-1 text-slate-400 hover:text-indigo-600 transition-colors">
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Profil</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
