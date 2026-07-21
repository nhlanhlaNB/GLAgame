import { COLLECTIONS } from '../firebaseService'
import { cleanText, getDocument, saveDocument, toNumber } from './adminDataHelpers'

const DOC_ID = 'global'

export async function getGlobalAppSettings() {
  return getDocument(COLLECTIONS.appSettings, DOC_ID, {
    certificateRequiredCards: 10,
    certificateAverageScore: 75,
    maxAiCardsPerSolution: 3,
    explanationWordLimit: 100,
    hintsEnabled: false,
    cardFlipEnabledByDefault: true,
    soundEnabledByDefault: false,
    showCardImagesByDefault: true,
    highContrastByDefault: false,
    largeTextByDefault: false,
    reduceMotionByDefault: false,
    defaultLanguage: 'en',
    appTheme: 'gla-gold'
  })
}

export async function saveGlobalAppSettings(formValues) {
  return saveDocument(COLLECTIONS.appSettings, DOC_ID, {
    certificateRequiredCards: toNumber(formValues.certificateRequiredCards, 10),
    certificateAverageScore: toNumber(formValues.certificateAverageScore, 75),
    maxAiCardsPerSolution: toNumber(formValues.maxAiCardsPerSolution, 3),
    explanationWordLimit: toNumber(formValues.explanationWordLimit, 100),
    hintsEnabled: Boolean(formValues.hintsEnabled),
    cardFlipEnabledByDefault: formValues.cardFlipEnabledByDefault !== false,
    soundEnabledByDefault: Boolean(formValues.soundEnabledByDefault),
    showCardImagesByDefault: formValues.showCardImagesByDefault !== false,
    highContrastByDefault: Boolean(formValues.highContrastByDefault),
    largeTextByDefault: Boolean(formValues.largeTextByDefault),
    reduceMotionByDefault: Boolean(formValues.reduceMotionByDefault),
    defaultLanguage: cleanText(formValues.defaultLanguage) || 'en',
    appTheme: cleanText(formValues.appTheme) || 'gla-gold'
  }, { actionType: 'save_global_app_settings' })
}
