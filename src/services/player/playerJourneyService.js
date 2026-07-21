import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import {
  PLAYER_COLLECTIONS,
  getUserRef,
  now,
  playerCollection,
  playerDoc
} from './playerDataService'
import {
  logAiCardsSelected,
  logGameSessionStarted,
  logHintRequested,
  logProblemCardsSelected,
  logScoreReceived,
  logSolutionSubmitted
} from './playerAnalyticsService'
import {
  updatePlayerActiveSession,
  updatePlayerCurrentProblemStack,
  updatePlayerProgressSummary
} from './playerProfileService'

function cleanData(value) {
  if (Array.isArray(value)) {
    return value.map(cleanData)
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date || (value.constructor && value.constructor.name !== 'Object')) {
      return value
    }

    return Object.fromEntries(
      Object.entries(value)
        .filter(([, itemValue]) => itemValue !== undefined)
        .map(([key, itemValue]) => [key, cleanData(itemValue)])
    )
  }

  return value
}

function toSafeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function getSelectedAiCardIds(selectedAiCards = []) {
  return selectedAiCards.map((card) => card.id || card.aiCardId || card)
}

function getSelectedAiCardTitles(selectedAiCards = []) {
  return selectedAiCards.map((card) => card.title || '').filter(Boolean)
}

function normaliseScoreResult(scoreResult = {}) {
  const totalScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        toSafeNumber(
          scoreResult.totalScore ||
            scoreResult.total_score ||
            scoreResult.score ||
            scoreResult.GLA_coin_earned ||
            0
        )
      )
    )
  )

  return {
    totalScore,
    glaCoinEarned: toSafeNumber(
      scoreResult.glaCoinEarned ||
        scoreResult.GLA_coin_earned ||
        scoreResult.gla_coin_earned ||
        totalScore
    ),
    overallFeedback:
      scoreResult.overallFeedback ||
      scoreResult.feedback?.overall ||
      (typeof scoreResult.feedback === 'string' ? scoreResult.feedback : '') ||
      'Your solution has been scored.',
    improvementSuggestion:
      scoreResult.improvementSuggestion ||
      scoreResult.improvement ||
      scoreResult.feedback?.improvement ||
      'Add more practical detail to strengthen your solution.',
    subScores: scoreResult.subScores || scoreResult.sub_scores || {},
    areaFeedback: scoreResult.areaFeedback || scoreResult.feedback_by_area || scoreResult.area_feedback || scoreResult.feedback?.by_area || {},
    certificationTrackable: scoreResult.certificationTrackable ?? scoreResult.certification_trackable ?? totalScore >= 50
  }
}

export async function getActiveProblemCards() {
  const cardsQuery = query(
    playerCollection(PLAYER_COLLECTIONS.problemCards),
    where('isActive', '==', true)
  )

  const cardsSnap = await getDocs(cardsQuery)

  return cardsSnap.docs
    .map((cardDoc) => ({
      id: cardDoc.id,
      ...cardDoc.data()
    }))
    .sort((a, b) => Number(a.id) - Number(b.id))
}

export async function getActiveAiCards() {
  const cardsQuery = query(
    playerCollection(PLAYER_COLLECTIONS.aiCards),
    where('isActive', '==', true)
  )

  const cardsSnap = await getDocs(cardsQuery)

  return cardsSnap.docs
    .map((cardDoc) => ({
      id: cardDoc.id,
      ...cardDoc.data()
    }))
    .sort((a, b) => Number(a.id) - Number(b.id))
}

export async function createSelectedProblemStack({
  userId,
  selectedProblemIds,
  stackName = 'Active Problem Stack'
}) {
  if (!userId) {
    throw new Error('User ID is required to create a problem stack.')
  }

  if (!selectedProblemIds || selectedProblemIds.length < 10) {
    throw new Error('At least 10 problem cards must be selected.')
  }

  const stackRef = await addDoc(
    playerCollection(PLAYER_COLLECTIONS.selectedProblemStacks),
    cleanData({
      userId,
      stackName,
      selectedProblemIds,
      selectedCount: selectedProblemIds.length,
      status: 'active',
      isActive: true,
      isSchema: false,
      createdAt: now(),
      updatedAt: now()
    })
  )

  await updateDoc(stackRef, {
    selectedProblemStackId: stackRef.id
  })

  await updatePlayerCurrentProblemStack(userId, stackRef.id)
  await logProblemCardsSelected(userId, selectedProblemIds)

  return stackRef.id
}

