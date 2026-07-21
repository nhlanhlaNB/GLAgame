const TRANSLATION_FUNCTION_URL = '/.netlify/functions/translate-ui'

const LANGUAGE_TARGETS = {
  en: 'en',
  zu: 'zu',
  fr: 'fr',
  ar: 'ar',
  pt: 'pt',
  sw: 'sw'
}

function normaliseLanguageCode(value) {
  const code = String(value || '').trim().toLowerCase()
  if (!code) return 'en'
  if (code === 'isizulu' || code === 'zulu') return 'zu'
  if (code === 'kiswahili' || code === 'swahili') return 'sw'
  if (code === 'french' || code === 'français' || code === 'francais') return 'fr'
  if (code === 'arabic' || code === 'العربية') return 'ar'
  if (code === 'portuguese' || code === 'português' || code === 'portugues') return 'pt'
  return LANGUAGE_TARGETS[code] ? code : 'en'
}

function restoreProtectedTokens(value, replacements) {
  return replacements.reduce((text, [token, original]) => text.replaceAll(token, original), value)
}

function protectBrandWords(value) {
  const protectedWords = [
    'GRIT Lab Africa',
    'AfriQuest',
    'GLA Coin',
    'GLA',
    'SDGs',
    'SDG',
    'AI'
  ]

  let text = String(value || '')
  const replacements = []

  protectedWords.forEach((word, index) => {
    const token = `__GLA_PROTECTED_${index}__`
    if (text.includes(word)) {
      text = text.split(word).join(token)
      replacements.push([token, word])
    }
  })

  return { text, replacements }
}

async function translateWithPublicEndpoint(text, targetLanguage) {
  const { text: protectedText, replacements } = protectBrandWords(text)
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'auto')
  url.searchParams.set('tl', targetLanguage)
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', protectedText)

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('Language service request failed.')

  const payload = await response.json()
  const translated = Array.isArray(payload?.[0])
    ? payload[0].map((part) => part?.[0] || '').join('')
    : text

  return restoreProtectedTokens(translated || text, replacements)
}

export async function translateInterfaceTexts({ texts, targetLanguage }) {
  const languageCode = normaliseLanguageCode(targetLanguage)
  const uniqueTexts = Array.from(new Set((texts || []).map((text) => String(text || '').trim()).filter(Boolean)))

  if (languageCode === 'en' || uniqueTexts.length === 0) {
    return uniqueTexts.reduce((map, text) => ({ ...map, [text]: text }), {})
  }

  try {
    const response = await fetch(TRANSLATION_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage: languageCode, texts: uniqueTexts })
    })

    if (response.ok) {
      const payload = await response.json()
      if (payload?.translations && typeof payload.translations === 'object') {
        return payload.translations
      }
    }
  } catch {
    // Local Vite dev may not expose Netlify functions. The direct endpoint is used as a fallback.
  }

  const translatedPairs = await Promise.all(
    uniqueTexts.map(async (text) => {
      try {
        const translated = await translateWithPublicEndpoint(text, languageCode)
        return [text, translated || text]
      } catch {
        return [text, text]
      }
    })
  )

  return translatedPairs.reduce((map, [source, translated]) => {
    map[source] = translated
    return map
  }, {})
}
