const SCORING_ENDPOINT = '/api/deepseek/explain'
const SCORING_TIMEOUT_MS = 25000

async function postScore(endpoint, payload, timeoutMs = SCORING_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          'The scoring engine could not score the explanation right now.'
      )
    }

    if (!data || typeof data !== 'object') {
      throw new Error('The scoring engine returned an empty result.')
    }

    return data
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Scoring is taking too long. Please check your connection and try again.')
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function gradeExplanation({
  problemCard,
  selectedSolution,
  selectedAiCards = [],
  userExplanation
}) {
  const payload = {
    problemCard,
    selectedSolution,
    selectedAiCards,
    userExplanation
  }

  return postScore(SCORING_ENDPOINT, payload)
}
