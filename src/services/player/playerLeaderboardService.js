import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, db, isSchemaDocument } from '../firebaseService'

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function getUserId(user) {
  return cleanText(user.userId || user.uid || user.firestoreId || user.id)
}

function getAttemptUserId(attempt) {
  return cleanText(attempt.userId || attempt.playerId || attempt.uid || attempt.createdBy)
}

function getAttemptProblemId(attempt) {
  return cleanText(attempt.problemId || attempt.problemCardId || attempt.cardId)
}

function getAttemptScore(attempt) {
  return toNumber(attempt.totalScore || attempt.total_score || attempt.score || attempt.GLA_coin_earned || attempt.glaCoinEarned)
}

function getFullName(user) {
  const firstName = cleanText(user.firstName)
  const lastName = cleanText(user.lastName)
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName
  if (user.displayName) return user.displayName
  if (user.name) return user.name
  if (user.email) return String(user.email).split('@')[0]
  return 'Player'
}

function isPlayerUser(user) {
  return String(user.role || 'player').toLowerCase() !== 'admin'
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
}

function calculateBestProblemStats(userId, attempts) {
  const userAttempts = attempts.filter((attempt) => String(getAttemptUserId(attempt)) === String(userId))
  const bestScoreByProblem = {}

  userAttempts.forEach((attempt) => {
    const problemId = getAttemptProblemId(attempt)
    if (!problemId) return
    bestScoreByProblem[problemId] = Math.max(bestScoreByProblem[problemId] || 0, getAttemptScore(attempt))
  })

  const bestScores = Object.values(bestScoreByProblem)
  const completedProblems = bestScores.length
  const averageScore = completedProblems > 0 ? Math.round(bestScores.reduce((total, score) => total + score, 0) / completedProblems) : 0
  const bestScore = bestScores.length > 0 ? Math.max(...bestScores) : 0

  return { attempts: userAttempts.length, completedProblems, averageScore, bestScore }
}

function calculateCoinStats(userId, transactions) {
  const userTransactions = transactions.filter((transaction) => String(transaction.userId) === String(userId))
  const totalEarned = userTransactions.filter((transaction) => String(transaction.type || '').toLowerCase() === 'earned').reduce((total, transaction) => total + toNumber(transaction.amount), 0)
  const totalSpent = userTransactions.filter((transaction) => String(transaction.type || '').toLowerCase() === 'spent').reduce((total, transaction) => total + toNumber(transaction.amount), 0)
  return { totalGlaCoinEarned: totalEarned, totalGlaCoinSpent: totalSpent, glaCoinBalance: totalEarned - totalSpent }
}

function calculateOverallPoints(row) {
  const certificateBonus = row.certificate === 'Issued' ? 100 : 0
  return Math.round(toNumber(row.totalGlaCoinEarned) + toNumber(row.completedProblems) * 50 + toNumber(row.averageScore) * 5 + certificateBonus)
}

async function saveLeaderboardCache(rows) {
  const now = new Date()
  const period = now.toISOString().slice(0, 10)
  const leaderboardId = `global_${period}`
  await setDoc(doc(db, COLLECTIONS.leaderboards, leaderboardId), cleanFirestoreData({
    leaderboardId,
    leaderboardType: 'global',
    period,
    rows: rows.slice(0, 100),
    rowCount: rows.length,
    updatedAt: serverTimestamp()
  }), { merge: true })
}

export async function syncCurrentPlayerLeaderboardProfile({ userId, fullName = '', averageScore = 0, completedProblems = 0, totalGlaCoinEarned = 0 }) {
  if (!userId) throw new Error('User ID is required to sync leaderboard profile.')

  await setDoc(doc(db, COLLECTIONS.users, userId), cleanFirestoreData({
    userId,
    displayName: cleanText(fullName) || 'Player',
    averageScore: toNumber(averageScore),
    completedProblemCount: toNumber(completedProblems),
    totalGlaCoinEarned: toNumber(totalGlaCoinEarned),
    leaderboardUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }), { merge: true })
}

export async function getPlayerLeaderboardRows(currentUserId = '') {
  const [users, attempts, transactions, certificates] = await Promise.all([
    getCollectionRows(COLLECTIONS.users),
    getCollectionRows(COLLECTIONS.attempts),
    getCollectionRows(COLLECTIONS.glaCoinTransactions),
    getCollectionRows(COLLECTIONS.certificates)
  ])

  const certificateUserIds = new Set(
    certificates.filter((certificate) => !isSchemaDocument(certificate)).map((certificate) => cleanText(certificate.userId || certificate.playerId || certificate.ownerId)).filter(Boolean)
  )

  const rows = users
    .filter((user) => !isSchemaDocument(user))
    .filter(isPlayerUser)
    .map((user) => {
      const userId = getUserId(user)
      const attemptStats = calculateBestProblemStats(userId, attempts)
      const coinStats = calculateCoinStats(userId, transactions)
      const completedProblems = Math.max(toNumber(user.completedProblemCount), attemptStats.completedProblems)
      const averageScore = toNumber(user.averageScore) > 0 ? toNumber(user.averageScore) : attemptStats.averageScore
      const totalGlaCoinEarned = toNumber(user.totalGlaCoinEarned) > 0 ? toNumber(user.totalGlaCoinEarned) : coinStats.totalGlaCoinEarned
      const glaCoinBalance = user.glaCoinBalance !== undefined ? toNumber(user.glaCoinBalance) : coinStats.glaCoinBalance
      const certificate = user.certificateUnlocked || user.certificateId || certificateUserIds.has(userId) ? 'Issued' : 'Pending'
      const row = {
        userId,
        name: getFullName(user),
        email: cleanText(user.email),
        completedProblems,
        averageScore,
        bestScore: Math.max(toNumber(user.bestScore), attemptStats.bestScore),
        attempts: attemptStats.attempts,
        totalGlaCoinEarned,
        totalGlaCoinSpent: coinStats.totalGlaCoinSpent,
        glaCoinBalance,
        certificate,
        isCurrentUser: String(userId) === String(currentUserId)
      }
      return { ...row, overallPoints: calculateOverallPoints(row) }
    })
    .sort((a, b) => b.overallPoints - a.overallPoints)
    .map((row, index) => ({ ...row, rank: index + 1 }))

  await saveLeaderboardCache(rows)
  return rows
}

export async function getLatestCachedLeaderboards() {
  const rows = await getCollectionRows(COLLECTIONS.leaderboards)
  return rows
    .filter((row) => !isSchemaDocument(row))
    .sort((a, b) => String(b.period || '').localeCompare(String(a.period || '')))
}
