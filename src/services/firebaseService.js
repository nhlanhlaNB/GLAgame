import { auth, db, storage } from '../firebase'

export const COLLECTIONS = {
  users: 'users',
  problemCards: 'problemCards',
  aiCards: 'aiCards',
  selectedProblemStacks: 'selectedProblemStacks',
  gameSessions: 'gameSessions',
  attempts: 'attempts',
  deepSeekEvaluations: 'deepSeekEvaluations',
  hintRequests: 'hintRequests',
  glaCoinTransactions: 'glaCoinTransactions',
  walletAdjustments: 'walletAdjustments',
  certificates: 'certificates',
  scoringRubrics: 'scoringRubrics',
  scores: 'scores',
  subScores: 'subScores',
  feedback: 'feedback',
  userFeedback: 'userFeedback',
  aiScoringReviews: 'aiScoringReviews',
  cardReviewNotes: 'cardReviewNotes',
  analyticsEvents: 'analyticsEvents',
  languageVersions: 'languageVersions',
  cardTranslations: 'cardTranslations',
  uiTranslations: 'uiTranslations',
  achievements: 'achievements',
  playerAchievements: 'playerAchievements',
  levels: 'levels',
  adminUsers: 'adminUsers',
  adminActivityLogs: 'adminActivityLogs',
  appSettings: 'appSettings',
  launchSettings: 'launchSettings',
  sponsorRewards: 'sponsorRewards',
  rewardClaims: 'rewardClaims',
  multiplayerRooms: 'multiplayerRooms',
  roomPlayers: 'roomPlayers',
  teams: 'teams',
  teamSessions: 'teamSessions',
  debates: 'debates',
  debateVotes: 'debateVotes',
  tournaments: 'tournaments',
  tournamentPlayers: 'tournamentPlayers',
  leaderboards: 'leaderboards',
  cardSkins: 'cardSkins',
  userCardSkins: 'userCardSkins',
  publicLaunchEvents: 'publicLaunchEvents',
  adminReports: 'adminReports'
}

export function cleanFirestoreData(value) {
  if (Array.isArray(value)) {
    return value.map(cleanFirestoreData).filter((item) => item !== undefined)
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date || (value.constructor && value.constructor.name !== 'Object')) {
      return value
    }

    const cleaned = {}

    Object.entries(value).forEach(([key, item]) => {
      if (item === undefined) return
      cleaned[key] = cleanFirestoreData(item)
    })

    return cleaned
  }

  return value
}

export function cleanText(value) {
  return String(value || '').trim()
}

export function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function makeSafeId(value, fallback = 'item') {
  const cleaned = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return cleaned || `${fallback}_${Date.now()}`
}

export function isSchemaDocument(row) {
  const id = cleanText(row?.firestoreId || row?.id || row?.documentId).toLowerCase()
  return id === '__schema' || id === 'schema' || id.includes('__schema') || id.includes('sample')
}

export { auth, db, storage }
