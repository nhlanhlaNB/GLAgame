import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

const DEFAULT_ACHIEVEMENTS = [
  {
    achievementId: 'first_solution',
    title: 'First AI Solution',
    description: 'Submit your first AI solution for an African SDG problem.',
    icon: '🌱',
    category: 'Getting Started',
    conditionType: 'attempts',
    targetValue: 1,
    rewardCoin: 10,
    order: 1,
    isActive: true
  },
  {
    achievementId: 'three_problem_solver',
    title: 'Problem Solver',
    description: 'Complete 3 different problem cards.',
    icon: '🧩',
    category: 'Progress',
    conditionType: 'completedProblems',
    targetValue: 3,
    rewardCoin: 25,
    order: 2,
    isActive: true
  },
  {
    achievementId: 'ten_card_certification_path',
    title: 'Certification Path',
    description: 'Complete 10 problem cards, the main certificate requirement.',
    icon: '🎓',
    category: 'Certification',
    conditionType: 'completedProblems',
    targetValue: 10,
    rewardCoin: 50,
    order: 3,
    isActive: true
  },
  {
    achievementId: 'certificate_ready',
    title: 'Certificate Ready',
    description: 'Complete at least 10 problem cards with an average score of 75% or higher.',
    icon: '🏅',
    category: 'Certification',
    conditionType: 'certificateReady',
    targetValue: 1,
    rewardCoin: 75,
    order: 4,
    isActive: true
  },
  {
    achievementId: 'high_scorer',
    title: 'High Scorer',
    description: 'Achieve a best score of 85 or higher on any problem card.',
    icon: '⭐',
    category: 'Scoring',
    conditionType: 'bestScore',
    targetValue: 85,
    rewardCoin: 30,
    order: 5,
    isActive: true
  },
  {
    achievementId: 'perfect_solution',
    title: 'Perfect Solution',
    description: 'Score 100 on any AI solution.',
    icon: '💯',
    category: 'Scoring',
    conditionType: 'bestScore',
    targetValue: 100,
    rewardCoin: 100,
    order: 6,
    isActive: true
  },
  {
    achievementId: 'ai_combination_builder',
    title: 'AI Combination Builder',
    description: 'Use 3 AI cards together in one solution.',
    icon: '🤖',
    category: 'AI Thinking',
    conditionType: 'maxAiCardsUsed',
    targetValue: 3,
    rewardCoin: 20,
    order: 7,
    isActive: true
  },
  {
    achievementId: 'persistent_innovator',
    title: 'Persistent Innovator',
    description: 'Submit 10 total attempts, including retries.',
    icon: '🔁',
    category: 'Persistence',
    conditionType: 'attempts',
    targetValue: 10,
    rewardCoin: 40,
    order: 8,
    isActive: true
  },
  {
    achievementId: 'gla_coin_collector',
    title: 'GLA Coin Collector',
    description: 'Earn 500 total GLA coin.',
    icon: '🪙',
    category: 'GLA Coin',
    conditionType: 'totalGlaCoinEarned',
    targetValue: 500,
    rewardCoin: 25,
    order: 9,
    isActive: true
  },
  {
    achievementId: 'gla_coin_master',
    title: 'GLA Coin Master',
    description: 'Earn 1000 total GLA coin.',
    icon: '👑',
    category: 'GLA Coin',
    conditionType: 'totalGlaCoinEarned',
    targetValue: 1000,
    rewardCoin: 50,
    order: 10,
    isActive: true
  },
  {
    achievementId: 'african_context_champion',
    title: 'African Context Champion',
    description: 'Score strongly in African context and feasibility.',
    icon: '🌍',
    category: 'Responsible Innovation',
    conditionType: 'africanContextScore',
    targetValue: 13,
    rewardCoin: 35,
    order: 11,
    isActive: true
  },
  {
    achievementId: 'responsible_ai_guardian',
    title: 'Responsible AI Guardian',
    description: 'Score strongly in ethical and responsible AI use.',
    icon: '🛡️',
    category: 'Responsible Innovation',
    conditionType: 'responsibleAiScore',
    targetValue: 9,
    rewardCoin: 35,
    order: 12,
    isActive: true
  }
]

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function isSchemaDocument(row) {
  const id = cleanText(row.firestoreId || row.achievementId).toLowerCase()

  return (
    id === '__schema' ||
    id === 'schema' ||
    id.includes('__schema') ||
    id.includes('sample')
  )
}

function getSafeAchievementId(achievement) {
  return cleanText(achievement.achievementId || achievement.firestoreId)
}

