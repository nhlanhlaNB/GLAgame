import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { COLLECTIONS, cleanFirestoreData, db, isSchemaDocument } from '../firebaseService'

function cleanText(value) {
  return String(value || '').trim()
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
}

function normaliseCard(row, cardType) {
  return {
    firestoreId: row.firestoreId,
    id: row.id || row.firestoreId,
    cardType,
    title: cleanText(row.title) || `${cardType === 'ai' ? 'AI' : 'Problem'} Card`,
    subtitle: cleanText(row.problem_type || row.ai_type || row.type || row.cardTheme),
    description: cleanText(row.problem || row.what_it_can_do || row.canDo || row.description),
    frontImageUrl: cleanText(row.frontImageUrl || row.imageUrl || row.illustrationUrl),
    backImageUrl: cleanText(row.backImageUrl),
    frontImageName: cleanText(row.frontImageName),
    backImageName: cleanText(row.backImageName),
    isActive: row.isActive !== false,
    cardTheme: cleanText(row.cardTheme) || (cardType === 'ai' ? 'gold' : 'dark-blue'),
    sdgGoals: row.sdg_goals || []
  }
}

function normaliseSkin(row, ownedIds = new Set(), equippedSkinId = '') {
  const skinId = cleanText(row.skinId || row.firestoreId)
  return {
    firestoreId: row.firestoreId,
    skinId,
    title: cleanText(row.title || row.name) || 'Card Skin',
    description: cleanText(row.description) || 'Unlockable card design.',
    cardType: cleanText(row.cardType || 'all'),
    imageUrl: cleanText(row.imageUrl || row.frontImageUrl || row.previewUrl),
    requiredLevel: toNumber(row.requiredLevel),
    requiredAchievementId: cleanText(row.requiredAchievementId),
    requiredCompletedProblems: toNumber(row.requiredCompletedProblems),
    requiredAverageScore: toNumber(row.requiredAverageScore),
    isActive: row.isActive !== false,
    order: toNumber(row.order, 99),
    owned: ownedIds.has(skinId),
    equipped: equippedSkinId === skinId
  }
}

export async function getPlayerCardDesigns(userId = '') {
  const [problemCards, aiCards, skins, userSkins] = await Promise.all([
    getCollectionRows(COLLECTIONS.problemCards),
    getCollectionRows(COLLECTIONS.aiCards),
    getCollectionRows(COLLECTIONS.cardSkins),
    getCollectionRows(COLLECTIONS.userCardSkins)
  ])

  const playerSkinRows = userSkins
    .filter((row) => !isSchemaDocument(row))
    .filter((row) => !userId || String(row.userId) === String(userId))

  const ownedIds = new Set(playerSkinRows.map((row) => cleanText(row.skinId)).filter(Boolean))
  const equippedSkinId = cleanText(playerSkinRows.find((row) => row.isEquipped)?.skinId)

  return {
    problemCards: problemCards.filter((row) => !isSchemaDocument(row)).map((row) => normaliseCard(row, 'problem')),
    aiCards: aiCards.filter((row) => !isSchemaDocument(row)).map((row) => normaliseCard(row, 'ai')),
    cardSkins: skins
      .filter((row) => !isSchemaDocument(row))
      .map((row) => normaliseSkin(row, ownedIds, equippedSkinId))
      .filter((skin) => skin.isActive)
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    userCardSkins: playerSkinRows
  }
}

export async function unlockPlayerCardSkin({ userId, skin, source = 'player_progress' }) {
  if (!userId) throw new Error('User ID is required to unlock a card skin.')
  if (!skin?.skinId) throw new Error('Card skin is missing.')

  const userSkinId = `${userId}_${skin.skinId}`
  const payload = cleanFirestoreData({
    userSkinId,
    userId,
    skinId: skin.skinId,
    skinTitle: skin.title || '',
    cardType: skin.cardType || 'all',
    source,
    isEquipped: false,
    unlockedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await setDoc(doc(db, COLLECTIONS.userCardSkins, userSkinId), payload, { merge: true })
  return payload
}

export async function equipPlayerCardSkin({ userId, skinId }) {
  if (!userId) throw new Error('User ID is required to equip a card skin.')
  if (!skinId) throw new Error('Skin ID is required.')

  const existingRows = await getCollectionRows(COLLECTIONS.userCardSkins)
  const playerRows = existingRows
    .filter((row) => !isSchemaDocument(row))
    .filter((row) => String(row.userId) === String(userId))

  await Promise.all(
    playerRows.map((row) =>
      setDoc(
        doc(db, COLLECTIONS.userCardSkins, row.firestoreId || `${userId}_${row.skinId}`),
        { isEquipped: cleanText(row.skinId) === cleanText(skinId), updatedAt: serverTimestamp() },
        { merge: true }
      )
    )
  )

  await setDoc(doc(db, COLLECTIONS.users, userId), {
    equippedCardSkinId: skinId,
    updatedAt: serverTimestamp()
  }, { merge: true })

  return skinId
}
