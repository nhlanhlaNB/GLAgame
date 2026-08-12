import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ID = 'afriquest-8757e'
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(process.cwd(), 'serviceAccount.json')

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: npm run provision:admin -- <admin@email.com> <password>')
  process.exit(1)
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `Service account JSON not found at: ${SERVICE_ACCOUNT_PATH}\n` +
      'Download it from Firebase console > Project settings > Service accounts ' +
      '(Generate new private key) and save it as serviceAccount.json, ' +
      'or set the GOOGLE_APPLICATION_CREDENTIALS environment variable.\n' +
      'It is git-ignored and must never be committed.'
  )
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))

initializeApp({
  credential: cert(serviceAccount),
  projectId: PROJECT_ID
})

const auth = getAuth()
const firestore = getFirestore()

async function main() {
  let uid

  try {
    const existing = await auth.getUserByEmail(email)
    uid = existing.uid
    await auth.updateUser(uid, { password, emailVerified: true })
    console.log(`Admin user already exists; updated password for ${email} (${uid})`)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error
    }

    const created = await auth.createUser({
      email,
      password,
      emailVerified: true,
      displayName: 'GRIT Lab Africa Admin'
    })
    uid = created.uid
    console.log(`Created admin user ${email} (${uid})`)
  }

  await auth.setCustomUserClaims(uid, { admin: true })
  console.log('Set custom claim admin=true')

  await firestore
    .doc(`adminUsers/${uid}`)
    .set(
      {
        adminId: uid,
        uid,
        email,
        fullName: 'GRIT Lab Africa Admin',
        role: 'admin',
        accessLevel: 'super_admin',
        accountStatus: 'active',
        permissions: [
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
        loginProvider: 'firebase-auth',
        createdAt: new Date(),
        lastLoginAt: null
      },
      { merge: true }
    )

  console.log(`Seeded adminUsers/${uid}`)
  console.log('Done. Sign in at /admin with that email + password.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
