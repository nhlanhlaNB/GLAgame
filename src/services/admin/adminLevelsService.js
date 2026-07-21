import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, makeSafeId, removeDocument, saveDocument, toNumber } from './adminDataHelpers'

export async function getAdminLevels() {
  const rows = await getRows(COLLECTIONS.levels)
  return rows.sort((a, b) => toNumber(a.level) - toNumber(b.level))
}

export async function saveAdminLevel(formValues) {
  const title = cleanText(formValues.title)
  if (!title) throw new Error('Level title is required.')
  const levelId = cleanText(formValues.levelId || formValues.firestoreId) || makeSafeId(title, 'level')
  return saveDocument(COLLECTIONS.levels, levelId, {
    levelId,
    level: toNumber(formValues.level, 1),
    title,
    badge: cleanText(formValues.badge) || '🏅',
    description: cleanText(formValues.description),
    requiredCoin: toNumber(formValues.requiredCoin),
    requiredCompletedProblems: toNumber(formValues.requiredCompletedProblems),
    requiredAverageScore: toNumber(formValues.requiredAverageScore),
    isActive: formValues.isActive !== false,
    createdAt: formValues.createdAt || serverTimestamp()
  }, { actionType: 'save_level' })
}

export async function deleteAdminLevel(level) {
  return removeDocument(COLLECTIONS.levels, level.firestoreId || level.levelId, { actionType: 'delete_level' })
}
