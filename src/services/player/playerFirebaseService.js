import { collection, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

export const PLAYER_COLLECTIONS = {
  users: 'users',
  problemCards: 'problemCards',
  aiCards: 'aiCards',
  selectedProblemStacks: 'selectedProblemStacks',
  gameSessions: 'gameSessions',
  attempts: 'attempts',
  deepSeekEvaluations: 'deepSeekEvaluations',
  scores: 'scores',
  subScores: 'subScores',
  feedback: 'feedback',
  hintRequests: 'hintRequests',
  glaCoinTransactions: 'glaCoinTransactions',
  certificates: 'certificates',
  analyticsEvents: 'analyticsEvents',
  appSettings: 'appSettings',
  achievements: 'achievements',
  playerAchievements: 'playerAchievements'
}

export function playerCollection(collectionName) {
  return collection(db, collectionName)
}

export function playerDoc(collectionName, documentId) {
  return doc(db, collectionName, documentId)
}

export function now() {
  return serverTimestamp()
}

export function getUserRef(userId) {
  return playerDoc(PLAYER_COLLECTIONS.users, userId)
}

export function getAppSettingsRef() {
  return playerDoc(PLAYER_COLLECTIONS.appSettings, 'default')
}