import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

function cleanText(value) {
  return String(value || '').trim()
}

function parseListField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean)
  }

  return String(value || '')
    .split(/\n|,/)
    .map((item) => cleanText(item))
    .filter(Boolean)
}

function getNumberFromCard(card) {
  const fieldNumber = Number(card?.id)

  if (Number.isFinite(fieldNumber) && fieldNumber > 0) {
    return fieldNumber
  }

  const documentNumber = Number(
    String(card?.firestoreId || '')
      .replace('problem_', '')
      .replace('ai_', '')
      .trim()
  )

  if (Number.isFinite(documentNumber) && documentNumber > 0) {
    return documentNumber
  }

  return 0
}

function getProblemCardDocumentId(cardOrId) {
  if (typeof cardOrId === 'object' && cardOrId !== null) {
    if (cardOrId.firestoreId) {
      return String(cardOrId.firestoreId)
    }

    if (cardOrId.id !== undefined && cardOrId.id !== null) {
      const idValue = String(cardOrId.id)

      if (idValue.startsWith('problem_')) {
        return idValue
      }

      return `problem_${idValue}`
    }
  }

  const idValue = String(cardOrId || '').trim()

  if (idValue.startsWith('problem_')) {
    return idValue
  }

  return `problem_${idValue}`
}

function getAiCardDocumentId(cardOrId) {
  if (typeof cardOrId === 'object' && cardOrId !== null) {
    if (cardOrId.firestoreId) {
      return String(cardOrId.firestoreId)
    }

    if (cardOrId.id !== undefined && cardOrId.id !== null) {
      const idValue = String(cardOrId.id)

      if (idValue.startsWith('ai_')) {
        return idValue
      }

      return `ai_${idValue}`
    }
  }

  const idValue = String(cardOrId || '').trim()

  if (idValue.startsWith('ai_')) {
    return idValue
  }

  return `ai_${idValue}`
}

export async function getAdminProblemCards() {
  const problemCardsRef = collection(db, COLLECTIONS.problemCards)
  const problemCardsQuery = query(problemCardsRef, orderBy('id', 'asc'))
  const snapshot = await getDocs(problemCardsQuery)

  return snapshot.docs
    .map((documentSnapshot) => ({
      firestoreId: documentSnapshot.id,
      ...documentSnapshot.data()
    }))
    .sort((a, b) => getNumberFromCard(a) - getNumberFromCard(b))
}

export async function getNextProblemCardId() {
  const cards = await getAdminProblemCards()

  const highestId = cards.reduce((highest, card) => {
    return Math.max(highest, getNumberFromCard(card))
  }, 0)

  return highestId + 1
}

export async function addAdminProblemCard(formValues) {
  const title = cleanText(formValues.title)
  const problemType = cleanText(formValues.problem_type)
  const problem = cleanText(formValues.problem)
  const thinkAboutIt = cleanText(formValues.think_about_it)
  const examples = parseListField(formValues.examples)
  const sdgGoals = parseListField(formValues.sdg_goals)

  if (!title) {
    throw new Error('Problem card title is required.')
  }

  if (!problemType) {
    throw new Error('Problem type is required.')
  }

  if (!problem) {
    throw new Error('Problem description is required.')
  }

  if (!thinkAboutIt) {
    throw new Error('Reflection question is required.')
  }

  if (sdgGoals.length === 0) {
    throw new Error('At least one SDG goal is required.')
  }

  const nextId = await getNextProblemCardId()
  const documentId = `problem_${nextId}`

  const cardData = {
    id: nextId,
    title,
    problem_type: problemType,
    problem,
    examples,
    think_about_it: thinkAboutIt,
    sdg_goals: sdgGoals,
    cardType: 'problem',
    cardTheme: 'dark-blue',
    backImageName: 'card2.jpeg',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTIONS.problemCards, documentId), cardData)

  return {
    firestoreId: documentId,
    ...cardData
  }
}

export async function deleteAdminProblemCard(card) {
  const documentId = getProblemCardDocumentId(card)

  if (!documentId || documentId === 'problem_') {
    throw new Error('Problem card document ID is missing.')
  }

  await deleteDoc(doc(db, COLLECTIONS.problemCards, documentId))

  return documentId
}

export async function updateProblemCardSdgMapping(card, sdgGoalsValue) {
  const documentId = getProblemCardDocumentId(card)
  const sdgGoals = parseListField(sdgGoalsValue)

  if (!documentId || documentId === 'problem_') {
    throw new Error('Problem card document ID is missing.')
  }

  if (sdgGoals.length === 0) {
    throw new Error('Please add at least one SDG goal.')
  }

  await setDoc(
    doc(db, COLLECTIONS.problemCards, documentId),
    {
      sdg_goals: sdgGoals,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )

  return {
    documentId,
    sdg_goals: sdgGoals
  }
}

export async function getAdminAiCards() {
  const aiCardsRef = collection(db, COLLECTIONS.aiCards)
  const aiCardsQuery = query(aiCardsRef, orderBy('id', 'asc'))
  const snapshot = await getDocs(aiCardsQuery)

  return snapshot.docs
    .map((documentSnapshot) => ({
      firestoreId: documentSnapshot.id,
      ...documentSnapshot.data()
    }))
    .sort((a, b) => getNumberFromCard(a) - getNumberFromCard(b))
}

export async function getNextAiCardId() {
  const cards = await getAdminAiCards()

  const highestId = cards.reduce((highest, card) => {
    return Math.max(highest, getNumberFromCard(card))
  }, 0)

  return highestId + 1
}

export async function addAdminAiCard(formValues) {
  const title = cleanText(formValues.title)
  const aiType = cleanText(formValues.ai_type)
  const whatItCanDo = cleanText(formValues.what_it_can_do)
  const examples = parseListField(formValues.examples)
  const thinkAboutIt = cleanText(formValues.think_about_it)

  if (!title) {
    throw new Error('AI card title is required.')
  }

  if (!aiType) {
    throw new Error('Type of AI is required.')
  }

  if (!whatItCanDo) {
    throw new Error('What this AI can do is required.')
  }

  if (examples.length === 0) {
    throw new Error('Please add at least one example.')
  }

  if (!thinkAboutIt) {
    throw new Error('Reflection question is required.')
  }

  const nextId = await getNextAiCardId()
  const documentId = `ai_${nextId}`

  const cardData = {
    id: nextId,
    title,
    ai_type: aiType,
    what_it_can_do: whatItCanDo,
    examples,
    think_about_it: thinkAboutIt,
    cardType: 'ai',
    cardTheme: 'gold',
    backImageName: 'card1.jpeg',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTIONS.aiCards, documentId), cardData)

  return {
    firestoreId: documentId,
    ...cardData
  }
}

export async function deleteAdminAiCard(card) {
  const documentId = getAiCardDocumentId(card)

  if (!documentId || documentId === 'ai_') {
    throw new Error('AI card document ID is missing.')
  }

  await deleteDoc(doc(db, COLLECTIONS.aiCards, documentId))

  return documentId
}