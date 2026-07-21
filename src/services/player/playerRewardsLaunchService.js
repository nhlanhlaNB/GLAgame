import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, db, isSchemaDocument } from '../firebaseService'

const STARTER_REWARDS = [
  {
    rewardId: 'reward_innovation_badge',
    title: 'Innovation Badge',
    description: 'Unlock a badge for strong AI and SDG problem-solving.',
    sponsorName: 'GRIT Lab Africa',
    rewardType: 'badge',
    requiredCompletedProblems: 5,
    requiredAverageScore: 70,
    requiredCertificate: false,
    coinBonus: 25,
    isActive: true,
    order: 1
  },
  {
    rewardId: 'reward_certificate_showcase',
    title: 'Certificate Showcase',
    description: 'Unlock a certificate showcase reward after meeting the certificate requirement.',
    sponsorName: 'GRIT Lab Africa',
    rewardType: 'recognition',
    requiredCompletedProblems: 10,
    requiredAverageScore: 75,
    requiredCertificate: true,
    coinBonus: 50,
    isActive: true,
    order: 2
  },
  {
    rewardId: 'reward_card_skin_gold',
    title: 'Golden Card Skin',
    description: 'Unlock a golden card skin for continued play and replay motivation.',
    sponsorName: 'GRIT Lab Africa',
    rewardType: 'card_skin',
    requiredCompletedProblems: 12,
    requiredAverageScore: 75,
    requiredCertificate: true,
    coinBonus: 75,
    isActive: true,
    order: 3
  },
  {
    rewardId: 'reward_leaderboard_title',
    title: 'SDG Problem Solver Title',
    description: 'Unlock a leaderboard title for high-quality African context solutions.',
    sponsorName: 'GRIT Lab Africa',
    rewardType: 'leaderboard_title',
    requiredCompletedProblems: 15,
    requiredAverageScore: 80,
    requiredCertificate: true,
    coinBonus: 100,
    isActive: true,
    order: 4
  },
  {
    rewardId: 'reward_advanced_certificate',
    title: 'Advanced Certificate Marker',
    description: 'Unlock an advanced progress marker after solving more cards with a strong average.',
    sponsorName: 'GRIT Lab Africa',
    rewardType: 'advanced_certificate',
    requiredCompletedProblems: 20,
    requiredAverageScore: 84,
    requiredCertificate: true,
    coinBonus: 150,
    isActive: true,
    order: 5
  }
]

function nowDate() {
  return new Date()
}

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
}

export async function seedStarterRewardsLaunchData() {
  await Promise.all(STARTER_REWARDS.map((reward) => setDoc(doc(db, COLLECTIONS.sponsorRewards, reward.rewardId), cleanFirestoreData({ ...reward, createdAt: nowDate(), updatedAt: nowDate() }), { merge: true })))

  await setDoc(doc(db, COLLECTIONS.launchSettings, 'publicLaunch'), cleanFirestoreData({
    launchId: 'publicLaunch',
    launchStatus: 'pilot',
    launchTitle: 'GRIT Lab Africa AI for SDGs Card Game Pilot',
    launchMessage: 'The game is ready for pilot testing with learners and youth innovators.',
    allowPublicRegistration: true,
    allowRewardClaims: true,
    sponsorMessage: 'Sponsor-supported rewards can be activated for launch programmes.',
    updatedAt: nowDate()
  }), { merge: true })

  await setDoc(doc(db, COLLECTIONS.publicLaunchEvents, 'pilot_showcase'), cleanFirestoreData({
    eventId: 'pilot_showcase',
    title: 'Pilot Showcase',
    description: 'A public launch activity for learners to showcase AfriQuest progress.',
    eventStatus: 'planning',
    eventDate: '',
    createdAt: nowDate(),
    updatedAt: nowDate()
  }), { merge: true })

  return STARTER_REWARDS.length + 2
}

