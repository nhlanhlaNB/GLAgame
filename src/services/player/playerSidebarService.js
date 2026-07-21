import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { PLAYER_COLLECTIONS } from './playerDataService'

function toSafeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function getTimeValue(value) {
  if (!value) return 0

  if (typeof value.toMillis === 'function') {
    return value.toMillis()
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  const parsedDate = new Date(value).getTime()

  return Number.isFinite(parsedDate) ? parsedDate : 0
}

function sortNewestFirst(items) {
  return [...items].sort(
    (a, b) =>
      getTimeValue(b.updatedAt || b.createdAt || b.issuedAt) -
      getTimeValue(a.updatedAt || a.createdAt || a.issuedAt)
  )
}

function rowsFromSnapshot(snapshot) {
  return snapshot.docs.map((itemDoc) => ({
    id: itemDoc.id,
    ...itemDoc.data()
  }))
}

async function getRows(collectionName, userId) {
  if (!userId) return []

  const collectionQuery = query(
    collection(db, collectionName),
    where('userId', '==', userId)
  )

  const snapshot = await getDocs(collectionQuery)
  return rowsFromSnapshot(snapshot)
}

function getActiveStack(stacks = []) {
  const activeStacks = stacks.filter(
    (stack) => stack.isActive !== false && stack.status !== 'archived'
  )

  return sortNewestFirst(activeStacks)[0] || sortNewestFirst(stacks)[0] || null
}

function getAttemptId(attempt) {
  return attempt?.attemptId || attempt?.id || ''
}

function getAttemptProblemId(attempt) {
  return String(
    attempt?.problemCardId ||
      attempt?.problemId ||
      attempt?.problem_id ||
      ''
  )
}

function buildScoreLookup(scores = []) {
  const lookup = {}

  scores.forEach((score) => {
    const attemptId = score?.attemptId || score?.attempt_id || ''
    if (!attemptId) return
    lookup[attemptId] = score
  })

  return lookup
}

function normaliseAttemptRows(attempts = [], scores = []) {
  const scoreLookup = buildScoreLookup(scores)

  return attempts.map((attempt) => {
    const attemptId = getAttemptId(attempt)
    const matchingScore = scoreLookup[attemptId] || {}

    return {
      ...attempt,
      attemptId,
      problemId: getAttemptProblemId(attempt),
      problemTitle:
        attempt.problemCardTitle ||
        attempt.problemTitle ||
        attempt.title ||
        'Problem card',
      totalScore: toSafeNumber(
        matchingScore.totalScore ??
          matchingScore.score ??
          attempt.totalScore ??
          attempt.score
      ),
      glaCoinEarned: toSafeNumber(
        matchingScore.glaCoinEarned ??
          matchingScore.GLA_coin_earned ??
          attempt.glaCoinEarned ??
          attempt.GLA_coin_earned
      )
    }
  })
}

function getCompletedProblemSummary(attemptRows = []) {
  const bestScoresByProblem = {}

  attemptRows.forEach((attempt) => {
    const problemId = getAttemptProblemId(attempt)
    if (!problemId) return

    const currentBest = toSafeNumber(bestScoresByProblem[problemId])
    bestScoresByProblem[problemId] = Math.max(
      currentBest,
      toSafeNumber(attempt.totalScore)
    )
  })

  const bestScores = Object.values(bestScoresByProblem)
  const completedProblems = bestScores.length
  const averageScore = completedProblems > 0
    ? Math.round(bestScores.reduce((total, score) => total + score, 0) / completedProblems)
    : 0

  return {
    completedProblems,
    averageScore,
    certificationProgress: Math.min(10, completedProblems)
  }
}

function getCoinBalance(profile, transactions = []) {
  if (transactions.length === 0) {
    return toSafeNumber(profile?.glaCoinBalance)
  }

  return transactions.reduce((balance, transaction) => {
    const amount = toSafeNumber(transaction.amount)

    if (transaction.type === 'spent') {
      return balance - amount
    }

    if (transaction.type === 'earned' || transaction.type === 'bonus' || transaction.type === 'reward') {
      return balance + amount
    }

    if (transaction.balanceAfter !== undefined) {
      return toSafeNumber(transaction.balanceAfter, balance)
    }

    return balance
  }, 0)
}

function getLatestCertificate(certificates = []) {
  return sortNewestFirst(certificates)[0] || null
}

export function buildPlayerSidebarData({
  profile = null,
  selectedProblemStacks = [],
  attempts = [],
  scores = [],
  coinTransactions = [],
  certificates = []
}) {
  const activeStack = getActiveStack(selectedProblemStacks)
  const selectedProblemIds = activeStack?.selectedProblemIds || []
  const attemptRows = normaliseAttemptRows(attempts, scores)
  const completedSummary = getCompletedProblemSummary(attemptRows)
  const latestAttempt = sortNewestFirst(attemptRows)[0] || null
  const latestCertificate = getLatestCertificate(certificates)
  const glaCoinBalance = getCoinBalance(profile, coinTransactions)
  const certificateUnlocked =
    profile?.certificateUnlocked === true ||
    latestCertificate?.isUnlocked === true ||
    (completedSummary.completedProblems >= 10 && completedSummary.averageScore >= 75)

  return {
    source: 'database',
    profile,
    activeStack,
    selectedProblemIds,
    selectedProblemCount: selectedProblemIds.length,
    attempts: attemptRows,
    latestAttempt,
    coinTransactions,
    certificates,
    latestCertificate,
    glaCoinBalance,
    certificateUnlocked,
    completedProblems: completedSummary.completedProblems,
    averageScore: completedSummary.averageScore,
    certificationProgress: completedSummary.certificationProgress,
    updatedAt: new Date().toISOString()
  }
}

export async function getPlayerSidebarData(userId) {
  if (!userId) return null

  const [profileSnap, selectedProblemStacks, attempts, scores, coinTransactions, certificates] =
    await Promise.all([
      getDoc(doc(db, PLAYER_COLLECTIONS.users, userId)),
      getRows(PLAYER_COLLECTIONS.selectedProblemStacks, userId),
      getRows(PLAYER_COLLECTIONS.attempts, userId),
      getRows(PLAYER_COLLECTIONS.scores, userId),
      getRows(PLAYER_COLLECTIONS.glaCoinTransactions, userId),
      getRows(PLAYER_COLLECTIONS.certificates, userId)
    ])

  return buildPlayerSidebarData({
    profile: profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null,
    selectedProblemStacks,
    attempts,
    scores,
    coinTransactions,
    certificates
  })
}

export function subscribePlayerSidebarData(userId, onData, onError) {
  if (!userId) return () => {}

  const cache = {
    profile: null,
    selectedProblemStacks: [],
    attempts: [],
    scores: [],
    coinTransactions: [],
    certificates: []
  }

  function emit() {
    onData(buildPlayerSidebarData(cache))
  }

  const unsubscribeHandlers = [
    onSnapshot(
      doc(db, PLAYER_COLLECTIONS.users, userId),
      (snapshot) => {
        cache.profile = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
        emit()
      },
      onError
    ),
    onSnapshot(
      query(collection(db, PLAYER_COLLECTIONS.selectedProblemStacks), where('userId', '==', userId)),
      (snapshot) => {
        cache.selectedProblemStacks = rowsFromSnapshot(snapshot)
        emit()
      },
      onError
    ),
    onSnapshot(
      query(collection(db, PLAYER_COLLECTIONS.attempts), where('userId', '==', userId)),
      (snapshot) => {
        cache.attempts = rowsFromSnapshot(snapshot)
        emit()
      },
      onError
    ),
    onSnapshot(
      query(collection(db, PLAYER_COLLECTIONS.scores), where('userId', '==', userId)),
      (snapshot) => {
        cache.scores = rowsFromSnapshot(snapshot)
        emit()
      },
      onError
    ),
    onSnapshot(
      query(collection(db, PLAYER_COLLECTIONS.glaCoinTransactions), where('userId', '==', userId)),
      (snapshot) => {
        cache.coinTransactions = rowsFromSnapshot(snapshot)
        emit()
      },
      onError
    ),
    onSnapshot(
      query(collection(db, PLAYER_COLLECTIONS.certificates), where('userId', '==', userId)),
      (snapshot) => {
        cache.certificates = rowsFromSnapshot(snapshot)
        emit()
      },
      onError
    )
  ]

  return () => {
    unsubscribeHandlers.forEach((unsubscribe) => unsubscribe())
  }
}
