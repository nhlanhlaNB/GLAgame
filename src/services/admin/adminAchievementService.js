import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, makeSafeId, removeDocument, saveDocument, toNumber } from './adminDataHelpers'

export async function getAdminAchievements() {
  const rows = await getRows(COLLECTIONS.achievements)
  return rows.sort((a, b) => toNumber(a.order, 99) - toNumber(b.order, 99))
}

export async function saveAdminAchievement(formValues) {
  const title = cleanText(formValues.title)
  if (!title) throw new Error('Achievement title is required.')
  const achievementId = cleanText(formValues.achievementId || formValues.firestoreId) || makeSafeId(title, 'achievement')
  return saveDocument(COLLECTIONS.achievements, achievementId, {
    achievementId,
    title,
    description: cleanText(formValues.description),
    icon: cleanText(formValues.icon) || '🏅',
    category: cleanText(formValues.category) || 'Progress',
    conditionType: cleanText(formValues.conditionType) || 'attempts',
    targetValue: toNumber(formValues.targetValue, 1),
    rewardCoin: toNumber(formValues.rewardCoin),
    order: toNumber(formValues.order, 99),
    isActive: formValues.isActive !== false,
    createdAt: formValues.createdAt || serverTimestamp()
  }, { actionType: 'save_achievement' })
}

export async function deleteAdminAchievement(achievement) {
  return removeDocument(COLLECTIONS.achievements, achievement.firestoreId || achievement.achievementId, { actionType: 'delete_achievement' })
}
