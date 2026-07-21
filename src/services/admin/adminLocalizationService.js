import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, makeSafeId, removeDocument, saveDocument, toNumber } from './adminDataHelpers'

export async function getLanguages() {
  const rows = await getRows(COLLECTIONS.languageVersions)

  return rows
    .map((language) => ({
      firestoreId: language.firestoreId,
      languageId: cleanText(language.languageId || language.languageCode || language.firestoreId).toLowerCase(),
      languageCode: cleanText(language.languageCode || language.code || language.firestoreId).toLowerCase(),
      languageName: cleanText(language.languageName || language.language || language.name || language.firestoreId),
      deckStatus: cleanText(language.deckStatus || language.status) || 'Draft',
      reviewer: cleanText(language.reviewer) || 'Pending',
      isActive: language.isActive !== false,
      order: toNumber(language.order, 99),
      createdAt: language.createdAt || null,
      updatedAt: language.updatedAt || null
    }))
    .sort((a, b) => a.order - b.order || a.languageName.localeCompare(b.languageName))
}

export async function saveLanguageVersion(formValues) {
  const languageCode = cleanText(formValues.languageCode).toLowerCase().replace(/[^a-z-]/g, '')
  const languageName = cleanText(formValues.languageName)

  if (!languageCode) throw new Error('Language code is required. Example: en, fr, zu.')
  if (!languageName) throw new Error('Language name is required. Example: English, French, isiZulu.')

  return saveDocument(COLLECTIONS.languageVersions, languageCode, {
    languageId: languageCode,
    languageCode,
    languageName,
    language: languageName,
    deckStatus: cleanText(formValues.deckStatus) || 'Draft',
    reviewer: cleanText(formValues.reviewer) || 'Pending',
    isActive: formValues.isActive !== false,
    order: toNumber(formValues.order, 99),
    createdAt: formValues.createdAt || serverTimestamp()
  }, { actionType: 'save_language_version' })
}

export async function updateLanguageStatus(language, isActive) {
  const languageId = cleanText(language.firestoreId || language.languageCode || language.languageId).toLowerCase()
  if (!languageId) throw new Error('Language document ID is missing.')

  return saveDocument(COLLECTIONS.languageVersions, languageId, { isActive: Boolean(isActive), updatedAt: serverTimestamp() }, { actionType: isActive ? 'activate_language' : 'deactivate_language' })
}

export async function deleteLanguageVersion(language) {
  const languageId = cleanText(language.firestoreId || language.languageCode || language.languageId).toLowerCase()
  if (!languageId) throw new Error('Language document ID is missing.')
  return removeDocument(COLLECTIONS.languageVersions, languageId, { actionType: 'delete_language_version' })
}

export async function getUiTranslations() {
  const rows = await getRows(COLLECTIONS.uiTranslations)
  return rows
    .map((row) => ({
      firestoreId: row.firestoreId,
      translationId: cleanText(row.translationId || row.firestoreId),
      languageCode: cleanText(row.languageCode || row.language).toLowerCase(),
      namespace: cleanText(row.namespace || 'player'),
      key: cleanText(row.key || row.translationKey),
      sourceText: cleanText(row.sourceText || row.englishText),
      translatedText: cleanText(row.translatedText || row.text || row.value),
      status: cleanText(row.status) || 'active',
      updatedAt: row.updatedAt || null
    }))
    .sort((a, b) => a.languageCode.localeCompare(b.languageCode) || a.namespace.localeCompare(b.namespace) || a.key.localeCompare(b.key))
}

export async function saveUiTranslation(formValues) {
  const languageCode = cleanText(formValues.languageCode).toLowerCase()
  const namespace = cleanText(formValues.namespace || 'player')
  const key = cleanText(formValues.key || formValues.translationKey)
  const translatedText = cleanText(formValues.translatedText || formValues.text || formValues.value)

  if (!languageCode) throw new Error('Language code is required.')
  if (!key) throw new Error('Translation key is required.')
  if (!translatedText) throw new Error('Translated text is required.')

  const translationId = cleanText(formValues.translationId || formValues.firestoreId) || makeSafeId(`${languageCode}_${namespace}_${key}`, 'translation')

  return saveDocument(COLLECTIONS.uiTranslations, translationId, {
    translationId,
    languageCode,
    namespace,
    key,
    sourceText: cleanText(formValues.sourceText || formValues.englishText),
    translatedText,
    text: translatedText,
    status: cleanText(formValues.status) || 'active',
    updatedAt: serverTimestamp()
  }, { actionType: 'save_ui_translation' })
}

export async function deleteUiTranslation(translation) {
  const translationId = cleanText(translation.firestoreId || translation.translationId)
  if (!translationId) throw new Error('Translation document ID is missing.')
  return removeDocument(COLLECTIONS.uiTranslations, translationId, { actionType: 'delete_ui_translation' })
}

export async function seedStarterLanguages() {
  const starterLanguages = [
    { languageCode: 'en', languageName: 'English', order: 1, deckStatus: 'Published', reviewer: 'GRIT Lab Africa', isActive: true },
    { languageCode: 'zu', languageName: 'isiZulu', order: 2, deckStatus: 'Published', reviewer: 'GRIT Lab Africa', isActive: true },
    { languageCode: 'fr', languageName: 'French', order: 3, deckStatus: 'Published', reviewer: 'GRIT Lab Africa', isActive: true },
    { languageCode: 'ar', languageName: 'Arabic', order: 4, deckStatus: 'Published', reviewer: 'GRIT Lab Africa', isActive: true },
    { languageCode: 'pt', languageName: 'Portuguese', order: 5, deckStatus: 'Published', reviewer: 'GRIT Lab Africa', isActive: true },
    { languageCode: 'sw', languageName: 'Kiswahili', order: 6, deckStatus: 'Published', reviewer: 'GRIT Lab Africa', isActive: true }
  ]

  await Promise.all(starterLanguages.map((language) => saveLanguageVersion(language)))

  const starterTranslations = [
    { languageCode: 'zu', key: 'dashboard', sourceText: 'Dashboard', translatedText: 'Ideshibhodi' },
    { languageCode: 'zu', key: 'settings', sourceText: 'Settings', translatedText: 'Izilungiselelo' },
    { languageCode: 'fr', key: 'dashboard', sourceText: 'Dashboard', translatedText: 'Tableau de bord' },
    { languageCode: 'fr', key: 'settings', sourceText: 'Settings', translatedText: 'Paramètres' },
    { languageCode: 'ar', key: 'dashboard', sourceText: 'Dashboard', translatedText: 'لوحة التحكم' },
    { languageCode: 'ar', key: 'settings', sourceText: 'Settings', translatedText: 'الإعدادات' },
    { languageCode: 'pt', key: 'dashboard', sourceText: 'Dashboard', translatedText: 'Painel' },
    { languageCode: 'pt', key: 'settings', sourceText: 'Settings', translatedText: 'Definições' },
    { languageCode: 'sw', key: 'dashboard', sourceText: 'Dashboard', translatedText: 'Dashibodi' },
    { languageCode: 'sw', key: 'settings', sourceText: 'Settings', translatedText: 'Mipangilio' }
  ]

  await Promise.all(starterTranslations.map((translation) => saveUiTranslation({ namespace: 'system', ...translation })))

  return starterLanguages.length + starterTranslations.length
}
