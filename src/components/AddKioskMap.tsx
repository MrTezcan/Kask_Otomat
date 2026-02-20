'use client'

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState, useEffect } from 'react'

const userIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
})

const newKioskIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: linear-gradient(135deg, #f59e0b, #ef4444); width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px rgba(245,158,11,0.8); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; animation: pulse 2s infinite;">+</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
})

const otherKioskIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: #64748b; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
})

function LocationMarker({
    onLocationSelect,
    initialPosition
}: {
    onLocationSelect: (lat: number, lng: number) => void,
    initialPosition: [number, number] | null
}) {
    const [position, setPosition] = useState<[number, number] | null>(initialPosition)

    useEffect(() => {
        if (initialPosition) setPosition(initialPosition)
    }, [initialPosition])

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng
            setPosition([lat, lng])
            onLocationSelect(lat, lng)
        },
    })

    return position === null ? null : (
        <Marker position={position} icon={newKioskIcon}>
            <Popup>Seçili Konum</Popup>
        </Marker>
    )
}

export default function AddKioskMap({
    userLocation,
    onLocationSelect,
    initialLocation = null,
    otherKiosks = []
}: {
    userLocation: [number, number],
    onLocationSelect: (lat: number, lng: number) => void,
    initialLocation?: [number, number] | null,
    otherKiosks?: any[]
}) {
    return (
        <MapContainer center={initialLocation || userLocation} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
                attribution=''
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />

            {/* User Location */}
            <Marker position={userLocation} icon={userIcon}>
                <Popup>Mevcut Konum</Popup>
            </Marker>

            {/* Other Existing Kiosks */}
            {otherKiosks.map((kiosk) => {
                const lat = kiosk.lat || kiosk.latitude
                const lng = kiosk.lng || kiosk.longitude
                if (!lat || !lng) return null
                return (
                    <Marker
                        key={kiosk.id}
                        position={[lat, lng]}
                        icon={otherKioskIcon}
                    >
                        <Popup>
                            <div className="text-xs font-bold">{kiosk.name}</div>
                        </Popup>
                    </Marker>
                )
            })}

            <LocationMarker onLocationSelect={onLocationSelect} initialPosition={initialLocation} />
        </MapContainer>
    )
}
