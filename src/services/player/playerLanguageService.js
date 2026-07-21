import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

export const FALLBACK_LANGUAGES = [
  { languageCode: 'en', languageName: 'English', deckStatus: 'Published', isActive: true, order: 1 },
  { languageCode: 'fr', languageName: 'French', deckStatus: 'Published', isActive: true, order: 2 },
  { languageCode: 'zu', languageName: 'isiZulu', deckStatus: 'Published', isActive: true, order: 3 },
  { languageCode: 'pt', languageName: 'Portuguese', deckStatus: 'Draft', isActive: true, order: 4 },
  { languageCode: 'sw', languageName: 'Kiswahili', deckStatus: 'Draft', isActive: true, order: 5 },
  { languageCode: 'ar', languageName: 'Arabic', deckStatus: 'Draft', isActive: true, order: 6 }
]

export const APP_TRANSLATIONS = {
  en: {
    gameTitle: 'GRIT Lab Africa AI for SDGs Card Game',
    menu: 'Menu',
    close: 'Close',
    journey: 'Journey',
    dashboard: 'Dashboard',
    coins: 'GLA Coins',
    certificate: 'Certificate',
    profile: 'Profile',
    achievements: 'Achievements',
    levels: 'Levels',
    leaderboard: 'Leaderboard',
    analytics: 'Analytics',
    language: 'Language',
    settings: 'App Settings',
    cardDesigns: 'Card Designs',
    multiplayer: 'Multiplayer',
    rewards: 'Rewards & Launch',
    selectLanguage: 'Choose your language',
    languageHelp: 'When you choose a language, the app saves your preference and loads matching card translations from the system where available.',
    saveLanguage: 'Save Language',
    currentLanguage: 'Current language',
    availableLanguages: 'Available languages',
    cardTranslations: 'Card translations',
    settingsTitle: 'App settings and accessibility',
    settingsHelp: 'Control how the game looks and behaves for your device and learning needs.',
    visualSettings: 'Visual settings',
    gameplaySettings: 'Gameplay settings',
    cardFlipEnabled: 'Allow card flipping',
    showCardImages: 'Show card images',
    highContrast: 'High contrast mode',
    largeText: 'Large text',
    reduceMotion: 'Reduce motion',
    lowBandwidth: 'Low bandwidth mode',
    keyboardMode: 'Keyboard friendly mode',
    screenReaderLabels: 'Screen reader labels',
    compactCards: 'Compact card layout',
    confirmBeforeSubmit: 'Confirm before submitting answers',
    soundEnabled: 'Sound effects',
    soundNotAvailable: 'Sound is stored as a setting only. No sound files are connected yet.',
    saveSettings: 'Save Settings',
    cardDesignTitle: 'Card image and design showcase',
    cardDesignHelp: 'Card images are loaded from the system problemCards and aiCards where frontImageUrl or backImageUrl exists.',
    problemCards: 'Problem cards',
    aiCards: 'AI cards',
    multiplayerTitle: 'Multiplayer hub',
    multiplayerHelp: 'Create or join collaborative rooms for challenge, team, debate or tournament play.',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    roomName: 'Room name',
    roomCode: 'Room code',
    mode: 'Mode',
    players: 'Players',
    status: 'Status',
    rewardsTitle: 'Rewards and public launch',
    rewardsHelp: 'Connect sponsor rewards, launch messages and claim history to the system.',
    claimReward: 'Claim Reward',
    launchStatus: 'Launch status'
  },
  fr: {
    gameTitle: 'Jeu de cartes IA pour les ODD de GRIT Lab Africa',
    menu: 'Menu',
    close: 'Fermer',
    journey: 'Parcours',
    dashboard: 'Tableau de bord',
    coins: 'Pièces GLA',
    certificate: 'Certificat',
    profile: 'Profil',
    achievements: 'Badges',
    levels: 'Niveaux',
    leaderboard: 'Classement',
    analytics: 'Analyses',
    language: 'Langue',
    settings: 'Paramètres',
    cardDesigns: 'Design des cartes',
    multiplayer: 'Multijoueur',
    rewards: 'Récompenses et lancement',
    selectLanguage: 'Choisissez votre langue',
    languageHelp: 'Lorsque vous choisissez une langue, l’application enregistre votre préférence et charge les traductions des cartes depuis the system si elles existent.',
    saveLanguage: 'Enregistrer la langue',
    currentLanguage: 'Langue actuelle',
    availableLanguages: 'Langues disponibles',
    cardTranslations: 'Traductions des cartes',
    settingsTitle: 'Paramètres de l’application et accessibilité',
    settingsHelp: 'Contrôlez l’apparence et le comportement du jeu selon votre appareil et vos besoins.',
    visualSettings: 'Paramètres visuels',
    gameplaySettings: 'Paramètres de jeu',
    cardFlipEnabled: 'Autoriser le retournement des cartes',
    showCardImages: 'Afficher les images des cartes',
    highContrast: 'Mode contraste élevé',
    largeText: 'Texte agrandi',
    reduceMotion: 'Réduire les animations',
    lowBandwidth: 'Mode faible connexion',
    keyboardMode: 'Mode clavier',
    screenReaderLabels: 'Libellés pour lecteur d’écran',
    compactCards: 'Cartes compactes',
    confirmBeforeSubmit: 'Confirmer avant l’envoi',
    soundEnabled: 'Effets sonores',
    soundNotAvailable: 'Le son est enregistré comme paramètre seulement. Aucun fichier audio n’est encore connecté.',
    saveSettings: 'Enregistrer les paramètres',
    cardDesignTitle: 'Images et design des cartes',
    cardDesignHelp: 'Les images des cartes sont chargées depuis the system problemCards et aiCards lorsqu’une URL d’image existe.',
    problemCards: 'Cartes problème',
    aiCards: 'Cartes IA',
    multiplayerTitle: 'Espace multijoueur',
    multiplayerHelp: 'Créez ou rejoignez des salles collaboratives pour les défis, équipes, débats ou tournois.',
    createRoom: 'Créer une salle',
    joinRoom: 'Rejoindre',
    roomName: 'Nom de la salle',
    roomCode: 'Code de salle',
    mode: 'Mode',
    players: 'Joueurs',
    status: 'Statut',
    rewardsTitle: 'Récompenses et lancement public',
    rewardsHelp: 'Connectez les récompenses des sponsors, les messages de lancement et l’historique des demandes à the system.',
    claimReward: 'Demander la récompense',
    launchStatus: 'Statut du lancement'
  },
  zu: {
    gameTitle: 'Umdlalo Wamakhadi we-GRIT Lab Africa AI nama-SDG',
    menu: 'Imenyu',
    close: 'Vala',
    journey: 'Uhambo',
    dashboard: 'Ideshibhodi',
    coins: 'Ama-GLA Coin',
    certificate: 'Isitifiketi',
    profile: 'Iphrofayela',
    achievements: 'Imiklomelo',
    levels: 'Amazinga',
    leaderboard: 'Ibhodi labaholi',
    analytics: 'Ukuhlaziya',
    language: 'Ulimi',
    settings: 'Izilungiselelo',
    cardDesigns: 'Ukubukeka kwamakhadi',
    multiplayer: 'Abadlali abaningi',
    rewards: 'Imivuzo nokwethulwa',
    selectLanguage: 'Khetha ulimi lwakho',
    languageHelp: 'Uma ukhetha ulimi, uhlelo lugcina okukhethile bese lulanda ukuhumusha kwamakhadi ku-the system uma kukhona.',
    saveLanguage: 'Gcina ulimi',
    currentLanguage: 'Ulimi lwamanje',
    availableLanguages: 'Izilimi ezikhona',
    cardTranslations: 'Ukuhumusha kwamakhadi',
    settingsTitle: 'Izilungiselelo zohlelo nokufinyeleleka',
    settingsHelp: 'Lawula indlela umdlalo obukeka ngayo nokuthi usebenza kanjani kudivayisi yakho.',
    visualSettings: 'Izilungiselelo zokubuka',
    gameplaySettings: 'Izilungiselelo zomdlalo',
    cardFlipEnabled: 'Vumela ukuguqula ikhadi',
    showCardImages: 'Bonisa izithombe zamakhadi',
    highContrast: 'Ukugqama okuphezulu',
    largeText: 'Umbhalo omkhulu',
    reduceMotion: 'Nciphisa ukunyakaza',
    lowBandwidth: 'Imodi yedatha encane',
    keyboardMode: 'Imodi yekhibhodi',
    screenReaderLabels: 'Amalebula wokufunda isikrini',
    compactCards: 'Amakhadi amafushane',
    confirmBeforeSubmit: 'Qinisekisa ngaphambi kokuthumela',
    soundEnabled: 'Imisindo',
    soundNotAvailable: 'Umsindo ugcinwa njengesilungiselelo kuphela. Awekho amafayela omsindo axhunyiwe okwamanje.',
    saveSettings: 'Gcina izilungiselelo',
    cardDesignTitle: 'Izithombe nokubukeka kwamakhadi',
    cardDesignHelp: 'Izithombe zamakhadi zilayishwa ku-the system problemCards nama-aiCards uma i-URL yesithombe ikhona.',
    problemCards: 'Amakhadi ezinkinga',
    aiCards: 'Amakhadi e-AI',
    multiplayerTitle: 'Indawo yabadlali abaningi',
    multiplayerHelp: 'Dala noma ujoyine amagumbi okusebenzisana emiqhudelwaneni, emaqenjini, ezingxoxweni noma ezitournament.',
    createRoom: 'Dala igumbi',
    joinRoom: 'Joyina',
    roomName: 'Igama legumbi',
    roomCode: 'Ikhodi yegumbi',
    mode: 'Imodi',
    players: 'Abadlali',
    status: 'Isimo',
    rewardsTitle: 'Imivuzo nokwethulwa komphakathi',
    rewardsHelp: 'Xhuma imivuzo yabaxhasi, imiyalezo yokwethula nomlando wezicelo ku-the system.',
    claimReward: 'Cela umvuzo',
    launchStatus: 'Isimo sokwethulwa'
  }
}

