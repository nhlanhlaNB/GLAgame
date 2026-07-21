import { addDoc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import {
  PLAYER_COLLECTIONS,
  getAppSettingsRef,
  getUserRef,
  now,
  playerCollection,
  playerDoc
} from './playerDataService'
import { getPlayerDashboardData } from './playerDashboardService'
import { logCertificateUnlocked } from './playerAnalyticsService'

function toSafeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function cleanData(value) {
  if (Array.isArray(value)) {
    return value.map(cleanData)
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date || (value.constructor && value.constructor.name !== 'Object')) {
      return value
    }

    return Object.fromEntries(
      Object.entries(value)
        .filter(([, itemValue]) => itemValue !== undefined)
        .map(([key, itemValue]) => [key, cleanData(itemValue)])
    )
  }

  return value
}

function createVerificationCode(userId) {
  const shortUserId = String(userId || 'USER').slice(0, 6).toUpperCase()
  const timestamp = Date.now().toString().slice(-6)

  return `GLA-${shortUserId}-${timestamp}`
}

export async function getCertificateSettings() {
  const settingsSnap = await getDoc(getAppSettingsRef())

  if (!settingsSnap.exists()) {
    return {
      certificateRequiredCompletedCards: 10,
      certificateRequiredAverage: 75,
      allowCertificates: true
    }
  }

  const settings = settingsSnap.data()

  return {
    certificateRequiredCompletedCards: toSafeNumber(
      settings.certificateRequiredCompletedCards,
      10
    ),
    certificateRequiredAverage: toSafeNumber(
      settings.certificateRequiredAverage,
      75
    ),
    allowCertificates: settings.allowCertificates !== false
  }
}

export async function getPlayerCertificate(userId) {
  if (!userId) {
    return null
  }

  const certificatesQuery = query(
    playerCollection(PLAYER_COLLECTIONS.certificates),
    where('userId', '==', userId),
    where('isUnlocked', '==', true)
  )

  const certificatesSnap = await getDocs(certificatesQuery)

  if (certificatesSnap.empty) {
    return null
  }

  const certificateDoc = certificatesSnap.docs[0]

  return {
    id: certificateDoc.id,
    ...certificateDoc.data()
  }
}

export async function checkCertificateEligibility(userId) {
  if (!userId) {
    return {
      isEligible: false,
      reason: 'User ID is required.',
      completedProblemCount: 0,
      averageScore: 0,
      requiredCompletedCards: 10,
      requiredAverage: 75
    }
  }

  const settings = await getCertificateSettings()
  const dashboardData = await getPlayerDashboardData(userId)

  const completedProblemCount = toSafeNumber(
    dashboardData?.completedProblemCount ||
      dashboardData?.completedProblems
  )

  const averageScore = toSafeNumber(dashboardData?.averageScore)

  if (!settings.allowCertificates) {
    return {
      isEligible: false,
      reason: 'Certificates are currently disabled.',
      completedProblemCount,
      averageScore,
      requiredCompletedCards: settings.certificateRequiredCompletedCards,
      requiredAverage: settings.certificateRequiredAverage
    }
  }

  const hasEnoughCompletedCards =
    completedProblemCount >= settings.certificateRequiredCompletedCards

  const hasEnoughAverage =
    averageScore >= settings.certificateRequiredAverage

  return {
    isEligible: hasEnoughCompletedCards && hasEnoughAverage,
    reason:
      hasEnoughCompletedCards && hasEnoughAverage
        ? 'Player qualifies for certificate.'
        : 'Player has not met the certificate requirements yet.',
    completedProblemCount,
    averageScore,
    requiredCompletedCards: settings.certificateRequiredCompletedCards,
    requiredAverage: settings.certificateRequiredAverage
  }
}

