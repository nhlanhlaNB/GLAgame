import { collection, getDocs } from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function timestampToMillis(value) {
  if (!value) return 0

  if (typeof value.toMillis === 'function') {
    return value.toMillis()
  }

  if (value.seconds) {
    return value.seconds * 1000
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getFullName(user) {
  const firstName = String(user.firstName || '').trim()
  const lastName = String(user.lastName || '').trim()
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) return fullName
  if (user.displayName) return user.displayName
  if (user.email) return String(user.email).split('@')[0]

  return 'Player'
}

function getUserId(user) {
  return user.userId || user.uid || user.firestoreId || user.id
}

function isPlayerUser(user) {
  return String(user.role || 'player').toLowerCase() !== 'admin'
}

function isActiveUser(user) {
  const status = String(user.accountStatus || 'active').toLowerCase()
  return status === 'active'
}

function getAttemptUserId(attempt) {
  return attempt.userId || attempt.playerId || attempt.uid || attempt.createdBy
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

function getProblemId(attempt) {
  return attempt.problemId || attempt.problemCardId || attempt.cardId || ''
}

function getProblemTitle(attempt, problemCardsById) {
  const problemId = getProblemId(attempt)

  return (
    attempt.problemTitle ||
    attempt.problemCardTitle ||
    problemCardsById[problemId]?.title ||
    `Problem ${problemId || 'Unknown'}`
  )
}

function normalizeSelectedAiCards(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map((card) => {
      if (typeof card === 'object') {
        return {
          id: card.id || card.cardId || card.aiCardId || card.title,
          title: card.title || card.name || `AI Card ${card.id || ''}`
        }
      }

      return {
        id: value,
        title: String(card)
      }
    })
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title) => ({ id: title, title }))
  }

  return []
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))

  return snapshot.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    ...documentSnapshot.data()
  }))
}

function countRows(rows, keyGetter) {
  const map = {}

  rows.forEach((row) => {
    const key = keyGetter(row)
    if (!key) return

    if (!map[key]) {
      map[key] = {
        id: key,
        count: 0
      }
    }

    map[key].count += 1
  })

  return Object.values(map).sort((a, b) => b.count - a.count)
}

function getAverageRows(rows, groupGetter, scoreGetter, titleGetter) {
  const map = {}

  rows.forEach((row) => {
    const group = groupGetter(row)
    if (!group) return

    if (!map[group]) {
      map[group] = {
        id: group,
        title: titleGetter(row),
        total: 0,
        count: 0
      }
    }

    map[group].total += scoreGetter(row)
    map[group].count += 1
  })

  return Object.values(map)
    .map((row) => ({
      id: row.id,
      title: row.title,
      average: row.count > 0 ? Math.round(row.total / row.count) : 0,
      count: row.count
    }))
    .sort((a, b) => b.average - a.average)
}

function getBestScoreByUserProblem(attempts) {
  const map = {}

  attempts.forEach((attempt) => {
    const userId = getAttemptUserId(attempt)
    const problemId = getProblemId(attempt)

    if (!userId || !problemId) return

    const key = `${userId}:${problemId}`
    const score = getAttemptScore(attempt)

    map[key] = Math.max(map[key] || 0, score)
  })

  return map
}

function getCertificateCountFromUsers(users, certificates) {
  const fromUsers = users.filter(
    (user) => user.certificateUnlocked || user.certificateId
  ).length

  return Math.max(fromUsers, certificates.length)
}