function cleanText(value) {
  return String(value || '').trim()
}

function normaliseLanguageCode(value) {
  const code = cleanText(value).toLowerCase()
  if (code === 'isizulu') return 'zu'
  if (code === 'zulu') return 'zu'
  if (code === 'english') return 'en'
  if (code === 'french') return 'fr'
  return code || 'en'
}

function isSchemaDocument(row) {
  const id = cleanText(row.firestoreId || row.languageCode || row.translationId).toLowerCase()
  return id === '__schema' || id.includes('__schema') || id.includes('sample')
}

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
}

export function translateText(key, languageCode = 'en') {
  const code = normaliseLanguageCode(languageCode)
  return APP_TRANSLATIONS[code]?.[key] || APP_TRANSLATIONS.en[key] || key
}

export async function getAvailablePlayerLanguages() {
  const rows = await getCollectionRows(COLLECTIONS.languageVersions)
  const usable = rows
    .filter((row) => !isSchemaDocument(row))
    .map((row) => ({
      languageCode: normaliseLanguageCode(row.languageCode || row.code || row.firestoreId),
      languageName: cleanText(row.languageName || row.language || row.name || row.firestoreId),
      deckStatus: cleanText(row.deckStatus || row.status || 'Draft'),
      isActive: row.isActive !== false,
      order: Number(row.order || 99)
    }))
    .filter((row) => row.languageCode && row.languageName && row.isActive)

  if (usable.length === 0) {
    return FALLBACK_LANGUAGES
  }

  const merged = [...usable]
  FALLBACK_LANGUAGES.forEach((fallback) => {
    if (!merged.some((row) => row.languageCode === fallback.languageCode)) {
      merged.push(fallback)
    }
  })

  return merged.sort((a, b) => a.order - b.order || a.languageName.localeCompare(b.languageName))
}

