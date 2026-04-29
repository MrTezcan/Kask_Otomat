import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, TouchableWithoutFeedback, ScrollView, Modal, PanResponder, Platform } from 'react-native';
import { supabase } from './src/utils/supabase';
import { Check, ShieldCheck, Zap, ArrowRight, CreditCard, Wallet, Settings } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

type ScreenState = 'SETUP' | 'VIDEO_LOOP' | 'OPTIONS' | 'PAYMENT_METHODS' | 'QR_WALLET' | 'SANAL_POS_QR' | 'PROCESS' | 'FINISHED' | 'MAINTENANCE';


// YouTube URL detection + embed helper
function getYoutubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
}
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [setupDevices, setSetupDevices] = useState<any[]>([]);
  const [basePrice, setBasePrice] = useState<number>(25);
  const [perfumePrice, setPerfumePrice] = useState<number>(5);

  const [screen, setScreen] = useState<ScreenState>('VIDEO_LOOP');
  const [wantsPerfume, setWantsPerfume] = useState(false);
  const [machineStatus, setMachineStatus] = useState<string>('idle');
  const [videoUrl, setVideoUrl] = useState<string>('https://cdn.pixabay.com/video/2021/08/17/85378-589578036_large.mp4');
  const [deviceName, setDeviceName] = useState<string>('Yükleniyor...');
  const [tapCount, setTapCount] = useState(0);
  
  // Dynamic Theme
  const [isNight, setIsNight] = useState<boolean>(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 19 || hour < 7);
    };
    checkTime(); // Initial check
    const timeInterval = setInterval(checkTime, 60000); 
    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const styles = getStyles(isNight);

  // Sync resetInactivity into ref so PanResponder can call it
  useEffect(() => {
    resetInactivityRef.current = resetInactivity;
  });

  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const totalAmount = basePrice;

  // Screens where inactivity timeout is ACTIVE
  const TIMEOUT_SCREENS: ScreenState[] = ['OPTIONS', 'PAYMENT_METHODS', 'QR_WALLET', 'SANAL_POS_QR'];

  const goHome = () => {
    console.log('[NAV] Ana sayfaya donuluyor...');
    // Once tum timer'lari ve modal'i temizle
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    
    setShowInactivityWarning(false);
    
    // Kısa bir delay ile ekranı değiştir (Modal'ın kapanması için)
    setTimeout(() => {
      setScreen('VIDEO_LOOP');
      setWantsPerfume(false);
    }, 100);
  };

  const resetInactivity = () => {
    if (!TIMEOUT_SCREENS.includes(screen as ScreenState)) return;
    setShowInactivityWarning(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Show warning after 60s (Odemeler icin daha fazla zaman tanıyalım)
    warningTimer.current = setTimeout(() => {
      setShowInactivityWarning(true);
      setCountdown(20);
      let c = 20;
      countdownRef.current = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownRef.current!);
          goHome();
        }
      }, 1000);
    }, 60000);
  };

  // PanResponder to catch ANY touch on the screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetInactivityRef.current?.();
        return false; // don't consume the event
      },
    })
  ).current;

  // Keep resetInactivity accessible inside panResponder via ref
  const resetInactivityRef = useRef<(() => void) | null>(null);

  const fetchDeviceData = async (id: string) => {
    try {
      console.log('[fetchDeviceData] Sorgu basliyor, id:', id);
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('[fetchDeviceData] Supabase hata:', error.code, error.message);
        // Cihaz bulunamazsa (PGRST116) veya baska hata varsa temizle
        if (error.code === 'PGRST116') {
          await AsyncStorage.removeItem('DEVICE_ID');
          setDeviceId(null);
          const { data: allDevices } = await supabase.from('devices').select('*').order('name');
          if (allDevices) setSetupDevices(allDevices);
          setScreen('SETUP');
        }
        return false;
      }
      if (!data) {
        console.warn('[fetchDeviceData] Satir bulunamadi! id:', id);
        return false;
      }

      console.log('[fetchDeviceData] Basarili! hizmet_fiyati:', data.hizmet_fiyati, 'parfum_fiyati:', data.parfum_fiyati, 'video:', data.video_url);

      if (data.status === 'maintenance') {
        setScreen('MAINTENANCE');
      }

      setBasePrice(typeof data.hizmet_fiyati === 'number' ? data.hizmet_fiyati : 25);
      setPerfumePrice(typeof data.parfum_fiyati === 'number' ? data.parfum_fiyati : 5);
      setDeviceName(data.name || 'Bilinmeyen Cihaz');
      setVideoUrl(data.video_url && data.video_url.trim() !== '' ? data.video_url : 'https://cdn.pixabay.com/video/2021/08/17/85378-589578036_large.mp4');
      return true;
    } catch(e: any) {
      console.error('[fetchDeviceData] Exception:', e?.message || e);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const savedDeviceId = await AsyncStorage.getItem('DEVICE_ID');
      if (savedDeviceId) {
        const success = await fetchDeviceData(savedDeviceId);
        if (success) {
          setDeviceId(savedDeviceId);
          setScreen('VIDEO_LOOP');
        } else {
          // fetchDeviceData icinde zaten SETUP'a yonlendirme yapildi
        }
      } else {
        const { data } = await supabase.from('devices').select('*').order('name');
        if (data) setSetupDevices(data);
        setScreen('SETUP');
      }
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (TIMEOUT_SCREENS.includes(screen as ScreenState)) {
      resetInactivity();
    } else {
      // Clear all timers when not on a timeout screen
      setShowInactivityWarning(false);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [screen]);

  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase.channel('device_status_' + deviceId)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'devices'
        // Filter yok - payload icinde kontrol ediyoruz (UUID filter bazen calismaz)
      }, (payload) => {
        // Bu cihaza ait degilse yoksay
        if (payload.new.id !== deviceId) return;

        if (payload.new.hizmet_fiyati != null) setBasePrice(payload.new.hizmet_fiyati);
        if (payload.new.parfum_fiyati != null) setPerfumePrice(payload.new.parfum_fiyati);
        if (payload.new.name) setDeviceName(payload.new.name);
        if (payload.new.video_url) setVideoUrl(payload.new.video_url);

        // Bakim Modu Kontrolu
        const ds = payload.new.status || 'online';
        if (ds === 'maintenance') {
          setScreen('MAINTENANCE');
          return;
        } else if (ds === 'online' && screen === 'MAINTENANCE') {
          setScreen('VIDEO_LOOP');
        }

        // 'status' alani (online/offline/maintenance) tamamen yoksayilir (artik bakim modu haric).
        // Sadece work_status (ESP32 makine durumu) ekran gecisini tetikler.
        const ws: string = payload.new.work_status || '';
        if (ws && ws !== 'idle') {
          setMachineStatus(ws);
          if (ws === 'finished') {
            setScreen('FINISHED');
            setTimeout(() => { setScreen('VIDEO_LOOP'); setWantsPerfume(false); }, 8000);
          } else if (screen !== 'PROCESS' && screen !== 'FINISHED') {
            setScreen('PROCESS');
          }
        } else if (ws === 'idle' && screen === 'PROCESS') {
          setScreen('VIDEO_LOOP');
        }
      })
      .subscribe((status) => {
        console.log('[Realtime] Baglanti durumu:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screen, deviceId]);

  // ── GPS Location Tracking ──
  // Sends tablet GPS coordinates to Supabase every 5 minutes
  useEffect(() => {
    if (!deviceId) return;

    const updateLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[GPS] Konum izni verilmedi');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('[GPS] Konum alindi:', loc.coords.latitude, loc.coords.longitude);
        
        const { error } = await supabase
          .from('devices')
          .update({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
          .eq('id', deviceId);
        
        if (error) {
          console.error('[GPS] Supabase guncelleme hatasi:', error.message);
        } else {
          console.log('[GPS] Konum Supabase\'a gonderildi');
        }
      } catch (e: any) {
        console.error('[GPS] Hata:', e?.message || e);
      }
    };

    // İlk konum hemen al
    updateLocation();
    // Sonra her 5 dakikada bir guncelle
    const gpsInterval = setInterval(updateLocation, 5 * 60 * 1000);

    // --- Tablet Heartbeat ---
    const tabletHeartbeat = async () => {
      if (!deviceId) return;
      try {
        await supabase.from('devices').update({
          tablet_last_seen: new Date().toISOString()
        }).eq('id', deviceId);
        console.log('[Heartbeat] Tablet canlılık sinyali gönderildi');
      } catch (e) {
        console.error('[Heartbeat] Hata:', e);
      }
    };
    
    // İlk sinyali hemen gönder
    tabletHeartbeat();
    const heartbeatInterval = setInterval(tabletHeartbeat, 15000); // 15 saniyede bir ping

    return () => { 
      clearInterval(gpsInterval);
      clearInterval(heartbeatInterval);
    };
  }, [deviceId]);

  const handleSelectDevice = async (id: string) => {
    await AsyncStorage.setItem('DEVICE_ID', id);
    setDeviceId(id);
    await fetchDeviceData(id);
    setScreen('VIDEO_LOOP');
  };

  const handleHiddenTap = async () => {
    if (tapCount >= 4) {
      await AsyncStorage.removeItem('DEVICE_ID');
      setDeviceId(null);
      setTapCount(0);
      const { data } = await supabase.from('devices').select('*').order('name');
      if (data) setSetupDevices(data);
      setScreen('SETUP');
    } else {
      setTapCount(prev => prev + 1);
      setTimeout(() => setTapCount(0), 3000);
    }
  };

  if (!isReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const renderSetup = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <Settings color={isNight ? "#475569" : "#94a3b8"} size={80} style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Cihaz Kurulumu</Text>
      <Text style={styles.subtitle}>
        Lütfen bu tabletin bağlı olduğu makineyi seçin.
      </Text>

      <View style={styles.card}>
        <View style={{ gap: 15 }}>
          {setupDevices.map((device) => (
            <TouchableOpacity 
              key={device.id} 
              style={styles.methodButton}
              onPress={() => handleSelectDevice(device.id)}
            >
              <View style={[styles.iconCircleBlue, { width: 50, height: 50 }]}>
                <ShieldCheck color="#fff" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>{device.name}</Text>
                <Text style={styles.methodDesc}>{device.location}</Text>
              </View>
              <ArrowRight color={isNight ? "#334155" : "#cbd5e1"} size={24} />
            </TouchableOpacity>
          ))}
          {setupDevices.length === 0 && (
            <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 50 }} />
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderVideoLoop = () => (
    <TouchableWithoutFeedback onPress={() => { setWantsPerfume(false); setScreen('OPTIONS'); }}>
      <View style={styles.videoContainer}>
        {getYoutubeId(videoUrl) ? (
          <WebView
            style={StyleSheet.absoluteFillObject}
            source={{ uri: `https://www.youtube.com/embed/${getYoutubeId(videoUrl)}?autoplay=1&loop=1&controls=0&mute=1&playlist=${getYoutubeId(videoUrl)}&modestbranding=1&showinfo=0` }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            scrollEnabled={false}
          />
        ) : (
          <Video
            style={StyleSheet.absoluteFillObject}
            source={{ uri: videoUrl }}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
          />
        )}
        <View style={styles.videoOverlay}>
          <Text style={styles.videoTextLarge}>PREMIUM KASK TEMİZLİĞİ</Text>
          <View style={styles.glassBadge}>
             <Text style={styles.videoTextSmall}>Başlamak İçin Ekrana Dokunun</Text>
          </View>
          <View style={{ position: 'absolute', top: 40, right: 40, width: 100, height: 100 }}>
             <TouchableWithoutFeedback onPress={handleHiddenTap}>
               <View style={{ width: '100%', height: '100%' }} />
             </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  const renderOptions = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <TouchableWithoutFeedback onPress={handleHiddenTap}>
         <View style={{ alignItems: 'center' }}>
            <View style={styles.glowIcon}>
               <ShieldCheck color="#0ea5e9" size={60} />
            </View>
            <Text style={styles.title}>Temizlik Paketi</Text>
            <Text style={styles.subtitle}>Tercihinizi belirleyin ve devam edin</Text>
         </View>
      </TouchableWithoutFeedback>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{flex: 1, paddingRight: 10}}>
             <Text style={styles.rowTextBold}>Standart Temizlik</Text>
             <Text style={styles.rowTextSmall}>UVC + Ozon Dezenfeksiyon</Text>
          </View>
          <Text style={styles.priceText}>{basePrice} TL</Text>
        </View>

        <TouchableOpacity 
          style={[styles.optionBox, wantsPerfume ? styles.optionBoxActive : {}]}
          onPress={() => { resetInactivity(); setWantsPerfume(!wantsPerfume); }}
          activeOpacity={0.8}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10}}>
            <View style={[styles.checkbox, wantsPerfume ? styles.checkboxActive : {}]}>
              {wantsPerfume && <Check color="#fff" size={16} strokeWidth={3} />}
            </View>
            <View style={{ marginLeft: 15 }}>
               <Text style={[styles.rowTextBold, wantsPerfume ? {color: isNight ? '#fff' : '#0ea5e9'} : {}]}>Parfüm Uygulansın mı?</Text>
               <Text style={[styles.rowTextSmall, wantsPerfume ? {color: isNight ? '#bae6fd' : '#38bdf8'} : {}]}>Alerjisi veya hassasiyeti olanlar için kapatılabilir</Text>
            </View>
          </View>
          <Text style={[styles.priceText, wantsPerfume ? {color: isNight ? '#fff' : '#0ea5e9'} : {}]}>{wantsPerfume ? 'SEÇİLDİ' : 'HAYIR'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Toplam Tutar</Text>
          <Text style={styles.totalAmount}>{totalAmount} TL</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('VIDEO_LOOP')} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={async () => { 
            resetInactivity();
            // Donanim Kontrolu
            try {
              const { data } = await supabase.from('devices').select('status, last_seen, mega_status').eq('id', deviceId).single();
              const now = new Date();
              const espOk = data?.last_seen && (now.getTime() - new Date(data.last_seen).getTime()) < 90000;
              const megaOk = data?.mega_status === true;
              
              if (data?.status !== 'online' || !espOk || !megaOk) {
                alert('Sistem şu an hazır değil. Lütfen biraz bekleyin veya teknik destek isteyin.');
                return;
              }
              setScreen('PAYMENT_METHODS');
            } catch (e) {
              setScreen('PAYMENT_METHODS'); // Baglanti hatasinda toleransli davranalım
            }
          }} 
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Devam Et</Text>
          <ArrowRight color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPaymentMethods = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={styles.glowIcon}>
             <Wallet color="#0ea5e9" size={50} />
          </View>
          <Text style={styles.title}>Ödeme Yöntemi</Text>
          <Text style={styles.subtitle}>Tercih ettiğiniz yöntemi seçin</Text>
      </View>

      <View style={{ gap: 20, width: '100%', maxWidth: 500 }}>
        <TouchableOpacity style={styles.methodButton} onPress={() => { resetInactivity(); setScreen('QR_WALLET') }} activeOpacity={0.8}>
          <View style={styles.iconCircleGreen}>
            <Wallet color="#fff" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Uygulama Cüzdanı</Text>
            <Text style={styles.methodDesc}>Karekod okutarak hızlı ödeme</Text>
          </View>
          <ArrowRight color={isNight ? "#475569" : "#cbd5e1"} size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.methodButton} onPress={() => { resetInactivity(); setScreen('SANAL_POS_QR') }} activeOpacity={0.8}>
          <View style={styles.iconCircleBlue}>
            <CreditCard color="#fff" size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Kredi / Banka Kartı</Text>
            <Text style={styles.methodDesc}>Telefondan 3D Secure ile ödeme</Text>
          </View>
          <ArrowRight color={isNight ? "#475569" : "#cbd5e1"} size={24} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 40, width: '100%', maxWidth: 500 }]} onPress={() => setScreen('OPTIONS')} activeOpacity={0.8}>
        <Text style={styles.secondaryButtonText}>Geri Dön</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderWalletQR = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <Text style={styles.title}>Cüzdan Ödemesi</Text>
      <Text style={styles.subtitle}>
        Fresh-Rider uygulamanızı açın ve "QR Ödeme" sekmesinden kodu okutun.
      </Text>

      <View style={styles.qrCard}>
        <View style={styles.qrWrapper}>
           <QRCode
             value={`freshrider://pay?device_id=${deviceId}&amount=${totalAmount}&perfume=${wantsPerfume}`}
             size={220}
             logoBackgroundColor="#fff"
           />
        </View>
        <Text style={styles.qrPriceText}>{totalAmount} TL</Text>
      </View>

      <View style={styles.loadingBox}>
        <ActivityIndicator color="#0ea5e9" size="small" />
        <Text style={styles.loadingText}>Cihazdan onay bekleniyor...</Text>
      </View>

      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 30, width: '100%', maxWidth: 400 }]} onPress={goHome}>
        <Text style={styles.secondaryButtonText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSanalPosQR = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <Text style={styles.title}>Kredi Kartı Ödemesi</Text>
      <Text style={styles.subtitle}>
        Telefonunuzun kamerasından kodu okutun ve ödemenizi tamamlayın.
      </Text>

      <View style={styles.qrCard}>
        <View style={styles.qrWrapper}>
           <QRCode
             value={`https://freshrider.com/cc-pay?device_id=${deviceId}&amount=${totalAmount}&perfume=${wantsPerfume}`}
             size={220}
             logoBackgroundColor="#fff"
           />
        </View>
        <Text style={styles.qrPriceText}>{totalAmount} TL</Text>
      </View>

      <View style={styles.loadingBox}>
        <ActivityIndicator color="#0ea5e9" size="small" />
        <Text style={styles.loadingText}>Sanal POS işlemi bekleniyor...</Text>
      </View>

      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 30, width: '100%', maxWidth: 400 }]} onPress={goHome}>
        <Text style={styles.secondaryButtonText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const handleCancelProcess = async () => {
    if (!deviceId) return;
    try {
      await supabase.from('device_commands').insert({
        device_id: deviceId,
        command: 'RESET',
        payload: {},
        status: 'pending'
      });
      setScreen('VIDEO_LOOP');
      setWantsPerfume(false);
    } catch (e) {
      console.error('İptal komutu gönderilemedi:', e);
    }
  };

  const renderProcess = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <View style={[styles.glowIcon, { padding: 40, borderRadius: 100, marginBottom: 40 }]}>
         <Zap color="#10b981" size={80} />
      </View>
      <Text style={styles.title}>İşlem Devam Ediyor</Text>
      <Text style={styles.subtitle}>Lütfen kaskınız içerideyken kapağı açmayın.</Text>
      
      <View style={styles.statusCard}>
        <ActivityIndicator size="large" color="#10b981" style={{ marginBottom: 15 }} />
        <Text style={styles.statusLabel}>Aktif Aşama</Text>
        <Text style={styles.statusValue}>{machineStatus.toUpperCase()}</Text>
      </View>

      <TouchableOpacity
        style={[styles.secondaryButton, { marginTop: 30, width: '100%', maxWidth: 400, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)' }]}
        onPress={handleCancelProcess}
        activeOpacity={0.8}
      >
        <Text style={[styles.secondaryButtonText, { color: '#ef4444' }]}>⛔ İşlemi İptal Et</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFinished = () => (
    <ScrollView contentContainerStyle={styles.centerSection} style={{ flex: 1, width: '100%' }} bounces={false}>
      <View style={[styles.glowIcon, { padding: 40, borderRadius: 100, marginBottom: 40, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
         <Check color="#10b981" size={100} />
      </View>
      <Text style={[styles.title, { fontSize: 46, color: '#10b981' }]}>Mükemmel!</Text>
      <Text style={[styles.subtitle, { color: isNight ? '#f8fafc' : '#0f172a', fontSize: 24, marginTop: 10 }]}>İşlem başarıyla tamamlandı.</Text>
      <Text style={{ textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 18 }}>
        Kaskınızı güvenle kullanabilirsiniz. İyi yolculuklar!
      </Text>
    </ScrollView>
  );

  const renderMaintenance = () => (
    <View style={styles.centerSection}>
      <View style={[styles.glowIcon, { padding: 40, borderRadius: 100, marginBottom: 40, backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
         <Settings color="#f59e0b" size={100} />
      </View>
      <Text style={[styles.title, { color: '#f59e0b' }]}>Bakım Modu</Text>
      <Text style={[styles.subtitle, { fontSize: 20 }]}>
        Cihazımız şu an periyodik bakım aşamasındadır. En kısa sürede tekrar hizmetinizde olacağız.
      </Text>
      <Text style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 16 }}>
        Anlayışınız için teşekkür ederiz.
      </Text>
    </View>
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar style={isNight ? 'light' : 'dark'} hidden />
      {screen === 'SETUP' && renderSetup()}
      {screen === 'VIDEO_LOOP' && renderVideoLoop()}
      {screen === 'OPTIONS' && renderOptions()}
      {screen === 'PAYMENT_METHODS' && renderPaymentMethods()}
      {screen === 'QR_WALLET' && renderWalletQR()}
      {screen === 'SANAL_POS_QR' && renderSanalPosQR()}
      {screen === 'PROCESS' && renderProcess()}
      {screen === 'FINISHED' && renderFinished()}
      {screen === 'MAINTENANCE' && renderMaintenance()}

      {/* Inactivity Warning Modal */}
      <Modal visible={showInactivityWarning} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <View style={{ backgroundColor: isNight ? '#0f172a' : '#fff', borderRadius: 32, padding: 40, alignItems: 'center', width: '100%', maxWidth: 440, borderWidth: 1, borderColor: isNight ? '#334155' : '#e2e8f0' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#f59e0b' }}>
              <Text style={{ fontSize: 36 }}>⏱</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: isNight ? '#f8fafc' : '#0f172a', textAlign: 'center', marginBottom: 10 }}>
              Hareketsizlik Algılandı
            </Text>
            <Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 6, lineHeight: 22 }}>
              Uzun süredir etkileşim olmadı.
            </Text>
            <Text style={{ fontSize: 15, color: '#f59e0b', fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>
              {countdown} saniye içinde ana ekrana dönülüyor...
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={goHome}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 20, backgroundColor: isNight ? '#1e293b' : '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: isNight ? '#334155' : '#e2e8f0' }}
              >
                <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 16 }}>Ana Ekrana Dön</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowInactivityWarning(false); resetInactivity(); }}
                style={{ flex: 1, paddingVertical: 16, borderRadius: 20, backgroundColor: '#0ea5e9', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Function to generate styles based on time of day
const getStyles = (isNight: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: isNight ? '#020617' : '#f8fafc', 
    alignItems: 'center', 
  },
  centerSection: { 
    width: '100%', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 40,
    flexGrow: 1,
    justifyContent: 'center'
  },
  
  glowIcon: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 25,
    borderRadius: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isNight ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.15)',
  },
  title: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: isNight ? '#f8fafc' : '#0f172a', 
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1
  },
  subtitle: { 
    fontSize: 16, 
    color: isNight ? '#94a3b8' : '#64748b', 
    marginBottom: 40,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24
  },
  
  videoContainer: { flex: 1, width: '100%', backgroundColor: '#000' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  brandName: { color: '#38bdf8', fontSize: 64, fontWeight: '900', textAlign: 'center', letterSpacing: 5, textShadowColor: '#0ea5e9', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 35, marginBottom: 6 },
  slogan: { color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '500', textAlign: 'center', letterSpacing: 2, marginBottom: 32 },

  glassBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 100, marginTop: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  videoTextSmall: { color: '#e2e8f0', fontSize: 18, fontWeight: '700', letterSpacing: 1 },

  card: { 
    backgroundColor: isNight ? '#0f172a' : '#ffffff', 
    width: '100%', 
    maxWidth: 500,
    borderRadius: 32, 
    padding: 30, 
    borderWidth: 1, 
    borderColor: isNight ? '#1e293b' : '#e2e8f0',
    shadowColor: isNight ? '#0ea5e9' : '#000',
    shadowOpacity: isNight ? 0.1 : 0.05,
    shadowRadius: 30,
    elevation: 10
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rowTextBold: { fontSize: 18, fontWeight: 'bold', color: isNight ? '#f8fafc' : '#1e293b', marginBottom: 4 },
  rowTextSmall: { fontSize: 14, color: '#64748b' },
  priceText: { fontSize: 22, fontWeight: '900', color: isNight ? '#f8fafc' : '#0f172a' },
  
  optionBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: isNight ? '#1e293b' : '#e2e8f0', borderRadius: 24, padding: 20, marginTop: 10, backgroundColor: isNight ? '#020617' : '#ffffff' },
  optionBoxActive: { borderColor: '#0ea5e9', backgroundColor: isNight ? 'rgba(14, 165, 233, 0.1)' : '#f0f9ff' },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: isNight ? '#334155' : '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  
  divider: { height: 1, backgroundColor: isNight ? '#1e293b' : '#e2e8f0', marginVertical: 25 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 20, fontWeight: 'bold', color: isNight ? '#cbd5e1' : '#475569' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#10b981', textShadowColor: isNight ? 'rgba(16, 185, 129, 0.4)' : 'transparent', textShadowRadius: 10, textShadowOffset: {width: 0, height: 0} },

  buttonContainer: { flexDirection: 'row', gap: 15, marginTop: 30, width: '100%', maxWidth: 500 },
  primaryButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0ea5e9', paddingVertical: 20, borderRadius: 24, shadowColor: '#0ea5e9', shadowOpacity: 0.4, shadowRadius: 15, elevation: 5 },
  buttonText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  secondaryButton: { flex: 1, paddingVertical: 20, borderRadius: 24, backgroundColor: isNight ? '#1e293b' : '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isNight ? '#334155' : '#e2e8f0' },
  secondaryButtonText: { color: isNight ? '#94a3b8' : '#475569', fontSize: 18, fontWeight: 'bold' },

  methodButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: isNight ? '#0f172a' : '#ffffff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isNight ? '#1e293b' : '#e2e8f0', shadowColor: '#000', shadowOpacity: isNight ? 0 : 0.05, shadowRadius: 10, elevation: 2 },
  iconCircleBlue: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: isNight ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.15)' },
  iconCircleGreen: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: isNight ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)' },
  methodTitle: { fontSize: 18, fontWeight: 'bold', color: isNight ? '#f8fafc' : '#1e293b', marginBottom: 4 },
  methodDesc: { fontSize: 14, color: '#64748b' },

  qrCard: { backgroundColor: '#fff', borderRadius: 32, padding: 30, alignItems: 'center', width: '100%', maxWidth: 400, shadowColor: '#0ea5e9', shadowOpacity: isNight ? 0.2 : 0.1, shadowRadius: 30, elevation: 15, borderWidth: isNight ? 0 : 1, borderColor: '#e2e8f0' },
  qrWrapper: { padding: 10, backgroundColor: '#fff', borderRadius: 16 },
  qrPriceText: { marginTop: 20, color: '#0f172a', fontSize: 32, fontWeight: '900' },
  
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 30, backgroundColor: isNight ? 'rgba(14, 165, 233, 0.1)' : '#f0f9ff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: isNight ? 'rgba(14, 165, 233, 0.3)' : '#bae6fd' },
  loadingText: { color: isNight ? '#bae6fd' : '#0369a1', fontWeight: 'bold', fontSize: 16 },

  statusCard: { backgroundColor: isNight ? '#0f172a' : '#ffffff', borderRadius: 32, padding: 40, alignItems: 'center', width: '100%', maxWidth: 400, borderWidth: 1, borderColor: isNight ? '#1e293b' : '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  statusLabel: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  statusValue: { color: '#10b981', fontSize: 28, fontWeight: '900', letterSpacing: 2 }
});
