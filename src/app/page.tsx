'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Smartphone, User, ArrowRight, ShieldCheck, Globe, Check } from 'lucide-react'
import Logo from '@/components/Logo'
import { useLanguage } from '@/context/LanguageContext'

export default function Home() {
    const router = useRouter()
    const { t, language, setLanguage } = useLanguage()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load saved credentials on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPassword = localStorage.getItem('rememberedPassword');
        if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
        }
        const savedEmail = localStorage.getItem('rememberedEmail')
        const savedPassword = localStorage.getItem('rememberedPassword')
        if (savedEmail && savedPassword) {
            setEmail(savedEmail)
            setPassword(savedPassword)
            setRememberMe(true)
        }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(t('error') + ': ' + error.message)
            setLoading(false)
        } else {
            const user = data.user

            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email)
                localStorage.setItem('rememberedPassword', password)
            } else {
                localStorage.removeItem('rememberedEmail')
                localStorage.removeItem('rememberedPassword')
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'admin' || email.includes('admin')) {
                router.push('/admin')
            } else {
                router.push('/user')
            }
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Arkaplan Efektleri (Yüzen Küreler) */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-brand-primary/10 rounded-full blur-[100px] animate-float"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-accent/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10 animate-fade-in">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-6 animate-float">
                        <Logo size="large" />
                    </div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">
                        Fresh-Rider
                    </h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="glass-input w-full !pl-12 rounded-xl py-3 text-sm placeholder:text-slate-400"
                                placeholder={t('email')}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input w-full !pl-12 rounded-xl py-3 text-sm placeholder:text-slate-400"
                                placeholder={t('password')}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={`p-3 text-sm rounded-lg border backdrop-blur-md ${error.includes('baþarýlý') ? 'text-green-300 bg-green-900/40 border-green-500/30' : 'text-red-300 bg-red-900/40 border-red-500/30'}`}>
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-500 bg-slate-800 text-brand-primary focus:ring-brand-primary/50 transition-colors"
                            />
                            <span className="text-slate-500 group-hover:text-slate-600 transition-colors">Beni Hatýrla</span>
                        </label>
                        <a href="#" className="text-brand-primary hover:text-brand-accent transition-colors">Þifremi Unuttum</a>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Giriþ Yap <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push('/register')}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-600 font-medium rounded-xl border border-slate-200 transition-colors text-sm"
                        >
                            Hesabýnýz yok mu? <span className="text-brand-accent">Kayýt Olun</span>
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                    <button className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-white transition-colors group">
                        <Smartphone className="h-4 w-4 mr-1group-hover:text-brand-accent transition-colors" />
                        Mobil Uygulamayý Ýndir
                    </button>
                </div>
            </div>

            {/* Alt Bilgi */}
            <footer className="absolute bottom-4 text-center text-slate-600 text-[10px]">
                &copy; 2026 Fresh-Rider Hygiene Systems. Tüm haklarý saklýdýr.
            </footer>
        </main>
    )
}

