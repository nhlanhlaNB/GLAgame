import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { db } from '../firebaseService'
import * as adminCredentialsModule from '../../components/admin/adminCredentials'

const ADMIN_USERS_COLLECTION = 'adminUsers'
const ADMIN_SESSION_KEY = 'gla_admin_session'

function cleanText(value) {
  return String(value || '').trim()
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase()
}

function getAdminCredentials() {
  const source =
    adminCredentialsModule.adminCredentials ||
    adminCredentialsModule.ADMIN_CREDENTIALS ||
    adminCredentialsModule.default ||
    {}

  return {
    email: cleanEmail(
      source.email ||
        source.adminEmail ||
        adminCredentialsModule.ADMIN_EMAIL ||
        'admin@gritlabafrica.org'
    ),
    password: cleanText(
      source.password ||
        source.adminPassword ||
        adminCredentialsModule.ADMIN_PASSWORD ||
        'GLA-admin-2026'
    ),
    accessCode: cleanText(
      source.accessCode ||
        source.adminAccessCode ||
        source.code ||
        adminCredentialsModule.ADMIN_ACCESS_CODE ||
        'GLA-ADMIN'
    )
  }
}

function getAdminDocumentId(email) {
  return cleanEmail(email)
}

function removeFirestoreDates(adminUser) {
  return {
    adminId: adminUser.adminId || '',
    email: adminUser.email || '',
    fullName: adminUser.fullName || '',
    role: adminUser.role || 'admin',
    accessLevel: adminUser.accessLevel || 'super_admin',
    accountStatus: adminUser.accountStatus || 'active',
    permissions: adminUser.permissions || [],
    loginProvider: adminUser.loginProvider || 'static-demo'
  }
}

export async function getAdminUserByEmail(email) {
  const cleanedEmail = cleanEmail(email)

  if (!cleanedEmail) {
    return null
  }

  const adminDocRef = doc(
    db,
    ADMIN_USERS_COLLECTION,
    getAdminDocumentId(cleanedEmail)
  )

  const adminSnapshot = await getDoc(adminDocRef)

  if (!adminSnapshot.exists()) {
    return null
  }

  return {
    id: adminSnapshot.id,
    ...adminSnapshot.data()
  }
}

export async function createOrUpdateAdminUser(adminDetails = {}) {
  const credentials = getAdminCredentials()

  const email = cleanEmail(adminDetails.email || credentials.email)
  const adminId = getAdminDocumentId(email)

  const fullName =
    cleanText(adminDetails.fullName) || 'GRIT Lab Africa Admin'

  const adminDocRef = doc(db, ADMIN_USERS_COLLECTION, adminId)
  const existingAdmin = await getDoc(adminDocRef)

  const adminData = {
    adminId,
    email,
    fullName,
    role: 'admin',
    accessLevel: adminDetails.accessLevel || 'super_admin',
    accountStatus: adminDetails.accountStatus || 'active',
    permissions: adminDetails.permissions || [
      'admin.dashboard.view',
      'admin.cards.manage',
      'admin.rubrics.manage',
      'admin.translations.manage',
      'admin.scoringReviews.manage',
      'admin.analytics.view',
      'admin.users.view',
      'admin.settings.manage',
      'admin.feedback.manage'
    ],
    loginProvider: 'static-demo',
    updatedAt: serverTimestamp()
  }

  if (!existingAdmin.exists()) {
    await setDoc(adminDocRef, {
      ...adminData,
      createdAt: serverTimestamp(),
      lastLoginAt: null
    })

    return {
      id: adminId,
      ...adminData
    }
  }

  await setDoc(
    adminDocRef,
    {
      ...adminData
    },
    { merge: true }
  )

  return {
    id: adminId,
    ...existingAdmin.data(),
    ...adminData
  }
}

export async function updateAdminLastLogin(email) {
  const cleanedEmail = cleanEmail(email)

  if (!cleanedEmail) {
    throw new Error('Admin email is required.')
  }

  const adminDocRef = doc(
    db,
    ADMIN_USERS_COLLECTION,
    getAdminDocumentId(cleanedEmail)
  )

  await setDoc(
    adminDocRef,
    {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )

  const updatedAdmin = await getDoc(adminDocRef)

  if (!updatedAdmin.exists()) {
    return null
  }

  return {
    id: updatedAdmin.id,
    ...updatedAdmin.data()
  }
}

export async function loginAdmin({ email, password, accessCode }) {
  const credentials = getAdminCredentials()

  const enteredEmail = cleanEmail(email)
  const enteredPassword = cleanText(password)
  const enteredAccessCode = cleanText(accessCode)

  const correctEmail = credentials.email
  const correctPassword = credentials.password
  const correctAccessCode = credentials.accessCode

  if (
    enteredEmail !== correctEmail ||
    enteredPassword !== correctPassword ||
    enteredAccessCode !== correctAccessCode
  ) {
    throw new Error('Invalid admin login details.')
  }

  const adminUser = await createOrUpdateAdminUser({
    email: correctEmail,
    fullName: 'GRIT Lab Africa Admin',
    accessLevel: 'super_admin',
    accountStatus: 'active'
  })

  if (adminUser.accountStatus !== 'active') {
    throw new Error('This admin account is not active.')
  }

  const updatedAdminUser = await updateAdminLastLogin(correctEmail)

  const safeAdminSession = removeFirestoreDates(updatedAdminUser || adminUser)

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(safeAdminSession))

  return safeAdminSession
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

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAdminLoggedIn() {
  return Boolean(getSavedAdminSession())
}

export async function ensureDefaultAdminUserExists() {
  const credentials = getAdminCredentials()

  return createOrUpdateAdminUser({
    email: credentials.email,
    fullName: 'GRIT Lab Africa Admin',
    accessLevel: 'super_admin',
    accountStatus: 'active'
  })
}