export async function getCurrentProblemStack(userId) {
  if (!userId) {
    return null
  }

  const userSnap = await getDoc(getUserRef(userId))

  if (!userSnap.exists()) {
    return null
  }

  const currentProblemStackId = userSnap.data().currentProblemStackId

  if (!currentProblemStackId) {
    return null
  }

  const stackSnap = await getDoc(
    playerDoc(PLAYER_COLLECTIONS.selectedProblemStacks, currentProblemStackId)
  )

  if (!stackSnap.exists()) {
    return null
  }

  return {
    id: stackSnap.id,
    ...stackSnap.data()
  }
}

export async function startGameSession({
  userId,
  selectedProblemStackId,
  selectedProblemIds = []
}) {
  if (!userId) {
    throw new Error('User ID is required to start a game session.')
  }

  if (!selectedProblemStackId) {
    throw new Error('Selected problem stack ID is required.')
  }

  const sessionRef = await addDoc(
    playerCollection(PLAYER_COLLECTIONS.gameSessions),
    cleanData({
      userId,
      selectedProblemStackId,
      selectedProblemIds,
      status: 'active',
      completedProblemCount: 0,
      currentProblemCardId: '',
      isSchema: false,
      startedAt: now(),
      updatedAt: now()
    })
  )

  await updateDoc(sessionRef, {
    sessionId: sessionRef.id
  })

  await updatePlayerActiveSession(userId, sessionRef.id)

  await logGameSessionStarted({
    userId,
    sessionId: sessionRef.id,
    selectedProblemStackId
  })

  return sessionRef.id
}

export async function getActiveGameSession(userId) {
  if (!userId) {
    return null
  }

  const userSnap = await getDoc(getUserRef(userId))

  if (!userSnap.exists()) {
    return null
  }

  const activeSessionId = userSnap.data().activeSessionId

  if (!activeSessionId) {
    return null
  }

  const sessionSnap = await getDoc(
    playerDoc(PLAYER_COLLECTIONS.gameSessions, activeSessionId)
  )

  if (!sessionSnap.exists()) {
    return null
  }

  return {
    id: sessionSnap.id,
    ...sessionSnap.data()
  }
}

export async function updateCurrentProblemCard(sessionId, problemCardId) {
  if (!sessionId) {
    throw new Error('Session ID is required to update current problem card.')
  }

  await updateDoc(playerDoc(PLAYER_COLLECTIONS.gameSessions, sessionId), {
    currentProblemCardId: problemCardId,
    updatedAt: now()
  })

  return problemCardId
}

