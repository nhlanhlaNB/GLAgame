import { doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import {
  PLAYER_COLLECTIONS,
  now,
  playerCollection
} from './playerDataService'

function cleanData(value) {
  if (Array.isArray(value)) {
    return value.map(cleanData)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, itemValue]) => itemValue !== undefined)
        .map(([key, itemValue]) => [key, cleanData(itemValue)])
    )
  }

  return value
}

export async function logPlayerEvent({
  userId,
  eventType,
  eventName,
  screenName = '',
  metadata = {}
}) {
  if (!userId || !eventName) {
    return null
  }

  const eventRef = doc(playerCollection(PLAYER_COLLECTIONS.analyticsEvents))

  await setDoc(eventRef, {
    eventId: eventRef.id,
    userId,
    eventType,
    eventName,
    screenName,
    metadata: cleanData(metadata),
    isSchema: false,
    createdAt: now()
  })

  return eventRef.id
}

export function logPlayerLogin(userId) {
  return logPlayerEvent({
    userId,
    eventType: 'auth',
    eventName: 'player_logged_in',
    screenName: 'Login'
  })
}

export function logProblemCardsSelected(userId, selectedProblemIds) {
  return logPlayerEvent({
    userId,
    eventType: 'play_journey',
    eventName: 'problem_cards_selected',
    screenName: 'Problem Selection',
    metadata: {
      selectedProblemIds,
      selectedCount: selectedProblemIds.length
    }
  })
}

export function logGameSessionStarted({
  userId,
  sessionId,
  selectedProblemStackId
}) {
  return logPlayerEvent({
    userId,
    eventType: 'play_journey',
    eventName: 'game_session_started',
    screenName: 'Play Game',
    metadata: {
      sessionId,
      selectedProblemStackId
    }
  })
}

export function logAiCardsSelected({
  userId,
  sessionId,
  problemCardId,
  selectedAiCardIds
}) {
  return logPlayerEvent({
    userId,
    eventType: 'play_journey',
    eventName: 'ai_cards_selected',
    screenName: 'Play Game',
    metadata: {
      sessionId,
      problemCardId,
      selectedAiCardIds,
      selectedCount: selectedAiCardIds.length
    }
  })
}

export function logSolutionSubmitted({
  userId,
  sessionId,
  attemptId,
  problemCardId,
  selectedAiCardIds,
  wordCount
}) {
  return logPlayerEvent({
    userId,
    eventType: 'play_journey',
    eventName: 'solution_submitted',
    screenName: 'Play Game',
    metadata: {
      sessionId,
      attemptId,
      problemCardId,
      selectedAiCardIds,
      wordCount
    }
  })
}

export function logScoreReceived({
  userId,
  sessionId,
  attemptId,
  scoreId,
  problemCardId,
  totalScore,
  glaCoinEarned
}) {
  return logPlayerEvent({
    userId,
    eventType: 'scoring',
    eventName: 'score_received',
    screenName: 'Scoring',
    metadata: {
      sessionId,
      attemptId,
      scoreId,
      problemCardId,
      totalScore,
      glaCoinEarned
    }
  })
}

export function logHintRequested({
  userId,
  sessionId,
  hintRequestId,
  problemCardId,
  cost
}) {
  return logPlayerEvent({
    userId,
    eventType: 'hint',
    eventName: 'hint_requested',
    screenName: 'Play Game',
    metadata: {
      sessionId,
      hintRequestId,
      problemCardId,
      cost
    }
  })
}

export function logCertificateUnlocked({
  userId,
  certificateId,
  averageScore,
  completedProblemCount
}) {
  return logPlayerEvent({
    userId,
    eventType: 'certificate',
    eventName: 'certificate_unlocked',
    screenName: 'Certificate',
    metadata: {
      certificateId,
      averageScore,
      completedProblemCount
    }
  })
}

export function logProfileUpdated(userId, updatedFields) {
  return logPlayerEvent({
    userId,
    eventType: 'profile',
    eventName: 'profile_updated',
    screenName: 'Player Profile',
    metadata: {
      updatedFields
    }
  })
}

export function logDashboardViewed(userId) {
  return logPlayerEvent({
    userId,
    eventType: 'dashboard',
    eventName: 'dashboard_viewed',
    screenName: 'Dashboard'
  })
}

function toSafeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function makeTitleMap(cards = []) {
  const map = {}

  cards.forEach((card) => {
    map[String(card.id)] = card.title || `Problem ${card.id}`
  })

  return map
}

