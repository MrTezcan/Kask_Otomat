'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuthConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    // 5 saniye sonra ana sayfaya yönlendir
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
          <div className="relative bg-emerald-500 rounded-full p-4 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
          Hesabınız Doğrulandı!
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          Harika! Fresh-Rider hesabınız başarıyla aktifleştirildi. Artık sisteme giriş yapabilir ve tüm özelliklerin tadını çıkarabilirsiniz.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20"
          >
            Giriş Yapmaya Başla
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-slate-500 text-sm">
            5 saniye içinde otomatik olarak yönlendirileceksiniz...
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2 text-slate-500">
          <ShieldCheck className="w-5 h-5 text-emerald-500/50" />
          <span className="text-sm font-medium uppercase tracking-widest">Fresh-Rider Secure</span>
        </div>
      </div>
    </div>
  );
}