export async function getAdminDashboardStats() {
  const [users, problemCards, aiCards, certificates, hintRequests] =
    await Promise.all([
      getCollectionRows(COLLECTIONS.users),
      getCollectionRows(COLLECTIONS.problemCards),
      getCollectionRows(COLLECTIONS.aiCards),
      getCollectionRows(COLLECTIONS.certificates),
      getCollectionRows(COLLECTIONS.hintRequests)
    ])

  const playerUsers = users.filter(isPlayerUser)
  const registeredPlayers = playerUsers.length
  const activePlayers = playerUsers.filter(isActiveUser).length

  const certificatesIssued = getCertificateCountFromUsers(playerUsers, certificates)

  const completedPlayers = playerUsers.filter(
    (user) => toNumber(user.completedProblemCount) >= 10
  ).length

  const completionRateValue =
    registeredPlayers > 0
      ? Math.round((completedPlayers / registeredPlayers) * 100)
      : 0

  const recentPlayers = [...playerUsers]
    .sort((a, b) => {
      const bDate =
        timestampToMillis(b.lastLoginAt) ||
        timestampToMillis(b.updatedAt) ||
        timestampToMillis(b.createdAt)

      const aDate =
        timestampToMillis(a.lastLoginAt) ||
        timestampToMillis(a.updatedAt) ||
        timestampToMillis(a.createdAt)

      return bDate - aDate
    })
    .slice(0, 4)
    .map((user) => ({
      id: user.firestoreId || getUserId(user) || user.email,
      name: getFullName(user),
      completed: toNumber(user.completedProblemCount),
      average: toNumber(user.averageScore),
      certificate:
        user.certificateUnlocked || user.certificateId ? 'Issued' : 'Pending'
    }))

  return {
    registeredPlayers,
    activePlayers,
    problemCards: problemCards.length,
    aiCards: aiCards.length,
    certificatesIssued,
    hintsRequested: hintRequests.length,
    completionRate: `${completionRateValue}%`,
    completionRateValue,
    recentPlayers
  }
}

