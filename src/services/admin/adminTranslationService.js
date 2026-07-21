import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

const starterLanguages = [
  {
    languageCode: 'en',
    languageName: 'English',
    deckStatus: 'Published',
    reviewer: 'GRIT Lab Africa',
    isActive: true,
    order: 1
  },
  {
    languageCode: 'fr',
    languageName: 'French',
    deckStatus: 'Draft',
    reviewer: 'Pending',
    isActive: true,
    order: 2
  },
  {
    languageCode: 'pt',
    languageName: 'Portuguese',
    deckStatus: 'Draft',
    reviewer: 'Pending',
    isActive: true,
    order: 3
  },
  {
    languageCode: 'ar',
    languageName: 'Arabic',
    deckStatus: 'Planning',
    reviewer: 'Pending',
    isActive: true,
    order: 4
  },
  {
    languageCode: 'sw',
    languageName: 'Kiswahili',
    deckStatus: 'Planning',
    reviewer: 'Pending',
    isActive: true,
    order: 5
  },
  {
    languageCode: 'zu',
    languageName: 'isiZulu',
    deckStatus: 'Draft',
    reviewer: 'Pending',
    isActive: true,
    order: 6
  }
]

function cleanText(value) {
  return String(value || '').trim()
}

function cleanLanguageCode(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z-]/g, '')
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))

  return snapshot.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    ...documentSnapshot.data()
  }))
}

export async function getAdminLanguageVersions() {
  const [languages, translations, problemCards, aiCards] = await Promise.all([
    getCollectionRows(COLLECTIONS.languageVersions),
    getCollectionRows(COLLECTIONS.cardTranslations),
    getCollectionRows(COLLECTIONS.problemCards),
    getCollectionRows(COLLECTIONS.aiCards)
  ])

  const totalCards = problemCards.length + aiCards.length

  return languages
    .map((language) => {
      const languageCode = language.languageCode || language.code || language.firestoreId

      const translatedCardKeys = new Set(
        translations
          .filter((translation) => {
            return (
              String(translation.languageCode || translation.language || '')
                .toLowerCase() === String(languageCode || '').toLowerCase()
            )
          })
          .map((translation) => {
            const cardId =
              translation.cardId ||
              translation.problemCardId ||
              translation.aiCardId ||
              translation.sourceCardId ||
              translation.firestoreId

            const cardType = translation.cardType || 'card'

            return `${cardType}:${cardId}`
          })
      )

      const translatedCount = translatedCardKeys.size

      return {
        id: language.firestoreId,
        languageCode,
        languageName:
          language.languageName ||
          language.language ||
          language.name ||
          languageCode,
        language:
          language.languageName ||
          language.language ||
          language.name ||
          languageCode,
        deckStatus: language.deckStatus || language.status || 'Planning',
        cardsTranslated: translatedCount,
        totalCards,
        progress:
          totalCards > 0 ? Math.round((translatedCount / totalCards) * 100) : 0,
        reviewer: language.reviewer || 'Pending',
        isActive: language.isActive !== false,
        order: toNumber(language.order, 99),
        createdAt: language.createdAt || null,
        updatedAt: language.updatedAt || null
      }
    })
    .sort((a, b) => a.order - b.order || a.languageName.localeCompare(b.languageName))
}

export async function seedStarterLanguageVersions() {
  const uploadTasks = starterLanguages.map((language) =>
    setDoc(
      doc(db, COLLECTIONS.languageVersions, language.languageCode),
      {
        ...language,
        languageId: language.languageCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  )

  await Promise.all(uploadTasks)

  return starterLanguages.length
}

export async function addAdminLanguageVersion(formValues) {
  const languageName = cleanText(formValues.languageName)
  const languageCode = cleanLanguageCode(formValues.languageCode)
  const deckStatus = cleanText(formValues.deckStatus) || 'Planning'
  const reviewer = cleanText(formValues.reviewer) || 'Pending'

  if (!languageName) {
    throw new Error('Language name is required.')
  }

  if (!languageCode) {
    throw new Error('Language code is required.')
  }

  const languageData = {
    languageId: languageCode,
    languageCode,
    languageName,
    language: languageName,
    deckStatus,
    reviewer,
    isActive: true,
    order: toNumber(formValues.order, 99),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTIONS.languageVersions, languageCode), languageData, {
    merge: true
  })

  return {
    firestoreId: languageCode,
    ...languageData
  }
}

export async function updateAdminLanguageStatus(language, updates) {
  const languageId = language.firestoreId || language.languageCode || language.id

  if (!languageId) {
    throw new Error('Language document ID is missing.')
  }

  await setDoc(
    doc(db, COLLECTIONS.languageVersions, languageId),
    {
      ...updates,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )

  return languageId
}

export async function deleteAdminLanguageVersion(language) {
  const languageId = language.firestoreId || language.languageCode || language.id

  if (!languageId) {
    throw new Error('Language document ID is missing.')
  }

  await deleteDoc(doc(db, COLLECTIONS.languageVersions, languageId))

  return languageId
}