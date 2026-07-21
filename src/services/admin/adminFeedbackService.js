import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, saveDocument } from './adminDataHelpers'

export async function getFeedbackInboxRows() {
  const [feedback, userFeedback] = await Promise.all([getRows(COLLECTIONS.feedback), getRows(COLLECTIONS.userFeedback)])
  return [
    ...feedback.map((row) => ({ ...row, inboxSource: COLLECTIONS.feedback })),
    ...userFeedback.map((row) => ({ ...row, inboxSource: COLLECTIONS.userFeedback }))
  ].sort((a, b) => String(b.createdAt?.seconds || 0).localeCompare(String(a.createdAt?.seconds || 0)))
}

export async function updateFeedbackStatus(row, status, adminReply = '') {
  const collectionName = row.inboxSource || COLLECTIONS.feedback
  const documentId = row.firestoreId || row.feedbackId
  return saveDocument(collectionName, documentId, {
    ...row,
    feedbackStatus: cleanText(status),
    adminReply: cleanText(adminReply),
    reviewedAt: serverTimestamp()
  }, { actionType: `feedback_${status}` })
}