export async function saveAttemptWithScoring({
  userId,
  sessionId,
  problemCard,
  selectedAiCards,
  explanation,
  scoreResult,
  deepSeekRawResponse = null
}) {
  if (!userId) {
    throw new Error('User ID is required to save attempt.')
  }

  if (!sessionId) {
    throw new Error('Session ID is required to save attempt.')
  }

  if (!problemCard?.id) {
    throw new Error('Problem card is required to save attempt.')
  }

  if (!selectedAiCards || selectedAiCards.length === 0) {
    throw new Error('At least one AI card is required to save attempt.')
  }

  const selectedAiCardIds = getSelectedAiCardIds(selectedAiCards)
  const selectedAiCardTitles = getSelectedAiCardTitles(selectedAiCards)
  const normalisedResult = normaliseScoreResult(scoreResult)
  const problemCardId = String(problemCard.id)

  const previousAttemptsQuery = query(
    playerCollection(PLAYER_COLLECTIONS.attempts),
    where('userId', '==', userId),
    where('problemCardId', '==', problemCardId)
  )

  const userRef = getUserRef(userId)
  const [previousAttemptsSnap, userSnapBeforeReward] = await Promise.all([
    getDocs(previousAttemptsQuery),
    getDoc(userRef)
  ])

  const attemptNumber = previousAttemptsSnap.size + 1
  const currentBalance = userSnapBeforeReward.exists()
    ? toSafeNumber(userSnapBeforeReward.data().glaCoinBalance)
    : 0
  const currentTotalEarned = userSnapBeforeReward.exists()
    ? toSafeNumber(userSnapBeforeReward.data().totalGlaCoinEarned)
    : 0
  const balanceAfter = currentBalance + normalisedResult.glaCoinEarned

  const attemptRef = doc(playerCollection(PLAYER_COLLECTIONS.attempts))
  const evaluationRef = doc(playerCollection(PLAYER_COLLECTIONS.deepSeekEvaluations))
  const scoreRef = doc(playerCollection(PLAYER_COLLECTIONS.scores))
  const feedbackRef = doc(playerCollection(PLAYER_COLLECTIONS.feedback))
  const transactionRef = doc(playerCollection(PLAYER_COLLECTIONS.glaCoinTransactions))
  const batch = writeBatch(playerCollection(PLAYER_COLLECTIONS.attempts).firestore)
  const timestamp = now()

  batch.set(attemptRef, cleanData({
    attemptId: attemptRef.id,
    userId,
    sessionId,
    problemCardId,
    problemCardTitle: problemCard.title,
    selectedAiCardIds,
    selectedAiCardTitles,
    explanation,
    wordCount: explanation.trim().split(/\s+/).filter(Boolean).length,
    attemptNumber,
    totalScore: normalisedResult.totalScore,
    glaCoinEarned: normalisedResult.glaCoinEarned,
    subScores: normalisedResult.subScores,
    areaFeedback: normalisedResult.areaFeedback,
    overallFeedback: normalisedResult.overallFeedback,
    improvementSuggestion: normalisedResult.improvementSuggestion,
    certificationTrackable: normalisedResult.certificationTrackable,
    status: 'scored',
    isSchema: false,
    createdAt: timestamp,
    updatedAt: timestamp
  }))

  batch.set(evaluationRef, cleanData({
    evaluationId: evaluationRef.id,
    userId,
    sessionId,
    attemptId: attemptRef.id,
    problemCardId,
    requestPayload: {
      problemCard,
      selectedAiCards,
      explanation
    },
    responsePayload: deepSeekRawResponse || scoreResult,
    status: 'completed',
    isSchema: false,
    createdAt: timestamp
  }))

  batch.set(scoreRef, cleanData({
    scoreId: scoreRef.id,
    userId,
    sessionId,
    attemptId: attemptRef.id,
    evaluationId: evaluationRef.id,
    problemCardId,
    rubricId: 'default',
    totalScore: normalisedResult.totalScore,
    glaCoinEarned: normalisedResult.glaCoinEarned,
    isBestScore: false,
    isSchema: false,
    createdAt: timestamp
  }))

  Object.entries(normalisedResult.subScores).forEach(([rubricKey, score]) => {
    const subScoreRef = doc(playerCollection(PLAYER_COLLECTIONS.subScores))
    batch.set(subScoreRef, cleanData({
      subScoreId: subScoreRef.id,
      userId,
      sessionId,
      attemptId: attemptRef.id,
      scoreId: scoreRef.id,
      rubricKey,
      score: toSafeNumber(score),
      maxScore: {
        ai_card_relevance: 20,
        combination_strength: 15,
        practical_feasibility: 15,
        african_context_and_feasibility: 15,
        sdg_alignment: 15,
        creativity_and_innovation: 10,
        ethical_and_responsible_use: 10
      }[rubricKey] || 0,
      feedback: normalisedResult.areaFeedback?.[rubricKey] || '',
      isSchema: false,
      createdAt: timestamp
    }))
  })

  batch.set(feedbackRef, cleanData({
    feedbackId: feedbackRef.id,
    userId,
    sessionId,
    attemptId: attemptRef.id,
    scoreId: scoreRef.id,
    problemCardId,
    overallFeedback: normalisedResult.overallFeedback,
    improvementSuggestion: normalisedResult.improvementSuggestion,
    areaFeedback: normalisedResult.areaFeedback,
    certificationTrackable: normalisedResult.certificationTrackable,
    isSchema: false,
    createdAt: timestamp
  }))

  batch.set(transactionRef, cleanData({
    transactionId: transactionRef.id,
    userId,
    type: 'earned',
    amount: normalisedResult.glaCoinEarned,
    balanceBefore: currentBalance,
    balanceAfter,
    reason: 'problem_score',
    relatedAttemptId: attemptRef.id,
    relatedHintRequestId: '',
    problemCardId,
    sessionId,
    isSchema: false,
    createdAt: timestamp
  }))

  batch.set(userRef, {
    glaCoinBalance: balanceAfter,
    totalGlaCoinEarned: currentTotalEarned + normalisedResult.glaCoinEarned,
    updatedAt: timestamp
  }, { merge: true })

  batch.set(playerDoc(PLAYER_COLLECTIONS.gameSessions, sessionId), {
    completedProblemCount: increment(1),
    updatedAt: timestamp
  }, { merge: true })

  await batch.commit()

  Promise.allSettled([
    logSolutionSubmitted({
      userId,
      sessionId,
      attemptId: attemptRef.id,
      problemCardId,
      selectedAiCardIds,
      wordCount: explanation.trim().split(/\s+/).filter(Boolean).length
    }),
    logScoreReceived({
      userId,
      sessionId,
      attemptId: attemptRef.id,
      scoreId: scoreRef.id,
      problemCardId,
      totalScore: normalisedResult.totalScore,
      glaCoinEarned: normalisedResult.glaCoinEarned
    })
  ]).catch((error) => {
    console.error('Could not write scoring analytics in the background.', error)
  })

  return {
    attemptId: attemptRef.id,
    evaluationId: evaluationRef.id,
    scoreId: scoreRef.id,
    feedbackId: feedbackRef.id,
    transactionId: transactionRef.id,
    balanceAfter,
    totalScore: normalisedResult.totalScore,
    glaCoinEarned: normalisedResult.glaCoinEarned,
    overallFeedback: normalisedResult.overallFeedback,
    improvementSuggestion: normalisedResult.improvementSuggestion,
    subScores: normalisedResult.subScores,
    areaFeedback: normalisedResult.areaFeedback,
    certificationTrackable: normalisedResult.certificationTrackable
  }
}

