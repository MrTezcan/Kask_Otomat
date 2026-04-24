const fs = require('fs');
const p = 'src/app/admin/page.tsx';
// NO, that was admin/page! We need tablet-app/App.tsx
const pApp = 'C:/Users/PC/.gemini/antigravity/brain/5487fdf0-0c31-47e4-a90f-4cd3d9f32d01/Kask_Otomat_Tezcan/tablet-app/App.tsx';
let txt = fs.readFileSync(pApp, 'utf8');

// Replace 1: Add dynamicVideoUrl state
txt = txt.replace(
  "  const [machineStatus, setMachineStatus] = useState<string>('idle');",
  "  const [machineStatus, setMachineStatus] = useState<string>('idle');\n  const [videoUrl, setVideoUrl] = useState<string>('https://cdn.pixabay.com/video/2021/08/17/85378-589578036_large.mp4');"
);

// Replace 1.5: Remove constant videoUrl
txt = txt.replace(
  "  const videoUrl = 'https://cdn.pixabay.com/video/2021/08/17/85378-589578036_large.mp4'; \n",
  ""
);

// Replace 2: Fetch and update the video
const oldEffect = `  // Realtime subscription handles the automatic transition to PROCESS & FINISHED
  useEffect(() => {
    const channel = supabase.channel('device_status')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'devices',
        filter: \`id=eq.\${DEVICE_ID}\`
      }, (payload) => {
        if (payload.new.status && payload.new.status !== 'idle') {
          setMachineStatus(payload.new.status);
          
          if (payload.new.status === 'finished') {
            setScreen('FINISHED');
            setTimeout(() => {
              setScreen('VIDEO_LOOP');
              setWantsPerfume(false);
            }, 8000);
          } else if (screen !== 'PROCESS') {
            // Unlocks, Disinfecting, Drying, Perfume -> all go to PROCESS
            setScreen('PROCESS');
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screen]);`;

const newEffect = `  useEffect(() => {
    // Fetch initial parameters
    const fetchSettings = async () => {
      const { data } = await supabase.from('devices').select('kiosk_video_url').eq('id', DEVICE_ID).single();
      if (data?.kiosk_video_url) setVideoUrl(data.kiosk_video_url);
    };
    fetchSettings();
  }, []);

  // Realtime subscription handles the automatic transition to PROCESS & FINISHED
  useEffect(() => {
    const channel = supabase.channel('device_status')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'devices',
        filter: \`id=eq.\${DEVICE_ID}\`
      }, (payload) => {
        if (payload.new.kiosk_video_url) {
          setVideoUrl(payload.new.kiosk_video_url);
        }

        if (payload.new.status && payload.new.status !== 'idle') {
          setMachineStatus(payload.new.status);
          
          if (payload.new.status === 'finished') {
            setScreen('FINISHED');
            setTimeout(() => {
              setScreen('VIDEO_LOOP');
              setWantsPerfume(false);
            }, 8000);
          } else if (screen !== 'PROCESS') {
            // Unlocks, Disinfecting, Drying, Perfume -> all go to PROCESS
            setScreen('PROCESS');
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screen]);`;

txt = txt.replace(oldEffect, newEffect);

fs.writeFileSync(pApp, txt);
console.log('App.tsx updated to fetch remote videoURL successfully.');