'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Phone, ArrowLeft, Globe, Check, User } from 'lucide-react'
import Logo from '@/components/Logo'
import { useLanguage } from '@/context/LanguageContext'

export default function Register() {
    const router = useRouter()
    const { t, language, setLanguage } = useLanguage()
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.fullName,
                    phone: formData.phone,
                    role: 'customer',
                },
            },
        })

        if (error) {
            setError(t('error') + ': ' + error.message)
            setLoading(false)
        } else {
            setError(t('success') + '! ...')
            setTimeout(() => {
                router.push('/')
            }, 2000)
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Arkaplan Efektleri */}
            <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] animate-pulse-glow"></div>
            <div className="absolute bottom-[-20px] left-[-20px] w-72 h-72 bg-purple-600/20 rounded-full blur-[80px] animate-float"></div>

            <div className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10 animate-fade-in shadow-2xl shadow-black/50">

                <div className="flex justify-between items-start mb-4">
                    <button onClick={() => router.push('/')} className="flex items-center text-slate-400 hover:text-white transition-colors text-xs hover:-translate-x-1 duration-200">
                        <ArrowLeft className="w-3 h-3 mr-1" /> {t('back')}
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setLanguage('tr')}
                            className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${language === 'tr' ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                        >
                            TR
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${language === 'en' ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="mb-4">
                        <Logo size="small" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{t('registerTitle')}</h1>
                    <p className="mt-1 text-slate-400 text-sm">Fresh-Rider dünyasına katılın</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">{t('fullName')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                name="fullName"
                                required
                                className="glass-input w-full pl-9 rounded-lg py-2.5 text-sm placeholder:text-slate-600"
                                placeholder="Örn: Ahmet Yılmaz"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">{t('phone')}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                name="phone"
                                type="tel"
                                required
                                placeholder="0555 123 45 67"
                                className="glass-input w-full pl-9 rounded-lg py-2.5 text-sm placeholder:text-slate-600"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">E-posta</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="ornek@mail.com"
                                className="glass-input w-full pl-9 rounded-lg py-2.5 text-sm placeholder:text-slate-600"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 tracking-wider">Şifre</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="En az 6 karakter"
                                className="glass-input w-full pl-9 rounded-lg py-2.5 text-sm placeholder:text-slate-600"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={`p-3 text-xs rounded-lg border backdrop-blur-md ${error.includes('Başarılı') ? 'text-emerald-300 bg-emerald-900/40 border-emerald-500/30' : 'text-red-300 bg-red-900/40 border-red-500/30'}`}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-70 disabled:grayscale"
                    >
                        {loading ? t('loading') : t('registerButton')}
                    </button>

                </form>
            </div>
        </main>
    )
}