function normaliseAchievementDefinition(achievement) {
  const achievementId = getSafeAchievementId(achievement)

  return {
    achievementId,
    title: cleanText(achievement.title) || 'Achievement',
    description:
      cleanText(achievement.description) ||
      'Complete progress in the GRIT Lab Africa AI for SDGs Card Game.',
    icon: cleanText(achievement.icon) || '🏅',
    category: cleanText(achievement.category) || 'Progress',
    conditionType: cleanText(achievement.conditionType) || 'attempts',
    targetValue: toNumber(achievement.targetValue, 1),
    rewardCoin: toNumber(achievement.rewardCoin, 0),
    order: toNumber(achievement.order, 99),
    isActive: achievement.isActive !== false
  }
}

function isUsableAchievementDefinition(achievement) {
  if (isSchemaDocument(achievement)) return false

  const achievementId = getSafeAchievementId(achievement)
  const title = cleanText(achievement.title)
  const conditionType = cleanText(achievement.conditionType)

  return Boolean(achievementId && title && conditionType)
}

function getAttemptScore(attempt) {
  return toNumber(
    attempt.totalScore ||
      attempt.total_score ||
      attempt.score ||
      attempt.GLA_coin_earned ||
      attempt.glaCoinEarned
  )
}

function getAttemptProblemId(attempt) {
  return attempt.problemId || attempt.problemCardId || attempt.cardId || ''
}

function getSelectedAiCardsCount(attempt) {
  const selectedAiCards =
    attempt.selectedAiCards ||
    attempt.aiCards ||
    attempt.selectedSolution ||
    []

  if (Array.isArray(selectedAiCards)) {
    return selectedAiCards.length
  }

  if (typeof selectedAiCards === 'string') {
    return selectedAiCards
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean).length
  }

  return 0
}

function normaliseCategoryName(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getBestSubScore(attempts, possibleNames) {
  const possibleKeys = possibleNames.map(normaliseCategoryName)
  let bestScore = 0

  attempts.forEach((attempt) => {
    const subScores = attempt.subScores || attempt.sub_scores || {}

    Object.entries(subScores).forEach(([category, value]) => {
      const cleanCategory = normaliseCategoryName(category)

      const isMatch = possibleKeys.some((key) => cleanCategory.includes(key))

      if (!isMatch) return

      if (typeof value === 'object' && value !== null) {
        bestScore = Math.max(
          bestScore,
          toNumber(value.score || value.value || value.total)
        )
        return
      }

      bestScore = Math.max(bestScore, toNumber(value))
    })
  })

  return bestScore
}

function calculateAverageBestScore(attempts) {
  const bestScoreByProblem = {}

  attempts.forEach((attempt) => {
    const problemId = getAttemptProblemId(attempt)
    if (!problemId) return

    bestScoreByProblem[problemId] = Math.max(
      bestScoreByProblem[problemId] || 0,
      getAttemptScore(attempt)
    )
  })

  const scores = Object.values(bestScoreByProblem)

  if (scores.length === 0) return 0

  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length
  )
}

export function buildAchievementStats({
  attempts = [],
  completedProblems = 0,
  totalGlaCoinEarned = 0
}) {
  const bestScore = attempts.reduce((best, attempt) => {
    return Math.max(best, getAttemptScore(attempt))
  }, 0)

  const maxAiCardsUsed = attempts.reduce((highest, attempt) => {
    return Math.max(highest, getSelectedAiCardsCount(attempt))
  }, 0)

  return {
    totalAttempts: attempts.length,
    completedProblems: toNumber(completedProblems),
    totalGlaCoinEarned: toNumber(totalGlaCoinEarned),
    averageScore: calculateAverageBestScore(attempts),
    bestScore,
    maxAiCardsUsed,
    africanContextScore: getBestSubScore(attempts, [
      'africancontext',
      'africancontextandfeasibility',
      'african_context',
      'african_context_feasibility'
    ]),
    responsibleAiScore: getBestSubScore(attempts, [
      'ethical',
      'responsible',
      'ethicalresponsibleuse',
      'ethicalandresponsibleuse'
    ])
  }
}

function getCurrentValueForAchievement(achievement, stats) {
  if (achievement.conditionType === 'attempts') return stats.totalAttempts
  if (achievement.conditionType === 'completedProblems') return stats.completedProblems
  if (achievement.conditionType === 'bestScore') return stats.bestScore
  if (achievement.conditionType === 'maxAiCardsUsed') return stats.maxAiCardsUsed
  if (achievement.conditionType === 'totalGlaCoinEarned') return stats.totalGlaCoinEarned
  if (achievement.conditionType === 'africanContextScore') return stats.africanContextScore
  if (achievement.conditionType === 'responsibleAiScore') return stats.responsibleAiScore

  if (achievement.conditionType === 'certificateReady') {
    return stats.completedProblems >= 10 && stats.averageScore >= 75 ? 1 : 0
  }

  return 0
}