export async function requestPlayerHint({
  userId,
  sessionId,
  problemCardId,
  problemTitle = '',
  attemptId = '',
  hintText
}) {
  if (!userId) {
    throw new Error('User ID is required to request a hint.')
  }

  const userRef = getUserRef(userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error('Player profile was not found.')
  }

  const userData = userSnap.data()
  const currentBalance = toSafeNumber(userData.glaCoinBalance)

  if (currentBalance < 20) {
    throw new Error('You need at least 20 GLA coin to request a hint.')
  }

  const balanceAfter = currentBalance - 20

  const hintRef = await addDoc(
    playerCollection(PLAYER_COLLECTIONS.hintRequests),
    cleanData({
      hintRequestId: '',
      userId,
      sessionId,
      problemCardId,
      problemTitle,
      attemptId,
      hintText,
      cost: 20,
      glaCoinBalanceBefore: currentBalance,
      glaCoinBalanceAfter: balanceAfter,
      status: 'used',
      isSchema: false,
      createdAt: now()
    })
  )

  await updateDoc(hintRef, {
    hintRequestId: hintRef.id
  })

  const transactionRef = await addDoc(
    playerCollection(PLAYER_COLLECTIONS.glaCoinTransactions),
    cleanData({
      transactionId: '',
      userId,
      type: 'spent',
      amount: 20,
      reason: 'hint_used',
      relatedAttemptId: attemptId,
      relatedHintRequestId: hintRef.id,
      sessionId,
      problemCardId,
      problemTitle,
      balanceBefore: currentBalance,
      balanceAfter,
      isSchema: false,
      createdAt: now()
    })
  )

  await updateDoc(transactionRef, {
    transactionId: transactionRef.id
  })

  await updateDoc(userRef, {
    glaCoinBalance: increment(-20),
    totalGlaCoinSpent: increment(20),
    totalHintsUsed: increment(1),
    updatedAt: now()
  })

  await logHintRequested({
    userId,
    sessionId,
    hintRequestId: hintRef.id,
    problemCardId,
    cost: 20
  })

  return {
    hintRequestId: hintRef.id,
    transactionId: transactionRef.id,
    hintText,
    balanceAfter
  }
}

export async function completeGameSession(userId, sessionId) {
  if (!userId || !sessionId) {
    throw new Error('User ID and session ID are required to complete session.')
  }

  await updateDoc(playerDoc(PLAYER_COLLECTIONS.gameSessions, sessionId), {
    status: 'completed',
    endedAt: now(),
    updatedAt: now()
  })

  await updatePlayerActiveSession(userId, '')

  return sessionId
}

export async function refreshPlayerProgressFromAttempts(userId) {
  if (!userId) {
    return null
  }

  const scoresQuery = query(
    playerCollection(PLAYER_COLLECTIONS.scores),
    where('userId', '==', userId)
  )

  const scoresSnap = await getDocs(scoresQuery)

  const bestScoresByProblem = {}

  scoresSnap.docs.forEach((scoreDoc) => {
    const scoreData = scoreDoc.data()
    const problemCardId = scoreData.problemCardId
    const totalScore = toSafeNumber(scoreData.totalScore)

    if (!bestScoresByProblem[problemCardId]) {
      bestScoresByProblem[problemCardId] = totalScore
      return
    }

    bestScoresByProblem[problemCardId] = Math.max(
      bestScoresByProblem[problemCardId],
      totalScore
    )
  })

  const scoreValues = Object.values(bestScoresByProblem)
  const completedProblemCount = scoreValues.length
  const averageScore =
    completedProblemCount > 0
      ? Math.round(
          scoreValues.reduce((total, score) => total + score, 0) /
            completedProblemCount
        )
      : 0
  const bestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0

  return updatePlayerProgressSummary(userId, {
    completedProblemCount,
    averageScore,
    bestScore
  })
}