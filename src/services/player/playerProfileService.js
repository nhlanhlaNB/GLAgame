import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile
} from 'firebase/auth'
import {
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import {
  PLAYER_COLLECTIONS,
  getUserRef,
  now,
  playerCollection,
  playerDoc
} from './playerDataService'
import { logProfileUpdated } from './playerAnalyticsService'

const defaultPlayerFields = {
  role: 'player',
  accountStatus: 'active',
  glaCoinBalance: 0,
  totalGlaCoinEarned: 0,
  totalGlaCoinSpent: 0,
  totalHintsUsed: 0,
  completedProblemCount: 0,
  averageScore: 0,
  bestScore: 0,
  certificateUnlocked: false,
  certificateId: '',
  currentProblemStackId: '',
  activeSessionId: ''
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function cleanData(value) {
  if (Array.isArray(value)) return value.map(cleanData)

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, itemValue]) => itemValue !== undefined)
        .map(([key, itemValue]) => [key, cleanData(itemValue)])
    )
  }

  return value
}

function cleanText(value) {
  return String(value || '').trim()
}

function getFriendlyAuthError(error) {
  const code = error?.code || ''

  if (code === 'auth/requires-recent-login') {
    return 'For security, the system needs you to log out and log in again before changing your email or password.'
  }

  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'The current password is incorrect.'
  }

  if (code === 'auth/email-already-in-use') {
    return 'That email address is already being used by another account.'
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.'
  }

  if (code === 'auth/weak-password') {
    return 'The new password is too weak. Use at least 6 characters.'
  }

  return error?.message || 'Could not update profile.'
}

async function reauthenticateIfNeeded(authUser, currentPassword) {
  if (!authUser?.email || !currentPassword) return

  const credential = EmailAuthProvider.credential(authUser.email, currentPassword)
  await reauthenticateWithCredential(authUser, credential)
}

export async function getPlayerProfile(userId) {
  if (!userId) return null

  const userRef = getUserRef(userId)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) return null

  return {
    id: userSnap.id,
    ...userSnap.data()
  }
}

export async function getPlayerSelectedProblemStack(profile) {
  const stackId = profile?.currentProblemStackId

  if (!stackId) return null

  const stackSnap = await getDoc(
    playerDoc(PLAYER_COLLECTIONS.selectedProblemStacks, stackId)
  )

  if (!stackSnap.exists()) return null

  return {
    id: stackSnap.id,
    ...stackSnap.data()
  }
}

export async function createOrUpdatePlayerProfile({
  userId,
  firstName = '',
  lastName = '',
  phone = '',
  email = ''
}) {
  if (!userId) {
    throw new Error('User ID is required to create or update a player profile.')
  }

  const userRef = getUserRef(userId)

  await setDoc(
    userRef,
    cleanData({
      userId,
      firstName,
      lastName,
      phone,
      email,
      ...defaultPlayerFields,
      updatedAt: now()
    }),
    { merge: true }
  )

  return getPlayerProfile(userId)
}

export async function ensurePlayerProfile({
  userId,
  firstName = '',
  lastName = '',
  phone = '',
  email = ''
}) {
  if (!userId) {
    throw new Error('User ID is required to ensure player profile.')
  }

  const existingProfile = await getPlayerProfile(userId)

  if (existingProfile) {
    const missingFields = {}

    Object.entries(defaultPlayerFields).forEach(([key, value]) => {
      if (existingProfile[key] === undefined) missingFields[key] = value
    })

    if (existingProfile.userId === undefined) missingFields.userId = userId

    if (Object.keys(missingFields).length > 0) {
      await setDoc(
        getUserRef(userId),
        {
          ...missingFields,
          updatedAt: now()
        },
        { merge: true }
      )
    }

    return getPlayerProfile(userId)
  }

  return createOrUpdatePlayerProfile({ userId, firstName, lastName, phone, email })
}

export async function updatePlayerProfile(userId, profileData, authUser = null) {
  if (!userId) throw new Error('User ID is required to update player profile.')

  const firstName = cleanText(profileData.firstName)
  const lastName = cleanText(profileData.lastName)
  const phone = cleanText(profileData.phone)
  const displayName = cleanText(profileData.displayName || `${firstName} ${lastName}`)
  const nextEmail = cleanText(profileData.email)
  const currentPassword = String(profileData.currentPassword || '')
  const newPassword = String(profileData.newPassword || '')

  try {
    if (authUser && displayName && displayName !== authUser.displayName) {
      await updateProfile(authUser, { displayName })
    }

    if (authUser && nextEmail && nextEmail !== authUser.email) {
      await reauthenticateIfNeeded(authUser, currentPassword)
      await updateEmail(authUser, nextEmail)
    }

    if (authUser && newPassword) {
      await reauthenticateIfNeeded(authUser, currentPassword)
      await updatePassword(authUser, newPassword)
    }
  } catch (error) {
    throw new Error(getFriendlyAuthError(error))
  }

  const allowedFields = {
    firstName,
    lastName,
    phone,
    email: nextEmail || authUser?.email || profileData.email || '',
    displayName
  }

  const cleanedFields = cleanData(allowedFields)
  const userRef = getUserRef(userId)

  await updateDoc(userRef, {
    ...cleanedFields,
    updatedAt: now()
  })

  await logProfileUpdated(userId, Object.keys(cleanedFields))

  return getPlayerProfile(userId)
}

export async function updatePlayerProgressSummary(userId, summaryData) {
  if (!userId) throw new Error('User ID is required to update player progress.')

  const allowedFields = {
    glaCoinBalance: summaryData.glaCoinBalance,
    totalGlaCoinEarned: summaryData.totalGlaCoinEarned,
    totalGlaCoinSpent: summaryData.totalGlaCoinSpent,
    totalHintsUsed: summaryData.totalHintsUsed,
    completedProblemCount: summaryData.completedProblemCount,
    averageScore: summaryData.averageScore,
    bestScore: summaryData.bestScore,
    certificateUnlocked: summaryData.certificateUnlocked,
    certificateId: summaryData.certificateId,
    currentProblemStackId: summaryData.currentProblemStackId,
    activeSessionId: summaryData.activeSessionId
  }

  const userRef = getUserRef(userId)

  await updateDoc(userRef, {
    ...cleanData(allowedFields),
    updatedAt: now()
  })

  return getPlayerProfile(userId)
}

export async function updatePlayerActiveSession(userId, activeSessionId) {
  if (!userId) throw new Error('User ID is required to update active session.')

  await updateDoc(getUserRef(userId), {
    activeSessionId,
    updatedAt: now()
  })

  return activeSessionId
}

export async function updatePlayerCurrentProblemStack(userId, currentProblemStackId) {
  if (!userId) throw new Error('User ID is required to update current problem stack.')

  await updateDoc(getUserRef(userId), {
    currentProblemStackId,
    updatedAt: now()
  })

  return currentProblemStackId
}

export async function getPlayerAttempts(userId, maxResults = 20) {
  if (!userId) return []

  const attemptsQuery = query(
    playerCollection(PLAYER_COLLECTIONS.attempts),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  )

  const attemptsSnap = await getDocs(attemptsQuery)

  return attemptsSnap.docs.map((attemptDoc) => ({
    id: attemptDoc.id,
    ...attemptDoc.data()
  }))
}
