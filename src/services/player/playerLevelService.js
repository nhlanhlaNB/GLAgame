import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, db, isSchemaDocument } from '../firebaseService'

export const PLAYER_LEVELS = [
  { level: 1, levelId: 'ai_explorer', title: 'AI Explorer', badge: '🌱', description: 'You are starting your AI for SDGs learning journey.', requiredCoin: 0, requiredCompletedProblems: 0, requiredAverageScore: 0, isActive: true, order: 1 },
  { level: 2, levelId: 'problem_scout', title: 'Problem Scout', badge: '🔎', description: 'You have started exploring African problems through AI thinking.', requiredCoin: 100, requiredCompletedProblems: 1, requiredAverageScore: 0, isActive: true, order: 2 },
  { level: 3, levelId: 'ai_ideator', title: 'AI Ideator', badge: '💡', description: 'You are building stronger AI solution ideas.', requiredCoin: 250, requiredCompletedProblems: 3, requiredAverageScore: 50, isActive: true, order: 3 },
  { level: 4, levelId: 'sdg_builder', title: 'SDG Builder', badge: '🌍', description: 'You are connecting AI ideas to SDG-related challenges.', requiredCoin: 500, requiredCompletedProblems: 5, requiredAverageScore: 60, isActive: true, order: 4 },
  { level: 5, levelId: 'innovation_candidate', title: 'Innovation Candidate', badge: '🚀', description: 'You are close to the certificate pathway.', requiredCoin: 750, requiredCompletedProblems: 8, requiredAverageScore: 70, isActive: true, order: 5 },
  { level: 6, levelId: 'gla_certified_innovator', title: 'GLA Certified Innovator', badge: '🎓', description: 'You meet the certificate-style progress requirement.', requiredCoin: 1000, requiredCompletedProblems: 10, requiredAverageScore: 75, isActive: true, order: 6 },
  { level: 7, levelId: 'african_ai_champion', title: 'African AI Champion', badge: '🏆', description: 'You are showing strong continued play after certification.', requiredCoin: 1500, requiredCompletedProblems: 15, requiredAverageScore: 80, isActive: true, order: 7 },
  { level: 8, levelId: 'impact_leader', title: 'Impact Leader', badge: '👑', description: 'You are leading through high-quality AI and SDG problem-solving.', requiredCoin: 2000, requiredCompletedProblems: 20, requiredAverageScore: 85, isActive: true, order: 8 }
]

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normaliseLevel(row, index = 0) {
  const levelNumber = toNumber(row.level || row.levelNumber || row.order, index + 1)
  return {
    level: levelNumber,
    levelId: cleanText(row.levelId || row.firestoreId || `level_${levelNumber}`),
    title: cleanText(row.title || row.levelTitle || row.name) || `Level ${levelNumber}`,
    badge: cleanText(row.badge || row.icon || row.emoji) || '🏆',
    description: cleanText(row.description) || 'Player progression level.',
    requiredCoin: toNumber(row.requiredCoin || row.requiredGlaCoin || row.requiredCoins),
    requiredCompletedProblems: toNumber(row.requiredCompletedProblems || row.requiredProblems || row.completedProblemsRequired),
    requiredAverageScore: toNumber(row.requiredAverageScore || row.averageScoreRequired),
    isActive: row.isActive !== false,
    order: toNumber(row.order, levelNumber)
  }
}

async function getRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
}

export async function getActivePlayerLevels() {
  const rows = await getRows(COLLECTIONS.levels)
  const firebaseLevels = rows
    .filter((row) => !isSchemaDocument(row))
    .map(normaliseLevel)
    .filter((level) => level.isActive)

  const levelMap = new Map()

  PLAYER_LEVELS.forEach((level, index) => {
    const normalisedLevel = normaliseLevel(level, index)
    levelMap.set(normalisedLevel.levelId, normalisedLevel)
  })

  firebaseLevels.forEach((level, index) => {
    const current = levelMap.get(level.levelId) || {}
    levelMap.set(level.levelId, normaliseLevel({ ...current, ...level }, index))
  })

  return Array.from(levelMap.values())
    .filter((level) => level.isActive)
    .sort((a, b) => a.order - b.order || a.level - b.level)
}