function makeProblemTypeMap(cards = []) {
  const map = {}

  cards.forEach((card) => {
    map[String(card.id)] = card.problem_type || card.problemType || 'Problem'
  })

  return map
}

function getAttemptAiCardIds(attempt) {
  if (Array.isArray(attempt.selectedAiCardIds)) {
    return attempt.selectedAiCardIds.map(String)
  }

  if (Array.isArray(attempt.selectedAiCards)) {
    return attempt.selectedAiCards.map((card) =>
      String(card.id || card.aiCardId || card)
    )
  }

  return []
}

function getAttemptAiCardTitles(attempt) {
  if (Array.isArray(attempt.selectedAiCardTitles)) {
    return attempt.selectedAiCardTitles
  }

  if (Array.isArray(attempt.selectedAiCards)) {
    return attempt.selectedAiCards
      .map((card) => card.title || '')
      .filter(Boolean)
  }

  return []
}

async function getPlayerRows(collectionName, userId) {
  if (!userId) {
    return []
  }

  const rowsQuery = query(
    playerCollection(collectionName),
    where('userId', '==', userId)
  )

  const rowsSnap = await getDocs(rowsQuery)

  return rowsSnap.docs.map((rowDoc) => ({
    id: rowDoc.id,
    ...rowDoc.data()
  }))
}

function countByValue(values) {
  const countMap = {}

  values.forEach((value) => {
    if (!value) return

    countMap[value] = (countMap[value] || 0) + 1
  })

  return countMap
}

function countByArrayValues(rows, getter) {
  const countMap = {}

  rows.forEach((row) => {
    getter(row).forEach((value) => {
      if (!value) return

      countMap[value] = (countMap[value] || 0) + 1
    })
  })

  return countMap
}

function buildTopRows(countMap, labelMap = {}, labelKey = 'name') {
  return Object.entries(countMap)
    .map(([id, count]) => ({
      id,
      [labelKey]: labelMap[id] || id,
      count
    }))
    .sort((a, b) => b.count - a.count)
}

function buildCommonAiCombinations(attempts) {
  const comboMap = {}

  attempts.forEach((attempt) => {
    const ids = getAttemptAiCardIds(attempt).sort()

    if (ids.length === 0) return

    const titleValues = getAttemptAiCardTitles(attempt)
    const key = ids.join(' + ')
    const title = titleValues.length > 0 ? titleValues.join(' + ') : key

    if (!comboMap[key]) {
      comboMap[key] = {
        id: key,
        combination: title,
        count: 0
      }
    }

    comboMap[key].count += 1
  })

  return Object.values(comboMap).sort((a, b) => b.count - a.count)
}

