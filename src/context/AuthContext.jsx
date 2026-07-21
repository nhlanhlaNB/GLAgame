import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

const userGameDefaults = {
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

function getNameParts(displayName, email) {
  if (displayName) {
    const parts = displayName.trim().split(' ')

    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    }
  }

  return {
    firstName: email?.split('@')[0] || '',
    lastName: ''
  }
}

async function ensureUserDocument(user) {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    const nameParts = getNameParts(user.displayName, user.email)

    await setDoc(userRef, {
      userId: user.uid,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      phone: '',
      email: user.email || '',
      ...userGameDefaults,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    return
  }

  const userData = userSnap.data()
  const missingFields = {}

  Object.entries(userGameDefaults).forEach(([key, value]) => {
    if (userData[key] === undefined) {
      missingFields[key] = value
    }
  })

  if (userData.userId === undefined) {
    missingFields.userId = user.uid
  }

  if (userData.firstName === undefined || userData.lastName === undefined) {
    const nameParts = getNameParts(user.displayName, user.email)

    if (userData.firstName === undefined) {
      missingFields.firstName = nameParts.firstName
    }

    if (userData.lastName === undefined) {
      missingFields.lastName = nameParts.lastName
    }
  }

  if (userData.phone === undefined) {
    missingFields.phone = ''
  }

  if (userData.email === undefined) {
    missingFields.email = user.email || ''
  }

  await setDoc(
    userRef,
    {
      ...missingFields,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    },
    { merge: true }
  )
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function register(firstName, lastName, phone, email, password) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`
    })

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      userId: userCredential.user.uid,
      firstName,
      lastName,
      phone,
      email,
      ...userGameDefaults,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    })

    return userCredential
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)

      if (user) {
        ensureUserDocument(user).catch((error) => {
          console.error('Could not sync player profile in the background.', error)
        })
      }
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    authLoading: loading,
    register,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}