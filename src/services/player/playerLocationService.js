import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseService'

const IP_LOOKUP_URLS = [
  'https://ipwho.is/',
  'https://freeipapi.com/api/json',
  'https://ipinfo.io/json'
]

const STORAGE_KEY = 'glaPlayerLocation'
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000

function readStorageLocation() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.capturedAt) return null

    const age = Date.now() - parsed.capturedAt
    if (age > STORAGE_TTL_MS) return null

    return parsed
  } catch {
    return null
  }
}

function writeStorageLocation(location) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  } catch {
    // Storage unavailable; the location is still saved to Firestore.
  }
}

function parseIpLookup(data) {
  if (!data) return null

  const isIpWhois = data?.ip && (data.country || data.city)
  const isFreeIpApi = data?.ipAddress && data?.countryName
  const isIpInfo = data?.ip && data?.loc

  if (isIpWhois) {
    return {
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      country: data.country || '',
      countryCode: data.country_code || data.countryCode || '',
      city: data.city || data.region || '',
      region: data.region || '',
      timezone: data.timezone?.id || '',
      source: 'ip'
    }
  }

  if (isFreeIpApi) {
    return {
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      city: data.cityName || '',
      region: data.regionName || '',
      timezone: Array.isArray(data.timeZones) ? data.timeZones[0] || '' : data.timeZones || '',
      source: 'ip'
    }
  }

  if (isIpInfo) {
    const [latitude, longitude] = String(data.loc || '')
      .split(',')
      .map((part) => Number(part))

    return {
      latitude: latitude || 0,
      longitude: longitude || 0,
      country: data.country || '',
      countryCode: data.country || '',
      city: data.city || '',
      region: data.region || '',
      timezone: data.timezone || '',
      source: 'ip'
    }
  }

  return null
}

async function fetchIpLocation() {
  for (const url of IP_LOOKUP_URLS) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      })

      if (!response.ok) continue

      const data = await response.json()
      const location = parseIpLookup(data)

      if (location && (location.country || location.city)) {
        return location
      }
    } catch {
      // Try the next IP lookup provider.
    }
  }

  return null
}

function getGpsLocationIfAlreadyGranted() {
  return new Promise((resolve) => {
    if (!('geolocation' in window.navigator)) {
      resolve(null)
      return
    }

    let granted = false

    const tryPosition = () => {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            source: 'gps'
          })
        },
        () => resolve(null),
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 600000
        }
      )
    }

    if (window.navigator.permissions && window.navigator.permissions.query) {
      window.navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          granted = permission.state === 'granted'
          if (granted) {
            tryPosition()
          } else {
            resolve(null)
          }
        })
        .catch(() => resolve(null))
      return
    }

    resolve(null)
  })
}

async function lookupLocation() {
  const ipLocation = await fetchIpLocation()
  if (!ipLocation) return null

  const gps = await getGpsLocationIfAlreadyGranted()

  if (gps && ipLocation.country) {
    return {
      ...ipLocation,
      latitude: gps.latitude,
      longitude: gps.longitude,
      accuracy: gps.accuracy,
      source: 'gps+ip'
    }
  }

  return ipLocation
}

export async function capturePlayerLocation(userId) {
  if (!userId) return null
  if (!window || typeof window.navigator === 'undefined') return null

  const cached = readStorageLocation()
  if (cached && cached.country) {
    savePlayerLocation(userId, cached).catch(() => {})
    return cached
  }

  const location = await lookupLocation()

  if (!location || (!location.country && !location.city)) {
    return null
  }

  const result = {
    latitude: location.latitude || 0,
    longitude: location.longitude || 0,
    accuracy: location.accuracy || 0,
    country: location.country || '',
    countryCode: location.countryCode || '',
    city: location.city || '',
    region: location.region || '',
    timezone: location.timezone || '',
    source: location.source || 'ip',
    capturedAt: Date.now()
  }

  writeStorageLocation(result)
  savePlayerLocation(userId, result).catch((error) => {
    console.error('Could not save player location.', error)
  })

  return result
}

async function savePlayerLocation(userId, location) {
  const userRef = doc(db, 'users', userId)

  const payload = {
    location: {
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      accuracy: location.accuracy || 0,
      country: location.country || '',
      countryCode: location.countryCode || '',
      city: location.city || '',
      region: location.region || '',
      timezone: location.timezone || '',
      source: location.source || 'ip',
      capturedAt: location.capturedAt || null
    },
    locationUpdatedAt: new Date()
  }

  try {
    await updateDoc(userRef, payload)
  } catch {
    await setDoc(userRef, payload, { merge: true })
  }
}