export async function unlockPlayerCertificate(userId) {
  if (!userId) {
    throw new Error('User ID is required to unlock certificate.')
  }

  const existingCertificate = await getPlayerCertificate(userId)

  if (existingCertificate) {
    return existingCertificate
  }

  const eligibility = await checkCertificateEligibility(userId)

  if (!eligibility.isEligible) {
    return {
      isUnlocked: false,
      reason: eligibility.reason,
      completedProblemCount: eligibility.completedProblemCount,
      averageScore: eligibility.averageScore,
      requiredCompletedCards: eligibility.requiredCompletedCards,
      requiredAverage: eligibility.requiredAverage
    }
  }

  const userSnap = await getDoc(getUserRef(userId))

  if (!userSnap.exists()) {
    throw new Error('Player profile was not found.')
  }

  const userData = userSnap.data()
  const playerName =
    `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
    userData.displayName ||
    userData.email ||
    'Player'

  const verificationCode = createVerificationCode(userId)

  const certificateRef = await addDoc(
    playerCollection(PLAYER_COLLECTIONS.certificates),
    cleanData({
      certificateId: '',
      userId,
      playerName,
      certificateTitle:
        'Artificial Intelligence and Practical Applications: Gaming SDG Problems and Ideating Solutions for Africa',
      averageScore: eligibility.averageScore,
      completedProblemCount: eligibility.completedProblemCount,
      isUnlocked: true,
      certificateUrl: '',
      verificationCode,
      isSchema: false,
      issuedAt: now(),
      createdAt: now(),
      updatedAt: now()
    })
  )

  await updateDoc(certificateRef, {
    certificateId: certificateRef.id
  })

  await updateDoc(getUserRef(userId), {
    certificateUnlocked: true,
    certificateId: certificateRef.id,
    updatedAt: now()
  })

  await logCertificateUnlocked({
    userId,
    certificateId: certificateRef.id,
    averageScore: eligibility.averageScore,
    completedProblemCount: eligibility.completedProblemCount
  })

  return {
    certificateId: certificateRef.id,
    userId,
    playerName,
    certificateTitle:
      'Artificial Intelligence and Practical Applications: Gaming SDG Problems and Ideating Solutions for Africa',
    averageScore: eligibility.averageScore,
    completedProblemCount: eligibility.completedProblemCount,
    isUnlocked: true,
    certificateUrl: '',
    verificationCode
  }
}

export async function getOrCreatePlayerCertificate(userId) {
  const existingCertificate = await getPlayerCertificate(userId)

  if (existingCertificate) {
    return existingCertificate
  }

  return unlockPlayerCertificate(userId)
}

export async function updateCertificateUrl(certificateId, certificateUrl) {
  if (!certificateId) {
    throw new Error('Certificate ID is required to update certificate URL.')
  }

  await updateDoc(playerDoc(PLAYER_COLLECTIONS.certificates, certificateId), {
    certificateUrl,
    updatedAt: now()
  })

  return certificateUrl
}

export async function verifyCertificate(verificationCode) {
  if (!verificationCode) {
    return null
  }

  const certificatesQuery = query(
    playerCollection(PLAYER_COLLECTIONS.certificates),
    where('verificationCode', '==', verificationCode),
    where('isUnlocked', '==', true)
  )

  const certificatesSnap = await getDocs(certificatesQuery)

  if (certificatesSnap.empty) {
    return null
  }

  const certificateDoc = certificatesSnap.docs[0]

  return {
    id: certificateDoc.id,
    ...certificateDoc.data()
  }
}

export async function syncCertificateStatusToUser(userId) {
  if (!userId) {
    return null
  }

  const certificate = await getPlayerCertificate(userId)

  if (!certificate) {
    await setDoc(
      getUserRef(userId),
      {
        certificateUnlocked: false,
        certificateId: '',
        updatedAt: now()
      },
      { merge: true }
    )

    return null
  }

  await setDoc(
    getUserRef(userId),
    {
      certificateUnlocked: true,
      certificateId: certificate.certificateId || certificate.id,
      updatedAt: now()
    },
    { merge: true }
  )

  return certificate
}