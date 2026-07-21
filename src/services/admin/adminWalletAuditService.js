import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, db } from '../firebaseService'
import { cleanText, getRows, makeSafeId, saveDocument, toNumber } from './adminDataHelpers'
import { logAdminAction } from './adminActivityLogService'

export async function getWalletAuditData() {
  const [users, transactions, adjustments] = await Promise.all([
    getRows(COLLECTIONS.users), getRows(COLLECTIONS.glaCoinTransactions), getRows(COLLECTIONS.walletAdjustments)
  ])
  const playerUsers = users.filter((user) => String(user.role || 'player').toLowerCase() !== 'admin')
  return { users: playerUsers, transactions, adjustments }
}

export async function createWalletAdjustment({ userId, amount, type = 'earned', reason = '', adminEmail = 'admin@gritlabafrica.org' }) {
  if (!userId) throw new Error('Select a player first.')
  const absoluteAmount = Math.abs(toNumber(amount))
  if (absoluteAmount <= 0) throw new Error('Amount must be greater than 0.')
  const cleanType = String(type).toLowerCase() === 'spent' ? 'spent' : 'earned'
  const transactionId = `${userId}_admin_${Date.now()}`
  const signedAmount = cleanType === 'spent' ? -absoluteAmount : absoluteAmount

  const transaction = {
    transactionId,
    userId,
    type: cleanType,
    amount: absoluteAmount,
    reason: cleanText(reason) || 'Admin wallet adjustment',
    source: 'admin-adjustment',
    adminEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTIONS.glaCoinTransactions, transactionId), cleanFirestoreData(transaction), { merge: true })
  await setDoc(doc(db, COLLECTIONS.users, userId), cleanFirestoreData({
    glaCoinBalance: increment(signedAmount),
    totalGlaCoinEarned: cleanType === 'earned' ? increment(absoluteAmount) : increment(0),
    totalGlaCoinSpent: cleanType === 'spent' ? increment(absoluteAmount) : increment(0),
    walletUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }), { merge: true })

  await saveDocument(COLLECTIONS.walletAdjustments, makeSafeId(transactionId), transaction, { actionType: 'wallet_adjustment' })
  await logAdminAction({ actionType: 'wallet_adjustment', collectionName: COLLECTIONS.glaCoinTransactions, documentId: transactionId, after: transaction })
  return transaction
}
