'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import Logo from '@/components/Logo'

export default function ForgotPassword() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) {
            setError('Hata: ' + error.message)
            setLoading(false)
        } else {
            setSent(true)
            setLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-10 left-10 w-72 h-72 bg-brand-primary/10 rounded-full blur-[100px]"></div>
            <div className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10">
                <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-brand-primary mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
                </button>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4"><Logo size="large" /></div>
                    <h1 className="text-2xl font-black text-slate-800">Şifremi Unuttum</h1>
                    <p className="text-slate-500 text-sm mt-2">Hesabınıza bağlı e-posta adresini girin, size şifre sıfırlama bağlantısı gönderelim.</p>
                </div>

                {sent ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">E-posta Gönderildi!</h3>
                        <p className="text-slate-500 text-sm">Lütfen <b>{email}</b> adresini kontrol edin. (Spam klasörüne bakmayı unutmayın)</p>
                        <button onClick={() => router.push('/')} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl mt-6 hover:bg-slate-200 transition-colors">Giriş Ekranına Dön</button>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-posta Adresi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                                </div>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="glass-input w-full !pl-12 rounded-xl py-3 text-sm" placeholder="ornek@mail.com" />
                            </div>
                        </div>

                        {error && <div className="p-3 text-sm rounded-lg border text-red-300 bg-red-900/40 border-red-500/30">{error}</div>}

                        <button type="submit" disabled={loading}
                            className="w-full flex justify-center items-center py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Send className="w-4 h-4 mr-2" /> Sıfırlama Bağlantısı Gönder</>}
                        </button>
                    </form>
                )}
            </div>
        </main>
    )
}
