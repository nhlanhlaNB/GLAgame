const RUBRIC_LIMITS = {
  ai_card_relevance: 20,
  combination_strength: 15,
  practical_feasibility: 15,
  african_context_and_feasibility: 15,
  sdg_alignment: 15,
  creativity_and_innovation: 10,
  ethical_and_responsible_use: 10
}

const RUBRIC_KEYS = Object.keys(RUBRIC_LIMITS)

const RUBRIC_FEEDBACK_DEFAULTS = {
  ai_card_relevance: 'The selected AI cards should directly match the problem and clearly support the solution.',
  combination_strength: 'Explain how the selected AI cards work together instead of acting as separate ideas.',
  practical_feasibility: 'Make the solution more realistic by mentioning tools, people, cost, access, or implementation steps.',
  african_context_and_feasibility: 'Strengthen the answer by showing awareness of African realities such as language, connectivity, infrastructure, cost, and local communities.',
  sdg_alignment: 'Connect the solution more clearly to the SDG goals linked to the problem card.',
  creativity_and_innovation: 'Add a more original, useful, or locally inspiring idea.',
  ethical_and_responsible_use: 'Mention privacy, fairness, inclusion, safety, and human oversight where needed.'
}

function normaliseAreaFeedback(parsed = {}) {
  const raw =
    parsed?.feedback_by_area ||
    parsed?.area_feedback ||
    parsed?.sub_score_feedback ||
    parsed?.subScoreFeedback ||
    parsed?.feedback?.by_area ||
    parsed?.feedback?.sub_scores ||
    {}

  const result = {}

  RUBRIC_KEYS.forEach((key) => {
    const value = raw[key] || raw[key.replace(/_/g, ' ')] || raw[key.replace(/_/g, '')]

    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim()
    } else if (value && typeof value === 'object') {
      result[key] = String(value.feedback || value.reason || value.comment || RUBRIC_FEEDBACK_DEFAULTS[key]).trim()
    } else {
      result[key] = RUBRIC_FEEDBACK_DEFAULTS[key]
    }
  })

  return result
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}

function cleanJsonResponse(content) {
  return String(content || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
}

function extractJsonObject(content) {
  const cleaned = cleanJsonResponse(content)

  if (!cleaned) {
    return ''
  }

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned
  }

  return cleaned.slice(firstBrace, lastBrace + 1)
}

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').trim()
    const number = Number(cleaned)

    if (Number.isFinite(number)) {
      return number
    }
  }

  if (value && typeof value === 'object') {
    const possibleNestedValues = [
      value.score,
      value.value,
      value.mark,
      value.marks,
      value.points,
      value.total
    ]

    for (const nestedValue of possibleNestedValues) {
      const number = toNumber(nestedValue, Number.NaN)

      if (Number.isFinite(number)) {
        return number
      }
    }
  }

  return fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function pickNumber(source, possibleKeys, fallback = 0) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  for (const key of possibleKeys) {
    if (source[key] !== undefined && source[key] !== null) {
      return toNumber(source[key], fallback)
    }
  }

  return fallback
}

function normaliseSubScores(subScores = {}) {
  return {
    ai_card_relevance: clamp(
      Math.round(
        pickNumber(subScores, [
          'ai_card_relevance',
          'aiCardRelevance',
          'AI Card Relevance',
          'AI card relevance',
          'ai card relevance',
          'relevance'
        ])
      ),
      0,
      RUBRIC_LIMITS.ai_card_relevance
    ),

    combination_strength: clamp(
      Math.round(
        pickNumber(subScores, [
          'combination_strength',
          'combinationStrength',
          'Combination Strength',
          'combination strength',
          'combination'
        ])
      ),
      0,
      RUBRIC_LIMITS.combination_strength
    ),

    practical_feasibility: clamp(
      Math.round(
        pickNumber(subScores, [
          'practical_feasibility',
          'practicalFeasibility',
          'Practical Feasibility',
          'practical feasibility',
          'feasibility',
          'practicality'
        ])
      ),
      0,
      RUBRIC_LIMITS.practical_feasibility
    ),

    african_context_and_feasibility: clamp(
      Math.round(
        pickNumber(subScores, [
          'african_context_and_feasibility',
          'africanContextAndFeasibility',
          'African Context and Feasibility',
          'african context and feasibility',
          'african_context',
          'africanContext',
          'african context'
        ])
      ),
      0,
      RUBRIC_LIMITS.african_context_and_feasibility
    ),

    sdg_alignment: clamp(
      Math.round(
        pickNumber(subScores, [
          'sdg_alignment',
          'sdgAlignment',
          'SDG Alignment',
          'sdg alignment',
          'sdg'
        ])
      ),
      0,
      RUBRIC_LIMITS.sdg_alignment
    ),

    creativity_and_innovation: clamp(
      Math.round(
        pickNumber(subScores, [
          'creativity_and_innovation',
          'creativityAndInnovation',
          'Creativity and Innovation',
          'creativity and innovation',
          'creativity',
          'innovation'
        ])
      ),
      0,
      RUBRIC_LIMITS.creativity_and_innovation
    ),

    ethical_and_responsible_use: clamp(
      Math.round(
        pickNumber(subScores, [
          'ethical_and_responsible_use',
          'ethicalAndResponsibleUse',
          'Ethical and Responsible Use',
          'ethical and responsible use',
          'ethics',
          'ethical_use',
          'responsible_use'
        ])
      ),
      0,
      RUBRIC_LIMITS.ethical_and_responsible_use
    )
  }
}

