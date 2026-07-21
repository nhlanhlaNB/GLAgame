import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import aiCardsJson from '../assets/json/ai_cards_1_to_30_extracted_text.json'

const AI_CARDS_COLLECTION = 'aiCards'
const IMAGE_BASE_PATH = '/assets/images'
const DEFAULT_BACK_IMAGE_NAME = 'card1.jpeg'

function getAiCardsArray() {
  if (Array.isArray(aiCardsJson)) return aiCardsJson
  if (Array.isArray(aiCardsJson.aiCards)) return aiCardsJson.aiCards
  return []
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getCardNumber(card) {
  const number = Number(card.id || card.cardNumber || 0)
  return String(number).padStart(2, '0')
}

function normaliseAiCard(card) {
  const id = Number(card.id)
  const cardNumber = getCardNumber(card)
  const fileName = card.fileName || `AI_${id}.png`
  const aiType = card.aiType || card.subtitle || card.ai_type || card.type || 'AI'
  const whatThisAiCanDo = card.whatThisAiCanDo || card.what_it_can_do || card.canDo || ''
  const thinkAboutIt = card.thinkAboutIt || card.think_about_it || ''
  const howItCanHelpSolveProblems = card.howItCanHelpSolveProblems || card.how_it_can_help_solve_problems || ''
  const examples = toArray(card.examples)

  return {
    aiCardId: `ai_${id}`,
    id,
    order: id,
    cardNumber,
    cardLabel: card.cardLabel || `AI CARD ${cardNumber}`,
    title: card.title || '',
    subtitle: card.subtitle || '',
    description: card.description || '',
    ai_type: aiType,
    aiType,
    type: aiType,
    what_it_can_do: whatThisAiCanDo,
    whatThisAiCanDo,
    canDo: whatThisAiCanDo,
    examples,
    how_it_can_help_solve_problems: howItCanHelpSolveProblems,
    howItCanHelpSolveProblems,
    think_about_it: thinkAboutIt,
    thinkAboutIt,
    bestFor: card.bestFor || '',
    footer: card.footer || {},
    cardType: 'ai',
    cardTheme: card.cardTheme || 'neon-purple',
    fileName,
    frontImageName: fileName,
    frontImageUrl: `${IMAGE_BASE_PATH}/${fileName}`,
    backImageName: card.backImageName || DEFAULT_BACK_IMAGE_NAME,
    backImageUrl: `${IMAGE_BASE_PATH}/${card.backImageName || DEFAULT_BACK_IMAGE_NAME}`,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
}

async function deleteAllAiCards() {
  const snapshot = await getDocs(collection(db, AI_CARDS_COLLECTION))

  if (snapshot.empty) return 0

  const batches = []
  let currentBatch = writeBatch(db)
  let operationCount = 0
  let deletedCount = 0

  snapshot.docs.forEach((documentSnapshot) => {
    currentBatch.delete(documentSnapshot.ref)
    operationCount += 1
    deletedCount += 1

    if (operationCount === 450) {
      batches.push(currentBatch)
      currentBatch = writeBatch(db)
      operationCount = 0
    }
  })

  if (operationCount > 0) {
    batches.push(currentBatch)
  }

  for (const batch of batches) {
    await batch.commit()
  }

  return deletedCount
}

export async function resetAndSeedAiCards() {
  const cards = getAiCardsArray()

  if (cards.length === 0) {
    throw new Error('No AI cards were found in ai_cards_1_to_30_extracted_text.json.')
  }

  const deletedCount = await deleteAllAiCards()

  const batches = []
  let currentBatch = writeBatch(db)
  let operationCount = 0

  cards.forEach((card) => {
    const normalisedCard = normaliseAiCard(card)
    const cardRef = doc(db, AI_CARDS_COLLECTION, normalisedCard.aiCardId)

    currentBatch.set(cardRef, normalisedCard, { merge: false })
    operationCount += 1

    if (operationCount === 450) {
      batches.push(currentBatch)
      currentBatch = writeBatch(db)
      operationCount = 0
    }
  })

  if (operationCount > 0) {
    batches.push(currentBatch)
  }

  for (const batch of batches) {
    await batch.commit()
  }

  return {
    collection: AI_CARDS_COLLECTION,
    deletedCount,
    insertedCount: cards.length
  }
}
