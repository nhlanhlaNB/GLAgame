import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyBPalvqRrchXu6c2g9yWIPwLnKQu-USIRg',
  authDomain: 'afriquest-8757e.firebaseapp.com',
  projectId: 'afriquest-8757e',
  storageBucket: 'afriquest-8757e.firebasestorage.app',
  messagingSenderId: '722190528249',
  appId: '1:722190528249:web:260790dabd70351314fc28',
  measurementId: 'G-SHH6T5MJDJ'
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

let analytics = null
let analyticsReady = null

function initAnalytics() {
  if (analyticsReady) return analyticsReady

  analyticsReady = isSupported()
    .then((supported) => {
      if (!supported) return null
      analytics = getAnalytics(app)
      return analytics
    })
    .catch(() => null)

  return analyticsReady
}

export { auth, db, storage, analytics, initAnalytics }
export default app
