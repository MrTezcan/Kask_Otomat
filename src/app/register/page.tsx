'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Phone, ArrowLeft, User } from 'lucide-react'
import Logo from '@/components/Logo'
import { useLanguage } from '@/context/LanguageContext'

export default function Register() {
    const router = useRouter()
    const { t, language, setLanguage } = useLanguage()
    const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', password: '' })
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!termsAccepted) {
            setError('Devam etmek icin Kullanici Sozlesmesini kabul etmelisiniz.')
            return
        }
        setLoading(true)
        setError(null)

        if (formData.password.length < 6) {
            setError('Sifre en az 6 karakter olmalidir.')
            setLoading(false)
            return
        }

        const { data: isPhoneUnique, error: phoneCheckError } = await supabase.rpc('check_phone_unique', { phone_number: formData.phone })
        if (!phoneCheckError && isPhoneUnique === false) {
            setError('Bu telefon numarasi zaten kullanimda.')
            setLoading(false)
            return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { data: { full_name: formData.fullName, phone: formData.phone, role: 'customer' } },
        })

        if (signUpError) {
            const msg = signUpError.message.toLowerCase()
            if (msg.includes('already registered') || msg.includes('user already') || msg.includes('already been registered')) {
                setError('Bu e-posta adresi zaten kullanimda.')
            } else if (msg.includes('password')) {
                setError('Sifre gecersiz: ' + signUpError.message)
            } else {
                setError('Kayit hatasi: ' + signUpError.message)
            }
            setLoading(false)
            return
        }

        if (data.session) {
            window.location.href = '/user'
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    if (success) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6">
                <div className="glass-card w-full max-w-md p-8 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Kayit Basarili!</h2>
                    <p className="text-slate-400 text-sm mb-6">E-posta adresinize bir onay linki gonderdik. Lutfen e-postanizi kontrol edip hesabinizi onaylayin.</p>
                    <button onClick={() => router.push('/')} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl">
                        Giris Sayfasina Git
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] animate-pulse-glow"></div>
            <div className="absolute bottom-[-20px] left-[-20px] w-72 h-72 bg-purple-600/20 rounded-full blur-[80px] animate-float"></div>

            <div className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10 animate-fade-in shadow-2xl shadow-black/50">
                <div className="flex justify-between items-start mb-4">
                    <button onClick={() => router.push('/')} className="flex items-center text-slate-400 hover:text-white transition-colors text-xs hover:-translate-x-1 duration-200">
                        <ArrowLeft className="w-3 h-3 mr-1" /> {t('back')}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setLanguage('tr')} className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${language === 'tr' ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>TR</button>
                        <button onClick={() => setLanguage('en')} className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${language === 'en' ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>EN</button>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="mb-4"><Logo size="small" /></div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{t('registerTitle')}</h1>
                    <p className="mt-1 text-slate-400 text-sm">Fresh-Rider dunyasina katilin</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">{t('fullName')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-500" /></div>
                            <input name="fullName" required className="glass-input w-full !pl-11 rounded-lg py-2.5 text-sm placeholder:text-slate-600" placeholder="Ornek: Ahmet Yilmaz" onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">{t('phone')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-500" /></div>
                            <input name="phone" type="tel" required placeholder="0555 123 45 67" className="glass-input w-full !pl-11 rounded-lg py-2.5 text-sm placeholder:text-slate-600" onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">E-posta</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-slate-500" /></div>
                            <input name="email" type="email" required placeholder="ornek@mail.com" className="glass-input w-full !pl-11 rounded-lg py-2.5 text-sm placeholder:text-slate-600" onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">Sifre</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-500" /></div>
                            <input name="password" type="password" required minLength={6} placeholder="En az 6 karakter" className="glass-input w-full !pl-11 rounded-lg py-2.5 text-sm placeholder:text-slate-600" onChange={handleChange} />
                        </div>
                    </div>

                    {/* Terms Checkbox - Required */}
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${termsAccepted ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                        <div className="relative flex-shrink-0 mt-0.5">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setError(null) }}
                                className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-white/30 bg-white/5'}`}>
                                {termsAccepted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>
                        <span className="text-xs text-slate-400 leading-relaxed">
                            <button type="button" onClick={() => router.push('/terms')} className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2">
                                Kullanici Sozlesmesi ve Gizlilik Politikasini
                            </button>
                            {' '}okudum ve kabul ediyorum.
                        </span>
                    </label>

                    {error && (
                        <div className="p-3 text-xs rounded-lg border backdrop-blur-md text-red-300 bg-red-900/40 border-red-500/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !termsAccepted}
                        className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? t('loading') : t('registerButton')}
                    </button>
                </form>
            </div>
        </main>
    )
}