function sumSubScores(subScores) {
  return Object.values(subScores).reduce((total, score) => total + score, 0)
}

function distributeTotalIntoSubScores(totalScore) {
  const safeTotal = clamp(Math.round(toNumber(totalScore, 1)), 1, 100)

  const subScores = {}

  RUBRIC_KEYS.forEach((key) => {
    subScores[key] = Math.floor((safeTotal * RUBRIC_LIMITS[key]) / 100)
  })

  let difference = safeTotal - sumSubScores(subScores)

  while (difference > 0) {
    for (const key of RUBRIC_KEYS) {
      if (difference <= 0) break

      if (subScores[key] < RUBRIC_LIMITS[key]) {
        subScores[key] += 1
        difference -= 1
      }
    }
  }

  while (difference < 0) {
    for (const key of RUBRIC_KEYS) {
      if (difference >= 0) break

      if (subScores[key] > 0) {
        subScores[key] -= 1
        difference += 1
      }
    }
  }

  return subScores
}

function isVeryWeakExplanation(text) {
  const cleaned = String(text || '').trim().toLowerCase()

  const weakAnswers = [
    'i dont know',
    "i don't know",
    'idk',
    'not sure',
    'no idea',
    'i am not sure',
    "i'm not sure"
  ]

  if (weakAnswers.includes(cleaned)) {
    return true
  }

  return cleaned.split(/\s+/).filter(Boolean).length <= 3
}

function getFeedback(parsed, userExplanation) {
  const weak = isVeryWeakExplanation(userExplanation)

  let overall =
    parsed?.feedback?.overall ||
    parsed?.overall_feedback ||
    parsed?.overallFeedback ||
    ''

  let improvement =
    parsed?.feedback?.improvement ||
    parsed?.improvement ||
    parsed?.improvement_suggestion ||
    ''

  if (!overall) {
    overall = weak
      ? 'Your answer is too short to show a clear solution, so it receives a low score. You still get feedback so you can try again.'
      : 'Your idea has been reviewed. The score shows how realistic, practical, ethical and useful the solution is.'
  }

  if (!improvement) {
    improvement = weak
      ? 'Try explaining which AI card you chose, who it helps, and how it would work in a real African community.'
      : 'Improve your answer by explaining who will use the solution, how it will work, what resources are needed, and why it fits the African context.'
  }

  return {
    overall,
    improvement,
    by_area: normaliseAreaFeedback(parsed)
  }
}

function normaliseEvaluation(parsed, userExplanation) {
  const rawSubScores = parsed?.sub_scores || parsed?.subScores || {}
  let subScores = normaliseSubScores(rawSubScores)
  let subScoreTotal = sumSubScores(subScores)

  let providedTotal = Math.round(
    toNumber(
      parsed?.total_score ??
        parsed?.totalScore ??
        parsed?.score ??
        parsed?.GLA_coin_earned ??
        parsed?.glaCoinEarned,
      0
    )
  )

  providedTotal = clamp(providedTotal, 0, 100)

  if (subScoreTotal <= 0 && providedTotal > 0) {
    subScores = distributeTotalIntoSubScores(providedTotal)
    subScoreTotal = sumSubScores(subScores)
  }

  if (subScoreTotal <= 0) {
    const fallbackScore = isVeryWeakExplanation(userExplanation) ? 7 : 35
    subScores = distributeTotalIntoSubScores(fallbackScore)
    subScoreTotal = sumSubScores(subScores)
  }

  let totalScore = clamp(subScoreTotal, 1, 100)

  if (isVeryWeakExplanation(userExplanation)) {
    totalScore = clamp(totalScore, 1, 15)
    subScores = distributeTotalIntoSubScores(totalScore)
  }

  const feedback = getFeedback(parsed, userExplanation)

  return {
    total_score: totalScore,
    GLA_coin_earned: totalScore,
    sub_scores: subScores,
    feedback,
    feedback_by_area: feedback.by_area,
    certification_trackable: totalScore >= 50
  }
}

