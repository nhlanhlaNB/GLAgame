import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { cleanFirestoreData, cleanText, db, isSchemaDocument, makeSafeId, toNumber } from '../firebaseService'
import { logAdminAction } from './adminActivityLogService'

export { cleanText, isSchemaDocument, makeSafeId, toNumber }

export async function getRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs
    .map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
    .filter((row) => !isSchemaDocument(row))
}

export async function getDocument(collectionName, documentId, fallback = {}) {
  const ref = doc(db, collectionName, documentId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return { firestoreId: documentId, ...fallback }
  return { firestoreId: snapshot.id, ...snapshot.data() }
}

export async function saveDocument(collectionName, documentId, data, log = {}) {
  const safeId = cleanText(documentId) || makeSafeId(data?.title || data?.name || data?.label || 'item')
  const payload = cleanFirestoreData({ ...data, updatedAt: serverTimestamp() })
  await setDoc(doc(db, collectionName, safeId), payload, { merge: true })
  await logAdminAction({
    actionType: log.actionType || 'save_document',
    collectionName,
    documentId: safeId,
    notes: log.notes || '',
    after: payload
  })
  return { firestoreId: safeId, ...payload }
}

export async function removeDocument(collectionName, documentId, log = {}) {
  const safeId = cleanText(documentId)
  if (!safeId) throw new Error('Document ID is required.')
  await deleteDoc(doc(db, collectionName, safeId))
  await logAdminAction({
    actionType: log.actionType || 'delete_document',
    collectionName,
    documentId: safeId,
    notes: log.notes || ''
  })
  return safeId
}

export function parseCsvList(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean)
  return cleanText(value).split(/,|\n/).map((item) => cleanText(item)).filter(Boolean)
}