function buildAverageScorePerProblem(scores, problemTitleMap, problemTypeMap) {
  const problemMap = {}

  scores.forEach((score) => {
    const problemId = String(score.problemCardId || score.problemId || '')

    if (!problemId) return

    if (!problemMap[problemId]) {
      problemMap[problemId] = {
        id: problemId,
        title: problemTitleMap[problemId] || `Problem ${problemId}`,
        problem_type: problemTypeMap[problemId] || 'Problem',
        total: 0,
        count: 0
      }
    }

    problemMap[problemId].total += toSafeNumber(score.totalScore)
    problemMap[problemId].count += 1
  })

  return Object.values(problemMap)
    .map((item) => ({
      ...item,
      averageScore: item.count > 0 ? Math.round(item.total / item.count) : 0
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
}

function readableRubricName(key) {
  const names = {
    ai_card_relevance: 'AI Card Relevance',
    aiCardRelevance: 'AI Card Relevance',
    combination_strength: 'Combination Strength',
    combinationStrength: 'Combination Strength',
    practical_feasibility: 'Practical Feasibility',
    practicalFeasibility: 'Practical Feasibility',
    african_context_and_feasibility: 'African Context',
    africanContextAndFeasibility: 'African Context',
    sdg_alignment: 'SDG Alignment',
    sdgAlignment: 'SDG Alignment',
    creativity_and_innovation: 'Creativity',
    creativityAndInnovation: 'Creativity',
    ethical_and_responsible_use: 'Ethics',
    ethicalAndResponsibleUse: 'Ethics'
  }

  return names[key] || key || 'Scoring Category'
}

function buildAverageScorePerCategory(subScores) {
  const categoryMap = {}

  subScores.forEach((subScore) => {
    const key = subScore.rubricKey || subScore.label || 'category'

    if (!categoryMap[key]) {
      categoryMap[key] = {
        id: key,
        name: subScore.label || readableRubricName(key),
        total: 0,
        count: 0
      }
    }

    categoryMap[key].total += toSafeNumber(subScore.score)
    categoryMap[key].count += 1
  })

  return Object.values(categoryMap)
    .map((item) => ({
      id: item.id,
      name: item.name,
      average: item.count > 0 ? Math.round(item.total / item.count) : 0,
      count: item.count
    }))
    .sort((a, b) => b.average - a.average)
}

function buildCompletionRate(scores) {
  const uniqueProblemIds = new Set(
    scores
      .map((score) => String(score.problemCardId || score.problemId || ''))
      .filter(Boolean)
  )

  return Math.min(100, Math.round((uniqueProblemIds.size / 10) * 100))
}

function buildReplayRate(attempts, certificates) {
  const hasCertificate = certificates.some(
    (certificate) => certificate.isUnlocked === true
  )

  if (!hasCertificate) {
    return 0
  }

  const replayAttempts = attempts.filter(
    (attempt) => toSafeNumber(attempt.attemptNumber, 1) > 1
  )

  return replayAttempts.length
}

export async function getPlayerAnalyticsData(userId, cards = []) {
  if (!userId) {
    return null
  }

  const [
    analyticsEvents,
    attempts,
    scores,
    subScores,
    hintRequests,
    certificates,
    selectedProblemStacks,
    gameSessions,
    coinTransactions
  ] = await Promise.all([
    getPlayerRows(PLAYER_COLLECTIONS.analyticsEvents, userId),
    getPlayerRows(PLAYER_COLLECTIONS.attempts, userId),
    getPlayerRows(PLAYER_COLLECTIONS.scores, userId),
    getPlayerRows(PLAYER_COLLECTIONS.subScores, userId),
    getPlayerRows(PLAYER_COLLECTIONS.hintRequests, userId),
    getPlayerRows(PLAYER_COLLECTIONS.certificates, userId),
    getPlayerRows(PLAYER_COLLECTIONS.selectedProblemStacks, userId),
    getPlayerRows(PLAYER_COLLECTIONS.gameSessions, userId),
    getPlayerRows(PLAYER_COLLECTIONS.glaCoinTransactions, userId)
  ])

  const problemTitleMap = makeTitleMap(cards)
  const problemTypeMap = makeProblemTypeMap(cards)

  const selectedProblemIds = selectedProblemStacks.flatMap(
    (stack) => stack.selectedProblemIds || []
  )

  const mostSelectedProblemRows = buildTopRows(
    countByValue(selectedProblemIds.map(String)),
    problemTitleMap,
    'title'
  ).map((row) => ({
    ...row,
    problem_type: problemTypeMap[row.id] || 'Problem'
  }))

  const aiCardUsageRows = buildTopRows(
    countByArrayValues(attempts, getAttemptAiCardIds),
    {},
    'aiCard'
  )

  const commonAiCombinationRows = buildCommonAiCombinations(attempts)

  const averageScorePerProblemRows = buildAverageScorePerProblem(
    scores,
    problemTitleMap,
    problemTypeMap
  )

  const categoryAverageRows = buildAverageScorePerCategory(subScores)

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (total, score) => total + toSafeNumber(score.totalScore),
            0
          ) / scores.length
        )
      : 0

  const certificateCount = certificates.filter(
    (certificate) => certificate.isUnlocked === true
  ).length

  const hintsRequested = hintRequests.length
  const completionRate = buildCompletionRate(scores)
  const replayRate = buildReplayRate(attempts, certificates)

  const totalGlaCoinEarned = coinTransactions
    .filter((transaction) => transaction.type === 'earned')
    .reduce(
      (total, transaction) => total + toSafeNumber(transaction.amount),
      0
    )

  const totalGlaCoinSpent = coinTransactions
    .filter((transaction) => transaction.type === 'spent')
    .reduce(
      (total, transaction) => total + toSafeNumber(transaction.amount),
      0
    )

  return {
    analyticsEvents,
    attempts,
    scores,
    subScores,
    hintRequests,
    certificates,
    selectedProblemStacks,
    gameSessions,
    coinTransactions,

    totalEvents: analyticsEvents.length,
    sessionsStarted: gameSessions.length,
    totalAttempts: attempts.length,
    totalScores: scores.length,
    averageScore,

    mostSelectedProblemRows,
    aiCardUsageRows,
    commonAiCombinationRows,
    averageScorePerProblemRows,
    categoryAverageRows,

    hintsRequested,
    certificateCount,
    completionRate,
    replayRate,
    totalGlaCoinEarned,
    totalGlaCoinSpent
  }
}
