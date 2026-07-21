import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, saveDocument, toNumber } from './adminDataHelpers'

function getUserId(user) {
  return cleanText(user.userId || user.uid || user.firestoreId || user.id)
}

function getName(user) {
  const fullName = cleanText(`${user.firstName || ''} ${user.lastName || ''}`)
  return fullName || cleanText(user.displayName || user.name || user.email) || 'Player'
}

function timestampToMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value.seconds) return value.seconds * 1000
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(value) {
  const millis = timestampToMillis(value)
  if (!millis) return 'Not available'
  return new Date(millis).toLocaleString()
}

function getAttemptScore(attempt) {
  return toNumber(attempt.totalScore || attempt.total_score || attempt.score || attempt.glaCoinEarned || attempt.GLA_coin_earned)
}

function getAttemptProblemId(attempt) {
  return cleanText(attempt.problemId || attempt.problemCardId || attempt.cardId)
}

function getBestProblemStats(userId, attempts) {
  const userAttempts = attempts.filter((attempt) => String(attempt.userId || attempt.playerId || attempt.uid || attempt.createdBy) === String(userId))
  const bestByProblem = {}

  userAttempts.forEach((attempt) => {
    const problemId = getAttemptProblemId(attempt)
    if (!problemId) return
    bestByProblem[problemId] = Math.max(bestByProblem[problemId] || 0, getAttemptScore(attempt))
  })

  const scores = Object.values(bestByProblem)
  const completed = scores.length
  const average = completed ? Math.round(scores.reduce((total, score) => total + score, 0) / completed) : 0

  return { attempts: userAttempts.length, completed, average }
}

export async function getAdminPlayerAnalyticsRows() {
  const [users, attempts, certificates, hintRequests, transactions] = await Promise.all([
    getRows(COLLECTIONS.users),
    getRows(COLLECTIONS.attempts),
    getRows(COLLECTIONS.certificates),
    getRows(COLLECTIONS.hintRequests),
    getRows(COLLECTIONS.glaCoinTransactions)
  ])

  return users
    .filter((user) => String(user.role || 'player').toLowerCase() !== 'admin')
    .map((user) => {
      const userId = getUserId(user)
      const calculatedStats = getBestProblemStats(userId, attempts)
      const userTransactions = transactions.filter((transaction) => String(transaction.userId || transaction.playerId || transaction.uid) === String(userId))
      const earned = userTransactions.filter((transaction) => String(transaction.type || '').toLowerCase() === 'earned').reduce((total, transaction) => total + toNumber(transaction.amount), 0)
      const spent = userTransactions.filter((transaction) => String(transaction.type || '').toLowerCase() === 'spent').reduce((total, transaction) => total + toNumber(transaction.amount), 0)
      const certificateIssued = user.certificateUnlocked || user.certificateId || certificates.some((certificate) => String(certificate.userId || certificate.playerId || certificate.ownerId) === String(userId))
      const completed = toNumber(user.completedProblemCount, calculatedStats.completed)
      const average = toNumber(user.averageScore, calculatedStats.average)

      return {
        id: userId,
        firestoreId: user.firestoreId,
        name: getName(user),
        email: cleanText(user.email),
        phone: cleanText(user.phone),
        status: cleanText(user.accountStatus) || 'active',
        completed,
        average,
        attempts: calculatedStats.attempts,
        hintsUsed: hintRequests.filter((hint) => String(hint.userId || hint.playerId || hint.uid) === String(userId)).length,
        coin: user.glaCoinBalance !== undefined ? toNumber(user.glaCoinBalance) : earned - spent,
        totalGlaCoinEarned: user.totalGlaCoinEarned !== undefined ? toNumber(user.totalGlaCoinEarned) : earned,
        totalGlaCoinSpent: user.totalGlaCoinSpent !== undefined ? toNumber(user.totalGlaCoinSpent) : spent,
        certificate: certificateIssued ? 'Issued' : 'Pending',
        lastSeen: formatDate(user.lastLoginAt || user.updatedAt || user.createdAt),
        sortDate: timestampToMillis(user.lastLoginAt || user.updatedAt || user.createdAt)
      }
    })
    .sort((a, b) => b.sortDate - a.sortDate)
}

export async function getPlayerDetailsRows() {
  return getAdminPlayerAnalyticsRows()
}

export async function updatePlayerStatus(player, accountStatus) {
  const userId = player.id || player.userId || player.firestoreId
  return saveDocument(
    COLLECTIONS.users,
    userId,
    { accountStatus, updatedAt: serverTimestamp() },
    { actionType: `player_${accountStatus}` }
  )
}

export async function updatePlayerDetails(player, updates) {
  const userId = player.id || player.userId || player.firestoreId
  return saveDocument(
    COLLECTIONS.users,
    userId,
    { ...updates, updatedAt: serverTimestamp() },
    { actionType: 'update_player_details' }
  )
}
