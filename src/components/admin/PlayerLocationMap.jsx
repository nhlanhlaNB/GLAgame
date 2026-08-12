import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ACCENT = '#0d47a1'
const LIGHT = '#1565c0'

const TILE_SOURCES = [
  {
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  {
    label: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  }
]

function buildIcon(color, pulse = false) {
  const size = pulse ? 34 : 26

  return L.divIcon({
    className: 'adaMapPin',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid #ffffff;
      background:${color};
      box-shadow:0 6px 16px rgba(13,71,161,0.5), 0 0 0 2px rgba(255,255,255,0.9), inset 0 0 0 2px rgba(255,255,255,0.35);
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
  const tileIndexRef = useRef(0)
  const [tileStatus, setTileStatus] = useState('loading')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false
    }).setView([-4.5, 22], 3)

    let loadedCount = 0
    let erroredCount = 0

    const addTileSource = (index) => {
      if (index >= TILE_SOURCES.length) {
        setTileStatus('offline')
        return
      }

      const source = TILE_SOURCES[index]
      const layer = L.tileLayer(source.url, source.options)

      layer.on('tileerror', () => {
        erroredCount += 1

        if (loadedCount === 0 && erroredCount >= 4) {
          layer.remove()
          addTileSource(index + 1)
        }
      })

      layer.on('load', () => {
        loadedCount += 1
        setTileStatus('loaded')
      })

      layer.addTo(map)
      tileIndexRef.current = index
    }

    addTileSource(0)

    mapRef.current = map
    layerRef.current = L.layerGroup().addTo(map)

    const resizeTimer = window.setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 350)

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.clearTimeout(resizeTimer)
      resizeObserver.disconnect()
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

    window.setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 200)
  }, [markers])

  return (
    <div className="adaMapWrap" style={{ height }}>
      <div ref={containerRef} className="adaMapCanvas" />
      {tileStatus === 'offline' ? (
        <div className="adaMapStatus">
          <p className="adaMapStatusTitle">Map could not load</p>
          <p className="adaMapStatusSub">
            Tile servers could not be reached. Check your internet connection
            and try again.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default PlayerLocationMap
