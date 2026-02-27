'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Settings, RefreshCw, AlertTriangle, Search, Server, MapPin, Users, Wallet, Plus, X, CreditCard, LogOut, Check, LayoutDashboard, Pen, Trash2, MessageSquare, Clock, Eye, Bell, Send, ChevronDown, Upload, Cpu, Zap } from 'lucide-react'
import Logo from '@/components/Logo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

const KioskMap = dynamic(() => import('@/components/KioskMap'), { ssr: false })
const AddKioskMap = dynamic(() => import('@/components/AddKioskMap'), { ssr: false })

type Device = { id: string; name: string; location: string; latitude?: number; longitude?: number; status: 'online' | 'offline' | 'maintenance'; hizmet_fiyati: number; last_seen: string; firmware_version?: string; ota_status?: string; ota_updated_at?: string }
type Customer = { id: string; email: string; full_name: string; balance: number; role: string; phone?: string }

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
    const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' }
    const c = colors[color] || 'bg-slate-50 text-slate-600'
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex justify-between items-center group">
            <div><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p><h3 className="text-3xl font-black text-slate-800">{value}</h3></div>
            <div className={`p-4 rounded-xl ${c}`}>{icon}</div>
        </div>
    )
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={`shrink-0 md:w-full flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon className="w-5 h-5" />{label}
        </button>
    )
}

export default function AdminDashboard() {
    const [devices, setDevices] = useState<Device[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [tickets, setTickets] = useState<any[]>([])
    const [sentNotifications, setSentNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [adminName, setAdminName] = useState('')
    const router = useRouter()
    const { t } = useLanguage()

    const [otaReleases, setOtaReleases] = useState<any[]>([])
    const [otaFile, setOtaFile] = useState<File | null>(null)
    const [otaUrl, setOtaUrl] = useState('')
    const [otaUploadMode, setOtaUploadMode] = useState<'file' | 'url'>('file')
    const [otaVersion, setOtaVersion] = useState('')
    const [otaDescription, setOtaDescription] = useState('')
    const [otaUploading, setOtaUploading] = useState(false)
    const [otaDeploying, setOtaDeploying] = useState<string | null>(null)
    const [showOtaDeployModal, setShowOtaDeployModal] = useState<any | null>(null)
    const [otaTargetMode, setOtaTargetMode] = useState<'all' | 'select'>('all')
    const [otaSelectedDevices, setOtaSelectedDevices] = useState<string[]>([])

    const [activeTab, setActiveTab] = useState<'dashboard' | 'devices' | 'customers' | 'finance' | 'support' | 'notifications' | 'ota'>('dashboard')
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [ticketReplies, setTicketReplies] = useState<any[]>([])
    const [replyText, setReplyText] = useState('')

    // Balance Management
    const [showBalanceModal, setShowBalanceModal] = useState(false)
    const [balanceAmount, setBalanceAmount] = useState('')
    const [balanceOperation, setBalanceOperation] = useState<'add' | 'subtract'>('add')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')

    // Edit/Add Kiosk
    const [showAddKioskModal, setShowAddKioskModal] = useState(false)
    const [editingDevice, setEditingDevice] = useState<Device | null>(null)
    const [newKioskName, setNewKioskName] = useState(''); const [newKioskAddress, setNewKioskAddress] = useState(''); const [newKioskPrice, setNewKioskPrice] = useState('50'); const [newKioskLocation, setNewKioskLocation] = useState<[number, number] | null>(null)
    const [addrProvince, setAddrProvince] = useState(''); const [addrDistrict, setAddrDistrict] = useState(''); const [addrStreet, setAddrStreet] = useState(''); const [isGeocoding, setIsGeocoding] = useState(false)

    // Notification State
    const [showNotifModal, setShowNotifModal] = useState(false)
    const [notifTitle, setNotifTitle] = useState('')
    const [notifMessage, setNotifMessage] = useState('')
    const [notifType, setNotifType] = useState('info')

    // Status Change
    const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null)

    // Bulk Update State
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false)
    const [bulkUpdateType, setBulkUpdateType] = useState<'fixed' | 'percentage' | 'add' | 'subtract'>('fixed')
    const [bulkUpdateValue, setBulkUpdateValue] = useState('')

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/'); return }
            const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
            if (profile?.role !== 'admin' && !user.email?.includes('admin')) { router.push('/user'); return }
            setAdminName(profile?.full_name || user.email?.split('@')[0] || 'Admin')
            await Promise.all([fetchDevices(), fetchCustomers(), fetchTransactions(), fetchTickets(), fetchSentNotifications()])
            setLoading(false)
        }
        init()
        const sub = supabase.channel('admin-db').on('postgres_changes', { event: '*', schema: 'public' }, () => { fetchDevices(); fetchCustomers(); fetchTransactions(); fetchTickets(); fetchSentNotifications() }).subscribe()

        const chatSub = supabase.channel('admin-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies' }, (payload: any) => {
            if (selectedTicket && payload.new.ticket_id === selectedTicket.id) fetchReplies(selectedTicket.id)
        }).subscribe()

        return () => { supabase.removeChannel(sub); supabase.removeChannel(chatSub) }
    }, [selectedTicket])

    const fetchDevices = async () => { const { data } = await supabase.from('devices').select('*').order('name'); if (data) setDevices(data) }
    const fetchCustomers = async () => { const { data } = await supabase.from('profiles').select('*').order('full_name'); if (data) setCustomers(data) }
    const fetchTransactions = async () => { const { data } = await supabase.from('transactions').select(`*, profiles:user_id(full_name)`).order('created_at', { ascending: false }).limit(50); if (data) setTransactions(data) }
    const fetchTickets = async () => { const { data } = await supabase.from('tickets').select(`*, profiles:user_id(full_name, email)`).order('created_at', { ascending: false }); if (data) setTickets(data) }
    const fetchReplies = async (ticketId: string) => { const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }); if (data) setTicketReplies(data) }
    const fetchSentNotifications = async () => { const { data } = await supabase.from('notifications').select(`*, profiles:user_id(full_name)`).order('created_at', { ascending: false }).limit(50); if (data) setSentNotifications(data) }
    const fetchOtaReleases = async () => { const { data } = await supabase.from('ota_releases').select('*').order('created_at', { ascending: false }); if (data) setOtaReleases(data) }

    const handleUploadOta = async () => {
        if (!otaVersion) return alert('Versiyon zorunludur')
        if (otaUploadMode === 'file' && !otaFile) return alert('Lutfen bir dosya secin')
        if (otaUploadMode === 'url' && !otaUrl) return alert('Lutfen bir URL girin')
        setOtaUploading(true)
        try {
            let firmwareUrl = otaUrl
            if (otaUploadMode === 'file' && otaFile) {
                const filePath = `firmware/${otaVersion}/${otaFile.name}`
                const { error: uploadError } = await supabase.storage.from('ota-firmware').upload(filePath, otaFile, { upsert: true })
                if (uploadError) throw uploadError
                const { data: urlData } = supabase.storage.from('ota-firmware').getPublicUrl(filePath)
                firmwareUrl = urlData.publicUrl
            }
            const { error: dbError } = await supabase.from('ota_releases').insert({ version: otaVersion, description: otaDescription, firmware_url: firmwareUrl, is_active: false })
            if (dbError) throw dbError
            alert('Firmware kaydedildi: ' + otaVersion)
            setOtaFile(null); setOtaVersion(''); setOtaDescription(''); setOtaUrl('')
            fetchOtaReleases()
        } catch (e: any) {
            alert('Hata: ' + e.message)
        } finally {
            setOtaUploading(false)
        }
    }

    const handleDeployOta = async () => {
        const release = showOtaDeployModal
        if (!release) return
        setOtaDeploying(release.id)
        setShowOtaDeployModal(null)
        try {
            // Mark this release as active, deactivate others
            await supabase.from('ota_releases').update({ is_active: false }).neq('id', release.id)
            await supabase.from('ota_releases').update({ is_active: true }).eq('id', release.id)

            // Determine target devices
            let targetIds: string[] = []
            if (otaTargetMode === 'all') {
                targetIds = devices.map(d => d.id)
            } else {
                targetIds = otaSelectedDevices
            }

            if (targetIds.length === 0) { alert('Hiç cihaz seçilmedi'); setOtaDeploying(null); return }

            // Mark selected devices as pending
            await supabase.from('devices').update({ ota_status: 'pending' }).in('id', targetIds)

            // Write OTA commands
            const cmds = targetIds.map(id => supabase.from('commands').insert({
                device_id: id,
                command: 'OTA_UPDATE',
                payload: release.firmware_url,
                ota_release_id: release.id,
                status: 'pending'
            }))
            await Promise.all(cmds)

            alert(`OTA komutu ${targetIds.length} cihaza gönderildi!`)
            fetchOtaReleases()
            fetchDevices()
        } catch (e: any) {
            alert('Hata: ' + e.message)
        } finally {
            setOtaDeploying(null)
            setOtaSelectedDevices([])
        }
    }

    const handleSaveKiosk = async () => {
        if (!newKioskLocation || !newKioskName) return alert('Lutfen tum alanlari doldurun')
        const data = { name: newKioskName, location: newKioskAddress, latitude: newKioskLocation[0], longitude: newKioskLocation[1], hizmet_fiyati: parseInt(newKioskPrice), last_seen: new Date().toISOString() }
        const { error } = editingDevice ? await supabase.from('devices').update(data).eq('id', editingDevice.id) : await supabase.from('devices').insert([{ ...data, status: 'online' }])
        if (!error) { alert('Kaydedildi'); setShowAddKioskModal(false); setEditingDevice(null); fetchDevices() }
    }
    const handleDeleteKiosk = async (id: string) => { if (confirm('Silinsin mi?')) { await supabase.from('devices').delete().eq('id', id); fetchDevices() } }

    const handleUpdateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('devices').update({ status }).eq('id', id)
        if (!error) { setShowStatusMenu(null); fetchDevices() }
    }

    const handleBulkUpdate = async () => {
        if (!bulkUpdateValue) return alert('Lutfen bir deger girin')
        const val = parseFloat(bulkUpdateValue)
        if (isNaN(val)) return alert('Gecersiz deger')
        if (!confirm('Tum cihazlarin fiyatlari guncellenecek. Emin misiniz?')) return
        setLoading(true)
        try {
            const updates = devices.map(device => {
                let newPrice = device.hizmet_fiyati
                if (bulkUpdateType === 'fixed') newPrice = val
                else if (bulkUpdateType === 'percentage') newPrice = Math.round(device.hizmet_fiyati * (1 + val / 100))
                else if (bulkUpdateType === 'add') newPrice = device.hizmet_fiyati + val
                else if (bulkUpdateType === 'subtract') newPrice = Math.max(0, device.hizmet_fiyati - val)
                return supabase.from('devices').update({ hizmet_fiyati: newPrice }).eq('id', device.id)
            })
            await Promise.all(updates)
            alert('Tum fiyatlar guncellendi')
            setShowBulkUpdateModal(false)
            setBulkUpdateValue('')
            fetchDevices()
        } catch (e) {
            alert('Bir hata olustu')
        } finally {
            setLoading(false)
        }
    }

    const handleReplyTicket = async () => {
        if (!replyText || !selectedTicket) return
        try {
            const { error: rpcError } = await supabase.rpc('admin_reply_ticket', { ticket_id: selectedTicket.id, reply_text: replyText })
            if (rpcError) throw rpcError
            const newReply = {
                id: 'temp-' + Date.now(),
                ticket_id: selectedTicket.id,
                user_id: (await supabase.auth.getUser()).data.user?.id,
                message: replyText,
                is_admin: true,
                created_at: new Date().toISOString()
            }
            setTicketReplies([...ticketReplies, newReply])
            setReplyText('')
            fetchTickets()
        } catch (err: any) {
            alert('Hata: ' + err.message)
        }
    }

    const handleResolveTicket = async () => { if (selectedTicket && confirm('Cozuldu mu?')) { await supabase.from('tickets').update({ status: 'closed' }).eq('id', selectedTicket.id); fetchTickets(); setSelectedTicket(null) } }

    const handleAddBalance = async () => {
        if (!selectedCustomer || !balanceAmount) return
        const amt = balanceOperation === 'add' ? parseInt(balanceAmount) : -parseInt(balanceAmount)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.rpc('increment_balance', { user_id: selectedCustomer.id, amount: amt, admin_id: user?.id, p_payment_method: 'admin_manual' })
        if (error) alert('Hata: ' + error.message)
        else { alert('Bakiye guncellendi'); setShowBalanceModal(false); setBalanceAmount(''); fetchCustomers(); fetchTransactions() }
    }

    const handleSendNotification = async () => {
        if (!notifTitle || !notifMessage) return alert('Baslik ve mesaj zorunludur')
        const { error } = await supabase.from('notifications').insert({ title: notifTitle, message: notifMessage, type: notifType, user_id: null })
        if (!error) {
            alert('Bildirim gonderildi')
            setShowNotifModal(false); setNotifTitle(''); setNotifMessage('')
            fetchSentNotifications()
        } else {
            alert('Hata: ' + error.message)
        }
    }

    const findCoordinates = async () => {
        setIsGeocoding(true)
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${addrStreet} ${addrDistrict} ${addrProvince}`)}`)
            const data = await res.json()
            if (data[0]) { setNewKioskLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]); setNewKioskAddress(data[0].display_name) }
        } catch (e) { } finally { setIsGeocoding(false) }
    }

    useEffect(() => { fetchOtaReleases() }, [])

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-brand-primary animate-spin" /></div>

    if (!adminName) return null

    return (
        <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
            <aside className="w-full md:w-64 h-16 md:h-full bg-white border-b md:border-r border-slate-200 flex flex-row md:flex-col z-20 shadow-sm relative overflow-x-auto md:overflow-x-visible shrink-0 no-scrollbar custom-scrollbar-hide">
                <div className="md:h-20 h-full flex items-center px-4 md:px-6 border-r md:border-b md:border-r-0 border-slate-100 shrink-0"><Logo size="small" /></div>
                <nav className="flex-1 p-2 md:p-4 md:space-y-1 overflow-x-auto md:overflow-x-transparent flex flex-row md:flex-col items-center md:items-stretch gap-2 md:gap-0 no-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Genel Bakis" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={Server} label="Cihaz Yonetimi" active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} />
                    <SidebarItem icon={Users} label="Musteriler" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                    <SidebarItem icon={CreditCard} label="Finans & Islemler" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
                    <SidebarItem icon={MessageSquare} label="Destek Merkezi" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
                    <SidebarItem icon={Bell} label="Bildirimler" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                    <SidebarItem icon={Cpu} label="OTA Guncelleme" active={activeTab === 'ota'} onClick={() => setActiveTab('ota')} />
                    <SidebarItem icon={Eye} label="Kullanici Gorunumu" active={false} onClick={() => router.push('/user')} />
                    <div className="border-t border-slate-100 my-2"></div>
                </nav>
                <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">{adminName.charAt(0)}</div>
                        <div className="flex-1 overflow-hidden"><p className="text-sm font-bold truncate">{adminName}</p><p className="text-[10px] text-slate-500 uppercase">Yonetici</p></div>
                        <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="text-slate-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto relative scroll-smooth bg-slate-50/50">
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-10"><Logo size="small" /><button><Settings className="w-6 h-6 text-slate-600" /></button></header>
                <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{activeTab === 'dashboard' ? 'Genel Bakis' : activeTab === 'support' ? 'Destek Merkezi' : activeTab === 'finance' ? 'Finansal Islemler' : activeTab === 'notifications' ? 'Bildirim Gecmisi' : activeTab === 'devices' ? 'Cihaz Yonetimi' : activeTab === 'ota' ? 'OTA Firmware Guncelleme' : 'Musteriler'}</h1>
                            <p className="text-sm text-slate-500 mt-1">Sistem yonetimi ve raporlama</p>
                        </div>
                        {activeTab === 'devices' && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowBulkUpdateModal(true)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><CreditCard className="w-4 h-4" /> Toplu Fiyat Guncelle</button>
                                <button onClick={() => { setEditingDevice(null); setNewKioskLocation(null); setShowAddKioskModal(true) }} className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Yeni Cihaz Ekle</button>
                            </div>
                        )}
                    </div>

                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Toplam Cihaz" value={devices.length} icon={<Server className="w-6 h-6" />} color="blue" />
                                <StatCard title="Aktif Cihazlar" value={devices.filter(d => d.status === 'online').length} icon={<Activity className="w-6 h-6" />} color="emerald" />
                                <StatCard title="Bakimdaki Cihazlar" value={devices.filter(d => d.status === 'maintenance').length} icon={<AlertTriangle className="w-6 h-6" />} color="amber" />
                                <StatCard title="Musteriler" value={customers.length} icon={<Users className="w-6 h-6" />} color="purple" />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800">Canli Harita</h3><span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg">Online</span></div>
                                    <div className="h-[300px] rounded-xl overflow-hidden border border-slate-50 relative"><KioskMap userLocation={[41.0082, 28.9784]} kiosks={devices} /></div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4">Son Aktiviteler</h3>
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar min-h-[250px]">
                                        {transactions.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">Henuz islem yok</div> : transactions.slice(0, 10).map(tx => (
                                            <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                                <div><p className="text-xs font-bold text-slate-700">{tx.profiles?.full_name}</p><p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                                                <span className={`text-xs font-black ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount)}&#8378;</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setActiveTab('finance')} className="mt-4 w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100">Tum Islemleri Gor</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up h-[calc(100vh-200px)]">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Talepler ({tickets.filter(t => t.status !== 'closed').length})</h3>
                                    <button onClick={() => setShowNotifModal(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Kullanicilara Bildirim Gonder"><Bell className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {tickets.map(ticket => (
                                        <div key={ticket.id} onClick={async () => { setSelectedTicket(ticket); fetchReplies(ticket.id) }} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTicket?.id === ticket.id ? 'bg-brand-primary/5 border-brand-primary/30' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                                            <div className="flex justify-between mb-1"><span className="font-bold text-sm text-slate-800 truncate">{ticket.subject}</span><span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${ticket.status === 'open' ? 'bg-red-100 text-red-600' : ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{ticket.status}</span></div>
                                            <p className="text-xs text-slate-500 truncate">{ticket.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(ticket.created_at).toLocaleString('tr-TR')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                                {selectedTicket ? (
                                    <>
                                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                            <div><h2 className="text-xl font-bold text-slate-800">{selectedTicket.subject}</h2><p className="text-sm text-slate-500 mt-1">{selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.email})</p></div>
                                            {selectedTicket.status !== 'closed' && <button onClick={handleResolveTicket} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 hover:bg-emerald-100">Cozuldu Olarak Isatle</button>}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 flex flex-col-reverse custom-scrollbar">
                                            <div className="space-y-4 pb-2">
                                                <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">U</div> <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 max-w-[80%] border border-slate-100"><p className="font-bold text-slate-900 text-xs mb-1">Kullanici (Sorun)</p>{selectedTicket.message}</div></div>
                                                {selectedTicket.admin_reply && ticketReplies.length === 0 && <div className="flex gap-4 flex-row-reverse"><div className="w-8 h-8 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">A</div> <div className="bg-brand-primary text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[80%]"><p className="font-bold text-white/80 text-xs mb-1">Admin Yaniti</p>{selectedTicket.admin_reply}</div></div>}
                                                {ticketReplies.map(reply => (
                                                    <div key={reply.id} className={`flex gap-4 ${reply.is_admin ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${reply.is_admin ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500'}`}>{reply.is_admin ? 'A' : 'U'}</div>
                                                        <div className={`p-4 rounded-2xl shadow-sm text-sm max-w-[80%] ${reply.is_admin ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                                                            <p className={`font-bold text-xs mb-1 ${reply.is_admin ? 'text-white/80' : 'text-slate-900'}`}>{reply.is_admin ? 'Admin' : 'Kullanici'} <span className="opacity-50 font-normal ml-2">{new Date(reply.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                                                            {reply.message}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {selectedTicket.status !== 'closed' && (
                                            <div className="p-4 border-t border-slate-100 bg-white"><div className="flex gap-2"><textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Yanit yazin..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm min-h-[40px] max-h-[100px] focus:outline-none focus:border-brand-primary resize-none" /><button onClick={handleReplyTicket} className="btn-primary py-2 px-4 text-sm flex items-center gap-2 self-end"><Send className="w-4 h-4" /> Gonder</button></div></div>
                                        )}
                                    </>
                                ) : <div className="flex items-center justify-center h-full text-slate-400 flex-col"><MessageSquare className="w-12 h-12 mb-2 opacity-20" /><p>Detaylari gormek icin bir talep secin</p></div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'finance' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Tum Islemler</h3><button onClick={fetchTransactions} className="text-slate-400 hover:text-brand-primary"><RefreshCw className="w-4 h-4" /></button></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100"><tr><th className="p-4">Tarih</th><th className="p-4">Kullanici</th><th className="p-4">Islem Tipi</th><th className="p-4 text-right">Tutar</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 text-slate-500 text-xs font-medium"><div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(tx.created_at).toLocaleString('tr-TR')}</div></td>
                                                <td className="p-4 font-bold text-slate-700">{tx.profiles?.full_name}</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{tx.type === 'deposit' ? 'Bakiye Yukleme' : 'Harcama'}</span></td>
                                                <td className={`p-4 text-right font-black ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount)} &#8378;</td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">Islem bulunamadi.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">Gonderilen Bildirimler</h3>
                                <button onClick={() => setShowNotifModal(true)} className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all flex items-center gap-2"><Send className="w-4 h-4" /> Yeni Bildirim Gonder</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100"><tr><th className="p-4">Tarih</th><th className="p-4">Baslik</th><th className="p-4">Mesaj</th><th className="p-4">Tip</th><th className="p-4 text-right">Alici</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {sentNotifications.map(n => (
                                            <tr key={n.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 text-slate-500 text-xs font-medium"><div className="flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(n.created_at).toLocaleString('tr-TR')}</div></td>
                                                <td className="p-4 font-bold text-slate-700">{n.title}</td>
                                                <td className="p-4 text-slate-600 min-w-[300px] whitespace-pre-wrap">{n.message}</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${n.type === 'error' ? 'bg-red-50 text-red-600' : n.type === 'warning' ? 'bg-amber-50 text-amber-600' : n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{n.type}</span></td>
                                                <td className="p-4 text-right font-bold text-slate-600">{n.user_id ? n.profiles?.full_name : <span className="text-brand-primary">Tum Kullanicilar</span>}</td>
                                            </tr>
                                        ))}
                                        {sentNotifications.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Henuz bildirim gonderilmedi.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ota' && (
                        <div className="space-y-6 animate-fade-in-up">
                            {/* Upload Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-indigo-50 rounded-xl"><Cpu className="w-5 h-5 text-indigo-600" /></div>
                                    <div><h3 className="font-bold text-slate-800">Yeni Firmware Kaydet</h3><p className="text-xs text-slate-500">Dosya yukleyin veya var olan bir URL girin</p></div>
                                </div>
                                {/* Upload Mode Toggle */}
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4 w-fit">
                                    <button onClick={() => setOtaUploadMode('file')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${otaUploadMode === 'file' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>📁 Dosyadan Yukle</button>
                                    <button onClick={() => setOtaUploadMode('url')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${otaUploadMode === 'url' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>🔗 URL ile Kaydet</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Versiyon</label><input value={otaVersion} onChange={e => setOtaVersion(e.target.value)} className="modern-input" placeholder="orn: v1.2.3" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Aciklama</label><input value={otaDescription} onChange={e => setOtaDescription(e.target.value)} className="modern-input" placeholder="orn: Bug fix ve optimizasyon" /></div>
                                    <div>
                                        {otaUploadMode === 'file' ? (
                                            <>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Firmware Dosyasi (.bin)</label>
                                                <input type="file" accept=".bin,.zip,.tar.gz" onChange={e => setOtaFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                                            </>
                                        ) : (
                                            <>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Firmware URL</label>
                                                <input value={otaUrl} onChange={e => setOtaUrl(e.target.value)} className="modern-input" placeholder="https://...supabase.co/storage/.../esp32.bin" />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <button onClick={handleUploadOta} disabled={otaUploading || !otaFile || !otaVersion} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {otaUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {otaUploading ? 'Yukleniyor...' : 'Yukle'}
                                    </button>
                                    {otaFile && <span className="text-xs text-slate-500 font-medium">{otaFile.name} ({(otaFile.size / 1024).toFixed(1)} KB)</span>}
                                </div>
                            </div>

                            {/* Release History */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-800">Firmware Gecmisi</h3>
                                    <button onClick={fetchOtaReleases} className="text-slate-400 hover:text-brand-primary"><RefreshCw className="w-4 h-4" /></button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100">
                                            <tr><th className="p-4">Versiyon</th><th className="p-4">Aciklama</th><th className="p-4">Tarih</th><th className="p-4">Durum</th><th className="p-4 text-right">Islem</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {otaReleases.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-black text-slate-800">{r.version}</td>
                                                    <td className="p-4 text-slate-600">{r.description || '-'}</td>
                                                    <td className="p-4 text-slate-500 text-xs"><div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.created_at).toLocaleString('tr-TR')}</div></td>
                                                    <td className="p-4">{r.is_active ? <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-md flex items-center gap-1 w-fit"><Zap className="w-3 h-3" />Aktif</span> : <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-md">Pasif</span>}</td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => { setShowOtaDeployModal(r); setOtaTargetMode('all'); setOtaSelectedDevices([]) }}
                                                            disabled={otaDeploying === r.id || r.is_active}
                                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ml-auto">
                                                            {otaDeploying === r.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                                            {r.is_active ? 'Aktif' : 'Deploy Et'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {otaReleases.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Henuz firmware yuklenmedi.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Failed / Unreachable Devices */}
                            {devices.some(d => d.ota_status === 'failed' || d.ota_status === 'unreachable' || d.ota_status === 'pending') && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-5 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Cihaz OTA Durumu</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100">
                                                <tr><th className="p-4">Cihaz</th><th className="p-4">Konum</th><th className="p-4">Durum</th><th className="p-4">Mevcut Firmware</th><th className="p-4">OTA Guncelleme</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {devices.filter(d => d.ota_status && d.ota_status !== 'idle').map(d => (
                                                    <tr key={d.id} className="hover:bg-slate-50/50">
                                                        <td className="p-4 font-bold text-slate-800">{d.name}</td>
                                                        <td className="p-4 text-slate-500 text-xs">{d.location}</td>
                                                        <td className="p-4"><span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md ${d.status === 'online' ? 'bg-emerald-50 text-emerald-600' :
                                                            d.status === 'offline' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>{d.status}</span></td>
                                                        <td className="p-4 font-mono text-xs text-slate-600">{d.firmware_version || 'v0.0.0'}</td>
                                                        <td className="p-4"><span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md flex items-center gap-1 w-fit ${d.ota_status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                                            d.ota_status === 'failed' ? 'bg-red-50 text-red-600' :
                                                                d.ota_status === 'unreachable' ? 'bg-slate-100 text-slate-500' :
                                                                    'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {d.ota_status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                                                            {d.ota_status}
                                                            {d.ota_updated_at && <span className="opacity-60 font-normal normal-case ml-1">{new Date(d.ota_updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                        </span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Musteri Listesi</h3><div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Ara..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary w-64" /></div></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100"><tr><th className="p-4">Ad Soyad</th><th className="p-4">Iletisim</th><th className="p-4">Bakiye</th><th className="p-4 text-right">Islem</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {customers.filter(c => c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.email?.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold text-slate-700">{c.full_name}</td>
                                                <td className="p-4 text-slate-500"><div className="flex flex-col"><span className="text-xs">{c.email}</span><span className="text-[10px]">{c.phone || '-'}</span></div></td>
                                                <td className="p-4 font-black text-brand-primary">{c.balance} &#8378;</td>
                                                <td className="p-4 text-right"><button onClick={() => { setSelectedCustomer(c); setShowBalanceModal(true) }} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors">Yonet</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'devices' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                            {devices.map(device => (
                                <div key={device.id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-brand-primary/30 transition-all group shadow-sm hover:shadow-md relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div><h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">{device.name}</h3><p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {device.location}</p></div>
                                        <div className="relative">
                                            <button onClick={() => setShowStatusMenu(showStatusMenu === device.id ? null : device.id)} className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${device.status === 'online' ? 'bg-emerald-100 text-emerald-700' : device.status === 'offline' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {device.status} <ChevronDown className="w-3 h-3" />
                                            </button>
                                            {showStatusMenu === device.id && (
                                                <div className="absolute right-0 top-6 bg-white border border-slate-100 rounded-xl shadow-lg p-1 z-30 min-w-[100px]">
                                                    <button onClick={() => handleUpdateStatus(device.id, 'online')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-emerald-50 text-emerald-600 rounded-lg">Online</button>
                                                    <button onClick={() => handleUpdateStatus(device.id, 'maintenance')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 text-amber-600 rounded-lg">Bakim</button>
                                                    <button onClick={() => handleUpdateStatus(device.id, 'offline')} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-red-50 text-red-600 rounded-lg">Offline</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm font-black text-brand-primary">{device.hizmet_fiyati} TL</div>
                                            <div className="flex items-center gap-1">
                                                <Cpu className="w-3 h-3 text-slate-400" />
                                                <span className="text-[10px] text-slate-500 font-mono">{device.firmware_version || 'v0.0.0'}</span>
                                                {device.ota_status && device.ota_status !== 'idle' && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ml-1 ${device.ota_status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                                        device.ota_status === 'failed' ? 'bg-red-100 text-red-600' :
                                                            device.ota_status === 'unreachable' ? 'bg-slate-200 text-slate-500' :
                                                                'bg-amber-100 text-amber-600'
                                                        }`}>{device.ota_status}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingDevice(device); setNewKioskName(device.name); setNewKioskPrice(device.hizmet_fiyati.toString()); setNewKioskLocation([device.latitude!, device.longitude!]); setNewKioskAddress(device.location); setShowAddKioskModal(true) }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Pen className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteKiosk(device.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    {showStatusMenu === device.id && <div className="fixed inset-0 z-20" onClick={() => setShowStatusMenu(null)}></div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Add Kiosk */}
            {showAddKioskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">{editingDevice ? 'Cihazi Duzenle' : 'Yeni Cihaz Ekle'}</h2><button onClick={() => setShowAddKioskModal(false)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button></div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cihaz Adi</label><input value={newKioskName} onChange={e => setNewKioskName(e.target.value)} className="modern-input" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Hizmet Fiyati (TL)</label><input type="number" value={newKioskPrice} onChange={e => setNewKioskPrice(e.target.value)} className="modern-input" /></div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3"><p className="text-xs font-bold text-slate-400 uppercase">Adres Bul</p><div className="grid grid-cols-2 gap-2"><input value={addrProvince} onChange={e => setAddrProvince(e.target.value)} placeholder="Il" className="modern-input text-xs" /><input value={addrDistrict} onChange={e => setAddrDistrict(e.target.value)} placeholder="Ilce" className="modern-input text-xs" /></div><input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} placeholder="Cadde/Sokak" className="modern-input text-xs" /><button onClick={findCoordinates} disabled={isGeocoding} className="w-full py-2 bg-brand-primary/10 text-brand-primary font-bold text-xs rounded-lg hover:bg-brand-primary/20">{isGeocoding ? 'Araniyor...' : 'Konumu Bul'}</button></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tam Adres</label><textarea value={newKioskAddress} onChange={e => setNewKioskAddress(e.target.value)} className="modern-input text-xs" rows={2} /></div>
                                <button onClick={handleSaveKiosk} className="w-full btn-primary">{editingDevice ? 'Guncelle' : 'Kaydet'}</button>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-slate-200 h-[400px]"><AddKioskMap userLocation={[41.0082, 28.9784]} initialLocation={newKioskLocation} onLocationSelect={(lat, lng) => setNewKioskLocation([lat, lng])} otherKiosks={devices} /></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Customer Balance */}
            {showBalanceModal && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 animate-fade-in-up">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Bakiye Yonetimi</h3>
                        <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100 text-center"><p className="text-xs text-slate-500 uppercase font-bold">Mevcut Bakiye</p><p className="text-3xl font-black text-brand-primary">{selectedCustomer.balance} &#8378;</p><p className="text-sm font-bold text-slate-700 mt-1">{selectedCustomer.full_name}</p></div>
                        <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-xl"><button onClick={() => setBalanceOperation('add')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${balanceOperation === 'add' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Ekle (+)</button><button onClick={() => setBalanceOperation('subtract')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${balanceOperation === 'subtract' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Cikar (-)</button></div>
                        <div className="mb-6"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tutar (TL)</label><input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="modern-input text-center text-lg font-bold" autoFocus /></div>
                        <div className="flex gap-3"><button onClick={() => setShowBalanceModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Iptal</button><button onClick={handleAddBalance} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90">Onayla</button></div>
                    </div>
                </div>
            )}

            {/* Modal: Send Notification */}
            {showNotifModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800">Toplu Bildirim Gonder</h3><button onClick={() => setShowNotifModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Baslik</label><input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="modern-input" placeholder="Orn: Sistem Bakimi" /></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mesaj</label><textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} className="modern-input" rows={3} placeholder="Bildirim icerigi..." /></div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bildirim Tipi</label>
                                <div className="flex gap-2">
                                    {['info', 'success', 'warning', 'error'].map(t => (
                                        <button key={t} onClick={() => setNotifType(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${notifType === t ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /><p className="text-xs text-amber-700 font-medium">Bu bildirim <strong>tum kayitli kullanicilara</strong> gonderilecektir.</p></div>
                            <button onClick={handleSendNotification} className="w-full btn-primary flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Gonder</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Bulk Update */}
            {showBulkUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800">Toplu Fiyat Guncelleme</h3><button onClick={() => setShowBulkUpdateModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Guncelleme Tipi</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setBulkUpdateType('fixed')} className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${bulkUpdateType === 'fixed' ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>Sabit Fiyat</button>
                                    <button onClick={() => setBulkUpdateType('percentage')} className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${bulkUpdateType === 'percentage' ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>Yuzde (%)</button>
                                    <button onClick={() => setBulkUpdateType('add')} className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${bulkUpdateType === 'add' ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>Tutar Ekle</button>
                                    <button onClick={() => setBulkUpdateType('subtract')} className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${bulkUpdateType === 'subtract' ? 'bg-brand-primary text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>Tutar Cikar</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                    {bulkUpdateType === 'fixed' ? 'Yeni Fiyat (TL)' : bulkUpdateType === 'percentage' ? 'Oran (%)' : 'Tutar (TL)'}
                                </label>
                                <input type="number" value={bulkUpdateValue} onChange={e => setBulkUpdateValue(e.target.value)} className="modern-input text-lg font-bold" placeholder="0" autoFocus />
                            </div>
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-700 font-medium">Bu islem <strong>{devices.length} cihazin</strong> fiyatini kalici olarak degistirecektir.</p>
                            </div>
                            <button onClick={handleBulkUpdate} className="w-full btn-primary">Uygula ve Guncelle</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal: OTA Deploy Options */}
            {showOtaDeployModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Firmware Deploy</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{showOtaDeployModal.version}</p>
                            </div>
                            <button onClick={() => setShowOtaDeployModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        {/* Target Selection */}
                        <div className="mb-5">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hedef Cihazlar</label>
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                <button onClick={() => setOtaTargetMode('all')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${otaTargetMode === 'all' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Tum Cihazlar ({devices.length})</button>
                                <button onClick={() => setOtaTargetMode('select')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${otaTargetMode === 'select' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Secili Cihazlar</button>
                            </div>
                        </div>

                        {otaTargetMode === 'select' && (
                            <div className="mb-5 max-h-48 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-2">
                                {devices.map(d => (
                                    <label key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={otaSelectedDevices.includes(d.id)}
                                            onChange={e => setOtaSelectedDevices(e.target.checked ? [...otaSelectedDevices, d.id] : otaSelectedDevices.filter(id => id !== d.id))}
                                            className="rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700">{d.name}</p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'online' ? 'bg-emerald-400' : d.status === 'offline' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                                                {d.status} — <span className="font-mono">{d.firmware_version || 'v0.0.0'}</span>
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2 mb-4">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium">
                                {otaTargetMode === 'all' ? `${devices.length} cihaza` : `${otaSelectedDevices.length} secili cihaza`} OTA komutu gonderilecek. Cihazlar siradaki baglantida guncelleme alacaktir.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowOtaDeployModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Iptal</button>
                            <button onClick={handleDeployOta} disabled={otaTargetMode === 'select' && otaSelectedDevices.length === 0} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" /> Deploy Et
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}



