import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseService'

const REVERSE_GEOCODE_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client'

function isPermissionDenied(error) {
  return (
    error?.code === 1 ||
    error?.PERMISSION_DENIED === 1 ||
    error?.code === 'PERMISSION_DENIED'
  )
}

function readStorageLocation() {
  try {
    const raw = window.localStorage.getItem('glaPlayerLocation')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStorageLocation(location) {
  try {
    window.localStorage.setItem('glaPlayerLocation', JSON.stringify(location))
  } catch {
    // Storage unavailable; the location is still saved to Firestore.
  }
}

async function reverseGeocode(latitude, longitude) {
  try {
    const url = `${REVERSE_GEOCODE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })

    if (!response.ok) return {}

    const data = await response.json()

    return {
      country: data.countryName || data.country || '',
      countryCode: data.countryCode || '',
      city: data.city || data.locality || data.principalSubdivision || '',
      region: data.principalSubdivision || '',
      timezone: data.timezone || ''
    }
  } catch {
    return {}
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in window.navigator)) {
      reject(new Error('Geolocation is not available in this browser.'))
      return
    }

    window.navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000
    })
  })
}

export async function capturePlayerLocation(userId) {
  if (!userId) return null
  if (!window || typeof window.navigator === 'undefined') return null

  const cached = readStorageLocation()
  if (cached) return cached

  let position
  try {
    position = await getCurrentPosition()
  } catch (error) {
    if (isPermissionDenied(error)) {
      const location = {
        denied: true,
        capturedAt: Date.now()
      }
      writeStorageLocation(location)
      savePlayerLocation(userId, location).catch(() => {})
    }
    return null
  }

  const latitude = position.coords.latitude
  const longitude = position.coords.longitude
  const place = await reverseGeocode(latitude, longitude)

  const location = {
    latitude,
    longitude,
    accuracy: position.coords.accuracy || 0,
    ...place,
    capturedAt: Date.now()
  }

  writeStorageLocation(location)
  savePlayerLocation(userId, location).catch((error) => {
    console.error('Could not save player location.', error)
  })

  return location
}

async function savePlayerLocation(userId, location) {
  const userRef = doc(db, 'users', userId)

  try {
    await updateDoc(userRef, {
      location: {
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        accuracy: location.accuracy || 0,
        country: location.country || '',
        countryCode: location.countryCode || '',
        city: location.city || '',
        region: location.region || '',
        timezone: location.timezone || '',
        capturedAt: location.capturedAt || null
      },
      locationUpdatedAt: new Date()
    })
  } catch {
    await setDoc(
      userRef,
      {
        location: {
          latitude: location.latitude || null,
          longitude: location.longitude || null,
          accuracy: location.accuracy || 0,
          country: location.country || '',
          countryCode: location.countryCode || '',
          city: location.city || '',
          region: location.region || '',
          timezone: location.timezone || '',
          capturedAt: location.capturedAt || null
        },
        locationUpdatedAt: new Date()
      },
      { merge: true }
    )
  }
}
