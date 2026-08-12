import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const ADMIN_USERS_COLLECTION = 'adminUsers'
const ADMIN_SESSION_KEY = 'gla_admin_session'

function cleanText(value) {
  return String(value || '').trim()
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase()
}

function removeFirestoreDates(adminUser) {
  return {
    adminId: adminUser.adminId || adminUser.uid || '',
    uid: adminUser.uid || adminUser.adminId || '',
    email: adminUser.email || '',
    fullName: adminUser.fullName || '',
    role: adminUser.role || 'admin',
    accessLevel: adminUser.accessLevel || 'super_admin',
    accountStatus: adminUser.accountStatus || 'active',
    permissions: adminUser.permissions || [],
    loginProvider: adminUser.loginProvider || 'firebase-auth'
  }
}

async function getAdminProfile(user) {
  if (!user) return null

  const uidRef = doc(db, ADMIN_USERS_COLLECTION, user.uid)
  const uidSnapshot = await getDoc(uidRef)

  if (uidSnapshot.exists()) {
    return {
      id: uidSnapshot.id,
      ...uidSnapshot.data(),
      uid: user.uid
    }
  }

  const emailRef = doc(db, ADMIN_USERS_COLLECTION, cleanEmail(user.email))
  const emailSnapshot = await getDoc(emailRef)

  if (emailSnapshot.exists()) {
    const data = emailSnapshot.data()

    await setDoc(
      uidRef,
      {
        ...data,
        uid: user.uid,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )

    return {
      id: user.uid,
      ...data,
      uid: user.uid
    }
  }

  return null
}

async function hasAdminClaim(user) {
  try {
    const token = await user.getIdTokenResult()
    return token.claims && token.claims.admin === true
  } catch {
    return false
  }
}

export async function loginAdmin({ email, password }) {
  const enteredEmail = cleanEmail(email)

  if (!enteredEmail || !password) {
    throw new Error('Admin email and password are required.')
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    enteredEmail,
    password
  )

  const user = userCredential.user
  const [adminUser, hasClaim] = await Promise.all([
    getAdminProfile(user),
    hasAdminClaim(user)
  ])

  if (!adminUser && !hasClaim) {
    await signOut(auth)
    throw new Error('This account is not registered as an administrator.')
  }

  const profile = adminUser || {
    uid: user.uid,
    email: user.email,
    fullName: user.displayName || 'GRIT Lab Africa Admin',
    role: 'admin',
    accessLevel: 'super_admin',
    accountStatus: 'active',
    permissions: []
  }

  if (
    profile.accountStatus &&
    String(profile.accountStatus).toLowerCase() !== 'active'
  ) {
    await signOut(auth)
    throw new Error('This admin account is not active.')
  }

  await setDoc(
    doc(db, ADMIN_USERS_COLLECTION, user.uid),
    {
      uid: user.uid,
      email: profile.email || user.email,
      fullName: profile.fullName || 'GRIT Lab Africa Admin',
      role: 'admin',
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch(() => {})

  const safeAdminSession = removeFirestoreDates({
    ...profile,
    uid: user.uid,
    email: profile.email || user.email
  })

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(safeAdminSession))

  return safeAdminSession
}

export function onAdminAuthStateChanged(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      callback(null)
      return
    }

    getAdminProfile(user)
      .then((profile) => {
        if (!profile) {
          localStorage.removeItem(ADMIN_SESSION_KEY)
          callback(null)
          return
        }

        const safeAdminSession = removeFirestoreDates({
          ...profile,
          uid: user.uid,
          email: profile.email || user.email
        })

        localStorage.setItem(
          ADMIN_SESSION_KEY,
          JSON.stringify(safeAdminSession)
        )

        callback(safeAdminSession)
      })
      .catch(() => {
        localStorage.removeItem(ADMIN_SESSION_KEY)
        callback(null)
      })
  })
}

export function getSavedAdminSession() {
  const savedSession = localStorage.getItem(ADMIN_SESSION_KEY)

  if (!savedSession) {
    return null
  }

  try {
    return JSON.parse(savedSession)
  } catch {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    return null
  }
}

export async function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY)

  try {
    await signOut(auth)
  } catch {
    // Ignore sign-out errors; the local session is already cleared.
  }
}

export function isAdminLoggedIn() {
  return Boolean(getSavedAdminSession())
}