export async function savePlayerLanguagePreference(userId, languageCode) {
  const safeCode = normaliseLanguageCode(languageCode)
  localStorage.setItem('gla_language_code', safeCode)
  document.documentElement.lang = safeCode
  window.dispatchEvent(new CustomEvent('gla-language-change', { detail: { languageCode: safeCode } }))

  if (userId) {
    await setDoc(
      doc(db, COLLECTIONS.users, userId),
      {
        preferredLanguageCode: safeCode,
        languageUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  }

  return safeCode
}

export async function getPlayerLanguagePreference(userId) {
  const savedCode = localStorage.getItem('gla_language_code') || 'en'
  document.documentElement.lang = savedCode
  return normaliseLanguageCode(savedCode)
}

export async function getCardTranslationsForLanguage(languageCode) {
  const code = normaliseLanguageCode(languageCode)
  const rows = await getCollectionRows(COLLECTIONS.cardTranslations)

  return rows
    .filter((row) => !isSchemaDocument(row))
    .filter((row) => normaliseLanguageCode(row.languageCode || row.language || row.code) === code)
    .map((row) => ({
      firestoreId: row.firestoreId,
      translationId: row.translationId || row.firestoreId,
      cardId: row.cardId || row.problemCardId || row.aiCardId || row.sourceCardId || '',
      cardType: row.cardType || row.type || 'card',
      languageCode: code,
      translatedTitle: row.translatedTitle || row.title || '',
      translatedProblem: row.translatedProblem || row.problem || row.translatedDescription || row.description || '',
      translatedExamples: row.translatedExamples || row.examples || [],
      translatedThinkAboutIt: row.translatedThinkAboutIt || row.think_about_it || row.question || ''
    }))
}

export function applyCardTranslation(card, translations = []) {
  if (!card) return card

  const match = translations.find((translation) => {
    return String(translation.cardId) === String(card.id) || String(translation.cardId) === String(card.firestoreId)
  })

  if (!match) return card

  return {
    ...card,
    title: match.translatedTitle || card.title,
    problem: match.translatedProblem || card.problem,
    what_it_can_do: match.translatedProblem || card.what_it_can_do,
    canDo: match.translatedProblem || card.canDo,
    examples: Array.isArray(match.translatedExamples) && match.translatedExamples.length > 0 ? match.translatedExamples : card.examples,
    think_about_it: match.translatedThinkAboutIt || card.think_about_it
  }
}

export function useLanguageText(languageCode) {
  return (key) => translateText(key, languageCode)
}
