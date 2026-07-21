import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

const defaultRubrics = [
  {
    rubricId: 'ai_card_relevance',
    categoryName: 'AI Card Relevance',
    maxScore: 20,
    description:
      'Whether the selected AI cards are suitable for the problem being solved.',
    order: 1,
    isActive: true
  },
  {
    rubricId: 'combination_strength',
    categoryName: 'Combination Strength',
    maxScore: 15,
    description:
      'Whether the selected AI cards work well together as a combined solution.',
    order: 2,
    isActive: true
  },
  {
    rubricId: 'practical_feasibility',
    categoryName: 'Practical Feasibility',
    maxScore: 15,
    description:
      'Whether the solution can realistically be implemented with available tools, resources and systems.',
    order: 3,
    isActive: true
  },
  {
    rubricId: 'african_context_feasibility',
    categoryName: 'African Context and Feasibility',
    maxScore: 15,
    description:
      'Whether the solution considers African realities such as cost, infrastructure, language, access and local communities.',
    order: 4,
    isActive: true
  },
  {
    rubricId: 'sdg_alignment',
    categoryName: 'SDG Alignment',
    maxScore: 15,
    description:
      'Whether the solution clearly supports the SDG goal or goals linked to the problem card.',
    order: 5,
    isActive: true
  },
  {
    rubricId: 'creativity_innovation',
    categoryName: 'Creativity and Innovation',
    maxScore: 10,
    description:
      'Whether the idea is original, useful, imaginative and able to inspire further innovation.',
    order: 6,
    isActive: true
  },
  {
    rubricId: 'ethical_responsible_use',
    categoryName: 'Ethical and Responsible Use',
    maxScore: 10,
    description:
      'Whether the solution considers privacy, fairness, safety, inclusion and responsible AI use.',
    order: 7,
    isActive: true
  }
]

function cleanText(value) {
  return String(value || '').trim()
}

function createSafeId(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export async function getAdminScoringRubrics() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.scoringRubrics))

  return snapshot.docs
    .map((documentSnapshot) => ({
      firestoreId: documentSnapshot.id,
      ...documentSnapshot.data()
    }))
    .sort((a, b) => toNumber(a.order) - toNumber(b.order))
}

export async function seedDefaultScoringRubrics() {
  const uploadTasks = defaultRubrics.map((rubric) =>
    setDoc(
      doc(db, COLLECTIONS.scoringRubrics, rubric.rubricId),
      {
        ...rubric,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  )

  await Promise.all(uploadTasks)

  return defaultRubrics.length
}

export async function addAdminScoringRubric(formValues) {
  const categoryName = cleanText(formValues.categoryName)
  const maxScore = toNumber(formValues.maxScore)
  const description = cleanText(formValues.description)
  const order = toNumber(formValues.order)

  if (!categoryName) {
    throw new Error('Rubric category name is required.')
  }

  if (maxScore <= 0) {
    throw new Error('Maximum score must be greater than 0.')
  }

  if (!description) {
    throw new Error('Rubric description is required.')
  }

  const rubricId = createSafeId(categoryName)

  if (!rubricId) {
    throw new Error('Rubric ID could not be created.')
  }

  const rubricData = {
    rubricId,
    categoryName,
    maxScore,
    description,
    order: order || 99,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTIONS.scoringRubrics, rubricId), rubricData, {
    merge: true
  })

  return {
    firestoreId: rubricId,
    ...rubricData
  }
}

export async function deleteAdminScoringRubric(rubric) {
  const rubricId = rubric.firestoreId || rubric.rubricId

  if (!rubricId) {
    throw new Error('Rubric document ID is missing.')
  }

  await deleteDoc(doc(db, COLLECTIONS.scoringRubrics, rubricId))

  return rubricId
}

export function getRubricTotalScore(rubrics) {
  return rubrics.reduce((total, rubric) => {
    return total + toNumber(rubric.maxScore)
  }, 0)
}