'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Lock, AlertTriangle, FileText, CreditCard, UserX, Info, Smartphone, HardHat } from 'lucide-react'

function Section({ icon: Icon, title, children }: { icon: any, title: string, children: any }) {
    return (
        <section className="mb-8 border-b border-slate-100 pb-8 last:border-0">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            </div>
            <div className="pl-12 text-sm text-slate-600 space-y-3 leading-relaxed">{children}</div>
        </section>
    )
}

export default function TermsPage() {
    const router = useRouter()
    return (
        <main className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 shadow-sm">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="font-bold text-slate-800 text-sm">Kullanici Sozlesmesi ve Gizlilik Politikasi</h1>
                    <p className="text-xs text-slate-400">Son guncelleme: 08 Mart 2026 — Fresh-Rider Kask Otomat Hizmetleri</p>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 leading-relaxed">
                        Bu sozlesmeyi dikkatlice okuyunuz. Uygulamaya kayit olarak veya kullanmaya devam ederek asagidaki tum kosullari okudugunuzu, anladiginizi ve kabul ettiginizi beyan etmis sayilirsiniz.
                    </p>
                </div>

                <Section icon={FileText} title="Madde 1 — Taraflar, Konu ve Kapsam">
                    <p>Bu Kullanici Hizmet Sozlesmesi (<strong>"Sozlesme"</strong>), <strong>Fresh-Rider Kask Otomat Hizmetleri</strong> (<strong>"Sirket"</strong>) ile Fresh-Rider mobil/web uygulamasini kullanan gercek kisi (<strong>"Kullanici"</strong>) arasinda, elektronik ortamda akdedilmis bir sozlesmedir.</p>
                    <p>Sozlesme; Fresh-Rider uygulamasi araciligiyla sunulan <strong>kask temizleme otomati kiralama, QR kod ile odeme, dijital cuzdan yonetimi ve ilgili tum hizmetleri</strong> kapsamaktadir.</p>
                    <p>Uygulamaya kayit olurken "Kullanici Sozlesmesini Okudum ve Kabul Ediyorum" onay kutusunu isaretleyen kullanici, bu sozlesmenin tum hukumlerini <strong>6098 sayili Turk Borclar Kanunu'nun 5. maddesi</strong> geregi uzaktan sozlesme kurallari cercevesinde kabul etmis sayilir.</p>
                </Section>

                <Section icon={Smartphone} title="Madde 2 — Hizmetin Tanimi ve Isleyisi">
                    <p>Fresh-Rider uygulamasi kullanicilara asagidaki hizmetleri sunmaktadir:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Kask Temizleme Otomatlari:</strong> Sirket'e ait fiziksel otomat cihazlarinin QR kod ya da uygulama uzerinden baslatilmasi.</li>
                        <li><strong>Dijital Cuzdan:</strong> Uygulama ici bakiye yuklemesi ve hizmet bedeli odemesi.</li>
                        <li><strong>Konum Hizmetleri:</strong> En yakin otomat konumunun GPS ile gosterilmesi.</li>
                        <li><strong>Musteri Destegi:</strong> Uygulama ici destek talebi ve mesajlasma sistemi.</li>
                    </ul>
                    <p>Sirket, fiziksel otomat cihazlarinin belirli saatlerde ya da tum noktalarda kesintisiz calisacagini garanti etmez. Hizmet erisebilirligi; bakim calismalari, teknik arizalar ve ucuncu taraf altyapi saglayicilarinin durumuna bagli olarak degiskenlik gosterebilir.</p>
                </Section>

                <Section icon={HardHat} title="Madde 3 — Kask ve Ekipmana Iliskin Sorumluluk Reddi">
                    <p><strong>Sirket, kask temizleme islemi sirasinda veya sonrasinda kaskin ugradigindan iddia edilen hasarlardan hicbir sekilde sorumlu tutulamaz.</strong> Bu kapsamda asagidaki durumlar Sirket'in sorumluluk alani disindadir:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Kullanici tarafindan otomata yanlis veya uygunsuz sekilde yerlestirilen kaskin temizleme sureci sirasinda maruz kalabilecegi mekanik etkiler.</li>
                        <li>Temizleme oncesinden kaynaklanan mevcut hasarlarin, arizalarin veya yipranmalarin temizleme surecine atfedilmesi.</li>
                        <li>Kaskin imalatcisi tarafindan belirtilen normlara aykiri sekilde kullanilmis olmasi nedeniyle ortaya cikabilecek deformasyon veya bozulmalar.</li>
                        <li>Temizleme islemi sonrasinda kaskin dogal kullanim yipranmasi nedeniyle degisime ugramasi.</li>
                        <li>Kullanicinin otomati talimatlara aykiri sekilde kullanmasindan kaynaklanan her turlu hasar.</li>
                    </ul>
                    <p>Kullanici, kaskin temizleme islemine uygun oldugunu, herhangi bir hasari bulunmadigini ve olagan kullanim icin elverisli durumda oldugunu beyan ederek hizmet baslatmis sayilir. <strong>Hizmet bedelinin odenmesi bu beyani onayla birlikte gerceklestirilmis kabul edilir.</strong></p>
                    <p>Sirket, kask temizleme islemi sonucunda kaskin yuzey gorunumu, kaplama ya da boya katmaninda ortaya cikabilecek degisikliklerden sorumlu degildir; zira temizleme sureci standarttir ve marka/modele gore farklilik gosteren kask malzemelerinin ozgul ozelliklerine gore uyarlanmamaktadir.</p>
                </Section>

                <Section icon={Shield} title="Madde 4 — Hesap Guvenligi ve Kullanici Sorumlulugu">
                    <p>Kullanici, hesabinin guvenligi ve sifre gizliliginden <strong>tamamen kendisi sorumludur.</strong> Asagida sayilan durumlardan Sirket hicbir kosul altinda sorumlu tutulamaz:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Kullanicinin sifresini unutmasi, zayif sifre secmesi ya da sifresini baskasina vermesi.</li>
                        <li>Hesap bilgilerinin ucuncu kisilerle isteyerek ya da istenmeyerek paylasilmasi.</li>
                        <li>Yetkisiz erisim sonucu bakiye kaybi ya da kisisel veri sizintisi.</li>
                        <li>Kullanicinin cihazinin calinmasi, kaybolmasi veya kotucul yazilima maruz kalmasi.</li>
                        <li>Kimlik avı (phishing) saldirilari sonucu bilgilerin ele gecirilmesi.</li>
                    </ul>
                    <p>Kullanici, hesabina yetkisiz erisim fark ettiginde derhal uygulama ici destek sistemi veya <strong>destek@freshriderkask.com</strong> adresi araciligiyla Sirket'e bildirmekle yukumludur.</p>
                </Section>

                <Section icon={CreditCard} title="Madde 5 — Odeme, Bakiye ve Iade Kosullari">
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Uygulamaya yuklenen bakiye <strong>dijital hizmet kredisi niteligi</strong> tasir; nakit para olarak iade edilmez.</li>
                        <li>Odeme islemi tamamlanmis ve cihaz calistirilmis hizmetlerde iade yapilmaz.</li>
                        <li>Teknik ariza nedeniyle cihaz odeme sonrasi hic baslamadiginda, belgelenmis basvuru uzerine bakiye iadesi yapilir.</li>
                        <li>Bakiye baska bir hesaba devredilemez veya transfer edilemez.</li>
                        <li>Hesap kapatma durumunda kullanilmamis bakiye icin <strong>30 gun</strong> icerisinde yazili iade talebi iletilmelidir.</li>
                        <li>Sirket, hizmet fiyatlarini onceden duyurarak degistirme hakkini sakli tutar.</li>
                    </ul>
                </Section>

                <Section icon={AlertTriangle} title="Madde 6 — Sorumluluk Sinirlamasi ve Garanti Reddi">
                    <p>Sirket, asagidaki durumlardan kaynaklanan dogrudan ya da dolayli hicbir zarardan sorumlu tutulamaz:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Planlanan veya planlanmayan bakim calismalari nedeniyle hizmet kesintileri.</li>
                        <li>Elektrik kesintisi, internet altyapisi arizasi veya dogal afet.</li>
                        <li>Supabase, Vercel ve benzeri ucuncu taraf teknoloji saglayicilarindan kaynaklanan sorunlar.</li>
                        <li>Siber saldiri veya dis kaynakli guvenlik ihlalleri (Sirket gerekli onlemleri alarak hareket eder).</li>
                        <li>Kullanicinin yanlis ya da eksik kask yerlestirmesinden kaynaklanan temizlik yetersizligi.</li>
                    </ul>
                    <p>Sirketin herhangi bir hizmet aksakligindan kaynaklanan <strong>toplam sorumlulugu, kullanicinin ilgili takvim ayinda odedigi toplam hizmet bedelini hicbir kosulda asamaz.</strong></p>
                </Section>

                <Section icon={Lock} title="Madde 7 — Kisisel Verilerin Korunmasi (KVKK)">
                    <p>Sirket, <strong>6698 sayili Kisisel Verilerin Korunmasi Kanunu (KVKK)</strong> kapsaminda veri sorumlusu sifatiyla hareket eder.</p>
                    <p><strong>Toplanan veriler:</strong> Ad-soyad, telefon numarasi, e-posta adresi, konum bilgisi (kiosk secimi icin), odeme gecmisi ve uygulama kullanim loglari.</p>
                    <p><strong>Isleme amacları:</strong> Hizmetin yurütulmesi, musteri destegi, yasal yukumlulukler ve hizmet kalitesinin iyilestirilmesi. Kisisel veriler <strong>ticari amacla ucuncu taraflarla paylasilmaz.</strong></p>
                    <p>Kullanici, KVKK'nin 11. maddesi kapsamindaki haklarini (bilgi talep etme, duzeltme, silme, islemeye itiraz) <strong>destek@freshriderkask.com</strong> adresine yazili basvuru ile kullanabilir.</p>
                </Section>

                <Section icon={UserX} title="Madde 8 — Yasaklanan Kullanimlar ve Hesap Askiya Alma">
                    <p>Asagidaki durumlar sozlesmeye aykiridir ve hesabin askiya alinmasina ya da kalici kapatilmasina neden olur:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Kask otomat cihazlarina fiziksel zarar verme, tahrip etme veya icerisine yabanci madde yerlestirme.</li>
                        <li>Sahte kimlik veya baskasina ait bilgilerle hesap olusturma.</li>
                        <li>Sistemi devre disi birakmaya, manipule etmeye ya da yetkisiz erisim saglamaya calismak.</li>
                        <li>Otomatik bot, script veya toplu islem araclari kullanmak.</li>
                        <li>Odeme hilesi, chargeback kotüye kullanimi veya sahte islem gerceklestirme.</li>
                    </ul>
                </Section>

                <Section icon={Info} title="Madde 9 — Fikri Mulkiyet, Sozlesme Degisiklikleri ve Uygulanacak Hukuk">
                    <p>Fresh-Rider uygulamasi, logosu, tasarimi, yazilim kodu ve iceriklerin tum fikri mulkiyet haklari Sirket'e aittir. Kullaniciya yalnizca kisisel ve ticari olmayan kullanim icin sinirli lisans taninmaktadir.</p>
                    <p>Sirket bu sozlesmeyi herhangi bir zamanda guncelleyebilir; degisiklikler uygulama ici bildirim ve/veya e-posta ile duyurulur. Guncelleme tarihinden itibaren uygulamayi kullanmaya devam etmek yeni kosullarin kabulunu ifade eder.</p>
                    <p>Bu sozlesmeden dogabilecek her turlu uyusmazlikta <strong>Turkiye Cumhuriyeti hukuku</strong> uygulanir. Yetkili mahkeme ve icra dairesi olarak <strong>Istanbul Merkez Adliyeleri</strong> kabul edilmistir.</p>
                </Section>

                <div className="mt-6 p-5 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                    <p className="text-xs text-slate-500">Bu sozlesme <strong>08 Mart 2026</strong> tarihinde yururluge girmistir.</p>
                    <p className="text-xs text-slate-500 mt-1">Sorular icin: <strong>destek@freshriderkask.com</strong></p>
                    <button onClick={() => router.back()} className="mt-4 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors active:scale-95">
                        Geri Don
                    </button>
                </div>
            </div>
        </main>
    )
}
