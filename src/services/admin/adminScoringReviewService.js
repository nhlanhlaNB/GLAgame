import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, saveDocument, toNumber } from './adminDataHelpers'

export async function getScoringReviewRows() {
  const [attempts, evaluations, reviews] = await Promise.all([
    getRows(COLLECTIONS.attempts), getRows(COLLECTIONS.deepSeekEvaluations), getRows(COLLECTIONS.aiScoringReviews)
  ])
  return attempts.map((attempt) => {
    const attemptId = attempt.firestoreId || attempt.attemptId
    const evaluation = evaluations.find((row) => String(row.attemptId) === String(attemptId)) || {}
    const review = reviews.find((row) => String(row.attemptId) === String(attemptId)) || {}
    return {
      ...attempt,
      attemptId,
      totalScore: toNumber(attempt.totalScore || attempt.score || evaluation.totalScore),
      reviewStatus: review.reviewStatus || attempt.reviewStatus || 'pending',
      adminComment: review.adminComment || '',
      evaluationId: evaluation.firestoreId || evaluation.evaluationId || ''
    }
  }).sort((a, b) => String(b.createdAt?.seconds || 0).localeCompare(String(a.createdAt?.seconds || 0)))
}

export async function saveScoringReview(attempt, reviewStatus, adminComment = '') {
  const attemptId = attempt.attemptId || attempt.firestoreId
  const reviewId = `review_${attemptId}`
  await saveDocument(COLLECTIONS.aiScoringReviews, reviewId, {
    reviewId,
    attemptId,
    userId: attempt.userId || attempt.playerId || '',
    problemId: attempt.problemId || attempt.problemCardId || '',
    totalScore: toNumber(attempt.totalScore || attempt.score),
    reviewStatus: cleanText(reviewStatus) || 'approved',
    adminComment: cleanText(adminComment),
    reviewedAt: serverTimestamp()
  }, { actionType: `scoring_review_${reviewStatus}` })
  await saveDocument(COLLECTIONS.attempts, attemptId, { reviewStatus, adminComment, reviewedAt: serverTimestamp() }, { actionType: 'update_attempt_review_status' })
}