function calculateAchievementProgress(achievement, stats) {
  const targetValue = toNumber(achievement.targetValue, 1)
  const currentValue = getCurrentValueForAchievement(achievement, stats)
  const unlocked = currentValue >= targetValue

  return {
    currentValue,
    targetValue,
    unlocked,
    progressPercent:
      targetValue > 0
        ? Math.min(100, Math.round((currentValue / targetValue) * 100))
        : 0
  }
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))

  return snapshot.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    ...documentSnapshot.data()
  }))
}

export async function seedDefaultAchievements() {
  const uploadTasks = DEFAULT_ACHIEVEMENTS.map((achievement) =>
    setDoc(
      doc(db, COLLECTIONS.achievements, achievement.achievementId),
      {
        ...achievement,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  )

  await Promise.all(uploadTasks)

  return DEFAULT_ACHIEVEMENTS.length
}

export async function getAchievementDefinitions() {
  const achievementRows = await getCollectionRows(COLLECTIONS.achievements)

  const usableAchievements = achievementRows
    .filter(isUsableAchievementDefinition)
    .map(normaliseAchievementDefinition)
    .filter((achievement) => achievement.isActive)

  if (usableAchievements.length === 0) {
    await seedDefaultAchievements()

    const seededRows = await getCollectionRows(COLLECTIONS.achievements)

    return seededRows
      .filter(isUsableAchievementDefinition)
      .map(normaliseAchievementDefinition)
      .filter((achievement) => achievement.isActive)
      .sort((a, b) => a.order - b.order)
  }

  return usableAchievements.sort((a, b) => a.order - b.order)
}

export async function getPlayerAchievements(userId) {
  if (!userId) return []

  const rows = await getCollectionRows(COLLECTIONS.playerAchievements)

  return rows.filter((row) => {
    if (isSchemaDocument(row)) return false
    return String(row.userId) === String(userId)
  })
}

export async function syncPlayerAchievements({
  userId,
  attempts = [],
  completedProblems = 0,
  totalGlaCoinEarned = 0
}) {
  if (!userId) {
    throw new Error('User ID is required to sync achievements.')
  }

  const stats = buildAchievementStats({
    attempts,
    completedProblems,
    totalGlaCoinEarned
  })

  const [achievementDefinitions, existingRows] = await Promise.all([
    getAchievementDefinitions(),
    getPlayerAchievements(userId)
  ])

  const existingMap = {}

  existingRows.forEach((row) => {
    existingMap[row.achievementId] = row
  })

  const syncedRows = await Promise.all(
    achievementDefinitions.map(async (achievement) => {
      const safeAchievement = normaliseAchievementDefinition(achievement)
      const progress = calculateAchievementProgress(safeAchievement, stats)
      const existing = existingMap[safeAchievement.achievementId]
      const documentId = `${userId}_${safeAchievement.achievementId}`

      const alreadyUnlocked = Boolean(existing?.unlocked)
      const unlocked = alreadyUnlocked || progress.unlocked
      const displayedCurrentValue = unlocked
        ? progress.targetValue
        : progress.currentValue
      const displayedProgressPercent = unlocked ? 100 : progress.progressPercent

      const playerAchievementData = {
        userId,
        achievementId: safeAchievement.achievementId,
        title: safeAchievement.title,
        description: safeAchievement.description,
        icon: safeAchievement.icon,
        category: safeAchievement.category,
        rewardCoin: safeAchievement.rewardCoin,
        conditionType: safeAchievement.conditionType,
        currentValue: displayedCurrentValue,
        targetValue: progress.targetValue,
        progressPercent: displayedProgressPercent,
        unlocked,
        unlockedAt:
          unlocked && !existing?.unlocked
            ? serverTimestamp()
            : existing?.unlockedAt || null,
        updatedAt: serverTimestamp()
      }

      if (!existing) {
        playerAchievementData.createdAt = serverTimestamp()
      }

      await setDoc(
        doc(db, COLLECTIONS.playerAchievements, documentId),
        playerAchievementData,
        { merge: true }
      )

      return {
        firestoreId: documentId,
        ...safeAchievement,
        ...playerAchievementData,
        unlockedAt: existing?.unlockedAt || null
      }
    })
  )

  const unlockedCount = syncedRows.filter((row) => row.unlocked).length

  await setDoc(
    doc(db, COLLECTIONS.users, userId),
    {
      achievementCount: syncedRows.length,
      unlockedAchievementCount: unlockedCount,
      lastAchievementSyncAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )

  return {
    stats,
    achievements: syncedRows
  }
}