const LANGUAGE_TARGETS = {
  en: 'en',
  zu: 'zu',
  fr: 'fr',
  ar: 'ar',
  pt: 'pt',
  sw: 'sw'
}

const PROTECTED_PHRASES = [
  'GRIT Lab Africa',
  'AfriQuest',
  'GLA Coin',
  'GLA',
  'SDGs',
  'SDG',
  'AI'
]

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  }
}

function normaliseLanguageCode(value) {
  const code = String(value || '').trim().toLowerCase()
  if (code === 'isizulu' || code === 'zulu') return 'zu'
  if (code === 'kiswahili' || code === 'swahili') return 'sw'
  if (code === 'french' || code === 'français' || code === 'francais') return 'fr'
  if (code === 'arabic' || code === 'العربية') return 'ar'
  if (code === 'portuguese' || code === 'português' || code === 'portugues') return 'pt'
  return LANGUAGE_TARGETS[code] ? code : 'en'
}

function protectBrandWords(value) {
  let text = String(value || '')
  const replacements = []

  PROTECTED_PHRASES.forEach((phrase, index) => {
    const token = `__GLA_PROTECTED_${index}__`
    if (text.includes(phrase)) {
      text = text.split(phrase).join(token)
      replacements.push([token, phrase])
    }
  })

  return { text, replacements }
}

function restoreProtectedTokens(value, replacements) {
  return replacements.reduce((text, [token, original]) => text.replaceAll(token, original), value)
}

async function translateOne(text, targetLanguage) {
  const { text: protectedText, replacements } = protectBrandWords(text)
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'auto')
  url.searchParams.set('tl', targetLanguage)
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', protectedText)

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'AfriQuestLanguageService/1.0' }
  })

  if (!response.ok) {
    throw new Error(`Translation request failed with ${response.status}`)
  }

  const payload = await response.json()
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part) => part?.[0] || '').join('')
    : text

  return restoreProtectedTokens(translated || text, replacements)
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true })
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Use POST for translation requests.' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const targetLanguage = normaliseLanguageCode(body.targetLanguage)
    const texts = Array.from(new Set((body.texts || []).map((text) => String(text || '').trim()).filter(Boolean))).slice(0, 120)

    if (targetLanguage === 'en') {
      return jsonResponse(200, {
        targetLanguage,
        translations: texts.reduce((map, text) => ({ ...map, [text]: text }), {})
      })
    }

    const translatedPairs = await Promise.all(
      texts.map(async (text) => {
        try {
          const translated = await translateOne(text, targetLanguage)
          return [text, translated || text]
        } catch {
          return [text, text]
        }
      })
    )

    const translations = translatedPairs.reduce((map, [source, translated]) => {
      map[source] = translated
      return map
    }, {})

    return jsonResponse(200, { targetLanguage, translations })
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Could not translate interface text.' })
  }
}