export async function getRewardsLaunchData(userId = '') {
  const [rewards, claims, launchRows, publicEvents] = await Promise.all([
    getCollectionRows(COLLECTIONS.sponsorRewards),
    getCollectionRows(COLLECTIONS.rewardClaims),
    getCollectionRows(COLLECTIONS.launchSettings),
    getCollectionRows(COLLECTIONS.publicLaunchEvents)
  ])

  const userClaims = claims.filter((claim) => !isSchemaDocument(claim) && String(claim.userId) === String(userId))
  const launchSettings = launchRows.find((row) => row.firestoreId === 'publicLaunch' || row.launchId === 'publicLaunch') || {
    launchStatus: 'pilot',
    launchTitle: 'GRIT Lab Africa AI for SDGs Card Game Pilot',
    launchMessage: 'The game is being prepared for public launch.',
    allowPublicRegistration: true,
    allowRewardClaims: true,
    sponsorMessage: 'Sponsor-supported features can be connected from the system.'
  }

  const liveRewards = rewards
    .filter((reward) => !isSchemaDocument(reward))
    .filter((reward) => reward.isActive !== false)

  const rewardSource = liveRewards.length > 0 ? liveRewards : STARTER_REWARDS

  return {
    rewards: rewardSource.map((reward) => ({
      rewardId: reward.rewardId || reward.firestoreId,
      title: reward.title || 'Learning Reward',
      description: reward.description || 'Reward details coming soon.',
      sponsorName: reward.sponsorName || 'GRIT Lab Africa',
      rewardType: reward.rewardType || 'recognition',
      requiredCompletedProblems: toNumber(reward.requiredCompletedProblems),
      requiredAverageScore: toNumber(reward.requiredAverageScore),
      requiredCertificate: reward.requiredCertificate === true,
      requiredLevel: toNumber(reward.requiredLevel),
      requiredAchievementId: cleanText(reward.requiredAchievementId),
      coinBonus: toNumber(reward.coinBonus),
      order: toNumber(reward.order, 99)
    })).sort((a, b) => a.order - b.order),
    claims: userClaims,
    launchSettings,
    publicLaunchEvents: publicEvents.filter((event) => !isSchemaDocument(event)).map((event) => ({
      eventId: event.eventId || event.firestoreId,
      title: cleanText(event.title) || 'Launch Event',
      description: cleanText(event.description),
      eventDate: cleanText(event.eventDate || event.date),
      eventStatus: cleanText(event.eventStatus || event.status) || 'planning'
    }))
  }
}

export async function claimSponsorReward({ userId, reward, completedProblems, averageScore, certificateUnlocked = false }) {
  if (!userId) throw new Error('User ID is required to claim a reward.')
  if (!reward?.rewardId) throw new Error('Reward is missing.')

  const hasCompletedRequirement = Number(completedProblems || 0) >= Number(reward.requiredCompletedProblems || 0)
  const hasAverageRequirement = Number(averageScore || 0) >= Number(reward.requiredAverageScore || 0)
  const hasCertificateRequirement = reward.requiredCertificate ? certificateUnlocked : true
  const canClaim = hasCompletedRequirement && hasAverageRequirement && hasCertificateRequirement

  if (!canClaim) {
    if (!hasCertificateRequirement) throw new Error('Unlock your certificate before claiming this reward.')
    throw new Error('You have not met this reward requirement yet.')
  }

  const claimId = `${userId}_${reward.rewardId}`
  const unlockedAt = nowDate()
  const payload = cleanFirestoreData({
    claimId,
    userId,
    rewardId: reward.rewardId,
    rewardTitle: reward.title,
    sponsorName: reward.sponsorName,
    rewardType: reward.rewardType,
    claimStatus: 'claimed',
    fulfillmentStatus: 'unlocked',
    completedProblems: Number(completedProblems || 0),
    averageScore: Number(averageScore || 0),
    coinBonus: Number(reward.coinBonus || 0),
    certificateUnlocked: Boolean(certificateUnlocked),
    createdAt: unlockedAt,
    updatedAt: unlockedAt,
    unlockedAt,
    isSchema: false
  })

  await setDoc(doc(db, COLLECTIONS.rewardClaims, claimId), payload, { merge: true })

  await setDoc(doc(db, COLLECTIONS.playerAchievements || 'playerAchievements', claimId), cleanFirestoreData({
    playerAchievementId: claimId,
    userId,
    achievementId: reward.rewardId,
    title: reward.title,
    description: reward.description,
    source: 'reward',
    status: 'unlocked',
    rewardType: reward.rewardType,
    unlockedAt,
    updatedAt: unlockedAt,
    isSchema: false
  }), { merge: true })

  if (reward.rewardType === 'card_skin') {
    await setDoc(doc(db, COLLECTIONS.userCardSkins || 'userCardSkins', claimId), cleanFirestoreData({
      userCardSkinId: claimId,
      userId,
      skinId: reward.rewardId,
      title: reward.title,
      status: 'unlocked',
      unlockedAt,
      updatedAt: unlockedAt,
      isSchema: false
    }), { merge: true })
  }

  if (Number(reward.coinBonus || 0) > 0) {
    await setDoc(doc(db, COLLECTIONS.glaCoinTransactions, `${claimId}_coin_bonus`), cleanFirestoreData({
      transactionId: `${claimId}_coin_bonus`,
      userId,
      source: 'reward',
      type: 'earn',
      amount: Number(reward.coinBonus || 0),
      description: `${reward.title} reward bonus`,
      createdAt: unlockedAt,
      updatedAt: unlockedAt,
      isSchema: false
    }), { merge: true })
  }

  return claimId
}
