'use client'
// Final Stability Fix: Comprehensive JSX Re-alignment
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Settings, ChevronLeft, RefreshCw, AlertTriangle, Search, Server, MapPin, Users, Wallet, Plus, X, CreditCard, LogOut, Check, LayoutDashboard, Pen, Trash2, MessageSquare, Clock, Eye, Bell, Send, ChevronDown, Upload, Cpu, Zap, Monitor, Menu } from 'lucide-react'
import Logo from '@/components/Logo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

const KioskMap = dynamic(() => import('@/components/KioskMap'), { ssr: false })
const AddKioskMap = dynamic(() => import('@/components/AddKioskMap'), { ssr: false })

type Device = { id: string; name: string; location: string; latitude?: number; longitude?: number; status: 'online' | 'offline' | 'maintenance'; hizmet_fiyati: number;
    parfum_fiyati?: number; last_seen: string; tablet_last_seen?: string; heartbeat_count?: number; mega_status?: boolean; esp32_status?: boolean; firmware_version?: string; ota_status?: string; ota_updated_at?: string; video_url?: string; work_status?: string; liquid_level_pct?: number; alarm?: string; nayax_terminal_id?: string;
    time_lock_sec?: number; time_wash_sec?: number; time_dry_sec?: number; time_perfume_sec?: number; time_finish_sec?: number; }
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
            <Icon className="w-5 h-5" />{label === 'Support' ? 'Destek Kayıtları' : label}
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
    const { t, language, setLanguage } = useLanguage()

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
    const [lastMegaUpdates, setLastMegaUpdates] = useState<Record<string, number>>({})
    const [otaSelectedDevices, setOtaSelectedDevices] = useState<string[]>([])

    type AdminTab = 'dashboard' | 'devices' | 'customers' | 'finance' | 'support' | 'notifications' | 'ota' | 'app-updates'
    const validAdminTabs: AdminTab[] = ['dashboard', 'devices', 'customers', 'finance', 'support', 'notifications', 'ota', 'app-updates']
    const getInitialAdminTab = (): AdminTab => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.replace('#', '') as AdminTab
            if (validAdminTabs.includes(hash)) return hash
        }
        return 'dashboard'
    }
    const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialAdminTab)
    const setActiveTab = (tab: AdminTab) => {
        setActiveTabState(tab)
        window.location.hash = tab
    }
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [ticketReplies, setTicketReplies] = useState<any[]>([])
    const [replyText, setReplyText] = useState('')
    const adminChatScrollRef = useRef<HTMLDivElement>(null)

    const [showBalanceModal, setShowBalanceModal] = useState(false)
    const [balanceAmount, setBalanceAmount] = useState('')
    const [balanceOperation, setBalanceOperation] = useState<'add' | 'subtract'>('add')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)

    const [showAddKioskModal, setShowAddKioskModal] = useState(false)
    const [editingDevice, setEditingDevice] = useState<Device | null>(null)
    const [newDeviceId, setNewDeviceId] = useState(''); const [newKioskName, setNewKioskName] = useState(''); const [newKioskAddress, setNewKioskAddress] = useState(''); const [newKioskPrice, setNewKioskPrice] = useState('50'); const [newKioskPerfumePrice, setNewKioskPerfumePrice] = useState('5'); const [newKioskLocation, setNewKioskLocation] = useState<[number, number] | null>(null); const [newKioskVideoUrl, setNewKioskVideoUrl] = useState(''); const [newKioskNayaxId, setNewKioskNayaxId] = useState('');
    const [newTimeLock, setNewTimeLock] = useState('2'); const [newTimeWash, setNewTimeWash] = useState('15'); const [newTimeDry, setNewTimeDry] = useState('30'); const [newTimePerfume, setNewTimePerfume] = useState('3'); const [newTimeFinish, setNewTimeFinish] = useState('5');
    const [addrProvince, setAddrProvince] = useState(''); const [addrDistrict, setAddrDistrict] = useState(''); const [addrStreet, setAddrStreet] = useState(''); const [isGeocoding, setIsGeocoding] = useState(false)

    const [showNotifModal, setShowNotifModal] = useState(false)
    const [showAdminSettings, setShowAdminSettings] = useState(false)
    const [adminOldPw, setAdminOldPw] = useState('')
    const [adminNewPw, setAdminNewPw] = useState('')
    const [adminConfirmPw, setAdminConfirmPw] = useState('')
    const [notifTitle, setNotifTitle] = useState('')
    const [notifMessage, setNotifMessage] = useState('')
    const [notifType, setNotifType] = useState('info')
    const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [now, setNow] = useState(new Date())
    const [adminLocation, setAdminLocation] = useState<[number, number] | null>(null)
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false)
    const [bulkUpdateValue, setBulkUpdateValue] = useState('')
    const [showBulkVideoModal, setShowBulkVideoModal] = useState(false)
    const [bulkVideoUrl, setBulkVideoUrl] = useState('')
    const [showBulkTimingModal, setShowBulkTimingModal] = useState(false)
    const [bulkTimeLock, setBulkTimeLock] = useState('2')
    const [bulkTimeWash, setBulkTimeWash] = useState('15')
    const [bulkTimeDry, setBulkTimeDry] = useState('30')
    const [bulkTimePerfume, setBulkTimePerfume] = useState('3')
    const [bulkTimeFinish, setBulkTimeFinish] = useState('5')
    const [bulkUpdateType, setBulkUpdateType] = useState<'fixed' | 'percentage' | 'add' | 'subtract'>('fixed')

    // Uygulama Güncelleme (APK) State'leri
    const [appReleases, setAppReleases] = useState<any[]>([])
    const [appFile, setAppFile] = useState<File | null>(null)
    const [appUrl, setAppUrl] = useState('')
    const [appVersion, setAppVersion] = useState('')
    const [appNotes, setAppNotes] = useState('')
    const [appPlatform, setAppPlatform] = useState<'mobile' | 'tablet'>('mobile')
    const [appUploading, setAppUploading] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (showMobileMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [showMobileMenu])

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/'); return }
            const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
            if (profile?.role !== 'admin' && !user.email?.includes('admin')) { router.push('/user'); return }
            setAdminName(profile?.full_name || user.email?.split('@')[0] || 'Admin')
            setIsSuperAdmin(user?.email === 'ibo.tezcan42@gmail.com')
            await Promise.all([fetchDevices(), fetchCustomers(), fetchTransactions(), fetchTickets(), fetchSentNotifications(), fetchAppReleases()])
            setLoading(false)
        }
        init()

        // Sayfa odaga geldiginde verileri tazele
        const handleFocus = () => {
            fetchDevices();
        };
        window.addEventListener('focus', handleFocus);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setAdminLocation([pos.coords.latitude, pos.coords.longitude]),
                () => {}, { enableHighAccuracy: true, timeout: 5000 }
            )
        }

        const interval = setInterval(() => setNow(new Date()), 30000)

        if (!loading) {
            fetchDevices()
            fetchCustomers()
            fetchTransactions()
            fetchTickets()
            fetchOtaReleases()
            fetchAppReleases()
            fetchSentNotifications()

            // Consolidated Realtime Subscription
            const channel = supabase.channel('admin-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const newData = payload.new as any
                        const oldData = payload.old as any
                        if (newData.liquid_level_pct !== undefined && oldData && newData.liquid_level_pct !== oldData.liquid_level_pct) {
                            setLastMegaUpdates(prev => ({ ...prev, [newData.id]: Date.now() }));
                        }
                        setDevices(prev => prev.map(d => d.id === newData.id ? { ...d, ...newData } : d));
                    } else {
                        fetchDevices();
                    }
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies' }, (payload: any) => {
                    if (selectedTicket && payload.new.ticket_id === selectedTicket.id) fetchReplies(selectedTicket.id)
                })
                .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                    if (payload.table !== 'devices' && payload.table !== 'ticket_replies') {
                        fetchCustomers(); fetchTransactions(); fetchTickets(); fetchSentNotifications();
                    }
                })
                .subscribe()
            
            return () => { 
                supabase.removeChannel(channel);
                window.removeEventListener('focus', handleFocus);
                clearInterval(interval);
            }
        }
    }, [activeTab, loading, selectedTicket])

    const handleAdminPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (adminNewPw.length < 6) return alert('Sifre en az 6 karakter olmalidir.')
        if (adminNewPw !== adminConfirmPw) return alert('Sifreler eslesmiyor.')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) return
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: adminOldPw })
        if (signInError) return alert('Eski sifre yanlis.')
        const { error } = await supabase.auth.updateUser({ password: adminNewPw })
        if (error) alert('Hata: ' + error.message)
        else { alert('Sifreniz guncellendi.'); setAdminOldPw(''); setAdminNewPw(''); setAdminConfirmPw(''); setShowAdminSettings(false) }
    }

    const fetchDevices = async () => { const { data, error } = await supabase.from('devices').select('*, esp32_status, mega_status').order('name'); if (data) setDevices(data) }
    const fetchCustomers = async () => { const { data } = await supabase.from('profiles').select('*').order('full_name'); if (data) setCustomers(data) }
    const fetchTransactions = async () => { const { data } = await supabase.from('transactions').select(`*, profiles:user_id(full_name)`).order('created_at', { ascending: false }).limit(50); if (data) setTransactions(data) }
    const fetchTickets = async () => { const { data } = await supabase.from('tickets').select(`*, profiles:user_id(full_name, email)`).order('created_at', { ascending: false }); if (data) setTickets(data) }
    const fetchReplies = async (ticketId: string) => { const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }); if (data) { setTicketReplies(data); setTimeout(() => { if (adminChatScrollRef.current) adminChatScrollRef.current.scrollTop = adminChatScrollRef.current.scrollHeight }, 100) } }
    const fetchSentNotifications = async () => { 
        try {
            const { data, error } = await supabase.from('notifications').select(`*, profiles:user_id(full_name)`).order('created_at', { ascending: false }).limit(50); 
            if (error) {
                console.warn('Bildirimler yüklenirken hata (Tablo olmayabilir):', error.message);
                return;
            }
            if (data) setSentNotifications(data);
        } catch (err) {
            console.error('fetchSentNotifications catch:', err);
        }
    }
    const fetchOtaReleases = async () => { const { data } = await supabase.from('ota_releases').select('*').order('created_at', { ascending: false }); if (data) setOtaReleases(data) }
    const fetchAppReleases = async () => { 
        const { data } = await supabase.from('app_releases').select('*').order('created_at', { ascending: false }); 
        if (data) setAppReleases(data) 
    }

    const handleUploadApp = async () => {
        if (!appVersion || (!appFile && !appUrl)) return alert('Versiyon ve Dosya/URL zorunludur')
        setAppUploading(true)
        try {
            let finalUrl = appUrl
            
            // Eğer dosya seçilmişse yükle, yoksa URL'i kullan
            if (appFile && !appUrl) {
                const bucketName = appPlatform === 'tablet' ? 'tablet_apk' : 'mobil_apk'
                const filePath = `${appVersion}/${appFile.name}`
                
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, appFile, { upsert: true })
                
                if (uploadError) {
                    if (uploadError.message.includes('size')) {
                        throw new Error('Dosya boyutu çok büyük! Lütfen Google Drive kullanın veya Supabase limitlerini artırın.')
                    }
                    throw uploadError
                }
                
                const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
                finalUrl = urlData.publicUrl
            }

            // Google Drive Link Dönüştürücü (Zaten URL varsa veya yeni oluştuysa çalışır)
            if (finalUrl && finalUrl.includes('drive.google.com')) {
                const idMatch = finalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) || finalUrl.match(/id=([a-zA-Z0-9-_]+)/);
                if (idMatch && idMatch[1]) finalUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
            }

            const { error } = await supabase.from('app_releases').insert({
                version: appVersion,
                apk_url: finalUrl,
                platform: appPlatform,
                release_notes: appNotes,
                is_active: true
            })
            
            if (error) throw error
            
            alert('Uygulama güncellemesi başarıyla yayınlandı!');
            setAppFile(null); setAppVersion(''); setAppNotes(''); setAppUrl('');
            fetchAppReleases()
        } catch (e: any) {
            alert('İşlem Başarısız: ' + (e.message || 'Bir ağ hatası oluştu.'))
        } finally {
            setAppUploading(false)
        }
    }

    const handleDeleteAppRelease = async (id: string) => {
        if (!confirm('Bu güncellemeyi silmek istediğinize emin misiniz?')) return
        const { error } = await supabase.from('app_releases').delete().eq('id', id)
        if (!error) fetchAppReleases()
    }

    const handleUploadOta = async () => {
        if (!otaVersion) return alert('Versiyon zorunludur')
        
        // Akilli Mod Secimi: URL varsa ve dosya yoksa URL moduna gec
        let currentMode = otaUploadMode
        if (otaUrl && !otaFile) currentMode = 'url'
        if (otaFile) currentMode = 'file'

        if (currentMode === 'file' && !otaFile) return alert('Lutfen bir dosya secin')
        if (currentMode === 'url' && !otaUrl) return alert('Lutfen bir URL girin')
        
        setOtaUploading(true)
        try {
            let firmwareUrl = otaUrl
            
            // Google Drive Link Donusturucu
            if (firmwareUrl.includes('drive.google.com')) {
                const idMatch = firmwareUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) || firmwareUrl.match(/id=([a-zA-Z0-9-_]+)/);
                if (idMatch && idMatch[1]) {
                    firmwareUrl = `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
                }
            }

            if (currentMode === 'file' && otaFile) {
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
            await supabase.from('ota_releases').update({ is_active: false }).neq('id', release.id)
            await supabase.from('ota_releases').update({ is_active: true }).eq('id', release.id)
            let targetIds: string[] = otaTargetMode === 'all' ? devices.map(d => d.id) : otaSelectedDevices
            if (targetIds.length === 0) { alert('Hiç cihaz seçilmedi'); setOtaDeploying(null); return }
            await supabase.from('devices').update({ ota_status: 'pending' }).in('id', targetIds)
            const cmds = targetIds.map(id => supabase.from('device_commands').insert({
                device_id: id, command: 'OTA_UPDATE', payload: { url: release.firmware_url, version: release.version }, status: 'pending'
            }))
            await Promise.all(cmds)
            alert(`OTA komutu ${targetIds.length} cihaza gönderildi!`)
            fetchOtaReleases(); fetchDevices()
        } catch (e: any) {
            alert('Hata: ' + e.message)
        } finally {
            setOtaDeploying(null); setOtaSelectedDevices([])
        }
    }

    const handleSaveKiosk = async () => {
        if (!newKioskLocation || !newKioskName) return alert('Lutfen tum alanlari doldurun')
        const data: any = { 
            name: newKioskName, location: newKioskAddress, latitude: newKioskLocation[0], longitude: newKioskLocation[1], 
            hizmet_fiyati: parseInt(newKioskPrice), parfum_fiyati: parseInt(newKioskPerfumePrice), 
            video_url: newKioskVideoUrl,
            time_lock_sec: parseInt(newTimeLock) || 2, time_wash_sec: parseInt(newTimeWash) || 15,
            time_dry_sec: parseInt(newTimeDry) || 30, time_perfume_sec: parseInt(newTimePerfume) || 3,
            time_finish_sec: parseInt(newTimeFinish) || 5
        }
        if (newKioskNayaxId.trim()) data.nayax_terminal_id = newKioskNayaxId.trim()
        let error;
        if (editingDevice) {
             const res = await supabase.from('devices').update(data).eq('id', editingDevice.id)
             error = res.error
        } else {
             if (!newDeviceId) return alert('Cihaz ID zorunludur')
             const res = await supabase.from('devices').insert([{ ...data, id: newDeviceId, status: 'online', last_seen: new Date().toISOString() }])
             error = res.error
        }
        if (!error) { 
            alert('Başarıyla Kaydedildi!'); 
            setShowAddKioskModal(false); 
            setEditingDevice(null); 
            fetchDevices(); 
        } else { 
            console.error('Kayıt Hatası:', error); 
            alert('Hata oluştu: ' + error.message); 
        }
    }
    const handleDeleteKiosk = async (id: string) => { if (confirm('Silinsin mi?')) { await supabase.from('devices').delete().eq('id', id); fetchDevices() } }
    const handleDeleteUser = async (c: Customer) => {
        if (!confirm(c.full_name + ' adli kullanici silinsin mi?')) return
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session?.access_token }, body: JSON.stringify({ userId: c.id }) })
        if (res.ok) { alert('Kullanici silindi.'); fetchCustomers() }
        else { const d = await res.json(); alert('Hata: ' + (d.error || 'Silme basarisiz')) }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('devices').update({ status }).eq('id', id)
        if (!error) { setShowStatusMenu(null); fetchDevices() }
    }

    const handleBulkUpdate = async () => {
        if (!bulkUpdateValue) return alert('Lutfen bir deger girin')
        const val = parseFloat(bulkUpdateValue); if (isNaN(val)) return alert('Gecersiz deger')
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
            await Promise.all(updates); alert('Tum fiyatlar guncellendi'); setShowBulkUpdateModal(false); setBulkUpdateValue(''); fetchDevices()
        } catch (e) { alert('Bir hata olustu') }
        finally { setLoading(false) }
    }

    const handleBulkVideoUpdate = async () => {
        if (!bulkVideoUrl) return alert('Lutfen bir URL girin')
        if (!confirm('Tum cihazlarin video URLsi guncellenecek. Emin misiniz?')) return
        setLoading(true)
        try {
            await supabase.from('devices').update({ video_url: bulkVideoUrl })
            alert('Tum cihazlarin videosu guncellendi'); setShowBulkVideoModal(false); setBulkVideoUrl(''); fetchDevices()
        } catch { alert('Hata olustu') }
        finally { setLoading(false) }
    }

    const handleBulkTimingUpdate = async () => {
        if (!confirm('Tüm cihazların zamanlama (saniye) ayarları güncellenecek. Bu işlem geri alınamaz. Emin misiniz?')) return
        setLoading(true)
        try {
            await supabase.from('devices').update({ 
                time_lock_sec: parseInt(bulkTimeLock) || 2, 
                time_wash_sec: parseInt(bulkTimeWash) || 15,
                time_dry_sec: parseInt(bulkTimeDry) || 30, 
                time_perfume_sec: parseInt(bulkTimePerfume) || 3,
                time_finish_sec: parseInt(bulkTimeFinish) || 5
            })
            alert('Tüm cihazların zamanlama ayarları başarıyla güncellendi!'); 
            setShowBulkTimingModal(false); 
            fetchDevices()
        } catch { alert('Güncelleme sırasında bir hata oluştu.') }
        finally { setLoading(false) }
    }

    const handleReplyTicket = async () => {
        if (!replyText || !selectedTicket) return
        const tId = selectedTicket.id
        const currentReplyText = replyText
        setReplyText('')
        
        try {
            const { error: rpcError } = await supabase.rpc('admin_reply_ticket', { 
                ticket_id: tId, 
                reply_text: currentReplyText 
            })
            
            if (rpcError) throw rpcError
            
            // Immediate fetch to bypass potential realtime lag
            await fetchReplies(tId)
            await fetchTickets()
            // Removed alert to prevent UI blocking
            console.log('Yanıt başarıyla gönderildi.');
        } catch (err: any) { 
            setReplyText(currentReplyText) // Restore text on error
            alert('Yanıt Gönderilemedi: ' + err.message) 
        }
    }

    const handleResolveTicket = async () => { 
        if (!selectedTicket) return;
        if (confirm('Bu talebi çözüldü olarak işaretlemek istediğinize emin misiniz?')) { 
            try {
                const { error } = await supabase.from('tickets').update({ status: 'resolved' }).eq('id', selectedTicket.id);
                if (error) throw error;
                
                alert('Talep başarıyla çözüldü.');
                fetchTickets(); 
                setSelectedTicket(null);
            } catch (err: any) {
                console.error('Talep Çözme Hatası:', err);
                alert('Hata (Talep Çözülemedi): ' + err.message);
            }
        } 
    }

    const handleAddBalance = async () => {
        if (!selectedCustomer || !balanceAmount) return
        const amt = balanceOperation === 'add' ? parseInt(balanceAmount) : -parseInt(balanceAmount)
        
        // Try to call with both naming conventions to be safe, or pick the one from fix_functions.sql
        const { error } = await supabase.rpc('increment_balance', { 
            v_user_id: selectedCustomer.id, 
            v_amount: amt
        })

        if (error) {
            console.error('Bakiye Hatası:', error)
            // Fallback for newer schema if exists
            const { error: error2 } = await supabase.rpc('increment_balance', { 
                user_id: selectedCustomer.id, 
                amount: amt 
            })
            if (error2) alert('Hata (Bakiye): ' + error2.message)
            else { 
                alert('Bakiye guncellendi'); 
                setShowBalanceModal(false); setBalanceAmount(''); fetchCustomers(); fetchTransactions() 
            }
        }
        else { 
            alert('Bakiye guncellendi'); 
            setShowBalanceModal(false); 
            setBalanceAmount(''); 
            fetchCustomers(); 
            fetchTransactions(); 
        }
    }

    const handleSendNotification = async () => {
        if (!notifTitle || !notifMessage) return alert('Baslik ve mesaj zorunludur')
        try {
            // user_id null means global broadcast
            const { error } = await supabase.from('notifications').insert({ 
                title: notifTitle, 
                message: notifMessage, 
                type: notifType, 
                user_id: null,
                is_read: false
            })
            if (error) throw error
            
            alert('Bildirim başarıyla gönderildi!'); 
            setShowNotifModal(false); 
            setNotifTitle(''); 
            setNotifMessage(''); 
            await fetchSentNotifications() 
        } catch (err: any) { 
            console.error('Bildirim Hatası:', err)
            alert('Hata (Bildirim Gönderilemedi): ' + (err.message || 'Bilinmeyen hata'))
        }
    }

    const handleDeleteAllNotifications = async () => {
        if (!confirm('Tüm bildirim geçmişi silinecek. Emin misiniz?')) return
        const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        if (!error) { alert('Tüm bildirimler silindi'); fetchSentNotifications() }
        else { alert('Hata: ' + error.message) }
    }

    const findCoordinates = () => {
        if (!navigator.geolocation) return alert('Konum desteklenmiyor.')
        setIsGeocoding(true)
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude; const lng = pos.coords.longitude; setNewKioskLocation([lat, lng])
                try {
                    const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&accept-language=tr')
                    const data = await res.json()
                    if (data?.display_name) setNewKioskAddress(data.display_name)
                } catch (e) {}
                setIsGeocoding(false)
            },
            (err) => { alert('Konum alinamadi: ' + err.message); setIsGeocoding(false) },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    useEffect(() => { fetchOtaReleases() }, [])

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><RefreshCw className="w-8 h-8 text-brand-primary animate-spin" /></div>
    if (!adminName) return null

    return (
        <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-hidden">
            <aside className="hidden md:flex md:w-64 md:h-full bg-white md:border-r border-slate-200 md:flex-col z-20 shadow-sm shrink-0">
                <div className="md:h-20 h-full flex items-center px-4 md:px-6 border-r md:border-b md:border-r-0 border-slate-100 shrink-0"><Logo size="small" /></div>
                <nav className="flex-1 p-2 md:p-4 md:space-y-1 overflow-x-auto md:overflow-x-transparent flex flex-row md:flex-col items-center md:items-stretch gap-2 md:gap-0 no-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Genel Bakis" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={Server} label="Cihaz Yonetimi" active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} />
                    <SidebarItem icon={Users} label="Musteriler" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                    <SidebarItem icon={CreditCard} label="Finans & Islemler" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
                    <SidebarItem icon={MessageSquare} label="Destek Merkezi" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
                    <SidebarItem icon={Bell} label="Bildirimler" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                    <SidebarItem icon={Cpu} label="Donanım OTA" active={activeTab === 'ota'} onClick={() => setActiveTab('ota')} />
                    <SidebarItem icon={Zap} label="Uygulama APK" active={activeTab === 'app-updates'} onClick={() => setActiveTab('app-updates')} />
                    <SidebarItem icon={Settings} label="Ayarlar" active={false} onClick={() => setShowAdminSettings(true)} />
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
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowMobileMenu(true)} className="p-2 -ml-2 text-slate-600">
                            <Menu className="w-6 h-6" />
                        </button>
                        <Logo size="small" />
                    </div>
                    <div className="flex gap-1 items-center">
                        <button onClick={() => setShowAdminSettings(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"><Settings className="w-6 h-6" /></button>
                        <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="p-2 text-slate-400 hover:text-red-500"><LogOut className="w-6 h-6" /></button>
                    </div>
                </header>

                {/* Full Mobil Sidebar Overlay */}
                {showMobileMenu && (
                    <div className="fixed inset-0 z-[100] md:hidden h-[100dvh] w-screen overflow-hidden touch-none">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
                        <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col animate-slide-in-left h-full overflow-hidden border-r border-slate-100">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                <Logo size="small" />
                                <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-slate-50 border border-slate-100 rounded-xl shadow-sm text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            <nav className="flex-1 overflow-y-auto p-4 space-y-1 bg-white scroll-smooth" style={{ overscrollBehavior: 'contain' }}>
                                <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Cpu} label="Cihaz Yönetimi" active={activeTab === 'devices'} onClick={() => { setActiveTab('devices'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Users} label="Müşteriler" active={activeTab === 'customers'} onClick={() => { setActiveTab('customers'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Wallet} label="Finansal İşlemler" active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={MessageSquare} label="Destek Merkezi" active={activeTab === 'support'} onClick={() => { setActiveTab('support'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Bell} label="Bildirim Geçmişi" active={activeTab === 'notifications'} onClick={() => { setActiveTab('notifications'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Cpu} label="Donanım OTA" active={activeTab === 'ota'} onClick={() => { setActiveTab('ota'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Zap} label="Uygulama APK" active={activeTab === 'app-updates'} onClick={() => { setActiveTab('app-updates'); setShowMobileMenu(false) }} />
                                <SidebarItem icon={Settings} label="Ayarlar" active={false} onClick={() => { setShowAdminSettings(true); setShowMobileMenu(false) }} />
                                <div className="h-10"></div> {/* Alt tarafın sıkışmaması için boşluk */}
                            </nav>
                            <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0 pb-8">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">{adminName.charAt(0)}</div>
                                    <div className="flex-1 overflow-hidden"><p className="text-sm font-bold truncate text-slate-800">{adminName}</p><p className="text-[10px] text-slate-500 uppercase font-black">Yönetici</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{activeTab === 'dashboard' ? 'Genel Bakis' : activeTab === 'support' ? 'Destek Merkezi' : activeTab === 'finance' ? 'Finansal Islemler' : activeTab === 'notifications' ? 'Bildirim Gecmisi' : activeTab === 'devices' ? 'Cihaz Yonetimi' : activeTab === 'ota' ? 'OTA Firmware Guncelleme' : activeTab === 'app-updates' ? 'Uygulama Güncelleme (APK)' : 'Musteriler'}</h1>
                            <p className="text-sm text-slate-500 mt-1">Sistem yonetimi ve raporlama</p>
                        </div>
                        {activeTab === 'devices' && (
                            <div className="flex gap-2 flex-wrap">
                                <button onClick={() => setShowBulkTimingModal(true)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><Clock className="w-4 h-4" /> Toplu Zamanlama Güncelle</button>
                                <button onClick={() => setShowBulkUpdateModal(true)} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><CreditCard className="w-4 h-4" /> Toplu Fiyat Guncelle</button>
                                <button onClick={() => { setBulkVideoUrl(''); setShowBulkVideoModal(true) }} className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><Zap className="w-4 h-4" /> Toplu Video Guncelle</button>
                                <button onClick={() => { setEditingDevice(null); setNewDeviceId(''); setNewKioskName(''); setNewKioskPrice('50'); setNewKioskPerfumePrice('5'); setNewKioskLocation(null); setNewKioskAddress(''); setNewKioskVideoUrl(''); setShowAddKioskModal(true) }} className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Yeni Cihaz Ekle</button>
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
                                    <div className="h-[300px] rounded-xl overflow-hidden border border-slate-50 relative"><KioskMap userLocation={adminLocation || [41.0082, 28.9784]} kiosks={devices} /></div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
                                    <h3 className="font-bold text-lg text-slate-800 mb-4">Son Aktiviteler</h3>
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar min-h-[250px]">
                                        {transactions.slice(0, 10).map(tx => (
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
                        <div className="animate-fade-in-up flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
                            <div className="flex flex-1 gap-4 overflow-hidden">
                                <div className={"bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-shrink-0 " + (selectedTicket ? "hidden lg:flex" : "flex w-full lg:w-80")}>
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Talepler</h3><button onClick={() => setShowNotifModal(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"><Bell className="w-4 h-4" /></button></div>
                                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                                        {tickets.map(ticket => (
                                            <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); fetchReplies(ticket.id) }} className={"p-4 cursor-pointer transition-all " + (selectedTicket?.id === ticket.id ? 'bg-brand-primary/5 border-l-4 border-brand-primary' : 'hover:bg-slate-50 border-l-4 border-transparent')}>
                                                <div className="flex justify-between items-start mb-1 gap-2"><span className="font-bold text-sm text-slate-800 leading-tight flex-1">{ticket.subject}</span><span className={"text-[10px] px-2 py-0.5 rounded-full uppercase font-black shrink-0 " + (ticket.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}>{ticket.status}</span></div>
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{ticket.message}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(ticket.created_at).toLocaleString('tr-TR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={"flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col " + (!selectedTicket ? "hidden lg:flex" : "flex w-full")}>
                                    {selectedTicket ? (
                                        <>
                                            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                                                <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 bg-slate-100 rounded-xl"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                                                <div className="flex-1 min-w-0"><h2 className="font-bold text-slate-800 truncate">{selectedTicket.subject}</h2><p className="text-xs text-slate-500 truncate">{selectedTicket.profiles?.full_name}</p></div>
                                                <button onClick={handleResolveTicket} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-200">Cozuldu</button>
                                            </div>
                                            <div ref={adminChatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                                                <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-black text-slate-600">K</div><div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 max-w-[85%] shadow-sm"><p className="text-sm text-slate-800">{selectedTicket.message}</p></div></div>
                                                {ticketReplies.map(reply => (
                                                    <div key={reply.id} className={"flex gap-3 " + (reply.is_admin ? 'flex-row-reverse' : '')}><div className={"w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black " + (reply.is_admin ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-600')}>{reply.is_admin ? 'A' : 'K'}</div><div className={"rounded-2xl px-4 py-3 max-w-[85%] shadow-sm " + (reply.is_admin ? 'bg-brand-primary text-white' : 'bg-white text-slate-800 border border-slate-200')}><p className="text-sm">{reply.message}</p></div></div>
                                                ))}
                                            </div>
                                            <div className="p-4 border-t border-slate-100 bg-white flex gap-3"><textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Yanitiniz..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary resize-none" rows={2} /><button onClick={handleReplyTicket} className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg hover:shadow-brand-primary/30 shrink-0"><Send className="w-5 h-5" /></button></div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><MessageSquare className="w-16 h-16 mb-3 opacity-30" /><p className="text-sm font-medium">Bir talep secin</p></div>
                                    )}
                                </div>
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
                                                <td className="p-4 text-slate-500 text-xs font-medium">{new Date(tx.created_at).toLocaleString('tr-TR')}</td>
                                                <td className="p-4 font-bold text-slate-700">{tx.profiles?.full_name}</td>
                                                <td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{tx.type === 'deposit' ? 'Bakiye Yukleme' : 'Harcama'}</span></td>
                                                <td className={`p-4 text-right font-black ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount)} &#8378;</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">Gonderilen Bildirimler</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleDeleteAllNotifications} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 hover:bg-red-100 transition-all">
                                        <Trash2 className="w-4 h-4" /> Geçmişi Temizle
                                    </button>
                                    <button onClick={() => setShowNotifModal(true)} className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                                        <Send className="w-4 h-4" /> Yeni Bildirim Gonder
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100"><tr><th className="p-4">Tarih</th><th className="p-4">Baslik</th><th className="p-4">Tip</th><th className="p-4 text-right">Alici</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {sentNotifications.map(n => (
                                            <tr key={n.id} className="hover:bg-slate-50/50"><td className="p-4 text-slate-500 text-xs">{new Date(n.created_at).toLocaleString('tr-TR')}</td><td className="p-4 font-bold text-slate-700">{n.title}</td><td className="p-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${n.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{n.type}</span></td><td className="p-4 text-right font-bold text-slate-600">{n.user_id ? n.profiles?.full_name : 'Tum Kullanicilar'}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ota' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-indigo-50 rounded-xl"><Cpu className="w-5 h-5 text-indigo-600" /></div><div><h3 className="font-bold text-slate-800">Yeni Firmware Kaydet</h3></div></div>
                                <div className="flex gap-4 mb-4 p-1 bg-slate-50 rounded-xl w-fit">
                                    <button onClick={() => setOtaUploadMode('file')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${otaUploadMode === 'file' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}>Dosya Yükle</button>
                                    <button onClick={() => setOtaUploadMode('url')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${otaUploadMode === 'url' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}>Dış Bağlantı (URL)</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Versiyon</label><input value={otaVersion} onChange={e => setOtaVersion(e.target.value)} className="modern-input" placeholder="v1.1.5" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Aciklama</label><input value={otaDescription} onChange={e => setOtaDescription(e.target.value)} className="modern-input" placeholder="Guncelleme detayi" /></div>
                                    {otaUploadMode === 'file' ? (
                                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Firmware Dosyası (.bin)</label><input type="file" accept=".bin" onChange={e => setOtaFile(e.target.files?.[0] || null)} className="modern-input" /></div>
                                    ) : (
                                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Firmware URL</label><input value={otaUrl} onChange={e => setOtaUrl(e.target.value)} className="modern-input" placeholder="https://..." /></div>
                                    )}
                                </div>
                                <button onClick={handleUploadOta} disabled={otaUploading} className="mt-4 btn-primary flex items-center gap-2">{otaUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Kaydet</button>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Firmware Gecmisi</h3><button onClick={fetchOtaReleases} className="text-slate-400 hover:text-brand-primary"><RefreshCw className="w-4 h-4" /></button></div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100"><tr><th className="p-4">Versiyon</th><th className="p-4">Durum</th><th className="p-4 text-right">Islem</th></tr></thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {otaReleases.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/50"><td className="p-4 font-black text-slate-800">{r.version}</td><td className="p-4">{r.is_active ? <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-md">Aktif</span> : <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-md">Pasif</span>}</td><td className="p-4 text-right"><button onClick={() => { setShowOtaDeployModal(r); setOtaTargetMode('all') }} disabled={r.is_active} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">Deploy</button></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'app-updates' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-4 bg-brand-primary/10 rounded-2xl">
                                        <Zap className="w-6 h-6 text-brand-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">Yeni Uygulama Sürümü Yayınla</h3>
                                        <p className="text-xs text-slate-500">Mobil veya Tablet uygulaması için APK güncellemesi gönderin.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hedef Platform</label>
                                        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                                            <button onClick={() => setAppPlatform('mobile')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${appPlatform === 'mobile' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400'}`}>Mobil</button>
                                            <button onClick={() => setAppPlatform('tablet')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${appPlatform === 'tablet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Tablet</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Versiyon Numarası</label>
                                        <input value={appVersion} onChange={e => setAppVersion(e.target.value)} className="modern-input" placeholder="Örn: 1.0.5" />
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Güncelleme Notları</label>
                                        <input value={appNotes} onChange={e => setAppNotes(e.target.value)} className="modern-input" placeholder="Neler değişti?" />
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">APK Dosyası Yükle</label>
                                        <div className="relative group">
                                            <input type="file" accept=".apk" onChange={e => setAppFile(e.target.files?.[0] || null)} className="modern-input pr-10" />
                                            <Upload className="absolute right-3 top-3 w-4 h-4 text-slate-300 group-hover:text-brand-primary transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Veya Harici APK Linki (Drive vb.)</label>
                                        <input value={appUrl} onChange={e => setAppUrl(e.target.value)} className="modern-input" placeholder="https://..." />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleUploadApp} 
                                    disabled={appUploading} 
                                    className="mt-8 w-full md:w-auto px-12 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {appUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} 
                                    Güncellemeyi Yayınla
                                </button>
                            </div>

                            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="font-black text-slate-800">Yayınlanmış Sürümler</h3>
                                    <button onClick={fetchAppReleases} className="p-2 text-slate-400 hover:text-brand-primary transition-colors"><RefreshCw className="w-4 h-4" /></button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black border-b border-slate-50">
                                            <tr>
                                                <th className="p-4">Platform</th>
                                                <th className="p-4">Versiyon</th>
                                                <th className="p-4">Tarih</th>
                                                <th className="p-4">Notlar</th>
                                                <th className="p-4 text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {appReleases.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${r.platform === 'mobile' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-indigo-50 text-indigo-600'}`}>
                                                            {r.platform}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-black text-slate-800">{r.version}</td>
                                                    <td className="p-4 text-slate-500 text-xs">{new Date(r.created_at).toLocaleString('tr-TR')}</td>
                                                    <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{r.release_notes || '-'}</td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <a href={r.apk_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-brand-primary bg-slate-50 rounded-lg"><Eye className="w-4 h-4" /></a>
                                                            <button onClick={() => handleDeleteAppRelease(r.id)} className="p-2 text-slate-400 hover:text-red-500 bg-red-50/50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {appReleases.length === 0 && (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-300 font-bold">Henüz bir uygulama sürümü yayınlanmamış.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Musteriler ({customers.length})</h3><div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Ara..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64" /></div></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-100"><tr><th className="p-4">Ad Soyad</th><th className="p-4">Bakiye</th><th className="p-4 text-right">Islem</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {customers.filter(c => c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.email?.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-700">{c.full_name}</td><td className="p-4 font-black text-brand-primary">{c.balance} &#8378;</td><td className="p-4 text-right"><button onClick={() => { setSelectedCustomer(c); setShowBalanceModal(true) }} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600">Yonet</button></td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'devices' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                            {devices.map(device => {
                                const espLastSeen = device.last_seen ? new Date(device.last_seen).getTime() : 0;
                                const tblLastSeen = device.tablet_last_seen ? new Date(device.tablet_last_seen).getTime() : 0;
                                const nowTime = now.getTime();

                                // Saat farklari icin 120 saniye tolerans ve mutlak deger kontrolu
                                const espConnected = (device.esp32_status === true) && (espLastSeen > 0 && Math.abs(nowTime - espLastSeen) < 120000);
                                const tabletConnected = (tblLastSeen > 0 && Math.abs(nowTime - tblLastSeen) < 120000);
                                const megaConnected = (device.mega_status === true) && espConnected;
                                const hasHardwareFailure = device.status === 'online' && (!espConnected || !megaConnected || !tabletConnected);

                                return (
                                    <div key={device.id} className={`bg-white p-5 rounded-2xl border transition-all group shadow-sm hover:shadow-md relative ${hasHardwareFailure ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50' : 'border-slate-100 hover:border-brand-primary/30'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold text-lg truncate ${hasHardwareFailure ? 'text-red-600' : 'group-hover:text-brand-primary'}`}>{device.name}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate"><MapPin className="w-3 h-3" /> {device.location}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 ml-4">
                                                <div className="relative">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={`flex items-center gap-2 p-1.5 rounded-lg border ${hasHardwareFailure ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                                                            <div className="flex flex-col items-center px-1 border-r border-slate-200">
                                                                <Cpu className={`w-3 h-3 ${espConnected ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`} />
                                                                <span className="text-[7px] font-black text-slate-400 mt-0.5">ESP</span>
                                                                <span className="text-[6px] font-bold text-brand-primary">{device.heartbeat_count || 0}</span>
                                                            </div>
                                                            <div className="flex flex-col items-center px-1 border-r border-slate-200">
                                                                <Zap className={`w-3 h-3 ${megaConnected ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`} />
                                                                <span className="text-[7px] font-black text-slate-400 mt-0.5">MG</span>
                                                            </div>
                                                            <div className="flex flex-col items-center px-1">
                                                                <Monitor className={`w-3 h-3 ${tabletConnected ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`} />
                                                                <span className="text-[7px] font-black text-slate-400 mt-0.5">TBL</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[8px] font-bold text-slate-400 italic">
                                                            Son: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Hiç'}
                                                        </div>
                                                        <button onClick={() => setShowStatusMenu(showStatusMenu === device.id ? null : device.id)} className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 border shadow-sm ${device.status === 'online' ? (hasHardwareFailure ? 'bg-red-600 text-white border-red-700 animate-bounce' : 'bg-emerald-50 text-emerald-600') : 'bg-slate-50 text-slate-500'}`}>
                                                            MOD: {device.status === 'online' ? (hasHardwareFailure ? 'HATA' : 'AKTIF') : device.status.toUpperCase()} <ChevronDown className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                    {showStatusMenu === device.id && (
                                                        <div className="absolute right-0 top-12 bg-white border border-slate-100 rounded-xl shadow-xl p-1 z-30 min-w-[130px] animate-fade-in-up">
                                                            <button onClick={() => handleUpdateStatus(device.id, 'online')} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-emerald-50 text-emerald-600 rounded-lg flex items-center gap-2">🟢 AKTIF MOD</button>
                                                            <button onClick={() => handleUpdateStatus(device.id, 'maintenance')} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-amber-50 text-amber-600 rounded-lg flex items-center gap-2">🟠 BAKIM MODU</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${!device.work_status || device.work_status === 'idle' ? 'bg-slate-50 text-slate-400' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                                {!device.work_status || device.work_status === 'idle' ? 'BOŞTA' : device.work_status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="mt-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                            <div className="flex justify-between items-center mb-1.5"><span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Zap className="w-3 h-3 text-blue-400" />Sıvı Seviyesi</span><span className="text-[10px] font-black text-slate-600">%{device.liquid_level_pct || 0}</span></div>
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${device.liquid_level_pct && device.liquid_level_pct < 20 ? 'bg-red-500' : 'bg-brand-primary'}`} style={{ width: `${device.liquid_level_pct || 0}%` }} /></div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-sm font-black text-brand-primary tracking-tight">{device.hizmet_fiyati} TL</div>
                                                <div className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">
                                                    ID: {device.id} | {device.firmware_version || 'v1.1.2'}
                                                    {device.ota_status && device.ota_status !== 'success' && (
                                                        <span className={`ml-2 px-1.5 py-0.5 rounded-md font-bold ${device.ota_status.includes('fail') ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600 animate-pulse'}`}>
                                                            OTA: {device.ota_status.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.preventDefault();
                                                        e.stopPropagation(); 
                                                        console.log("Duzenle butonuna basildi, Modal aciliyor...");
                                                        setEditingDevice(device); 
                                                        setNewDeviceId(device.id);
                                                        setNewKioskName(device.name); 
                                                        setNewKioskPrice(device.hizmet_fiyati?.toString() || '50');
                                                        setNewKioskPerfumePrice(device.parfum_fiyati?.toString() || '5');
                                                        setNewKioskNayaxId(device.nayax_terminal_id || '');
                                                        setNewKioskVideoUrl(device.video_url || '');
                                                        setNewKioskAddress(device.location || '');
                                                        if (device.latitude && device.longitude) {
                                                            setNewKioskLocation([device.latitude, device.longitude]);
                                                        } else {
                                                            setNewKioskLocation(null);
                                                        }
                                                        setNewTimeLock(device.time_lock_sec?.toString() || '2');
                                                        setNewTimeWash(device.time_wash_sec?.toString() || '15');
                                                        setNewTimeDry(device.time_dry_sec?.toString() || '30');
                                                        setNewTimePerfume(device.time_perfume_sec?.toString() || '3');
                                                        setNewTimeFinish(device.time_finish_sec?.toString() || '5');
                                                        setShowAddKioskModal(true); 
                                                    }} 
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 cursor-pointer shadow-md"
                                                >
                                                    <Pen className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold">Düzenle</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.preventDefault();
                                                        e.stopPropagation(); 
                                                        if(confirm('Cihazi silmek istediginizden emin misiniz?')) {
                                                            handleDeleteKiosk(device.id); 
                                                        }
                                                    }} 
                                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {showStatusMenu === device.id && <div className="fixed inset-0 z-20" onClick={() => setShowStatusMenu(null)}></div>}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL: Yeni/Duzenle Cihaz */}
            {showAddKioskModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-slate-50">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingDevice ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}
                            </h3>
                            <button onClick={() => setShowAddKioskModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cihaz ID (Kimlik)</label>
                                    <input type="text" value={newDeviceId} onChange={e => setNewDeviceId(e.target.value)} className="modern-input" placeholder="Örn: KASK-DCB4D90C64D4" />
                                    {editingDevice && <p className="text-[10px] text-brand-primary mt-1 font-bold">DİKKAT: ID değiştirildiğinde donanımla uyuşmazlık olabilir.</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cihaz Adı</label>
                                    <input type="text" value={newKioskName} onChange={e => setNewKioskName(e.target.value)} className="modern-input" placeholder="Örn: Akaretler-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nayax Terminal ID</label>
                                    <input type="text" value={newKioskNayaxId} onChange={e => setNewKioskNayaxId(e.target.value)} className="modern-input" placeholder="Opsiyonel" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Hizmet Fiyatı (TL)</label>
                                        <input type="number" value={newKioskPrice} onChange={e => setNewKioskPrice(e.target.value)} className="modern-input" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Parfüm Fiyatı (TL)</label>
                                        <input type="number" value={newKioskPerfumePrice} onChange={e => setNewKioskPerfumePrice(e.target.value)} className="modern-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Video URL</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={newKioskVideoUrl} onChange={e => setNewKioskVideoUrl(e.target.value)} className="modern-input flex-1" placeholder="https://..." />
                                        {newKioskVideoUrl && (
                                            <a href={newKioskVideoUrl} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-slate-400" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase block">Konum Seçimi</label>
                                        <button onClick={findCoordinates} disabled={isGeocoding} className="text-[10px] font-black text-brand-primary uppercase hover:underline flex items-center gap-1">
                                            {isGeocoding ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />} Konumumu Bul
                                        </button>
                                    </div>
                                    <div className="h-48 rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative group">
                                        <AddKioskMap 
                                            userLocation={adminLocation || [41.0082, 28.9784]} 
                                            onLocationSelect={(lat, lng) => setNewKioskLocation([lat, lng])} 
                                            initialLocation={newKioskLocation}
                                            otherKiosks={devices.filter(d => d.id !== editingDevice?.id)}
                                        />
                                        {!newKioskLocation && (
                                            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                                                <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold text-slate-600 border border-slate-200">Haritadan bir nokta seçin</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Adres Detayı</label>
                                    <textarea value={newKioskAddress} onChange={e => setNewKioskAddress(e.target.value)} className="modern-input h-20 resize-none text-xs" placeholder="Konum seçildiğinde otomatik dolabilir veya manuel giriniz..." />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-primary" /> Donanım Zamanlama Ayarları (Saniye)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kilitlenme</label>
                                    <input type="number" value={newTimeLock} onChange={e => setNewTimeLock(e.target.value)} className="modern-input !py-2.5 !text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Yıkama/Sis</label>
                                    <input type="number" value={newTimeWash} onChange={e => setNewTimeWash(e.target.value)} className="modern-input !py-2.5 !text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kurutma</label>
                                    <input type="number" value={newTimeDry} onChange={e => setNewTimeDry(e.target.value)} className="modern-input !py-2.5 !text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Parfüm</label>
                                    <input type="number" value={newTimePerfume} onChange={e => setNewTimePerfume(e.target.value)} className="modern-input !py-2.5 !text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Bitiş Ekranı</label>
                                    <input type="number" value={newTimeFinish} onChange={e => setNewTimeFinish(e.target.value)} className="modern-input !py-2.5 !text-sm" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex gap-4">
                            <button onClick={() => setShowAddKioskModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">İptal</button>
                            <button onClick={handleSaveKiosk} className="flex-[2] py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all">
                                {editingDevice ? 'Değişiklikleri Kaydet' : 'Cihazı Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Müşteri Bakiye Yönetimi */}
            {showBalanceModal && selectedCustomer && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bakiye Yönetimi</h3>
                            <button onClick={() => setShowBalanceModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Müşteri</p>
                                <p className="text-lg font-black text-slate-800">{selectedCustomer.full_name}</p>
                                <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Mevcut Bakiye:</span>
                                    <span className="text-xl font-black text-brand-primary">{selectedCustomer.balance} &#8378;</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase block">İşlem Türü</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                                    <button onClick={() => setBalanceOperation('add')} className={`py-2.5 rounded-lg text-sm font-bold transition-all ${balanceOperation === 'add' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Para Ekle (+)</button>
                                    <button onClick={() => setBalanceOperation('subtract')} className={`py-2.5 rounded-lg text-sm font-bold transition-all ${balanceOperation === 'subtract' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Para Çıkar (-)</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tutar (TL)</label>
                                <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="modern-input text-center text-2xl font-black py-4" placeholder="0" />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowBalanceModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">İptal</button>
                            <button onClick={handleAddBalance} className={`flex-[2] py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 ${balanceOperation === 'add' ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-red-600 shadow-red-200 hover:bg-red-700'}`}>
                                {balanceOperation === 'add' ? 'Bakiyeyi Artır' : 'Bakiyeyi Azalt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOtaDeployModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Güncellemeyi Başlat</h3>
                            <button onClick={() => setShowOtaDeployModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div className="text-xs font-bold text-indigo-400 uppercase mb-1">Seçili Versiyon</div>
                                <div className="text-xl font-black text-indigo-700">{showOtaDeployModal.version}</div>
                                <div className="text-xs text-indigo-500 mt-1">{showOtaDeployModal.description || 'Açıklama yok'}</div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase block">Hedef Cihazlar</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setOtaTargetMode('all')} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${otaTargetMode === 'all' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-400'}`}>Tüm Cihazlar</button>
                                    <button onClick={() => setOtaTargetMode('select')} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${otaTargetMode === 'select' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-400'}`}>Cihaz Seçimi</button>
                                </div>
                            </div>

                            {otaTargetMode === 'select' && (
                                <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {devices.map(d => (
                                        <button key={d.id} onClick={() => setOtaSelectedDevices(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])} className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${otaSelectedDevices.includes(d.id) ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100'}`}>
                                            <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                            {otaSelectedDevices.includes(d.id) && <Check className="w-4 h-4 text-brand-primary" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-[10px] text-amber-700 font-medium">Bu işlem seçili cihazlara güncelleme komutu gönderecek ve cihazlar yeniden başlayacaktır.</p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowOtaDeployModal(null)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">Vazgeç</button>
                            <button onClick={handleDeployOta} disabled={otaDeploying === showOtaDeployModal.id} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {otaDeploying === showOtaDeployModal.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} Yüklemeyi Başlat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkTimingModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBulkTimingModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-xl text-slate-800">Toplu Zamanlama Güncelle</h3>
                            <button onClick={() => setShowBulkTimingModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">Tüm cihazlar için saniye cinsinden donanım çalışma sürelerini belirleyin.</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Kilitlenme (Sn)</label>
                                <input type="number" value={bulkTimeLock} onChange={e => setBulkTimeLock(e.target.value)} className="modern-input" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Yıkama/Sis (Sn)</label>
                                <input type="number" value={bulkTimeWash} onChange={e => setBulkTimeWash(e.target.value)} className="modern-input" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Kurutma (Sn)</label>
                                <input type="number" value={bulkTimeDry} onChange={e => setBulkTimeDry(e.target.value)} className="modern-input" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Parfüm (Sn)</label>
                                <input type="number" value={bulkTimePerfume} onChange={e => setBulkTimePerfume(e.target.value)} className="modern-input" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Bitiş Ekranı Süresi (Sn)</label>
                                <input type="number" value={bulkTimeFinish} onChange={e => setBulkTimeFinish(e.target.value)} className="modern-input" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkTimingModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">İptal</button>
                            <button onClick={handleBulkTimingUpdate} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 shadow-lg">Tümüne Uygula</button>
                        </div>
                    </div>
                </div>
            )}

            {showAdminSettings && (
                <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAdminSettings(false)} />
                    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
                        <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-4">
                            <h3 className="font-black text-xl text-slate-800">Admin Ayarları</h3>
                            <button onClick={() => setShowAdminSettings(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Şifre Güvenliği</h4>
                                <form onSubmit={handleAdminPasswordChange} className="space-y-3">
                                    <input type="password" value={adminOldPw} onChange={e => setAdminOldPw(e.target.value)} placeholder="Mevcut Şifre" className="modern-input w-full" required />
                                    <input type="password" value={adminNewPw} onChange={e => setAdminNewPw(e.target.value)} placeholder="Yeni Şifre" className="modern-input w-full" required />
                                    <input type="password" value={adminConfirmPw} onChange={e => setAdminConfirmPw(e.target.value)} placeholder="Yeni Şifre (Tekrar)" className="modern-input w-full" required />
                                    <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Check className="w-5 h-5" /> Şifreyi Güncelle
                                    </button>
                                </form>
                            </div>
                            
                            <div className="border-t border-slate-100 pt-6 space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Diğer İşlemler</h4>
                                <button onClick={() => router.push('/user')} className="w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition-all">Müşteri Görünümüne Geç</button>
                                <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all">Oturumu Kapat</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNotifModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Yeni Bildirim Gönder</h3>
                            <button onClick={() => setShowNotifModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bildirim Başlığı</label>
                                <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="modern-input" placeholder="Örn: Kampanya Duyurusu" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mesaj İçeriği</label>
                                <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} className="modern-input h-24 resize-none" placeholder="Kullanıcılara iletilecek mesaj..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bildirim Tipi</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setNotifType('info')} className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${notifType === 'info' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-400'}`}>Bilgilendirme</button>
                                    <button onClick={() => setNotifType('warning')} className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${notifType === 'warning' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-slate-100 text-slate-400'}`}>Uyarı / Hata</button>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] text-blue-700 font-medium">Bu bildirim tüm aktif kullanıcılara anlık olarak iletilecektir.</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowNotifModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">Vazgeç</button>
                            <button onClick={handleSendNotification} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all">Gönder</button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkUpdateModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBulkUpdateModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-xl text-slate-800">Toplu Fiyat Güncelle</h3>
                            <button onClick={() => setShowBulkUpdateModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">İşlem Türü</label>
                                <select value={bulkUpdateType} onChange={e => setBulkUpdateType(e.target.value as any)} className="modern-input">
                                    <option value="fixed">Sabit Fiyat Yap</option>
                                    <option value="add">Üzerine Ekle (TL)</option>
                                    <option value="subtract">Fiyattan Düş (TL)</option>
                                    <option value="percentage">Yüzde Artır (%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Değer</label>
                                <input type="number" value={bulkUpdateValue} onChange={e => setBulkUpdateValue(e.target.value)} className="modern-input" placeholder="Örn: 10" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkUpdateModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">İptal</button>
                            <button onClick={handleBulkUpdate} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 shadow-lg">Uygula</button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkVideoModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBulkVideoModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-xl text-slate-800">Toplu Video Güncelle</h3>
                            <button onClick={() => setShowBulkVideoModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">Tüm cihazlardaki reklam videosunu tek seferde değiştirin.</p>
                        
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Yeni Video URL</label>
                            <input type="text" value={bulkVideoUrl} onChange={e => setBulkVideoUrl(e.target.value)} className="modern-input" placeholder="https://..." />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBulkVideoModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">İptal</button>
                            <button onClick={handleBulkVideoUpdate} className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 shadow-lg">Tümüne Uygula</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
