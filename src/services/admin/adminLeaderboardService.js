import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, saveDocument, toNumber } from './adminDataHelpers'

function getUserId(user) { return cleanText(user.userId || user.uid || user.firestoreId || user.id) }
function getName(user) { return cleanText(`${user.firstName || ''} ${user.lastName || ''}`) || cleanText(user.displayName || user.name || user.email) || 'Player' }

export async function getAdminLeaderboardRows() {
  const [users, transactions, attempts, certificates] = await Promise.all([
    getRows(COLLECTIONS.users), getRows(COLLECTIONS.glaCoinTransactions), getRows(COLLECTIONS.attempts), getRows(COLLECTIONS.certificates)
  ])
  const certificateUsers = new Set(certificates.map((c) => cleanText(c.userId || c.playerId || c.ownerId)).filter(Boolean))
  const rows = users.filter((u) => String(u.role || 'player').toLowerCase() !== 'admin').map((user) => {
    const userId = getUserId(user)
    const userAttempts = attempts.filter((attempt) => String(attempt.userId || attempt.playerId || attempt.uid) === String(userId))
    const earned = transactions.filter((t) => String(t.userId) === String(userId) && String(t.type).toLowerCase() === 'earned').reduce((total, t) => total + toNumber(t.amount), 0)
    const completed = Math.max(toNumber(user.completedProblemCount), new Set(userAttempts.map((a) => a.problemId || a.problemCardId || a.cardId).filter(Boolean)).size)
    const average = toNumber(user.averageScore)
    const certificate = user.certificateUnlocked || user.certificateId || certificateUsers.has(userId) ? 'Issued' : 'Pending'
    const overallPoints = Math.round(earned + completed * 50 + average * 5 + (certificate === 'Issued' ? 100 : 0))
    return { userId, name: getName(user), email: cleanText(user.email), completed, average, earned, certificate, overallPoints }
  })
  return rows.sort((a, b) => b.overallPoints - a.overallPoints).map((row, index) => ({ ...row, rank: index + 1 }))
}

export async function saveLeaderboardSnapshot(rows, title = 'Leaderboard snapshot') {
  const snapshotId = `leaderboard_${Date.now()}`
  return saveDocument(COLLECTIONS.leaderboards, snapshotId, {
    leaderboardId: snapshotId,
    title,
    rowCount: rows.length,
    rows,
    createdAt: serverTimestamp()
  }, { actionType: 'save_leaderboard_snapshot' })
}