function getRequirementProgress(currentValue, requiredValue) {
  if (!requiredValue || requiredValue <= 0) return 100
  return Math.min(100, Math.round((currentValue / requiredValue) * 100))
}

function levelIsUnlocked(level, stats) {
  return (
    stats.totalGlaCoinEarned >= level.requiredCoin &&
    stats.completedProblems >= level.requiredCompletedProblems &&
    stats.averageScore >= level.requiredAverageScore
  )
}

function getDisplayProgress(currentValue, requiredValue, unlocked) {
  if (unlocked) return Math.max(0, toNumber(requiredValue))
  return Math.min(toNumber(currentValue), Math.max(0, toNumber(requiredValue)))
}

function getLevelProgress(level, stats) {
  const coinProgress = getRequirementProgress(stats.totalGlaCoinEarned, level.requiredCoin)
  const completedProgress = getRequirementProgress(stats.completedProblems, level.requiredCompletedProblems)
  const averageProgress = getRequirementProgress(stats.averageScore, level.requiredAverageScore)
  return Math.min(coinProgress, completedProgress, averageProgress)
}

export function calculatePlayerLevelProgress({
  totalGlaCoinEarned = 0,
  completedProblems = 0,
  averageScore = 0,
  levelsSource = PLAYER_LEVELS
}) {
  const stats = {
    totalGlaCoinEarned: toNumber(totalGlaCoinEarned),
    completedProblems: toNumber(completedProblems),
    averageScore: toNumber(averageScore)
  }

  const source = levelsSource.length ? levelsSource : PLAYER_LEVELS
  const levels = source.map((level, index) => {
    const normalisedLevel = normaliseLevel(level, index)
    const unlocked = levelIsUnlocked(normalisedLevel, stats)

    return {
      ...normalisedLevel,
      unlocked,
      progressPercent: unlocked ? 100 : getLevelProgress(normalisedLevel, stats),
      coinProgress: getRequirementProgress(stats.totalGlaCoinEarned, normalisedLevel.requiredCoin),
      completedProgress: getRequirementProgress(stats.completedProblems, normalisedLevel.requiredCompletedProblems),
      averageProgress: getRequirementProgress(stats.averageScore, normalisedLevel.requiredAverageScore),
      displayedCoin: getDisplayProgress(stats.totalGlaCoinEarned, normalisedLevel.requiredCoin, unlocked),
      displayedCompleted: getDisplayProgress(stats.completedProblems, normalisedLevel.requiredCompletedProblems, unlocked),
      displayedAverage: getDisplayProgress(stats.averageScore, normalisedLevel.requiredAverageScore, unlocked)
    }
  })

  const unlockedLevels = levels.filter((level) => level.unlocked)
  const currentLevel = unlockedLevels[unlockedLevels.length - 1] || levels[0]
  const nextLevel = levels.find((level) => level.level > currentLevel.level && !level.unlocked) || null
  const nextProgress = nextLevel ? getLevelProgress(nextLevel, stats) : 100

  return {
    stats,
    levels,
    currentLevel,
    nextLevel,
    nextProgress,
    unlockedLevelCount: unlockedLevels.length,
    maxLevelCount: levels.length
  }
}

export async function syncPlayerLevelProgress({
  userId,
  totalGlaCoinEarned = 0,
  completedProblems = 0,
  averageScore = 0
}) {
  if (!userId) throw new Error('User ID is required to sync player level.')

  const firebaseLevels = await getActivePlayerLevels()
  const progress = calculatePlayerLevelProgress({
    totalGlaCoinEarned,
    completedProblems,
    averageScore,
    levelsSource: firebaseLevels
  })

  await setDoc(
    doc(db, COLLECTIONS.users, userId),
    cleanFirestoreData({
      currentLevel: progress.currentLevel.level,
      currentLevelId: progress.currentLevel.levelId,
      currentLevelTitle: progress.currentLevel.title,
      nextLevelId: progress.nextLevel?.levelId || '',
      nextLevelTitle: progress.nextLevel?.title || '',
      levelProgressPercent: progress.nextProgress,
      levelUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }),
    { merge: true }
  )

  return progress
}
