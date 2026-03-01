'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
    onScan: (result: string) => void
    onClose: () => void
}

export default function QrScanner({ onScan, onClose }: Props) {
    const scannerRef = useRef<any>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let html5QrCode: any

        const startScanner = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode')
                html5QrCode = new Html5Qrcode('qr-reader')
                scannerRef.current = html5QrCode

                const cameras = await Html5Qrcode.getCameras()
                if (!cameras || cameras.length === 0) {
                    setError('Kamera bulunamad\u0131.')
                    return
                }

                const camera = cameras.find((c: any) =>
                    c.label.toLowerCase().includes('back') ||
                    c.label.toLowerCase().includes('environment')
                ) || cameras[cameras.length - 1]

                await html5QrCode.start(
                    camera.id,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (text: string) => { onScan(text) },
                    () => {}
                )
            } catch (e: any) {
                setError('Kamera erişimi reddedildi veya açılamadı.')
            }
        }

        startScanner()

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {})
            }
        }
    }, [])

    return (
        <div className="flex flex-col items-center gap-3">
            {error ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
                    {error}
                    <p className="text-xs mt-1 text-red-400">Tarayıcı kamera iznini onaylayın ve yenileyin.</p>
                </div>
            ) : (
                <p className="text-xs text-slate-500 text-center">Kamerayı QR koda yakın tutun</p>
            )}
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: 300 }} />
        </div>
    )
}