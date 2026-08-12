import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ACCENT = '#2f6fb2'
const LIGHT = '#83b4f7'

function buildIcon(color, pulse = false) {
  const size = pulse ? 26 : 20

  return L.divIcon({
    className: 'adaMapPin',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid #ffffff;
      background:${color};
      box-shadow:0 4px 12px rgba(26,58,107,0.35);
      ${pulse ? 'animation:adaPinPulse 1.8s ease-out infinite;' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4]
  })
}

function PlayerLocationMap({ markers = [], height = 380 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false
    }).setView([-4.5, 22], 3)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    mapRef.current = map
    layerRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    if (!markers || markers.length === 0) {
      L.marker([-4.5, 22], { icon: buildIcon(ACCENT) })
        .addTo(layer)
        .bindPopup('<strong>No player locations yet</strong><br/>Locations appear once players grant location access.')
      return
    }

    const grouped = new Map()

    markers.forEach((marker) => {
      const key = `${marker.latitude.toFixed(1)},${marker.longitude.toFixed(1)}`
      const current = grouped.get(key) || { ...marker, players: [] }
      current.players.push(marker)
      grouped.set(key, current)
    })

    const totalBounds = []

    grouped.forEach((group) => {
      const count = group.players.length
      const name =
        group.players.length === 1
          ? group.players[0].name
          : `${count} players near ${group.city || group.country || 'here'}`
      const place = [group.city, group.country].filter(Boolean).join(', ') || 'Unknown location'

      const marker = L.marker([group.latitude, group.longitude], {
        icon: buildIcon(count > 1 ? LIGHT : ACCENT, count > 1)
      }).addTo(layer)

      const rows = group.players
        .slice(0, 12)
        .map(
          (player) =>
            `<div class="adaMapRow"><span>${player.name}</span></div>`
        )
        .join('')

      marker.bindPopup(`
        <div class="adaMapPop">
          <p class="adaMapPopTitle">${name}</p>
          <p class="adaMapPopSub">${place}</p>
          ${rows}
        </div>
      `)

      totalBounds.push([group.latitude, group.longitude])
    })

    if (totalBounds.length > 0 && markers.length > 1) {
      map.fitBounds(L.latLngBounds(totalBounds).pad(0.15), {
        maxZoom: 11
      })
    } else if (totalBounds.length === 1) {
      map.setView(totalBounds[0], 6)
    }
  }, [markers])

  return (
    <div className="adaMapWrap">
      <div ref={containerRef} style={{ height }} className="adaMapCanvas" />
    </div>
  )
}

export default PlayerLocationMap
