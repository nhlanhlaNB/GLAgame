import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, db } from '../firebaseService'

const SETTINGS_STORAGE_KEY = 'gla_player_settings'

export const DEFAULT_PLAYER_SETTINGS = {
  preferredLanguage: 'en',
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  lowBandwidth: false,
  saveDataMode: false,
  keyboardMode: false,
  screenReaderLabels: true,
  compactMode: false,
  cardFlipEnabled: true,
  soundEnabled: false,
  autoTranslate: true,
  showCardImages: true,
  confirmBeforeSubmit: false
}

function readLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeLocalSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    localStorage.setItem('gla_preferred_language', settings.preferredLanguage || 'en')
    localStorage.setItem('gla_auto_translate_interface', String(settings.autoTranslate !== false))
  } catch {
    // Local storage is optional. Settings still apply for the current session.
  }
}

function normaliseSettings(settings = {}) {
  const merged = { ...DEFAULT_PLAYER_SETTINGS, ...settings }
  return {
    ...merged,
    preferredLanguage: String(merged.preferredLanguage || 'en').toLowerCase(),
    highContrast: Boolean(merged.highContrast),
    largeText: Boolean(merged.largeText),
    reduceMotion: Boolean(merged.reduceMotion),
    lowBandwidth: Boolean(merged.lowBandwidth || merged.saveDataMode),
    saveDataMode: Boolean(merged.saveDataMode || merged.lowBandwidth),
    keyboardMode: Boolean(merged.keyboardMode),
    screenReaderLabels: merged.screenReaderLabels !== false,
    compactMode: Boolean(merged.compactMode),
    cardFlipEnabled: merged.cardFlipEnabled !== false,
    soundEnabled: Boolean(merged.soundEnabled),
    autoTranslate: merged.autoTranslate !== false,
    showCardImages: merged.showCardImages !== false,
    confirmBeforeSubmit: Boolean(merged.confirmBeforeSubmit)
  }
}

export async function getPlayerSettings(userId) {
  const localSettings = readLocalSettings()

  if (!userId) {
    return normaliseSettings(localSettings)
  }

  try {
    const snapshot = await getDoc(doc(db, COLLECTIONS.users, userId))
    if (!snapshot.exists()) return normaliseSettings(localSettings)

    const data = snapshot.data()
    return normaliseSettings({
      ...localSettings,
      ...(data.playerSettings || {}),
      preferredLanguage: data.preferredLanguage || data.playerSettings?.preferredLanguage || localSettings.preferredLanguage || DEFAULT_PLAYER_SETTINGS.preferredLanguage
    })
  } catch {
    return normaliseSettings(localSettings)
  }
}

export async function savePlayerSettings(userId, settings) {
  const merged = normaliseSettings(settings)
  writeLocalSettings(merged)

  if (!userId) {
    return merged
  }

  await setDoc(doc(db, COLLECTIONS.users, userId), cleanFirestoreData({
    preferredLanguage: merged.preferredLanguage,
    playerSettings: merged,
    settingsUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }), { merge: true })

  return merged
}

export function applyPlayerSettingsToDocument(settings) {
  const merged = normaliseSettings(settings)
  const root = document.documentElement
  root.dataset.glaHighContrast = merged.highContrast ? 'true' : 'false'
  root.dataset.glaLargeText = merged.largeText ? 'true' : 'false'
  root.dataset.glaReduceMotion = merged.reduceMotion ? 'true' : 'false'
  root.dataset.glaLowBandwidth = merged.lowBandwidth ? 'true' : 'false'
  root.dataset.glaCompactMode = merged.compactMode ? 'true' : 'false'
  root.dataset.glaKeyboardMode = merged.keyboardMode ? 'true' : 'false'
  root.dataset.glaScreenReaderLabels = merged.screenReaderLabels ? 'true' : 'false'
  root.dataset.glaShowCardImages = merged.showCardImages ? 'true' : 'false'
  root.dataset.glaCardFlipEnabled = merged.cardFlipEnabled ? 'true' : 'false'
  root.dataset.glaConfirmBeforeSubmit = merged.confirmBeforeSubmit ? 'true' : 'false'
  root.lang = merged.preferredLanguage || 'en'
  root.dir = merged.preferredLanguage === 'ar' ? 'rtl' : 'ltr'
}
