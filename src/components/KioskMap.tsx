'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'

const pulseStyles = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
`

const kioskIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background:linear-gradient(135deg,#10b981,#059669);width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:2px 2px 10px rgba(16,185,129,.5);display:flex;align-items:center;justify-content:center"><div style="transform:rotate(45deg);font-weight:900;color:white;font-size:14px">FR</div></div>`,
    iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32]
})
const kioskOfflineIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background:linear-gradient(135deg,#64748b,#475569);width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;display:flex;align-items:center;justify-content:center"><div style="transform:rotate(45deg);color:white;font-weight:bold">X</div></div>`,
    iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32]
})
const kioskMaintenanceIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background:linear-gradient(135deg,#f59e0b,#d97706);width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;display:flex;align-items:center;justify-content:center"><div style="transform:rotate(45deg);color:white;font-weight:bold">!</div></div>`,
    iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-32]
})
const nearestKioskIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background:linear-gradient(135deg,#06b6d4,#3b82f6);width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 0 25px rgba(6,182,212,.6);display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite"><div style="transform:rotate(45deg);font-weight:900;color:white;font-size:18px">*</div></div>`,
    iconSize:[44,44], iconAnchor:[22,44], popupAnchor:[0,-44]
})
const userIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 10px rgba(59,130,246,.2)"></div>`,
    iconSize:[16,16], iconAnchor:[8,8], popupAnchor:[0,-10]
})

function getKioskIcon(status: string, isNearest: boolean) {
    const s = (status||'online').toLowerCase()
    if (isNearest) return nearestKioskIcon
    if (s==='offline') return kioskOfflineIcon
    if (s==='maintenance') return kioskMaintenanceIcon
    return kioskIcon
}
function getStatusText(status: string) {
    const s = (status||'online').toLowerCase()
    if (s==='offline') return { text:'Cevrimdisi', color:'text-slate-600' }
    if (s==='maintenance') return { text:'Bakimda', color:'text-amber-600' }
    return { text:'Acik', color:'text-green-600' }
}

// InvalidateSize: fixes gray tiles when map container was hidden (display:none)
function InvalidateSize() {
    const map = useMap()
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 200)
        return () => clearTimeout(timer)
    })
    return null
}

// FitOnce: centers on user location first, then fits bounds with kiosks
function FitOnce({ kiosks, userLocation }: { kiosks: any[], userLocation: [number,number] }) {
    const map = useMap()
    const fitted = useRef(false)
    const centeredOnUser = useRef(false)
    
    // Center on real user location as soon as it's available (not default Istanbul)
    useEffect(() => {
        if (centeredOnUser.current) return
        const isDefault = userLocation[0] === 41.0082 && userLocation[1] === 28.9784
        if (!isDefault) {
            centeredOnUser.current = true
            map.setView(userLocation, 13, { animate: true })
        }
    }, [userLocation])
    
    // Fit bounds once when kiosks are loaded
    useEffect(() => {
        if (fitted.current || kiosks.length === 0) return
        fitted.current = true
        const points: [number,number][] = [userLocation]
        kiosks.forEach((k: any) => {
            const lat = k.lat || k.latitude
            const lng = k.lng || k.longitude
            if (lat && lng) points.push([lat, lng])
        })
        if (points.length > 1) {
            map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 13 })
        } else {
            map.setView(userLocation, 13)
        }
    }, [kiosks])
    return null
}

export default function KioskMap({ userLocation, kiosks }: { userLocation: [number,number], kiosks: any[] }) {
    const onlineKiosks = kiosks.filter((k: any) => k.status === 'online' || !k.status)
    const nearestKiosk = onlineKiosks.length > 0
        ? onlineKiosks.reduce((p: any, c: any) => c.distance < p.distance ? c : p)
        : null

    return (
        <div className="relative w-full h-full">
            <style>{pulseStyles}</style>
            <MapContainer center={userLocation} zoom={13} scrollWheelZoom={true} zoomControl={true} attributionControl={false} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
                <InvalidateSize />
                <FitOnce kiosks={kiosks} userLocation={userLocation} />
                <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={userLocation} icon={userIcon}><Popup autoPan={false}>Bu Senin Konumun</Popup></Marker>
                {kiosks.map((kiosk: any) => {
                    const lat = kiosk.lat || kiosk.latitude
                    const lng = kiosk.lng || kiosk.longitude
                    if (!lat || !lng) return null
                    const isNearest = nearestKiosk?.id === kiosk.id
                    const statusInfo = getStatusText(kiosk.status || 'online')
                    return (
                        <Marker key={kiosk.id} position={[lat, lng]} icon={getKioskIcon(kiosk.status || 'online', isNearest)}>
                            <Popup autoPan={false}>
                                <div className="text-slate-800">
                                    <strong className="block text-sm">{kiosk.name}</strong>
                                    {isNearest && <div className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block my-1">EN YAKIN FRESH-RIDER</div>}
                                    <span className="text-xs text-slate-500">Mesafe: {kiosk.distance} km</span><br />
                                    <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                                    {(kiosk.status === 'online' || !kiosk.status) && (
                                        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')} className="mt-2 w-full py-1 bg-blue-600 text-white text-xs font-bold rounded-md">Yol Tarifi Al</button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}