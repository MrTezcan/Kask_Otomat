'use client'
'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'

// Pulse animation for markers
const pulseStyles = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

// Fix for Leaflet icons in Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

// Custom Icon for Kiosk (Fresh-Rider) - Online
const kioskIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 2px 2px 10px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); font-weight: 900; color: white; font-size: 14px;">FR</div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
})

// Custom Icon for Kiosk - Offline
const kioskOfflineIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: linear-gradient(135deg, #64748b, #475569); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 2px 2px 10px rgba(100,116,139,0.5); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); font-weight: bold; color: white;">✕</div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
})

// Custom Icon for Kiosk - Maintenance
const kioskMaintenanceIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 2px 2px 10px rgba(245,158,11,0.5); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); font-weight: bold; color: white;">⚠</div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
})

// Custom Icon for Nearest Kiosk
const nearestKioskIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); width: 44px; height: 44px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 0 25px rgba(6,182,212,0.6); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;"><div style="transform: rotate(45deg); font-weight: 900; color: white; font-size: 18px;">★</div></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
})

// Custom Icon for User
const userIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 10px rgba(59,130,246,0.2);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
})

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.setView(center)
    }, [center, map])
    return null
}

function AutoBounds({ kiosks, userLocation }: { kiosks: any[], userLocation: [number, number] }) {
    const map = useMap()

    useEffect(() => {
        if (kiosks.length === 0) return

        const bounds = L.latLngBounds([userLocation])
        kiosks.forEach(k => {
            const lat = k.lat || k.latitude
            const lng = k.lng || k.longitude
            if (lat && lng) bounds.extend([lat, lng])
        })

        // Only fit bounds if there's more than just the user location or if kiosks are far
        if (kiosks.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        }
    }, [kiosks, userLocation, map])

    return null
}

function getKioskIcon(status: string, isNearest: boolean) {
    const s = (status || 'online').toLowerCase()
    if (isNearest) return nearestKioskIcon
    if (s === 'offline') return kioskOfflineIcon
    if (s === 'maintenance') return kioskMaintenanceIcon
    return kioskIcon
}

function getStatusText(status: string) {
    const s = (status || 'online').toLowerCase()
    if (s === 'offline') return { text: 'Çevrimdışı', color: 'text-slate-600' }
    if (s === 'maintenance') return { text: 'Bakımda', color: 'text-amber-600' }
    return { text: 'Açık', color: 'text-green-600' }
}

export default function KioskMap({ userLocation, kiosks }: { userLocation: [number, number], kiosks: any[] }) {
    // Find nearest kiosk (only online ones)
    const onlineKiosks = kiosks.filter(k => k.status === 'online' || !k.status)
    const nearestKiosk = onlineKiosks.length > 0 ? onlineKiosks.reduce((prev, curr) =>
        (curr.distance < prev.distance) ? curr : prev
    ) : null

    return (
        <div className="relative w-full h-full">
            <style>{pulseStyles}</style>
            <MapContainer center={userLocation} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
                <AutoBounds kiosks={kiosks} userLocation={userLocation} />

                {/* Modern Light Clean View (CartoDB Voyager) */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />



                {/* User Location */}
                <Marker position={userLocation} icon={userIcon}>
                    <Popup>Bu Senin Konumun</Popup>
                </Marker>

                {/* Kiosks */}
                {kiosks.map((kiosk) => {
                    const lat = kiosk.lat || kiosk.latitude
                    const lng = kiosk.lng || kiosk.longitude
                    if (!lat || !lng) return null

                    const isNearest = nearestKiosk?.id === kiosk.id
                    const statusInfo = getStatusText(kiosk.status || 'online')

                    return (
                        <Marker
                            key={kiosk.id}
                            position={[lat, lng]}
                            icon={getKioskIcon(kiosk.status || 'online', isNearest)}
                        >
                            <Popup>
                                <div className='text-slate-800'>
                                    <strong className='block text-sm'>{kiosk.name}</strong>
                                    {isNearest && (
                                        <div className='bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block my-1'>
                                            ⭐ EN YAKIN FRESH-RIDER
                                        </div>
                                    )}
                                    <span className='text-xs text-slate-500'>Mesafe: {kiosk.distance} km</span> <br />
                                    <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                                    {(kiosk.status === 'online' || !kiosk.status) && (
                                        <button
                                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')}
                                            className="mt-2 w-full py-1 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Yol Tarifi Al ↗
                                        </button>
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
