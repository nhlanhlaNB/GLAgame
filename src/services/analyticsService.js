import { logEvent } from 'firebase/analytics'
import { initAnalytics } from '../firebase'

let analyticsInstance = null

async function getAnalyticsInstance() {
  if (!analyticsInstance) {
    analyticsInstance = await initAnalytics()
  }

  return analyticsInstance
}

export async function logAnalyticsEvent(eventName, params = {}) {
  try {
    const analytics = await getAnalyticsInstance()

    if (!analytics) {
      return false
    }

    logEvent(analytics, eventName, params)
    return true
  } catch (error) {
    return false
  }
}

export function logPlayerLoginEvent(userId, method) {
  return logAnalyticsEvent('player_logged_in', {
    userId,
    login_method: method || 'unknown'
  })
}

export function logGameSessionEvent(sessionId, selectedProblemStackId) {
  return logAnalyticsEvent('game_session_started', {
    session_id: sessionId || '',
    problem_stack_id: selectedProblemStackId || ''
  })
}

export function logSolutionSubmittedEvent({
  userId,
  sessionId,
  problemCardId,
  selectedAiCardIds = [],
  wordCount
}) {
  return logAnalyticsEvent('solution_submitted', {
    userId: userId || '',
    session_id: sessionId || '',
    problem_card_id: problemCardId || '',
    ai_card_ids: (selectedAiCardIds || []).join(','),
    ai_card_count: (selectedAiCardIds || []).length,
    word_count: wordCount || 0
  })
}

export function logScoreReceivedEvent({
  userId,
  problemCardId,
  totalScore,
  glaCoinEarned
}) {
  return logAnalyticsEvent('score_received', {
    userId: userId || '',
    problem_card_id: problemCardId || '',
    total_score: totalScore || 0,
    gla_coin_earned: glaCoinEarned || 0
  })
}

export function logHintRequestedEvent({ userId, problemCardId, cost }) {
  return logAnalyticsEvent('hint_requested', {
    userId: userId || '',
    problem_card_id: problemCardId || '',
    cost: cost || 0
  })
}

export function logCertificateUnlockedEvent({ userId, averageScore, completedCount }) {
  return logAnalyticsEvent('certificate_unlocked', {
    userId: userId || '',
    average_score: averageScore || 0,
    completed_count: completedCount || 0
  })
}
