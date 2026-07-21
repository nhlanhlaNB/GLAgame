import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { aiCards } from '../data/aiCards'

export async function seedAiCards() {
  const uploadTasks = aiCards.map((card) =>
    setDoc(
      doc(db, 'aiCards', `ai_${card.id}`),
      {
        id: card.id,
        title: card.title,
        ai_type: card.type,
        what_it_can_do: card.canDo,
        examples: card.examples,
        think_about_it: card.question,
        cardType: 'ai',
        cardTheme: 'gold',
        backImageName: 'card1.jpeg',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  )

  await Promise.all(uploadTasks)

  return aiCards.length
}