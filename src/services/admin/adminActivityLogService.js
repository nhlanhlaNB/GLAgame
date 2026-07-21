import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, cleanText, db } from '../firebaseService'

export async function logAdminAction({
  adminEmail = '',
  actionType = '',
  collectionName = '',
  documentId = '',
  notes = '',
  before = null,
  after = null
}) {
  try {
    await addDoc(collection(db, COLLECTIONS.adminActivityLogs), cleanFirestoreData({
      adminEmail: cleanText(adminEmail) || 'admin@gritlabafrica.org',
      actionType: cleanText(actionType) || 'admin_action',
      collectionName: cleanText(collectionName),
      documentId: cleanText(documentId),
      notes: cleanText(notes),
      before,
      after,
      createdAt: serverTimestamp()
    }))
  } catch (error) {
    console.warn('Admin activity log failed:', error)
  }
}