function normaliseJsonCandidate(content) {
  return String(content || '')
    .replace(/^\uFEFF/, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/:\s*True([,}\]])/g, ': true$1')
    .replace(/:\s*False([,}\]])/g, ': false$1')
    .replace(/:\s*None([,}\]])/g, ': null$1')
    .trim()
}

function parseScoringJson(content) {
  const extracted = extractJsonObject(content)
  const candidates = [
    extracted,
    cleanJsonResponse(content),
    normaliseJsonCandidate(extracted),
    normaliseJsonCandidate(cleanJsonResponse(content))
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)

      if (Array.isArray(parsed)) {
        const firstObject = parsed.find((item) => item && typeof item === 'object')
        if (firstObject) {
          return firstObject
        }
      }

      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // Try the next possible JSON shape.
    }
  }

  return null
}

function includesAny(text, terms) {
  const cleaned = String(text || '').toLowerCase()
  return terms.some((term) => cleaned.includes(term))
}

function buildSafeFallbackEvaluation({ problemCard, selectedAiCards = [], selectedSolution, userExplanation }) {
  const answer = String(userExplanation || '').trim()
  const wordCount = answer.split(/\s+/).filter(Boolean).length
  const selectedCount = selectedAiCards.length || (selectedSolution ? 1 : 0)
  const weak = isVeryWeakExplanation(answer)

  if (weak) {
    return normaliseEvaluation(
      {
        total_score: 8,
        feedback: {
          overall: 'Your answer is too short to show a clear solution, so it receives a low score. You can still improve it and try again.',
          improvement: 'Explain which AI card you chose, who it helps, and how the solution would work in a real community.'
        }
      },
      answer
    )
  }

  const selectedText = [
    ...selectedAiCards.map((card) => `${card?.title || ''} ${card?.type || ''} ${card?.canDo || ''}`),
    selectedSolution ? `${selectedSolution.title || ''} ${selectedSolution.description || ''}` : ''
  ]
    .join(' ')
    .toLowerCase()

  const problemText = `${problemCard?.title || ''} ${problemCard?.problem_type || ''} ${problemCard?.problem || ''} ${(problemCard?.sdg_goals || []).join(' ')}`.toLowerCase()
  const combinedText = `${answer} ${selectedText} ${problemText}`

  const feasibilityTerms = ['app', 'platform', 'system', 'school', 'community', 'municipality', 'teacher', 'clinic', 'mobile', 'sms', 'data', 'internet', 'offline', 'cost', 'low cost', 'train', 'report', 'monitor', 'connect']
  const africanTerms = ['africa', 'african', 'local', 'community', 'rural', 'township', 'language', 'low cost', 'mobile', 'school', 'youth', 'public', 'informal']
  const sdgTerms = ['sdg', 'goal', 'education', 'health', 'job', 'work', 'poverty', 'food', 'water', 'energy', 'environment', 'equality', 'innovation', 'sustainable']
  const ethicsTerms = ['privacy', 'consent', 'safe', 'safety', 'secure', 'fair', 'bias', 'human', 'oversight', 'inclusive', 'inclusion', 'protect']

  const subScores = {
    ai_card_relevance: clamp(8 + selectedCount * 3 + (selectedText && answer.toLowerCase().split(/\s+/).some((word) => selectedText.includes(word) && word.length > 4) ? 4 : 0), 1, 20),
    combination_strength: clamp(selectedCount >= 2 ? 9 + (includesAny(answer, ['together', 'combine', 'also', 'first', 'then']) ? 3 : 0) : 6, 1, 15),
    practical_feasibility: clamp(6 + Math.min(7, feasibilityTerms.filter((term) => includesAny(combinedText, [term])).length) + (wordCount >= 35 ? 2 : 0), 1, 15),
    african_context_and_feasibility: clamp(5 + Math.min(8, africanTerms.filter((term) => includesAny(combinedText, [term])).length) + (wordCount >= 45 ? 2 : 0), 1, 15),
    sdg_alignment: clamp(5 + Math.min(8, sdgTerms.filter((term) => includesAny(combinedText, [term])).length) + ((problemCard?.sdg_goals || []).length ? 2 : 0), 1, 15),
    creativity_and_innovation: clamp(4 + (wordCount >= 30 ? 2 : 0) + (includesAny(answer, ['new', 'innovative', 'create', 'personalised', 'automated', 'predict', 'recommend']) ? 3 : 0), 1, 10),
    ethical_and_responsible_use: clamp(3 + Math.min(6, ethicsTerms.filter((term) => includesAny(combinedText, [term])).length) + (wordCount >= 50 ? 1 : 0), 1, 10)
  }

  const totalScore = clamp(sumSubScores(subScores), 1, 100)

  return normaliseEvaluation(
    {
      total_score: totalScore,
      sub_scores: subScores,
      feedback: {
        overall: 'Your solution was scored successfully. The marks reflect how well your answer connects the selected AI cards to the problem, feasibility, SDG value, African context, creativity, and responsible use.',
        improvement: 'To improve, add clearer implementation steps, mention users or partners, and include privacy, safety, or fairness where relevant.'
      },
      feedback_by_area: {
        ai_card_relevance: 'The selected AI cards are checked against the problem and the explanation you wrote.',
        combination_strength: 'Higher marks are awarded when the answer explains how the selected cards work together.',
        practical_feasibility: 'The answer should show practical steps, users, tools, access, cost, or implementation details.',
        african_context_and_feasibility: 'The answer is stronger when it considers local realities such as language, access, communities, schools, or connectivity.',
        sdg_alignment: 'The answer should clearly support the SDG goals connected to the problem card.',
        creativity_and_innovation: 'The answer earns more marks when it adds a useful, original, or locally inspiring idea.',
        ethical_and_responsible_use: 'The answer should mention privacy, safety, fairness, inclusion, or human oversight where needed.'
      }
    },
    answer
  )
}


