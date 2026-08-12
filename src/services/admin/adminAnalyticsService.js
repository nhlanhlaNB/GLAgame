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

function getDayKey(millis) {
  const date = new Date(millis)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayLabel(millis) {
  const date = new Date(millis)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function buildDailySeries(rows, dateGetter, valueGetter, days = 30) {
  const today = new Date()
  const map = {}
  const labels = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - i
    )
    const key = getDayKey(date.getTime())
    map[key] = { key, label: getDayLabel(date.getTime()), value: 0 }
    labels.push(key)
  }

  rows.forEach((row) => {
    const millis = timestampToMillis(dateGetter(row))
    if (!millis) return

    const key = getDayKey(millis)
    if (!map[key]) return

    map[key].value += toNumber(valueGetter(row))
  })

  return labels.map((key) => map[key])
}

function buildDailyAverageSeries(rows, dateGetter, scoreGetter, days = 30) {
  const today = new Date()
  const map = {}
  const labels = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - i
    )
    const key = getDayKey(date.getTime())
    map[key] = {
      key,
      label: getDayLabel(date.getTime()),
      total: 0,
      count: 0,
      average: 0
    }
    labels.push(key)
  }

  rows.forEach((row) => {
    const millis = timestampToMillis(dateGetter(row))
    if (!millis) return

    const key = getDayKey(millis)
    if (!map[key]) return

    map[key].total += toNumber(scoreGetter(row))
    map[key].count += 1
  })

  return labels.map((key) => ({
    ...map[key],
    average:
      map[key].count > 0 ? Math.round(map[key].total / map[key].count) : 0
  }))
}

function buildScoreDistribution(rows, scoreGetter) {
  const labels = [
    '0-9',
    '10-19',
    '20-29',
    '30-39',
    '40-49',
    '50-59',
    '60-69',
    '70-79',
    '80-89',
    '90-100'
  ]
  const counts = Array(10).fill(0)

  rows.forEach((row) => {
    const score = Math.max(0, Math.min(100, toNumber(scoreGetter(row))))
    counts[Math.min(9, Math.floor(score / 10))] += 1
  })

  return labels.map((range, index) => ({
    range,
    count: counts[index]
  }))
}

function buildSplit(label, value, total) {
  return {
    label,
    value: toNumber(value),
    percent:
      total > 0 ? Math.round((toNumber(value) / total) * 100) : 0
  }
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

  const attemptUsers = {}
  attempts.forEach((attempt) => {
    const userId = getAttemptUserId(attempt)
    if (!userId) return
    attemptUsers[userId] = (attemptUsers[userId] || 0) + 1
  })

  const topPlayers = playerUsers
    .map((user) => {
      const userId = getUserId(user) || user.firestoreId
      return {
        id: user.firestoreId || userId,
        name: getFullName(user),
        email: user.email || '',
        status: String(user.accountStatus || 'active'),
        completed: toNumber(user.completedProblemCount),
        average: toNumber(user.averageScore),
        best: toNumber(user.bestScore),
        coins: toNumber(user.glaCoinBalance),
        attempts: userId ? attemptUsers[userId] || 0 : 0,
        certificate:
          user.certificateUnlocked || user.certificateId ? 'Issued' : 'Pending',
        lastLogin:
          timestampToMillis(user.lastLoginAt) ||
          timestampToMillis(user.updatedAt) ||
          timestampToMillis(user.createdAt)
      }
    })
    .filter((player) => player.completed > 0 || player.attempts > 0)
    .sort(
      (a, b) =>
        b.completed - a.completed ||
        b.average - a.average ||
        b.attempts - a.attempts
    )
    .slice(0, 50)

  const playersOverTime = buildDailySeries(
    playerUsers,
    (user) => user.createdAt || user.registeredAt,
    () => 1
  )
  const attemptsOverTime = buildDailySeries(
    attempts,
    (attempt) => attempt.createdAt,
    () => 1
  )
  const hintsOverTime = buildDailySeries(
    hintRequests,
    (hint) => hint.createdAt,
    () => 1
  )
  const coinsOverTime = buildDailySeries(
    attempts,
    (attempt) => attempt.createdAt,
    (attempt) => getAttemptScore(attempt)
  )
  const averageScoreOverTime = buildDailyAverageSeries(
    attempts,
    (attempt) => attempt.createdAt,
    (attempt) => getAttemptScore(attempt)
  )

  const scoreDistribution = buildScoreDistribution(
    scoreRows,
    (row) => getAttemptScore(row)
  )

  const activeVsRegistered = [
    buildSplit('Registered', playerUsers.length, playerUsers.length),
    buildSplit('Active', activePlayers.length, playerUsers.length)
  ]

  const completionSplit = [
    buildSplit('Completed 10+', completedPlayers.length, playerUsers.length),
    buildSplit('In progress', playerUsers.length - completedPlayers.length, playerUsers.length)
  ]

  const replaySplit = [
    buildSplit('Replayed', replayUsers.size, playerUsers.length),
    buildSplit('Single play', playerUsers.length - replayUsers.size, playerUsers.length)
  ]

  const certificateSplit = [
    buildSplit('Issued', getCertificateCountFromUsers(playerUsers, certificates), playerUsers.length),
    buildSplit('Pending', Math.max(0, playerUsers.length - getCertificateCountFromUsers(playerUsers, certificates)), playerUsers.length)
  ]

  const playerStatusSplit = [
    buildSplit('Active', activePlayers.length, playerUsers.length),
    buildSplit('Inactive', playerUsers.length - activePlayers.length, playerUsers.length)
  ]

  const coinsByProblem = getAverageRows(
    scoreRows,
    (row) => getProblemId(row),
    (row) => getAttemptScore(row),
    (row) => getProblemTitle(row, problemCardsById)
  )
    .map((row) => ({
      id: row.id,
      title: row.title,
      coins: row.average,
      count: row.count
    }))
    .slice(0, 10)

  const hintsByProblem = countRows(
    hintRequests,
    (hint) => hint.problemId || hint.problemCardId || hint.cardId
  )
    .map((row) => ({
      id: row.id,
      title:
        hintRequests.find(
          (hint) =>
            String(hint.problemId || hint.problemCardId || hint.cardId) ===
            String(row.id)
        )?.problemTitle ||
        hintRequests.find(
          (hint) =>
            String(hint.problemId || hint.problemCardId || hint.cardId) ===
            String(row.id)
        )?.problemCardTitle ||
        problemCardsById[row.id]?.title ||
        `Problem ${row.id}`,
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
    averageScoreByCategory,
    trends: {
      playersOverTime,
      attemptsOverTime,
      hintsOverTime,
      coinsOverTime,
      averageScoreOverTime
    },
    distributions: {
      scoreDistribution,
      activeVsRegistered,
      completionSplit,
      replaySplit,
      certificateSplit,
      playerStatusSplit
    },
    perProblem: {
      coinsByProblem,
      hintsByProblem
    },
    topPlayers
  }
}