export async function getAdminAnalyticsDashboardData() {
  const [
    users,
    problemCards,
    aiCards,
    selectedProblemStacks,
    attempts,
    scores,
    subScores,
    hintRequests,
    certificates,
    gameSessions
  ] = await Promise.all([
    getCollectionRows(COLLECTIONS.users),
    getCollectionRows(COLLECTIONS.problemCards),
    getCollectionRows(COLLECTIONS.aiCards),
    getCollectionRows(COLLECTIONS.selectedProblemStacks),
    getCollectionRows(COLLECTIONS.attempts),
    getCollectionRows(COLLECTIONS.scores),
    getCollectionRows(COLLECTIONS.subScores),
    getCollectionRows(COLLECTIONS.hintRequests),
    getCollectionRows(COLLECTIONS.certificates),
    getCollectionRows(COLLECTIONS.gameSessions)
  ])

  const playerUsers = users.filter(isPlayerUser)
  const activePlayers = playerUsers.filter(isActiveUser)

  const problemCardsById = {}
  problemCards.forEach((card) => {
    problemCardsById[card.id] = card
    problemCardsById[card.firestoreId] = card
  })

  const aiCardsById = {}
  aiCards.forEach((card) => {
    aiCardsById[card.id] = card
    aiCardsById[card.firestoreId] = card
  })

  const completedPlayers = playerUsers.filter(
    (user) => toNumber(user.completedProblemCount) >= 10
  )

  const replayUsers = new Set()
  const seenUserProblem = new Set()

  attempts.forEach((attempt) => {
    const userProblemKey = `${getAttemptUserId(attempt)}:${getProblemId(attempt)}`

    if (seenUserProblem.has(userProblemKey)) {
      replayUsers.add(getAttemptUserId(attempt))
    }

    seenUserProblem.add(userProblemKey)
  })

  const completionRateValue =
    playerUsers.length > 0
      ? Math.round((completedPlayers.length / playerUsers.length) * 100)
      : 0

  const replayRateValue =
    playerUsers.length > 0
      ? Math.round((replayUsers.size / playerUsers.length) * 100)
      : 0

  const selectedProblemRows = []

  selectedProblemStacks.forEach((stack) => {
    const selectedIds =
      stack.problemIds ||
      stack.selectedProblemIds ||
      stack.cards ||
      stack.problemCards ||
      []

    if (Array.isArray(selectedIds)) {
      selectedIds.forEach((problemId) => {
        selectedProblemRows.push({
          problemId,
          title: problemCardsById[problemId]?.title || `Problem ${problemId}`
        })
      })
    }
  })

  attempts.forEach((attempt) => {
    const problemId = getProblemId(attempt)

    if (problemId) {
      selectedProblemRows.push({
        problemId,
        title: getProblemTitle(attempt, problemCardsById)
      })
    }
  })

  const mostSelectedProblems = countRows(
    selectedProblemRows,
    (row) => row.problemId
  )
    .map((row) => ({
      id: row.id,
      title:
        selectedProblemRows.find((item) => String(item.problemId) === String(row.id))
          ?.title || `Problem ${row.id}`,
      count: row.count
    }))
    .slice(0, 10)

  const aiCardUsageRows = []

  attempts.forEach((attempt) => {
    const selectedAiCards = normalizeSelectedAiCards(
      attempt.selectedAiCards || attempt.aiCards || attempt.selectedSolution
    )

    selectedAiCards.forEach((aiCard) => {
      aiCardUsageRows.push({
        id: aiCard.id,
        title: aiCardsById[aiCard.id]?.title || aiCard.title || `AI Card ${aiCard.id}`
      })
    })
  })

  const mostUsedAiCards = countRows(aiCardUsageRows, (row) => row.id)
    .map((row) => ({
      id: row.id,
      title:
        aiCardUsageRows.find((item) => String(item.id) === String(row.id))?.title ||
        `AI Card ${row.id}`,
      count: row.count
    }))
    .slice(0, 10)

  const combinationRows = attempts
    .map((attempt) => {
      const selectedAiCards = normalizeSelectedAiCards(
        attempt.selectedAiCards || attempt.aiCards || attempt.selectedSolution
      )

      if (selectedAiCards.length < 2) return null

      const combination = selectedAiCards
        .map((card) => card.title)
        .sort()
        .join(' + ')

      return {
        combination
      }
    })
    .filter(Boolean)

  const commonCombinations = countRows(
    combinationRows,
    (row) => row.combination
  )
    .map((row) => ({
      id: row.id,
      combination: row.id,
      count: row.count
    }))
    .slice(0, 10)

  const scoreRows = scores.length > 0 ? scores : attempts

  const averageScoreByProblem = getAverageRows(
    scoreRows,
    (row) => getProblemId(row),
    (row) => getAttemptScore(row),
    (row) => getProblemTitle(row, problemCardsById)
  ).slice(0, 10)

  const subScoreRows = []

  subScores.forEach((subScore) => {
    subScoreRows.push({
      category: subScore.category || subScore.categoryName || subScore.label,
      score: toNumber(subScore.score || subScore.value || subScore.average)
    })
  })

  attempts.forEach((attempt) => {
    const attemptSubScores = attempt.subScores || attempt.sub_scores || {}

    Object.entries(attemptSubScores).forEach(([category, score]) => {
      if (typeof score === 'object') {
        subScoreRows.push({
          category,
          score: toNumber(score.score || score.value || score.total)
        })
        return
      }

      subScoreRows.push({
        category,
        score: toNumber(score)
      })
    })
  })

  const averageScoreByCategory = getAverageRows(
    subScoreRows,
    (row) => row.category,
    (row) => row.score,
    (row) => row.category
  )
    .map((row) => ({
      id: row.id,
      category: row.title,
      average: row.average,
      count: row.count
    }))
    .slice(0, 10)

  return {
    metrics: {
      registeredPlayers: playerUsers.length,
      activePlayers: activePlayers.length,
      hintsRequested: hintRequests.length,
      certificatesIssued: getCertificateCountFromUsers(playerUsers, certificates),
      completionRate: `${completionRateValue}%`,
      completionRateValue,
      replayRate: `${replayRateValue}%`,
      replayRateValue,
      gameSessions: gameSessions.length,
      attempts: attempts.length
    },
    mostSelectedProblems,
    mostUsedAiCards,
    commonCombinations,
    averageScoreByProblem,
    averageScoreByCategory
  }
}