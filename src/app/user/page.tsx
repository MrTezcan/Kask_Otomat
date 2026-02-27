'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Bell, ChevronRight, MapPin, User, Wallet, Settings, LogOut, Globe, Check, QrCode, Sliders, Menu, X, Send, MessageSquare } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import Image from 'next/image'

const KioskMap = dynamic(() => import('@/components/KioskMap'), { ssr: false })

// ... (Existing types and components remain same)
type Device = { id: string; name: string; location: string; latitude?: number; longitude?: number; status: 'online' | 'offline' | 'maintenance' }

// ... (Existing calculateDistance and other helpers)
export default function UserDashboard() {
    const router = useRouter()
    const { t, language, setLanguage } = useLanguage()

    // ... (Existing State)
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

    // Ticket State
    const [ticketSubject, setTicketSubject] = useState('')
    const [ticketMessage, setTicketMessage] = useState('')
    const [tickets, setTickets] = useState<any[]>([])
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [chatReplies, setChatReplies] = useState<any[]>([])
    const [chatInput, setChatInput] = useState('')
    const [selectedNotification, setSelectedNotification] = useState<any | null>(null)

    // ... (Existing Effects & Helpers same as before)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return Math.round(R * c * 10) / 10
    }
    const kiosks = devices.map((device, index) => {
        const lat = device.latitude || (41.0082 + (index * 0.005)); const lng = device.longitude || (28.9784 + (index * 0.005))
        return { id: device.id, name: device.name, lat, lng, status: device.status, distance: calculateDistance(userLocation[0], userLocation[1], lat, lng) }
    })

    useEffect(() => {
        fetchProfile(); fetchDevices()
        const sub = supabase.channel('user-bal').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => setBalance(payload.new.balance)).subscribe()
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                (err) => { console.log('Location error:', err); /* keep default location 41.0082, 28.9784 */ },
                { enableHighAccuracy: true, timeout: 5000 }
            )
            navigator.geolocation.watchPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.log(err),
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
            const { data: reads } = await supabase.from('notification_reads')
                .select('notification_id').eq('user_id', userId)
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

        // Chat Realtime
        const chatSub = supabase.channel('user-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies' }, (payload: any) => {
            if (selectedTicket && payload.new.ticket_id === selectedTicket.id) fetchReplies(selectedTicket.id)
        }).subscribe()

        return () => { supabase.removeChannel(ticketSub); supabase.removeChannel(notifSub); supabase.removeChannel(chatSub) }
    }, [userId, selectedTicket])

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser(); if (!user) { router.push('/'); return }
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) { setName(data.full_name || user.email?.split('@')[0]); setUserId(user.id); setBalance(data.balance); if (data.role === 'admin') setIsAdmin(true) }
    }
    const fetchDevices = async () => { const { data } = await supabase.from('devices').select('*'); if (data) setDevices(data) }
    const fetchTickets = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { data } = await supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); if (data) setTickets(data) }

    const fetchReplies = async (ticketId: string) => {
        const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true })
        if (data) setChatReplies(data)
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return
        const { error } = await supabase.from('tickets').insert({ user_id: user.id, subject: ticketSubject, message: ticketMessage })
        if (!error) { setTicketSubject(''); setTicketMessage(''); fetchTickets() }
    }

    const handleSendReply = async () => {
        if (!chatInput || !selectedTicket) return
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('ticket_replies').insert({ ticket_id: selectedTicket.id, user_id: user?.id, message: chatInput, is_admin: false })
        if (!error) { setChatInput(''); fetchReplies(selectedTicket.id) }
    }

    const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

    const markAsRead = async (notif: any) => {
        if (!notif.is_read) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
            if (notif.user_id) {
                await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
            } else {
                await supabase.from('notification_reads').upsert(
                    { user_id: userId, notification_id: notif.id },
                    { onConflict: 'user_id,notification_id' }
                )
            }
        }

        // Deep linking logic
        if (notif.metadata?.ticket_id) {
            const ticket = tickets.find(t => t.id === notif.metadata.ticket_id)
            if (ticket) {
                setSelectedTicket(ticket)
                fetchReplies(ticket.id)
                setSettingsTab('support')
                setShowSettings(true)
                setShowNotifications(false)
            } else {
                // Fetch ticket if not in list
                const { data } = await supabase.from('tickets').select('*').eq('id', notif.metadata.ticket_id).single()
                if (data) {
                    setSelectedTicket(data)
                    fetchReplies(data.id)
                    setSettingsTab('support')
                    setShowSettings(true)
                    setShowNotifications(false)
                }
            }
        }

        // No deep link: Check heuristics (If titled "Destek" or "Yanıt", open support tab)
        if (notif.title.includes('Destek') || notif.title.includes('Yanıt')) {
            setSettingsTab('support')
            setShowSettings(true)
            setShowNotifications(false)
        } else {
            // Generic notification: Show detail
            setSelectedNotification(notif)
        }
    }

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

        // Update in DB (only for user-specific notifications for now due to schema limitations)
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    }

    // RENDER
    return (
        <div className="min-h-screen pb-24 relative">
            {/* Header, Balance, Map ... same as before ... */}
            <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">{name.charAt(0).toUpperCase()}</div>
                    <div><p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('greeting')}</p><h1 className="text-lg font-bold text-slate-800 leading-none">{name}</h1></div>
                </div>
                <div className="flex gap-2">
                    {isAdmin && <button onClick={() => router.push('/admin')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Sliders className="w-5 h-5" /></button>}
                    <button onClick={() => setShowNotifications(true)} className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 relative"><Bell className="w-5 h-5" />{notifications.some(n => !n.is_read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}</button>
                    <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600"><Menu className="w-5 h-5" /></button>
                </div>
            </header>

            <main className="px-6 space-y-6 mt-2">
                {/* Balance Card code from previous file... keeping concise here effectively same */}
                <div className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2"><span className="text-indigo-100 text-xs font-bold uppercase tracking-widest">{t('wallet')}</span><Wallet className="w-5 h-5 text-indigo-200" /></div>
                        <h2 className="text-4xl font-black mb-6 tracking-tight">{balance} <span className="text-2xl font-medium opacity-80">₺</span></h2>
                        <div className="flex gap-3"><button onClick={() => router.push('/user/wallet')} className="flex-1 py-3 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold hover:bg-white/30">+ {t('addBalance')}</button></div>
                    </div>
                </div>

                <div className="h-64 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 relative">
                    <KioskMap userLocation={userLocation} kiosks={kiosks} />
                </div>
            </main>

            {/* Modal: Settings & Support */}
            {showSettings && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10 animate-fade-in-up max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden shrink-0"></div>

                        {/* Back button from chat */}
                        {selectedTicket && (
                            <div className="mb-4 flex items-center gap-2">
                                <button onClick={() => setSelectedTicket(null)} className="p-2 bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                                <span className="font-bold text-slate-800">Sohbeti Kapat</span>
                            </div>
                        )}

                        {!selectedTicket ? (
                            <>
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-2 shrink-0">
                                    <button onClick={() => setSettingsTab('account')} className={`pb-2 text-sm font-bold ${settingsTab === 'account' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>{t('profileSettings')}</button>
                                    <button onClick={() => setSettingsTab('support')} className={`pb-2 text-sm font-bold ${settingsTab === 'support' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>{t('support')}</button>
                                </div>

                                {settingsTab === 'account' ? (
                                    <div className="space-y-4">
                                        {/* Profile form ... */}
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase block">Ad Soyad</label>
                                            <div className="flex gap-2">
                                                <input value={name} onChange={e => setName(e.target.value)} className="modern-input flex-1" placeholder="Ad Soyad" />
                                                <button onClick={async () => {
                                                    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', userId)
                                                    if (!error) alert('Profil güncellendi')
                                                }} className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform"><Check className="w-5 h-5" /></button>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">{t('language')}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setLanguage('tr')} className={`py-2 rounded-xl text-sm font-bold ${language === 'tr' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Türkçe</button>
                                                <button onClick={() => setLanguage('en')} className={`py-2 rounded-xl text-sm font-bold ${language === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>English</button>
                                            </div>
                                        </div>
                                        <button onClick={handleLogout} className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl">{t('logout')}</button>
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
                                                <div key={ticket.id} onClick={async () => { setSelectedTicket(ticket); fetchReplies(ticket.id) }} className="p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 active:scale-95 transition-all">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-slate-700 text-sm">{ticket.subject}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{ticket.status}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{ticket.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            // CHAT VIEW
                            <div className="flex flex-col h-[70vh]">
                                <div className="flex-1 overflow-y-auto space-y-4 p-4 custom-scrollbar">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">S</div>
                                        <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 max-w-[85%]"><p className="font-bold text-xs mb-1">Başlangıç Mesajı</p>{selectedTicket.message}</div>
                                    </div>

                                    {selectedTicket.admin_reply && chatReplies.length === 0 && (
                                        <div className="flex gap-3 flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600">A</div>
                                            <div className="bg-indigo-50 p-3 rounded-2xl rounded-tr-none text-sm text-slate-700 max-w-[85%] border border-indigo-100"><p className="font-bold text-indigo-600 text-xs mb-1">Destek</p>{selectedTicket.admin_reply}</div>
                                        </div>
                                    )}

                                    {chatReplies.map(reply => (
                                        <div key={reply.id} className={`flex gap-3 ${!reply.is_admin ? 'justify-end' : ''}`}>
                                            {reply.is_admin && <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600">A</div>}
                                            <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm ${!reply.is_admin ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                                                <p className={`font-bold text-xs mb-1 ${!reply.is_admin ? 'text-white/80' : 'text-indigo-600'}`}>{reply.is_admin ? 'Destek' : 'Ben'}</p>
                                                {reply.message}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-4" /> {/* Spacer */}
                                </div>

                                {selectedTicket.status !== 'closed' && (
                                    <div className="p-3 border-t border-slate-100 bg-white"><div className="flex gap-2">
                                        <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="modern-input flex-1" placeholder="Mesaj yazın..." />
                                        <button onClick={handleSendReply} className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/30"><Send className="w-5 h-5" /></button>
                                    </div></div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Notifications */}
            {showNotifications && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 10000 }}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowNotifications(false)}></div>
                    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-[2rem] p-6 relative z-10 animate-fade-in-up max-h-[80vh] overflow-y-auto flex flex-col">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden shrink-0"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Bildirimler</h3>
                            {notifications.length > 0 && <button onClick={markAllAsRead} className="text-xs font-bold text-brand-primary">Tümünü Okundu İşaretle</button>}
                        </div>

                        {!selectedNotification ? (
                            <div className="space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center">
                                        <Bell className="w-12 h-12 mb-3 opacity-20" />
                                        <p>Henüz bildiriminiz yok</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} onClick={() => markAsRead(n)} className={`p-4 rounded-xl border cursor-pointer transition-all ${n.is_read ? 'bg-white border-slate-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
                                            <div className="flex justify-between mb-1">
                                                <span className={`text-sm font-bold ${n.is_read ? 'text-slate-700' : 'text-indigo-900'}`}>{n.title}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className={`text-xs ${n.is_read ? 'text-slate-500' : 'text-indigo-800'} line-clamp-2`}>{n.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => setSelectedNotification(null)} className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"><ChevronRight className="w-4 h-4 rotate-180" /> Geri Dön</button>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-2">{selectedNotification.title}</h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedNotification.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-4 text-right">{new Date(selectedNotification.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === Bottom Navigation === */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[9999]" style={{ zIndex: 9999 }}>
                <div className="flex justify-between items-end pb-2">
                    <button className="flex flex-col items-center gap-1 p-2 text-indigo-600 w-16">
                        <div className="w-12 h-0.5 bg-indigo-600 rounded-full mb-1"></div>
                        <Activity className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Ana Sayfa</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-indigo-600 w-16 transition-colors" onClick={() => { document.querySelector('main')?.scrollTo({ top: 500, behavior: 'smooth' }) }}>
                        <MapPin className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Harita</span>
                    </button>
                    <button onClick={() => router.push('/user/wallet')} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-indigo-600 w-16 transition-colors">
                        <Wallet className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{t('wallet')}</span>
                    </button>
                    <button onClick={() => setShowSettings(true)} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-indigo-600 w-16 transition-colors">
                        <User className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Profil</span>
                    </button>
                </div>
                <div className="h-4 w-full bg-white sm:hidden"></div> {/* Safe area spacer */}
            </div>
        </div>
    )
}


