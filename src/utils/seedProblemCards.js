import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import problemCardsData from '../assets/json/grit_lab_africa_problem_cards.json'

export async function seedProblemCards() {
  const cards = problemCardsData.cards || problemCardsData || []

  const uploadTasks = cards.map((card) =>
    setDoc(
      doc(db, 'problemCards', `problem_${card.id}`),
      {
        id: card.id,
        title: card.title,
        problem_type: card.problem_type,
        problem: card.problem,
        examples: card.examples || [],
        think_about_it: card.think_about_it,
        sdg_goals: card.sdg_goals || [],
        cardType: 'problem',
        cardTheme: 'dark-blue',
        backImageName: 'card2.jpeg',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  )

  await Promise.all(uploadTasks)

  return cards.length
}