'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Smartphone, Tablet, Download, ArrowLeft, CheckCircle2, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

interface AppRelease {
  id: string
  version: string
  apk_url: string
  platform: 'mobile' | 'tablet'
  notes: string
  created_at: string
}

export default function DownloadPage() {
  const router = useRouter()
  const [releases, setReleases] = useState<AppRelease[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReleases() {
      try {
        const { data, error } = await supabase
          .from('app_releases')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (data) {
          // Her platform için sadece en güncel olanı alalım
          const latestMobile = data.find(r => r.platform === 'mobile')
          const latestTablet = data.find(r => r.platform === 'tablet')
          
          const filtered: AppRelease[] = []
          if (latestMobile) filtered.push(latestMobile)
          if (latestTablet) filtered.push(latestTablet)
          
          setReleases(filtered)
        }
      } catch (err) {
        console.error('Error fetching releases:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [])

  const mobileApp = releases.find(r => r.platform === 'mobile')
  const tabletApp = releases.find(r => r.platform === 'tablet')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-900">
      {/* Arka plan efektleri */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-4xl relative z-10">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Geri Dön
        </button>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6"><Logo size="large" variant="dark" /></div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Mobil Uygulamayı İndir</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Fresh-Rider deneyimini cebinize taşıyın. En güncel sürümleri aşağıdan indirebilirsiniz.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Android / Mobile Kartı */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center hover:border-sky-500/50 transition-all duration-500 group">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Android Uygulaması</h2>
            <p className="text-slate-400 text-sm mb-6">Tüm Android telefonlar için optimize edilmiş en güncel sürüm.</p>
            
            <div className="flex flex-col gap-4 w-full mt-auto">
              {loading ? (
                <div className="h-14 bg-white/5 animate-pulse rounded-xl"></div>
              ) : mobileApp ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-white/5 py-2 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 text-teal-500" />
                    Versiyon: v{mobileApp.version}
                  </div>
                  <a 
                    href={mobileApp.apk_url}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    Hemen İndir (.APK)
                  </a>
                </>
              ) : (
                <div className="p-4 bg-white/5 rounded-xl text-slate-500 text-sm italic">Henüz yayınlanmış bir sürüm bulunamadı.</div>
              )}
            </div>
          </div>

          {/* iOS / Tablet / Desktop Kartı */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center hover:border-teal-500/50 transition-all duration-500 group">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
              <Tablet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">iOS Uygulaması</h2>
            <p className="text-slate-400 text-sm mb-6">iPhone ve iPad cihazlarınız için App Store sürümü.</p>
            
            <div className="flex flex-col gap-4 w-full mt-auto">
              <div className="flex items-center justify-center gap-2 text-xs text-amber-500 bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
                <Globe className="w-3 h-3" />
                Hazırlanıyor (Çok Yakında)
              </div>
              <button 
                disabled
                className="flex items-center justify-center gap-3 bg-white/5 text-slate-500 font-bold py-4 px-6 rounded-xl border border-white/10 cursor-not-allowed"
              >
                App Store'da Yakında
              </button>
            </div>
          </div>
        </div>

        {/* Kurulum Talimatı */}
        <div className="mt-16 p-8 bg-white/5 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
            Nasıl Kurulur?
          </h3>
          <ul className="space-y-4">
            {[
              "İndirdiğiniz .APK dosyasını açın.",
              "Cihazınız 'Bilinmeyen Kaynaklar' uyarısı verirse ayarlardan izin verin.",
              "Kurulumu tamamlayın ve Fresh-Rider hesabınızla giriş yapın."
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start text-slate-400 text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-sky-500 font-bold text-xs">{i+1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <footer className="mt-12 text-center text-slate-600 text-xs">
          &copy; 2026 Fresh-Rider Hygiene Systems. Tüm hakları saklıdır.
        </footer>
      </div>
    </main>
  )
}
