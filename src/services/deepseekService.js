export async function gradeExplanation({
  problemCard,
  selectedSolution,
  selectedAiCards = [],
  userExplanation
}) {
  const response = await fetch('/api/deepseek/explain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      problemCard,
      selectedSolution,
      selectedAiCards,
      userExplanation
    })
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
}