import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, makeSafeId, removeDocument, saveDocument, toNumber } from './adminDataHelpers'

export async function getAdminRewards() {
  const rows = await getRows(COLLECTIONS.sponsorRewards)
  return rows.sort((a, b) => toNumber(a.requiredCoin) - toNumber(b.requiredCoin))
}

export async function saveAdminReward(formValues) {
  const title = cleanText(formValues.title)
  if (!title) throw new Error('Reward title is required.')
  const rewardId = cleanText(formValues.firestoreId || formValues.rewardId) || makeSafeId(title, 'reward')
  return saveDocument(COLLECTIONS.sponsorRewards, rewardId, {
    rewardId,
    title,
    description: cleanText(formValues.description),
    rewardType: cleanText(formValues.rewardType) || 'digital',
    sponsorName: cleanText(formValues.sponsorName) || 'GRIT Lab Africa',
    requiredCoin: toNumber(formValues.requiredCoin),
    availableQuantity: toNumber(formValues.availableQuantity, 0),
    isActive: formValues.isActive !== false,
    createdAt: formValues.createdAt || serverTimestamp()
  }, { actionType: 'save_reward' })
}

export async function deleteAdminReward(reward) {
  return removeDocument(COLLECTIONS.sponsorRewards, reward.firestoreId || reward.rewardId, { actionType: 'delete_reward' })
}

export async function getRewardClaims() {
  const rows = await getRows(COLLECTIONS.rewardClaims)
  return rows.sort((a, b) => String(b.createdAt?.seconds || 0).localeCompare(String(a.createdAt?.seconds || 0)))
}

export async function updateRewardClaimStatus(claim, status, adminNote = '') {
  const claimId = claim.firestoreId || claim.claimId
  return saveDocument(COLLECTIONS.rewardClaims, claimId, {
    ...claim,
    claimStatus: status,
    adminNote: cleanText(adminNote),
    reviewedAt: serverTimestamp()
  }, { actionType: `reward_claim_${status}` })
}
