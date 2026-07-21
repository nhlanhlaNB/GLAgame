import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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

export { auth, db, storage }
export default app
