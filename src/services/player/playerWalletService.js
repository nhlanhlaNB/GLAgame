import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function isSchemaDocument(row) {
  const id = cleanText(row.firestoreId || row.id || row.transactionId).toLowerCase()

  return (
    id === '__schema' ||
    id === 'schema' ||
    id.includes('__schema') ||
    id.includes('sample')
  )
}

function safeDocumentId(value) {
  return cleanText(value)
    .replace(/[\/\\#?]/g, '_')
    .replace(/\s+/g, '_')
}

function extractMillisFromId(value) {
  const match = cleanText(value).match(/(\d{10,})/)
  if (!match) return 0

  const number = Number(match[1])
  return Number.isFinite(number) ? number : 0
}

function parseDateMillis(value, fallbackId = '') {
  if (!value) return extractMillisFromId(fallbackId) || Date.now()

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

  if (Number.isFinite(parsed)) {
    return parsed
  }

  return extractMillisFromId(fallbackId) || Date.now()
}

function formatDateFromMillis(value) {
  const millis = toNumber(value)

  if (!millis) return 'Not available'

  return new Date(millis).toLocaleString()
}

function normaliseTransaction(transaction, index = 0, userId = '') {
  const transactionId = safeDocumentId(
    transaction.transactionId ||
      transaction.id ||
      `${transaction.type || 'transaction'}_${index}_${Date.now()}`
  )

  const type = cleanText(transaction.type).toLowerCase() === 'spent' ? 'spent' : 'earned'
  const amount = Math.abs(toNumber(transaction.amount))
  const createdAtMillis = parseDateMillis(
    transaction.createdAtMillis || transaction.createdAt,
    transactionId
  )

  return {
    transactionId,
    userId: cleanText(transaction.userId || userId),
    type,
    amount,
    balanceAfter: toNumber(transaction.balanceAfter),
    reason: cleanText(transaction.reason) || (type === 'spent' ? 'GLA coin spent' : 'GLA coin earned'),
    problemId: cleanText(transaction.problemId),
    problemTitle: cleanText(transaction.problemTitle) || 'General',
    createdAtText: cleanText(transaction.createdAtText || transaction.createdAt) || formatDateFromMillis(createdAtMillis),
    createdAtMillis,
    source: cleanText(transaction.source) || 'player-game'
  }
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))

  return snapshot.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    ...documentSnapshot.data()
  }))
}

export function calculateWalletSummary(transactions = []) {
  const earned = transactions
    .filter((transaction) => transaction.type === 'earned')
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0)

  const spent = transactions
    .filter((transaction) => transaction.type === 'spent')
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0)

  return {
    totalGlaCoinEarned: earned,
    totalGlaCoinSpent: spent,
    glaCoinBalance: earned - spent,
    transactionCount: transactions.length,
    earnedCount: transactions.filter((transaction) => transaction.type === 'earned').length,
    spentCount: transactions.filter((transaction) => transaction.type === 'spent').length
  }
}

export async function getPlayerCoinTransactions(userId) {
  if (!userId) return []

  const rows = await getCollectionRows(COLLECTIONS.glaCoinTransactions)

  return rows
    .filter((row) => {
      if (isSchemaDocument(row)) return false
      return String(row.userId) === String(userId)
    })
    .map((row, index) => normaliseTransaction(row, index, userId))
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis)
}

export async function syncPlayerWallet({
  userId,
  localTransactions = [],
  glaCoinBalance = 0,
  totalGlaCoinEarned = 0,
  totalGlaCoinSpent = 0
}) {
  if (!userId) {
    throw new Error('User ID is required to sync GLA coin wallet.')
  }

  const safeLocalTransactions = localTransactions.map((transaction, index) =>
    normaliseTransaction(transaction, index, userId)
  )

  await Promise.all(
    safeLocalTransactions.map((transaction) =>
      setDoc(
        doc(
          db,
          COLLECTIONS.glaCoinTransactions,
          `${userId}_${transaction.transactionId}`
        ),
        {
          ...transaction,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    )
  )

  const firestoreTransactions = await getPlayerCoinTransactions(userId)

  const mergedMap = {}

  firestoreTransactions.forEach((transaction) => {
    mergedMap[transaction.transactionId] = transaction
  })

  safeLocalTransactions.forEach((transaction) => {
    mergedMap[transaction.transactionId] = transaction
  })

  const mergedTransactions = Object.values(mergedMap).sort(
    (a, b) => b.createdAtMillis - a.createdAtMillis
  )

  const calculatedSummary = calculateWalletSummary(mergedTransactions)

  const walletSummary = {
    glaCoinBalance:
      mergedTransactions.length > 0
        ? calculatedSummary.glaCoinBalance
        : toNumber(glaCoinBalance),
    totalGlaCoinEarned:
      mergedTransactions.length > 0
        ? calculatedSummary.totalGlaCoinEarned
        : toNumber(totalGlaCoinEarned),
    totalGlaCoinSpent:
      mergedTransactions.length > 0
        ? calculatedSummary.totalGlaCoinSpent
        : toNumber(totalGlaCoinSpent),
    transactionCount: mergedTransactions.length,
    earnedCount: calculatedSummary.earnedCount,
    spentCount: calculatedSummary.spentCount
  }

  await setDoc(
    doc(db, COLLECTIONS.users, userId),
    {
      ...walletSummary,
      walletUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )

  return {
    transactions: mergedTransactions,
    summary: walletSummary
  }
}