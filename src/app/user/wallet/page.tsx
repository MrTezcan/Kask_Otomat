'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Wallet, CreditCard, History, ChevronLeft, Calendar, ArrowUpRight, ArrowDownLeft, Settings, Check, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { useLanguage } from '@/context/LanguageContext'

export default function WalletPage() {
    const router = useRouter()
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const { t, language, setLanguage } = useLanguage()

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [processingPayment, setProcessingPayment] = useState(false)
    const [cardNumber, setCardNumber] = useState('')
    const [cardHolderName, setCardHolderName] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvv, setCvv] = useState('')

    const fetchWalletData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return; }

        // Get Balance
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
        if (profile) setBalance(profile.balance)

        // Get Transactions
        const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50) // Show last 50 transactions

        if (txData) setTransactions(txData)
        setLoading(false)
    }

    useEffect(() => {
        fetchWalletData()

        // Realtime Balance Updates
        const channel = supabase.channel('wallet-balance')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                // @ts-ignore
                setBalance(payload.new.balance)
                fetchWalletData() // Refresh transactions too
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const isValidLuhn = (num: string) => {
        let sum = 0;
        let shouldDouble = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num.charAt(i));
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (sum % 10) === 0;
    }

    const getCardType = (number: string) => {
        const cleaned = number.replace(/\s/g, '')
        if (/^4/.test(cleaned)) return 'visa'
        if (/^5[1-5]/.test(cleaned)) return 'mastercard'
        if (/^3[47]/.test(cleaned)) return 'amex'
        if (/^6(?:011|5)/.test(cleaned)) return 'discover'
        if (/^35/.test(cleaned)) return 'jcb'
        if (/^(?:2131|1800|30[0-5])/.test(cleaned)) return 'dinersclub'
        if (/^62/.test(cleaned)) return 'unionpay'
        return 'unknown'
    }

    const getCardBrandColor = (type: string) => {
        switch (type) {
            case 'visa': return 'from-blue-600 to-blue-800'
            case 'mastercard': return 'from-red-600 to-orange-600'
            case 'amex': return 'from-blue-500 to-teal-600'
            case 'discover': return 'from-orange-500 to-orange-700'
            case 'jcb': return 'from-blue-700 to-red-600'
            case 'dinersclub': return 'from-slate-600 to-slate-800'
            case 'unionpay': return 'from-red-700 to-blue-700'
            default: return 'from-slate-800 to-black'
        }
    }

    const cardType = getCardType(cardNumber)

    const processPayment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (cardNumber.replace(/\s/g, '').length !== 16 || !isValidLuhn(cardNumber.replace(/\s/g, ''))) {
            alert("Lütfen geçerli bir kredi kartı numarası giriniz.");
            return;
        }

        setProcessingPayment(true)
        await new Promise(resolve => setTimeout(resolve, 2000))

        const amount = 100
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { error } = await supabase.rpc('increment_balance', {
                user_id: user.id,
                amount: amount,
                p_payment_method: 'credit_card'
            })
            if (!error) {
                await fetchWalletData()
                setShowPaymentModal(false)
                setCardNumber('')
                setCardHolderName('')
                setExpiry('')
                setCvv('')
                alert(t('paymentSuccess'))
            }
        }
        setProcessingPayment(false)
    }

    return (
        <div className="min-h-screen bg-brand-dark text-slate-800 font-sans p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="container mx-auto max-w-lg min-h-screen flex flex-col relative z-10 px-6 py-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <button onClick={() => router.push('/user')} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <Logo size="small" />
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest mt-2 italic">{t('wallet')}</h1>
                    </div>
                    <button onClick={() => setShowSettings(true)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </header>

                {/* Balance Card */}
                <div className="relative mb-10 group">
                    <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden text-center border border-slate-200 shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Wallet className="w-32 h-32 text-slate-800 rotate-12" />
                        </div>

                        <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mb-4">{t('currentBalance')}</p>
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="text-5xl font-black text-slate-800 tracking-tighter">{balance}</span>
                            <span className="text-2xl font-bold text-brand-primary">TL</span>
                        </div>

                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-slate-800 font-black rounded-2xl shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2 group"
                        >
                            <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {t('loadBalance')}
                        </button>
                    </div>
                </div>

                {/* Transactions */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 italic">
                            <History className="w-5 h-5 text-brand-primary" />
                            {t('transactionHistory')}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="glass-card p-5 rounded-[2rem] animate-pulse h-24 border border-slate-100 opacity-50"></div>
                            ))
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx.id} className="glass-card p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {tx.amount > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 leading-tight truncate max-w-[140px] sm:max-w-none">
                                                {tx.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3 text-slate-500" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {new Date(tx.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {tx.payment_method === 'admin' && (
                                                <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-brand-primary/10 rounded-lg w-fit border border-brand-primary/20">
                                                    <Settings className="w-2.5 h-2.5 text-brand-primary" />
                                                    <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">{t('topupAdmin')}</span>
                                                </div>
                                            )}
                                            {tx.payment_method === 'card' && (
                                                <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-lg w-fit border border-emerald-500/20">
                                                    <CreditCard className="w-2.5 h-2.5 text-emerald-400" />
                                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{t('topupCard')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black tracking-tight ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount} TL
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            {t('balanceAfter')}: <span className="text-slate-500 font-black">{tx.balance_after || '--'} TL</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="glass-card p-12 rounded-[3rem] text-center border border-slate-100 border-dashed">
                                <History className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('noTransactions')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="glass-card w-full max-w-sm rounded-3xl p-6 relative z-10 animate-fade-in shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{t('securePayment')}</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:text-slate-800 p-2 text-2xl">✕</button>
                        </div>

                        {/* Credit Card Visual */}
                        <div className={`w-full aspect-[1.586] rounded-2xl bg-gradient-to-br ${getCardBrandColor(cardType)} border border-white/20 p-5 mb-6 relative overflow-hidden shadow-2xl transform transition-all hover:scale-105`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-8 bg-amber-400 rounded-md shadow-sm opacity-90"></div>
                                    {/* Card Brand Logo */}
                                    <div className="text-right">
                                        {cardType === 'visa' && (
                                            <div className="text-slate-800 font-black text-2xl tracking-wider bg-blue-700 px-3 py-1 rounded">VISA</div>
                                        )}
                                        {cardType === 'mastercard' && (
                                            <div className="flex gap-[-8px]">
                                                <div className="w-8 h-8 rounded-full bg-red-500 opacity-90"></div>
                                                <div className="w-8 h-8 rounded-full bg-orange-500 opacity-90 -ml-3"></div>
                                            </div>
                                        )}
                                        {cardType === 'amex' && (
                                            <div className="text-slate-800 font-black text-xl tracking-tight bg-blue-600 px-2 py-1 rounded">AMEX</div>
                                        )}
                                        {cardType === 'discover' && (
                                            <div className="text-slate-800 font-black text-lg tracking-wider bg-orange-600 px-2 py-1 rounded">DISCOVER</div>
                                        )}
                                        {cardType === 'jcb' && (
                                            <div className="text-slate-800 font-black text-2xl tracking-wider">JCB</div>
                                        )}
                                        {cardType === 'unionpay' && (
                                            <div className="text-slate-800 font-black text-lg bg-red-700 px-2 py-1 rounded">UnionPay</div>
                                        )}
                                        {cardType === 'unknown' && (
                                            <span className="text-xs font-bold text-slate-500 tracking-widest">CARD</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xl font-mono text-slate-800 tracking-widest mb-6 drop-shadow-md">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mb-1">{t('cardHolder')}</p>
                                        <p className="text-sm font-medium text-slate-800 tracking-wider uppercase truncate max-w-[150px]">{cardHolderName || (language === 'tr' ? 'İSİM SOYAD' : 'NAME SURNAME')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mb-1">{t('expiry')}</p>
                                        <p className="text-sm font-medium text-slate-800 tracking-wider">{expiry || (language === 'tr' ? 'AA/YY' : 'MM/YY')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={processPayment} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">{t('cardNumber')}</label>
                                <input required maxLength={19} className={`glass-input w-full p-4 rounded-xl text-lg tracking-wide ${cardNumber.length === 19 && !isValidLuhn(cardNumber.replace(/\s/g, '')) ? 'border-red-500 text-red-500' : ''}`} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim(); setCardNumber(v.substring(0, 19)); }} />
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">{t('cardHolder')}</label>
                                <input required maxLength={24} className="glass-input w-full p-4 rounded-xl text-sm uppercase tracking-wide" placeholder={language === 'tr' ? 'AD SOYAD' : 'NAME SURNAME'} value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value.toUpperCase())} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">{t('expiry')}</label>
                                    <input required maxLength={5} className="glass-input w-full p-4 rounded-xl text-center" placeholder={language === 'tr' ? 'Ay/Yıl' : 'MM/YY'} value={expiry} onChange={(e) => { let v = e.target.value.replace(/\D/g, ''); if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4); setExpiry(v); }} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold ml-1 mb-1 block">{t('cvv')}</label>
                                    <input required maxLength={3} type="password" className="glass-input w-full p-4 rounded-xl text-center tracking-widest" placeholder="***" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} />
                                </div>
                            </div>

                            <button type="submit" disabled={processingPayment} className="w-full py-4 mt-4 bg-emerald-600 hover:bg-emerald-500 text-slate-800 font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50">
                                {processingPayment ? t('loading') : `100 TL ${t('payButton')}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-xl" onClick={() => setShowSettings(false)}></div>
                    <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 animate-scale-in border border-slate-200 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic">{t('settings')}</h3>
                            <button onClick={() => setShowSettings(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">✕</button>
                        </div>

                        <div className="space-y-6">
                            {/* Language Switcher */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">{t('language')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setLanguage('tr')}
                                        className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${language === 'tr' ? 'bg-brand-primary/20 border-brand-primary text-slate-800' : 'bg-white border border-slate-100 shadow-sm border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span className="font-bold text-sm">Türkçe</span>
                                        {language === 'tr' && <Check className="w-4 h-4 text-brand-primary" />}
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${language === 'en' ? 'bg-brand-primary/20 border-brand-primary text-slate-800' : 'bg-white border border-slate-100 shadow-sm border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span className="font-bold text-sm">English</span>
                                        {language === 'en' && <Check className="w-4 h-4 text-brand-primary" />}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/10 w-full"></div>

                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut()
                                    router.push('/')
                                }}
                                className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all group"
                            >
                                <span className="font-bold text-sm uppercase tracking-widest">{t('logout')}</span>
                                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