async function callScoringengine({ apiKey, model, prompt }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 22000)

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are the GRIT Lab Africa AI card game evaluator. Score strictly using the seven-area rubric. Return compact valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: 'json_object'
        },
        temperature: 0.1,
        max_tokens: 1200
      })
    })

    const rawText = await response.text()

    let data = {}

    try {
      data = JSON.parse(rawText)
    } catch {
      data = { rawText }
    }

    return { response, data }
  } catch (error) {
    if (error?.name === 'AbortError') {
      const response = new Response(JSON.stringify({ message: 'The scoring engine took too long to respond.' }), { status: 504 })
      return { response, data: { message: 'The scoring engine took too long to respond.' } }
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'Only POST requests are allowed.'
    })
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

    if (!apiKey) {
      return jsonResponse(500, {
        error:
          'the scoring engine API key has not been configured. Add DEEPSEEK_API_KEY in Netlify environment variables.'
      })
    }

    const body = JSON.parse(event.body || '{}')

    const problemCard = body.problemCard
    const selectedSolution = body.selectedSolution
    const selectedAiCards = Array.isArray(body.selectedAiCards)
      ? body.selectedAiCards.slice(0, 3)
      : []
    const userExplanation = String(body.userExplanation || '').trim()

    if (!problemCard) {
      return jsonResponse(400, {
        error: 'Problem card is missing.'
      })
    }

    if (!selectedSolution && selectedAiCards.length === 0) {
      return jsonResponse(400, {
        error: 'Please select at least one AI card before submitting.'
      })
    }

    if (!userExplanation) {
      return jsonResponse(400, {
        error: 'Please write a short explanation before submitting.'
      })
    }

    const wordCount = userExplanation.split(/\s+/).filter(Boolean).length

    if (wordCount > 100) {
      return jsonResponse(400, {
        error: 'Your explanation must be 100 words or less.'
      })
    }

    const selectedAiCardsText =
      selectedAiCards.length > 0
        ? selectedAiCards
            .map((card, index) => {
              return `${index + 1}. ${card.title}
Type: ${card.type}
What it can do: ${card.canDo}
Examples: ${(card.examples || []).slice(0, 3).join(', ')}`
            })
            .join('\n\n')
        : `Title: ${selectedSolution.title}
Description: ${selectedSolution.description}`

    const prompt = `
Return valid JSON only. Do not include markdown, comments, explanations outside JSON, or trailing commas. Keep every feedback sentence short.

You are evaluating a player's GRIT Lab Africa AI/SDG card game solution.

The player is not answering a correct-or-wrong quiz.
The player is designing a realistic AI solution for an African problem card.

IMPORTANT SCORING RULES:
- Give a score from 1 to 100.
- Never return 0.
- The score becomes the player's GLA coin earned.
- If the player says "I don't know", "not sure", "idk", or gives a very weak answer, give a low score between 1 and 15, but still give helpful feedback.
- Do not say you cannot evaluate the answer.
- Judge each rubric category separately and precisely. Do not copy the same value into every category unless the answer truly deserves that.
- Award marks only for what the player actually explains.
- Judge realism, practicality, African context, SDG alignment, creativity, and ethics.
- If the idea is unsafe, harmful, discriminatory, privacy-invasive, or dangerous, give a very low score and explain the safety problem.
- For health, mental health, GBV, crime, substance abuse, or emergency topics, reward privacy, human oversight, safe referrals, and appropriate support services.

PROBLEM CARD:
Title: ${problemCard.title}
Problem Type: ${problemCard.problem_type}
Problem: ${problemCard.problem}
Examples: ${(problemCard.examples || []).join(', ')}
Think About It: ${problemCard.think_about_it}
SDG Goals: ${(problemCard.sdg_goals || []).join(', ')}

SELECTED AI CARD(S):
${selectedAiCardsText}

PLAYER EXPLANATION:
"${userExplanation}"

SCORING RUBRIC:
1. ai_card_relevance: 20 marks
2. combination_strength: 15 marks
3. practical_feasibility: 15 marks
4. african_context_and_feasibility: 15 marks
5. sdg_alignment: 15 marks
6. creativity_and_innovation: 10 marks
7. ethical_and_responsible_use: 10 marks

The total_score must equal the sum of the sub_scores.
The total_score must be between 1 and 100.
GLA_coin_earned must equal total_score.

Return exactly this JSON shape using double quotes for every key and string:

{
  "total_score": 72,
  "GLA_coin_earned": 72,
  "sub_scores": {
    "ai_card_relevance": 15,
    "combination_strength": 10,
    "practical_feasibility": 11,
    "african_context_and_feasibility": 12,
    "sdg_alignment": 12,
    "creativity_and_innovation": 6,
    "ethical_and_responsible_use": 6
  },
  "feedback": {
    "overall": "Short helpful feedback explaining why this score was given.",
    "improvement": "One clear way the player can improve the solution."
  },
  "feedback_by_area": {
    "ai_card_relevance": "Precise reason for this sub-score.",
    "combination_strength": "Precise reason for this sub-score.",
    "practical_feasibility": "Precise reason for this sub-score.",
    "african_context_and_feasibility": "Precise reason for this sub-score.",
    "sdg_alignment": "Precise reason for this sub-score.",
    "creativity_and_innovation": "Precise reason for this sub-score.",
    "ethical_and_responsible_use": "Precise reason for this sub-score."
  },
  "certification_trackable": true
}
`

    let content = ''
    let deepseekError = ''

    for (let attempt = 1; attempt <= 1; attempt += 1) {
      const { response, data } = await callScoringengine({
        apiKey,
        model,
        prompt
      })

      if (!response.ok) {
        deepseekError =
          data?.error?.message ||
          data?.message ||
          'The scoring engine could not score the explanation right now.'

        continue
      }

      content = extractJsonObject(data?.choices?.[0]?.message?.content)

      if (content) {
        break
      }
    }

    if (!content) {
      return jsonResponse(502, {
        error:
          deepseekError ||
          'The scoring engine returned an empty response. Please try again in a few seconds.'
      })
    }

    const parsed = parseScoringJson(content)

    const normalised = parsed
      ? normaliseEvaluation(parsed, userExplanation)
      : buildSafeFallbackEvaluation({
          problemCard,
          selectedAiCards,
          selectedSolution,
          userExplanation
        })

    return jsonResponse(200, normalised)
  } catch (err) {
    return jsonResponse(500, {
      error: err.message || 'Internal server error.'
    })
  }
}