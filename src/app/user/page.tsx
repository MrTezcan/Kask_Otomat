export const revalidate = 0;
export const dynamic = 'force-dynamic';
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/user',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      }
    ]
  },
};

module.exports = nextConfig;
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Bell, ChevronRight, MapPin, User, Wallet, Check, QrCode, Sliders, Menu, X, Send } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

const KioskMap = dynamic(() => import('@/components/KioskMap'), { ssr: false })

type Device = {
    id: string
    name: string
    location: string
    latitude?: number
    longitude?: number
    status: 'online' | 'offline' | 'maintenance'
}

export default function UserDashboard() {
    const router = useRouter()
    const { t, language, setLanguage } = useLanguage()

    const [activeTab, setActiveTab] = useState<'home' | 'map'>('home')
    const [showQrModal, setShowQrModal] = useState(false)
    const [qrDeviceId, setQrDeviceId] = useState('')
    const [paymentProcessing, setPaymentProcessing] = useState(false)
    const [newPassword, setNewPassword] = useState('')
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
    const [chatInput, setChatInput] = useState('')
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null)

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
                () => { },
                { enableHighAccuracy: true, timeout: 5000 }
            )
            navigator.geolocation.watchPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                () => { },
                { enableHighAccuracy: true }
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
        if (data) setChatReplies(data)
    }

    const handleQrPayment = async () => {
        if (!qrDeviceId) return alert('Lutfen makine secin.')
        const device = devices.find(d => d.id === qrDeviceId)
        if (!device) return alert('Gecersiz makine kodu.')
        if (device.status !== 'online') return alert('Bu makine su anda hizmet veremiyor.')
        const finalPrice = 50
        if (balance < finalPrice) return alert('Bakiye yetersiz! Hizmet bedeli: ' + finalPrice + ' TL')
        setPaymentProcessing(true)
        try {
            const { error: balError } = await supabase.rpc('increment_balance', { amount: -finalPrice, user_id: userId })
            if (balError) throw balError
            await supabase.from('transactions').insert({ user_id: userId, amount: -finalPrice, type: 'payment', description: device.name + ' Kask Temizleme', status: 'completed' })
            await supabase.from('notifications').insert({ user_id: userId, type: 'success', title: 'Odeme Basarili', message: device.name + ' cihazinda ' + finalPrice + ' TL odeme yapildi.' })
            alert('Odeme basarili! Makine calismaya basliyor.')
            setShowQrModal(false)
            setQrDeviceId('')
            setBalance(prev => prev - finalPrice)
        } catch (e: any) {
            alert('Hata: ' + e.message)
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
        if (newPassword.length < 6) return alert('Sifre en az 6 karakter olmalidir.')
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) { alert('Sifre guncellenirken hata: ' + error.message) }
        else { alert('Sifreniz guncellendi.'); setNewPassword('') }
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
        } else if (notif.title?.includes('Destek') || notif.title?.includes('Yanit')) {
            setSettingsTab('support'); setShowSettings(true); setShowNotifications(false)
        } else {
            setSelectedNotification(notif)
        }
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    }

    return (
        <div className="min-h-screen pb-24 relative bg-slate-50">
            <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">{name.charAt(0).toUpperCase()}</div>
                    <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('greeting')}</p><h1 className="text-lg font-bold text-slate-800 leading-none">{name}</h1></div>
                </div>
                <div className="flex gap-2">
                    {isAdmin && <button onClick={() => router.push('/admin')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Sliders className="w-5 h-5" /></button>}
                    <button onClick={() => setShowNotifications(true)} className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 relative">
                        <Bell className="w-5 h-5" />
                        {notifications.some(n => !n.is_read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    </button>
                    <button onClick={() => { setShowSettings(true); setSettingsTab('account') }} className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600"><Menu className="w-5 h-5" /></button>
                </div>
            </header>

            <main className="px-4 space-y-4 mt-4">
                <div className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">CUZDANIM</span>
                            <Wallet className="w-5 h-5 text-indigo-200" />
                        </div>
                        <h2 className="text-4xl font-black mb-6 tracking-tight">{balance} <span className="text-2xl font-medium opacity-80">TL</span></h2>
                        <div className="flex gap-3">
                            <button onClick={() => router.push('/user/wallet')} className="flex-1 py-3 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold hover:bg-white/30">+ Bakiye Ekle</button>
                        </div>
                    </div>
                </div>

                {activeTab === 'map' ? (
                    <div className="h-[60vh] rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 relative">
                        <KioskMap userLocation={userLocation} kiosks={kiosks} />
                    </div>
                ) : (
                    <div className="w-full bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[42vh]">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <QrCode className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">QR Odeme</h3>
                        <p className="text-slate-500 text-center text-sm mb-8 max-w-xs leading-relaxed">
                            Kask otomatinin uzerindeki QR kodu okutun veya makine kodunu girerek odemenizi yapin.
                        </p>
                        <button
                            onClick={() => setShowQrModal(true)}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-base"
                        >
                            <QrCode className="w-5 h-5" />
                            Kod Girerek Ode
                        </button>
                    </div>
                )}
            </main>

            {showQrModal && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQrModal(false)}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-slate-800">QR Odeme</h3>
                            <button onClick={() => setShowQrModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Makine Sec</label>
                                <select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium" value={qrDeviceId} onChange={(e) => setQrDeviceId(e.target.value)}>
                                    <option value="">Seciniz...</option>
                                    {devices.filter(d => d.status === 'online').map(d => (
                                        <option key={d.id} value={d.id}>{d.name} - 50 TL</option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                                <span className="text-sm font-semibold text-indigo-700">Mevcut Bakiye</span>
                                <span className="text-lg font-black text-indigo-700">{balance} TL</span>
                            </div>
                            <button onClick={handleQrPayment} disabled={paymentProcessing || !qrDeviceId} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                                {paymentProcessing ? 'Isleniyor...' : '50 TL Ode ve Baslat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSettings && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 pb-32 relative z-10 max-h-[85vh] overflow-y-auto flex flex-col">
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
                                    <button onClick={() => setSettingsTab('account')} className={'pb-2 text-sm font-bold ' + (settingsTab === 'account' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400')}>{t('profileSettings')}</button>
                                    <button onClick={() => setSettingsTab('support')} className={'pb-2 text-sm font-bold ' + (settingsTab === 'support' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400')}>{t('support')}</button>
                                </div>
                                {settingsTab === 'account' ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase block">Ad Soyad</label>
                                            <div className="flex gap-2">
                                                <input value={name} onChange={e => setName(e.target.value)} className="modern-input flex-1" placeholder="Ad Soyad" />
                                                <button onClick={async () => { const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', userId); if (!error) alert('Profil guncellendi') }} className="bg-indigo-600 text-white p-3 rounded-xl active:scale-95"><Check className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase block">Sifre Degistir</label>
                                            <form onSubmit={handlePasswordChange} className="flex gap-2">
                                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="modern-input flex-1" placeholder="Yeni sifre (min 6)" />
                                                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl active:scale-95"><Check className="w-5 h-5" /></button>
                                            </form>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{t('language')}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setLanguage('tr')} className={'py-2 rounded-xl text-sm font-bold ' + (language === 'tr' ? 'bg-white shadow text-indigo-600' : 'text-slate-500')}>Turkce</button>
                                                <button onClick={() => setLanguage('en')} className={'py-2 rounded-xl text-sm font-bold ' + (language === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-500')}>English</button>
                                            </div>
                                        </div>
                                        <button onClick={handleLogout} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors">{t('logout')}</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <form onSubmit={handleCreateTicket} className="space-y-3">
                                            <input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder={t('ticketSubject')} className="modern-input" required />
                                            <textarea value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder={t('ticketMessage')} className="modern-input" rows={3} required />
                                            <button type="submit" className="btn-primary w-full bg-emerald-500">{t('sendTicket')}</button>
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
                            <div className="flex flex-col h-[70vh]">
                                <div className="flex-1 overflow-y-auto space-y-4 p-4">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">S</div>
                                        <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 max-w-[85%]"><p className="font-bold text-xs mb-1">Baslangic Mesaji</p>{selectedTicket.message}</div>
                                    </div>
                                    {selectedTicket.admin_reply && chatReplies.length === 0 && (
                                        <div className="flex gap-3 flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600">A</div>
                                            <div className="bg-indigo-50 p-3 rounded-2xl rounded-tr-none text-sm text-slate-700 max-w-[85%] border border-indigo-100"><p className="font-bold text-indigo-600 text-xs mb-1">Destek</p>{selectedTicket.admin_reply}</div>
                                        </div>
                                    )}
                                    {chatReplies.map(reply => (
                                        <div key={reply.id} className={'flex gap-3 ' + (!reply.is_admin ? 'justify-end' : '')}>
                                            {reply.is_admin && <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600">A</div>}
                                            <div className={'p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ' + (!reply.is_admin ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none')}>
                                                <p className={'font-bold text-xs mb-1 ' + (!reply.is_admin ? 'text-white/80' : 'text-indigo-600')}>{reply.is_admin ? 'Destek' : 'Ben'}</p>
                                                {reply.message}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-4" />
                                </div>
                                <div className="flex gap-2 p-4 border-t border-slate-100 shrink-0">
                                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Mesajinizi yazin..." className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400" />
                                    <button onClick={handleSendReply} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95"><Send className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showNotifications && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowNotifications(false); setSelectedNotification(null) }}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10 max-h-[85vh] overflow-y-auto">
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
                                    <button onClick={markAllAsRead} className="text-xs text-indigo-600 font-bold">Tumunu Oku</button>
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

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pt-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-[9999]">
                <div className="flex justify-around items-end pb-2 max-w-sm mx-auto">
                    <button className="flex flex-col items-center gap-1 p-2 w-20" onClick={() => setActiveTab('home')}>
                        {activeTab === 'home' && <div className="w-10 h-0.5 bg-indigo-600 rounded-full mb-0.5"></div>}
                        <Activity className={'w-6 h-6 ' + (activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400')} />
                        <span className={'text-[10px] font-bold ' + (activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400')}>Ana Sayfa</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 w-20" onClick={() => setActiveTab('map')}>
                        {activeTab === 'map' && <div className="w-10 h-0.5 bg-indigo-600 rounded-full mb-0.5"></div>}
                        <MapPin className={'w-6 h-6 ' + (activeTab === 'map' ? 'text-indigo-600' : 'text-slate-400')} />
                        <span className={'text-[10px] font-medium ' + (activeTab === 'map' ? 'text-indigo-600' : 'text-slate-400')}>Harita</span>
                    </button>
                    <button onClick={() => router.push('/user/wallet')} className="flex flex-col items-center gap-1 p-2 w-20 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Wallet className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{t('wallet')}</span>
                    </button>
                    <button onClick={() => { setShowSettings(true); setSettingsTab('account') }} className="flex flex-col items-center gap-1 p-2 w-20 text-slate-400 hover:text-indigo-600 transition-colors">
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Profil</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
