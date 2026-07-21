import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { COLLECTIONS, cleanText, db } from '../services/firebaseService'
import { translateInterfaceTexts } from '../services/translationApiService'

const STORAGE_KEY = 'gla_preferred_language'
const AUTO_TRANSLATE_STORAGE_KEY = 'gla_auto_translate_interface'

export const SUPPORTED_LANGUAGES = [
  { languageCode: 'en', languageName: 'English', isActive: true, order: 1, direction: 'ltr' },
  { languageCode: 'zu', languageName: 'isiZulu', isActive: true, order: 2, direction: 'ltr' },
  { languageCode: 'fr', languageName: 'French', isActive: true, order: 3, direction: 'ltr' },
  { languageCode: 'ar', languageName: 'Arabic', isActive: true, order: 4, direction: 'rtl' },
  { languageCode: 'pt', languageName: 'Portuguese', isActive: true, order: 5, direction: 'ltr' },
  { languageCode: 'sw', languageName: 'Kiswahili', isActive: true, order: 6, direction: 'ltr' }
]

const fallbackLanguages = SUPPORTED_LANGUAGES

export function normaliseLanguageCode(value) {
  const code = cleanText(value).toLowerCase()
  if (!code) return 'en'
  if (code === 'english') return 'en'
  if (code === 'isizulu' || code === 'isi-zulu' || code === 'zulu') return 'zu'
  if (code === 'french' || code === 'français' || code === 'francais') return 'fr'
  if (code === 'arabic' || code === 'العربية') return 'ar'
  if (code === 'portuguese' || code === 'português' || code === 'portugues') return 'pt'
  if (code === 'kiswahili' || code === 'swahili') return 'sw'
  return code
}

export function getLanguageDirection(languageCode) {
  // Keep the application layout left-to-right for every language so the sidebar,
  // cards and dashboards keep their original structure. Only the words change.
  normaliseLanguageCode(languageCode)
  return 'ltr'
}

function makeDictionary(entries) {
  return entries.reduce((dictionary, [key, value]) => {
    dictionary[key] = value
    return dictionary
  }, {})
}

const englishDictionary = makeDictionary([
  ['appName', 'GRIT Lab Africa'], ['gameName', 'AI for SDGs Card Game'], ['journey', 'Journey'], ['dashboard', 'Dashboard'], ['coins', 'GLA Coin'], ['certificate', 'Certificate'], ['profile', 'Profile'],
  ['achievements', 'Achievements'], ['levels', 'Levels'], ['leaderboard', 'Leaderboard'], ['analytics', 'Analytics'], ['language', 'Language'], ['settings', 'Settings'], ['multiplayer', 'Multiplayer'], ['rewards', 'Rewards'],
  ['progress', 'Progress'], ['experience', 'Experience'], ['completed', 'Completed'], ['average', 'Average'], ['coin', 'Coin'], ['close', 'Close'], ['playerSettings', 'Player settings'], ['accessibilitySettings', 'App settings and accessibility'], ['saveSettings', 'Save settings'],
  ['chooseLanguage', 'Choose language'], ['highContrast', 'High contrast'], ['largeText', 'Large text'], ['reduceMotion', 'Reduce motion'], ['cardFlip', 'Card flip animation'], ['soundEffects', 'Sound effects'], ['autoTranslate', 'Auto translate interface'], ['showCardImages', 'Show card images'], ['compactMode', 'Compact mode'], ['lowBandwidth', 'Low bandwidth mode'], ['keyboardMode', 'Keyboard friendly mode'], ['screenReaderLabels', 'Screen reader labels'], ['confirmBeforeSubmit', 'Confirm before submitting answers'],
  ['noData', 'No data found'], ['loading', 'Loading...'], ['active', 'Active'], ['inactive', 'Inactive'], ['search', 'Search'], ['filter', 'Filter'], ['adminDashboard', 'Admin Dashboard'], ['problemCards', 'Problem Cards'], ['aiCards', 'AI Cards'], ['sdgMappings', 'SDG Mappings'], ['scoringRubrics', 'Scoring Rubrics'], ['reports', 'Reports'], ['logout', 'Logout'], ['adminWorkspace', 'Admin workspace'],
  ['globalSettings', 'Global Settings'], ['languages', 'Languages'], ['playerAnalytics', 'Player Analytics'], ['playerDetails', 'Player Details'], ['walletAudit', 'GLA Coin Audit'], ['rooms', 'Rooms'], ['teamsDebates', 'Teams/Debates'], ['feedbackInbox', 'Feedback Inbox'], ['cardImages', 'Card Images'], ['certificates', 'Certificates'], ['backToPlayerApp', 'Back to Player App'], ['adminPortal', 'Admin Portal'],
  ['startQuest', 'Start Quest'], ['login', 'Login'], ['register', 'Register'], ['about', 'About'], ['contact', 'Contact'], ['exploreProject', 'Explore Project'], ['selected', 'Selected'], ['selectCard', 'Select Card'], ['tapToFlip', 'Tap to flip'], ['backToCover', 'Back to cover'], ['submitAnswer', 'Submit Answer'], ['saving', 'Saving...'], ['enabled', 'Enabled'], ['disabled', 'Disabled']
])

const baseTranslations = {
  en: englishDictionary,
  zu: makeDictionary([
    ['appName', 'GRIT Lab Africa'], ['gameName', 'Umdlalo Wamakhadi e-AI kuma-SDG'], ['journey', 'Uhambo'], ['dashboard', 'Ideshibhodi'], ['coins', 'Ama-GLA Coin'], ['certificate', 'Isitifiketi'], ['profile', 'Iphrofayela'],
    ['achievements', 'Impumelelo'], ['levels', 'Amazinga'], ['leaderboard', 'Ibhodi labaphambili'], ['analytics', 'Ukuhlaziya'], ['language', 'Ulimi'], ['settings', 'Izilungiselelo'], ['multiplayer', 'Abadlali abaningi'], ['rewards', 'Imivuzo'],
    ['progress', 'Inqubekelaphambili'], ['experience', 'Ulwazi'], ['completed', 'Kuqediwe'], ['average', 'Isilinganiso'], ['coin', 'Uhlamvu'], ['close', 'Vala'], ['playerSettings', 'Izilungiselelo zomdlali'], ['accessibilitySettings', 'Izilungiselelo zohlelo nokufinyeleleka'], ['saveSettings', 'Gcina izilungiselelo'],
    ['chooseLanguage', 'Khetha ulimi'], ['highContrast', 'Ukugqama okuphezulu'], ['largeText', 'Umbhalo omkhulu'], ['reduceMotion', 'Nciphisa ukunyakaza'], ['cardFlip', 'Ukuphenduka kwekhadi'], ['soundEffects', 'Imisindo'], ['autoTranslate', 'Humusha isixhumi ngokuzenzakalela'], ['showCardImages', 'Bonisa izithombe zamakhadi'], ['compactMode', 'Imodi emfushane'], ['lowBandwidth', 'Imodi yedatha encane'], ['keyboardMode', 'Imodi yekhibhodi'], ['screenReaderLabels', 'Amalebula okufunda isikrini'], ['confirmBeforeSubmit', 'Qinisekisa ngaphambi kokuthumela izimpendulo'],
    ['noData', 'Ayikho idatha etholakele'], ['loading', 'Iyalayisha...'], ['active', 'Kuyasebenza'], ['inactive', 'Akusebenzi'], ['search', 'Sesha'], ['filter', 'Hlunga'], ['adminDashboard', 'Ideshibhodi yomlawuli'], ['problemCards', 'Amakhadi Ezinkinga'], ['aiCards', 'Amakhadi e-AI'], ['sdgMappings', 'Ukuxhumanisa ama-SDG'], ['scoringRubrics', 'Imithetho yamaphuzu'], ['reports', 'Imibiko'], ['logout', 'Phuma'], ['adminWorkspace', 'Indawo yomlawuli'],
    ['globalSettings', 'Izilungiselelo zomhlaba'], ['languages', 'Izilimi'], ['playerAnalytics', 'Ukuhlaziya abadlali'], ['playerDetails', 'Imininingwane yomdlali'], ['walletAudit', 'Ukuhlola ama-GLA Coin'], ['rooms', 'Amagumbi'], ['teamsDebates', 'Amaqembu/Izingxoxo'], ['feedbackInbox', 'Ibhokisi lempendulo'], ['cardImages', 'Izithombe zamakhadi'], ['certificates', 'Izitifiketi'], ['backToPlayerApp', 'Buyela kuhlelo lomdlali'], ['adminPortal', 'Iphothali yomlawuli'],
    ['startQuest', 'Qala Uhambo'], ['login', 'Ngena'], ['register', 'Bhalisa'], ['about', 'Mayelana'], ['contact', 'Xhumana'], ['exploreProject', 'Hlola iphrojekthi'], ['selected', 'Kukhethiwe'], ['selectCard', 'Khetha ikhadi'], ['tapToFlip', 'Thinta ukuze uphendule'], ['backToCover', 'Buyela embozweni'], ['submitAnswer', 'Thumela impendulo'], ['saving', 'Kuyagcinwa...'], ['enabled', 'Kuvuliwe'], ['disabled', 'Kuvaliwe']
  ]),
  fr: makeDictionary([
    ['appName', 'GRIT Lab Africa'], ['gameName', 'Jeu de cartes IA pour les ODD'], ['journey', 'Parcours'], ['dashboard', 'Tableau de bord'], ['coins', 'Pièces GLA'], ['certificate', 'Certificat'], ['profile', 'Profil'],
    ['achievements', 'Réussites'], ['levels', 'Niveaux'], ['leaderboard', 'Classement'], ['analytics', 'Analytique'], ['language', 'Langue'], ['settings', 'Paramètres'], ['multiplayer', 'Multijoueur'], ['rewards', 'Récompenses'],
    ['progress', 'Progrès'], ['experience', 'Expérience'], ['completed', 'Terminé'], ['average', 'Moyenne'], ['coin', 'Pièce'], ['close', 'Fermer'], ['playerSettings', 'Paramètres du joueur'], ['accessibilitySettings', 'Paramètres de l’application et accessibilité'], ['saveSettings', 'Enregistrer les paramètres'],
    ['chooseLanguage', 'Choisir la langue'], ['highContrast', 'Contraste élevé'], ['largeText', 'Texte agrandi'], ['reduceMotion', 'Réduire les animations'], ['cardFlip', 'Animation de retournement des cartes'], ['soundEffects', 'Effets sonores'], ['autoTranslate', 'Traduire automatiquement l’interface'], ['showCardImages', 'Afficher les images des cartes'], ['compactMode', 'Mode compact'], ['lowBandwidth', 'Mode faible connexion'], ['keyboardMode', 'Mode clavier'], ['screenReaderLabels', 'Étiquettes pour lecteur d’écran'], ['confirmBeforeSubmit', 'Confirmer avant d’envoyer les réponses'],
    ['noData', 'Aucune donnée trouvée'], ['loading', 'Chargement...'], ['active', 'Actif'], ['inactive', 'Inactif'], ['search', 'Rechercher'], ['filter', 'Filtrer'], ['adminDashboard', 'Tableau de bord admin'], ['problemCards', 'Cartes problèmes'], ['aiCards', 'Cartes IA'], ['sdgMappings', 'Correspondances ODD'], ['scoringRubrics', 'Grilles de notation'], ['reports', 'Rapports'], ['logout', 'Déconnexion'], ['adminWorkspace', 'Espace administrateur'],
    ['globalSettings', 'Paramètres globaux'], ['languages', 'Langues'], ['playerAnalytics', 'Analytique des joueurs'], ['playerDetails', 'Détails du joueur'], ['walletAudit', 'Audit des pièces GLA'], ['rooms', 'Salles'], ['teamsDebates', 'Équipes/Débats'], ['feedbackInbox', 'Boîte de retours'], ['cardImages', 'Images des cartes'], ['certificates', 'Certificats'], ['backToPlayerApp', 'Retour à l’application joueur'], ['adminPortal', 'Portail administrateur'],
    ['startQuest', 'Commencer la quête'], ['login', 'Connexion'], ['register', 'Inscription'], ['about', 'À propos'], ['contact', 'Contact'], ['exploreProject', 'Explorer le projet'], ['selected', 'Sélectionné'], ['selectCard', 'Choisir la carte'], ['tapToFlip', 'Touchez pour retourner'], ['backToCover', 'Retour à la couverture'], ['submitAnswer', 'Envoyer la réponse'], ['saving', 'Enregistrement...'], ['enabled', 'Activé'], ['disabled', 'Désactivé']
  ]),
  ar: makeDictionary([
    ['appName', 'GRIT Lab Africa'], ['gameName', 'لعبة بطاقات الذكاء الاصطناعي لأهداف التنمية المستدامة'], ['journey', 'الرحلة'], ['dashboard', 'لوحة التحكم'], ['coins', 'عملات GLA'], ['certificate', 'الشهادة'], ['profile', 'الملف الشخصي'],
    ['achievements', 'الإنجازات'], ['levels', 'المستويات'], ['leaderboard', 'لوحة المتصدرين'], ['analytics', 'التحليلات'], ['language', 'اللغة'], ['settings', 'الإعدادات'], ['multiplayer', 'اللعب الجماعي'], ['rewards', 'المكافآت'],
    ['progress', 'التقدم'], ['experience', 'التجربة'], ['completed', 'مكتمل'], ['average', 'المتوسط'], ['coin', 'عملة'], ['close', 'إغلاق'], ['playerSettings', 'إعدادات اللاعب'], ['accessibilitySettings', 'إعدادات التطبيق وإمكانية الوصول'], ['saveSettings', 'حفظ الإعدادات'],
    ['chooseLanguage', 'اختر اللغة'], ['highContrast', 'تباين عالٍ'], ['largeText', 'نص كبير'], ['reduceMotion', 'تقليل الحركة'], ['cardFlip', 'حركة قلب البطاقة'], ['soundEffects', 'المؤثرات الصوتية'], ['autoTranslate', 'ترجمة الواجهة تلقائياً'], ['showCardImages', 'عرض صور البطاقات'], ['compactMode', 'الوضع المضغوط'], ['lowBandwidth', 'وضع البيانات المنخفضة'], ['keyboardMode', 'وضع مناسب للوحة المفاتيح'], ['screenReaderLabels', 'تسميات قارئ الشاشة'], ['confirmBeforeSubmit', 'التأكيد قبل إرسال الإجابات'],
    ['noData', 'لم يتم العثور على بيانات'], ['loading', 'جارٍ التحميل...'], ['active', 'نشط'], ['inactive', 'غير نشط'], ['search', 'بحث'], ['filter', 'تصفية'], ['adminDashboard', 'لوحة تحكم المدير'], ['problemCards', 'بطاقات المشكلات'], ['aiCards', 'بطاقات الذكاء الاصطناعي'], ['sdgMappings', 'ربط أهداف التنمية'], ['scoringRubrics', 'معايير التقييم'], ['reports', 'التقارير'], ['logout', 'تسجيل الخروج'], ['adminWorkspace', 'مساحة المدير'],
    ['globalSettings', 'الإعدادات العامة'], ['languages', 'اللغات'], ['playerAnalytics', 'تحليلات اللاعبين'], ['playerDetails', 'تفاصيل اللاعب'], ['walletAudit', 'مراجعة عملات GLA'], ['rooms', 'الغرف'], ['teamsDebates', 'الفرق/النقاشات'], ['feedbackInbox', 'صندوق الملاحظات'], ['cardImages', 'صور البطاقات'], ['certificates', 'الشهادات'], ['backToPlayerApp', 'العودة إلى تطبيق اللاعب'], ['adminPortal', 'بوابة المدير'],
    ['startQuest', 'ابدأ الرحلة'], ['login', 'تسجيل الدخول'], ['register', 'إنشاء حساب'], ['about', 'حول'], ['contact', 'اتصل'], ['exploreProject', 'استكشف المشروع'], ['selected', 'تم الاختيار'], ['selectCard', 'اختر البطاقة'], ['tapToFlip', 'اضغط للقلب'], ['backToCover', 'العودة للغلاف'], ['submitAnswer', 'إرسال الإجابة'], ['saving', 'جارٍ الحفظ...'], ['enabled', 'مفعل'], ['disabled', 'معطل']
  ]),
  pt: makeDictionary([
    ['appName', 'GRIT Lab Africa'], ['gameName', 'Jogo de Cartas de IA para os ODS'], ['journey', 'Jornada'], ['dashboard', 'Painel'], ['coins', 'Moedas GLA'], ['certificate', 'Certificado'], ['profile', 'Perfil'],
    ['achievements', 'Conquistas'], ['levels', 'Níveis'], ['leaderboard', 'Classificação'], ['analytics', 'Análises'], ['language', 'Idioma'], ['settings', 'Definições'], ['multiplayer', 'Multijogador'], ['rewards', 'Recompensas'],
    ['progress', 'Progresso'], ['experience', 'Experiência'], ['completed', 'Concluído'], ['average', 'Média'], ['coin', 'Moeda'], ['close', 'Fechar'], ['playerSettings', 'Definições do jogador'], ['accessibilitySettings', 'Definições da aplicação e acessibilidade'], ['saveSettings', 'Guardar definições'],
    ['chooseLanguage', 'Escolher idioma'], ['highContrast', 'Alto contraste'], ['largeText', 'Texto grande'], ['reduceMotion', 'Reduzir movimento'], ['cardFlip', 'Animação de virar carta'], ['soundEffects', 'Efeitos sonoros'], ['autoTranslate', 'Traduzir interface automaticamente'], ['showCardImages', 'Mostrar imagens das cartas'], ['compactMode', 'Modo compacto'], ['lowBandwidth', 'Modo de baixa largura de banda'], ['keyboardMode', 'Modo amigável ao teclado'], ['screenReaderLabels', 'Etiquetas para leitor de ecrã'], ['confirmBeforeSubmit', 'Confirmar antes de enviar respostas'],
    ['noData', 'Nenhum dado encontrado'], ['loading', 'A carregar...'], ['active', 'Ativo'], ['inactive', 'Inativo'], ['search', 'Pesquisar'], ['filter', 'Filtrar'], ['adminDashboard', 'Painel de administração'], ['problemCards', 'Cartas de problemas'], ['aiCards', 'Cartas de IA'], ['sdgMappings', 'Mapeamentos ODS'], ['scoringRubrics', 'Critérios de pontuação'], ['reports', 'Relatórios'], ['logout', 'Terminar sessão'], ['adminWorkspace', 'Área do administrador'],
    ['globalSettings', 'Definições globais'], ['languages', 'Idiomas'], ['playerAnalytics', 'Análises dos jogadores'], ['playerDetails', 'Detalhes do jogador'], ['walletAudit', 'Auditoria de moedas GLA'], ['rooms', 'Salas'], ['teamsDebates', 'Equipas/Debates'], ['feedbackInbox', 'Caixa de feedback'], ['cardImages', 'Imagens das cartas'], ['certificates', 'Certificados'], ['backToPlayerApp', 'Voltar à aplicação do jogador'], ['adminPortal', 'Portal de administração'],
    ['startQuest', 'Iniciar jornada'], ['login', 'Entrar'], ['register', 'Registar'], ['about', 'Sobre'], ['contact', 'Contacto'], ['exploreProject', 'Explorar projeto'], ['selected', 'Selecionado'], ['selectCard', 'Selecionar carta'], ['tapToFlip', 'Toque para virar'], ['backToCover', 'Voltar à capa'], ['submitAnswer', 'Enviar resposta'], ['saving', 'A guardar...'], ['enabled', 'Ativado'], ['disabled', 'Desativado']
  ]),
  sw: makeDictionary([
    ['appName', 'GRIT Lab Africa'], ['gameName', 'Mchezo wa Kadi za AI kwa SDG'], ['journey', 'Safari'], ['dashboard', 'Dashibodi'], ['coins', 'Sarafu za GLA'], ['certificate', 'Cheti'], ['profile', 'Wasifu'],
    ['achievements', 'Mafanikio'], ['levels', 'Viwango'], ['leaderboard', 'Ubao wa wanaoongoza'], ['analytics', 'Uchanganuzi'], ['language', 'Lugha'], ['settings', 'Mipangilio'], ['multiplayer', 'Wachezaji wengi'], ['rewards', 'Zawadi'],
    ['progress', 'Maendeleo'], ['experience', 'Uzoefu'], ['completed', 'Imekamilika'], ['average', 'Wastani'], ['coin', 'Sarafu'], ['close', 'Funga'], ['playerSettings', 'Mipangilio ya mchezaji'], ['accessibilitySettings', 'Mipangilio ya programu na ufikivu'], ['saveSettings', 'Hifadhi mipangilio'],
    ['chooseLanguage', 'Chagua lugha'], ['highContrast', 'Utofautishaji mkubwa'], ['largeText', 'Maandishi makubwa'], ['reduceMotion', 'Punguza mwendo'], ['cardFlip', 'Uhuishaji wa kugeuza kadi'], ['soundEffects', 'Athari za sauti'], ['autoTranslate', 'Tafsiri kiolesura kiotomatiki'], ['showCardImages', 'Onyesha picha za kadi'], ['compactMode', 'Hali fupi'], ['lowBandwidth', 'Hali ya data ndogo'], ['keyboardMode', 'Hali rafiki kwa kibodi'], ['screenReaderLabels', 'Lebo za kisoma skrini'], ['confirmBeforeSubmit', 'Thibitisha kabla ya kuwasilisha majibu'],
    ['noData', 'Hakuna data iliyopatikana'], ['loading', 'Inapakia...'], ['active', 'Amilifu'], ['inactive', 'Haifanyi kazi'], ['search', 'Tafuta'], ['filter', 'Chuja'], ['adminDashboard', 'Dashibodi ya msimamizi'], ['problemCards', 'Kadi za matatizo'], ['aiCards', 'Kadi za AI'], ['sdgMappings', 'Ulinganishaji wa SDG'], ['scoringRubrics', 'Vigezo vya alama'], ['reports', 'Ripoti'], ['logout', 'Ondoka'], ['adminWorkspace', 'Eneo la msimamizi'],
    ['globalSettings', 'Mipangilio ya jumla'], ['languages', 'Lugha'], ['playerAnalytics', 'Uchanganuzi wa wachezaji'], ['playerDetails', 'Maelezo ya mchezaji'], ['walletAudit', 'Ukaguzi wa sarafu za GLA'], ['rooms', 'Vyumba'], ['teamsDebates', 'Timu/Mijadala'], ['feedbackInbox', 'Sanduku la maoni'], ['cardImages', 'Picha za kadi'], ['certificates', 'Vyeti'], ['backToPlayerApp', 'Rudi kwenye programu ya mchezaji'], ['adminPortal', 'Lango la msimamizi'],
    ['startQuest', 'Anza safari'], ['login', 'Ingia'], ['register', 'Jisajili'], ['about', 'Kuhusu'], ['contact', 'Mawasiliano'], ['exploreProject', 'Chunguza mradi'], ['selected', 'Imechaguliwa'], ['selectCard', 'Chagua kadi'], ['tapToFlip', 'Gusa kugeuza'], ['backToCover', 'Rudi kwenye jalada'], ['submitAnswer', 'Wasilisha jibu'], ['saving', 'Inahifadhi...'], ['enabled', 'Imewashwa'], ['disabled', 'Imezimwa']
  ])
}

const commonSourcePhrases = [
  ['GRIT Lab Africa', 'appName'], ['AI for SDGs Card Game', 'gameName'], ['Journey', 'journey'], ['Dashboard', 'dashboard'], ['GLA Coin', 'coins'], ['GLA Coins', 'coins'], ['Certificate', 'certificate'], ['Profile', 'profile'],
  ['Achievements', 'achievements'], ['Levels', 'levels'], ['Leaderboard', 'leaderboard'], ['Analytics', 'analytics'], ['Language', 'language'], ['Settings', 'settings'], ['Multiplayer', 'multiplayer'], ['Rewards', 'rewards'],
  ['Progress', 'progress'], ['Experience', 'experience'], ['Completed', 'completed'], ['Average', 'average'], ['Coin', 'coin'], ['Close', 'close'], ['Player settings', 'playerSettings'], ['App settings and accessibility', 'accessibilitySettings'], ['Save settings', 'saveSettings'],
  ['Choose language', 'chooseLanguage'], ['High contrast', 'highContrast'], ['Large text', 'largeText'], ['Reduce motion', 'reduceMotion'], ['Card flip animation', 'cardFlip'], ['Sound effects', 'soundEffects'], ['Auto translate interface', 'autoTranslate'], ['Show card images', 'showCardImages'], ['Compact mode', 'compactMode'], ['Low bandwidth mode', 'lowBandwidth'], ['Keyboard friendly mode', 'keyboardMode'], ['Screen reader labels', 'screenReaderLabels'], ['Confirm before submitting answers', 'confirmBeforeSubmit'],
  ['No data found', 'noData'], ['Loading...', 'loading'], ['Active', 'active'], ['Inactive', 'inactive'], ['Search', 'search'], ['Filter', 'filter'], ['Admin Dashboard', 'adminDashboard'], ['Problem Cards', 'problemCards'], ['AI Cards', 'aiCards'], ['SDG Mappings', 'sdgMappings'], ['Scoring Rubrics', 'scoringRubrics'], ['Reports', 'reports'], ['Logout', 'logout'], ['Admin workspace', 'adminWorkspace'],
  ['Global Settings', 'globalSettings'], ['Languages', 'languages'], ['Player Analytics', 'playerAnalytics'], ['Player Details', 'playerDetails'], ['GLA Coin Audit', 'walletAudit'], ['Rooms', 'rooms'], ['Teams/Debates', 'teamsDebates'], ['Feedback Inbox', 'feedbackInbox'], ['Card Images', 'cardImages'], ['Certificates', 'certificates'], ['Back to Player App', 'backToPlayerApp'], ['Admin Portal', 'adminPortal'],
  ['Start Quest', 'startQuest'], ['Login', 'login'], ['Register', 'register'], ['About', 'about'], ['Contact', 'contact'], ['Explore Project', 'exploreProject'], ['Selected', 'selected'], ['Select Card', 'selectCard'], ['Tap to flip', 'tapToFlip'], ['Back to cover', 'backToCover'], ['Submit Answer', 'submitAnswer'], ['Saving...', 'saving'], ['Enabled', 'enabled'], ['Disabled', 'disabled'],
  ['Player achievements and badges', 'achievements'], ['Player levels and progression', 'levels'], ['GLA coin wallet', 'coins'], ['Player leaderboard', 'leaderboard'], ['Search and filter', 'search'], ['Current Balance', 'coins'], ['Total Earned', 'coins'], ['Total Spent', 'coins'], ['Current Level', 'levels'], ['Next Level', 'levels']
]

const uiPhraseCatalog = {
  "zu": {
    "AfriQuest Access": "Ukungena ku-AfriQuest",
    "Forgot password?": "Ukhohlwe iphasiwedi?",
    "Reset password": "Setha kabusha iphasiwedi",
    "Create account": "Dala i-akhawunti",
    "Welcome back": "Siyakwamukela futhi",
    "Email address": "Ikheli le-imeyili",
    "Send reset email": "Thumela i-imeyili yokusetha kabusha",
    "First name": "Igama",
    "Phone number": "Inombolo yocingo",
    "Please wait...": "Sicela ulinde...",
    "Create Account": "Dala i-akhawunti",
    "Already have an account? Login": "Usunayo i-akhawunti? Ngena",
    "Back to login": "Buyela ekungeneni",
    "No account yet? Register": "Awunayo i-akhawunti? Bhalisa",
    "Preparing your AI learning journey...": "Silungiselela uhambo lwakho lokufunda nge-AI...",
    "Admin Login": "Ukungena komlawuli",
    "Logout": "Phuma",
    "Start Quest": "Qala Uhambo",
    "Explore Project": "Hlola iphrojekthi",
    "About the project": "Mayelana nephrojekthi",
    "Contact us": "Xhumana nathi",
    "General Enquiries": "Imibuzo ejwayelekile",
    "Official Website": "Iwebhusayithi esemthethweni",
    "Visit GRIT Lab Africa": "Vakashela i-GRIT Lab Africa",
    "Project Showroom": "Umbukiso wephrojekthi",
    "Explore the Showroom": "Hlola umbukiso",
    "Powered by GRIT Lab Africa": "Ixhaswe yi-GRIT Lab Africa",
    "Problem cards": "Amakhadi ezinkinga",
    "Solution cards": "Amakhadi ezixazululo",
    "Learning rewards": "Imivuzo yokufunda",
    "How the game works": "Indlela umdlalo osebenza ngayo",
    "Educational purpose": "Inhloso yezemfundo",
    "Start learning": "Qala ukufunda",
    "Journey": "Uhambo",
    "Dashboard": "Ideshibhodi",
    "Certificate": "Isitifiketi",
    "Profile": "Iphrofayela",
    "Achievements": "Impumelelo",
    "Levels": "Amazinga",
    "Leaderboard": "Ibhodi labaphambili",
    "Analytics": "Ukuhlaziya",
    "Settings": "Izilungiselelo",
    "Multiplayer": "Abadlali abaningi",
    "Rewards": "Imivuzo",
    "completed": "kuqediwe",
    "Completed": "Kuqediwe",
    "Average": "Isilinganiso",
    "balance": "ibhalansi",
    "Unlocked": "Kuvuliwe",
    "Player details": "Imininingwane yomdlali",
    "App settings": "Izilungiselelo zohlelo",
    "Rooms": "Amagumbi",
    "Launch rewards": "Imivuzo yokuqalisa",
    "Badges": "Amabheji",
    "Rankings": "Amazinga",
    "No score yet": "Awekho amaphuzu okwamanje",
    "Updated": "Kubuyekeziwe",
    "Loading game cards": "Kulayishwa amakhadi omdlalo",
    "Loading dashboard": "Kulayishwa ideshibhodi",
    "Loading certificate": "Kulayishwa isitifiketi",
    "Loading profile": "Kulayishwa iphrofayela",
    "Loading analytics": "Kulayishwa ukuhlaziya",
    "No active game yet": "Awukho umdlalo osebenzayo okwamanje",
    "Choose your problem cards first.": "Khetha amakhadi ezinkinga kuqala.",
    "Go to Problem Selection": "Iya ekukhetheni izinkinga",
    "Welcome back,": "Siyakwamukela futhi,",
    "Build your AI solution.": "Yakha isixazululo sakho se-AI.",
    "Current Problem": "Inkinga yamanje",
    "Problem Card": "Ikhadi lenkinga",
    "Problem Card Revealed": "Ikhadi lenkinga liveziwe",
    "Click to reveal the full problem card.": "Chofoza ukuveza ikhadi lenkinga eligcwele.",
    "Click again to return to the cover.": "Chofoza futhi ukubuyela embozweni.",
    "Step 1": "Isinyathelo 1",
    "Step 2": "Isinyathelo 2",
    "Step 3": "Isinyathelo 3",
    "Choose your AI cards first.": "Khetha amakhadi akho e-AI kuqala.",
    "Selected AI solution cards.": "Amakhadi e-AI akhethiwe esixazululo.",
    "Choose or drag up to 3 AI cards here.": "Khetha noma hudula amakhadi e-AI afinyelela ku-3 lapha.",
    "Explain why you chose those AI cards.": "Chaza ukuthi kungani ukhethe lawo makhadi e-AI.",
    "Submit Answer": "Thumela impendulo",
    "Checking your solution...": "Sihlola isixazululo sakho...",
    "Live multiplayer arena": "Inkundla ebukhoma yabadlali abaningi",
    "Create rooms, request access, open lobbies, start rounds, submit answers, end sessions and track timestamps.": "Dala amagumbi, cela ukufinyelela, vula amalobhi, qala imizuliswano, thumela izimpendulo, uqede izikhathi futhi ulandele izikhathi.",
    "Live summary": "Isifinyezo esibukhoma",
    "All modes": "Zonke izindlela",
    "Room name": "Igama legumbi",
    "Quest / event theme": "Itimu yohambo / umcimbi",
    "Max players": "Abadlali abaningi kakhulu",
    "Create room and open lobby": "Dala igumbi bese uvula ilobhi",
    "Room code": "Ikhodi yegumbi",
    "Join room by code": "Joyina igumbi ngekhodi",
    "Back to Rooms": "Buyela emagumbini",
    "Players and live status": "Abadlali nesimo esibukhoma",
    "Invites and access requests": "Izimemo nezicelo zokufinyelela",
    "Invite player by email or UID": "Mema umdlali nge-imeyili noma i-UID",
    "Send room invite": "Thumela isimemo segumbi",
    "Notifications": "Izaziso",
    "Live invites and requests": "Izimemo nezicelo ezibukhoma",
    "No multiplayer notifications yet.": "Azikho izaziso zabadlali abaningi okwamanje.",
    "Open / Accept": "Vula / Yamukela",
    "Decline": "Nqaba",
    "Read": "Fundiwe",
    "Pending access requests": "Izicelo zokufinyelela ezisalindile",
    "Accept": "Yamukela",
    "Team name": "Igama leqembu",
    "Create Team": "Dala iqembu",
    "Teams": "Amaqembu",
    "No teams yet.": "Awekho amaqembu okwamanje.",
    "Delete Team": "Susa iqembu",
    "Debate prompt": "Isihloko sengxoxo",
    "Save Debate Prompt": "Gcina isihloko sengxoxo",
    "Vote category": "Isigaba sokuvota",
    "Submit Debate Vote": "Thumela ivoti lengxoxo",
    "Tournament title": "Isihloko sethumente",
    "Start Tournament": "Qala itournament",
    "Finish Tournament and Finalise Ranks": "Qeda itournament bese uqinisekisa amazinga",
    "Room activity log": "Ilogi yomsebenzi wegumbi",
    "Clear all logs": "Sula wonke amalogi",
    "No activity yet.": "Akukho msebenzi okwamanje.",
    "Challenge Mode": "Imodi Yenselelo",
    "Team Mode": "Imodi Yeqembu",
    "Debate Mode": "Imodi Yengxoxo",
    "Tournament Mode": "Imodi Yomqhudelwano",
    "Create Event": "Dala umcimbi",
    "Join / Request": "Joyina / Cela",
    "Open Lobby": "Vula ilobhi",
    "Request Access": "Cela ukufinyelela",
    "Join Room": "Joyina igumbi",
    "Start Challenge": "Qala inselelo",
    "Submit Challenge Answer": "Thumela impendulo yenselelo",
    "Submit Team Solution": "Thumela isixazululo seqembu",
    "Submit Debate Argument": "Thumela impikiswano yengxoxo",
    "Submit Tournament Round": "Thumela umzuliswano wethumente",
    "Live timeline": "Umugqa wesikhathi obukhoma",
    "Loading live multiplayer data...": "Kulayishwa idatha yabadlali abaningi ebukhoma...",
    "No lobby opened.": "Ayikho ilobhi evuliwe.",
    "Back to Home": "Buyela ekhaya",
    "Scoring in progress": "Ukubalwa kwamaphuzu kuyaqhubeka",
    "Please wait while the system checks relevance, feasibility, SDG alignment, creativity and responsible use.": "Sicela ulinde ngesikhathi uhlelo luhlola ukufaneleka, ukusebenza, ukuhambisana nama-SDG, ubuciko nokusetshenziswa okuphephile.",
    "Player settings": "Izilungiselelo zomdlali",
    "Professional player settings": "Izilungiselelo zomdlali ezisezingeni",
    "Player experience controls": "Izilawuli zolwazi lomdlali",
    "Choose one language for the full system.": "Khetha ulimi olulodwa lohlelo lonke.",
    "Preferred language": "Ulimi olukhethwayo",
    "Accessibility": "Ukufinyeleleka",
    "Make AfriQuest easier to read and use.": "Yenza i-AfriQuest ibe lula ukuyifunda nokuyisebenzisa.",
    "Game display": "Ukuboniswa komdlalo",
    "Control how game cards behave.": "Lawula indlela amakhadi omdlalo aziphatha ngayo.",
    "High contrast": "Ukugqama okuphezulu",
    "Large text": "Umbhalo omkhulu",
    "Reduce motion": "Nciphisa ukunyakaza",
    "Compact mode": "Imodi emfushane",
    "Enabled": "Kuvuliwe",
    "Disabled": "Kuvaliwe",
    "Save settings": "Gcina izilungiselelo",
    "Settings saved. Refreshing the system so the new language applies everywhere...": "Izilungiselelo zigciniwe. Kuvuselelwa uhlelo ukuze ulimi olusha lusebenze yonke indawo...",
    "Settings saved to the system and applied across the player system.": "Izilungiselelo zigciniwe ohlelweni futhi zasebenza kuhlelo lomdlali.",
    "Admin Dashboard": "Ideshibhodi yomlawuli",
    "Problem Cards": "Amakhadi ezinkinga",
    "AI Cards": "Amakhadi e-AI",
    "SDG Mappings": "Ukuxhumanisa ama-SDG",
    "Scoring Rubrics": "Imithetho yamaphuzu",
    "Global Settings": "Izilungiselelo zomhlaba",
    "Player Analytics": "Ukuhlaziya abadlali",
    "Player Details": "Imininingwane yomdlali",
    "Feedback Inbox": "Ibhokisi lempendulo",
    "Card Images": "Izithombe zamakhadi",
    "Admin Portal": "Iphothali yomlawuli",
    "Admin workspace": "Indawo yomlawuli",
    "Back to Player App": "Buyela kuhlelo lomdlali",
    "Signed in as": "Ungene njengo",
    "Overview": "Ukubuka konke",
    "Cards": "Amakhadi",
    "Deck": "Idekhi",
    "Rules": "Imithetho",
    "Add languages": "Engeza izilimi",
    "Accounts": "Ama-akhawunti",
    "Wallets": "Ama-wallet",
    "Moderation": "Ukuqondisa",
    "Modes": "Izindlela",
    "Issues": "Izinkinga",
    "Assets": "Ama-asethi",
    "Templates": "Izifanekiso",
    "Impact": "Umthelela",
    "Export": "Khipha"
  },
  "fr": {
    "AfriQuest Access": "Accès AfriQuest",
    "Forgot password?": "Mot de passe oublié ?",
    "Reset password": "Réinitialiser le mot de passe",
    "Create account": "Créer un compte",
    "Welcome back": "Bon retour",
    "Email address": "Adresse e-mail",
    "Send reset email": "Envoyer l’e-mail de réinitialisation",
    "First name": "Prénom",
    "Phone number": "Numéro de téléphone",
    "Please wait...": "Veuillez patienter...",
    "Create Account": "Créer un compte",
    "Already have an account? Login": "Vous avez déjà un compte ? Connexion",
    "Back to login": "Retour à la connexion",
    "No account yet? Register": "Pas encore de compte ? Inscription",
    "Preparing your AI learning journey...": "Préparation de votre parcours d’apprentissage IA...",
    "Admin Login": "Connexion administrateur",
    "Logout": "Déconnexion",
    "Start Quest": "Commencer la quête",
    "Explore Project": "Explorer le projet",
    "About the project": "À propos du projet",
    "Contact us": "Contactez-nous",
    "General Enquiries": "Demandes générales",
    "Official Website": "Site officiel",
    "Visit GRIT Lab Africa": "Visiter GRIT Lab Africa",
    "Project Showroom": "Vitrine du projet",
    "Explore the Showroom": "Explorer la vitrine",
    "Powered by GRIT Lab Africa": "Propulsé par GRIT Lab Africa",
    "Problem cards": "Cartes problèmes",
    "Solution cards": "Cartes solutions",
    "Learning rewards": "Récompenses d’apprentissage",
    "How the game works": "Fonctionnement du jeu",
    "Educational purpose": "Objectif éducatif",
    "Start learning": "Commencer à apprendre",
    "Journey": "Parcours",
    "Dashboard": "Tableau de bord",
    "Certificate": "Certificat",
    "Profile": "Profil",
    "Achievements": "Réussites",
    "Levels": "Niveaux",
    "Leaderboard": "Classement",
    "Analytics": "Analytique",
    "Settings": "Paramètres",
    "Multiplayer": "Multijoueur",
    "Rewards": "Récompenses",
    "completed": "terminé",
    "Completed": "Terminé",
    "Average": "Moyenne",
    "balance": "solde",
    "Unlocked": "Débloqué",
    "Player details": "Détails du joueur",
    "App settings": "Paramètres de l’application",
    "Rooms": "Salles",
    "Launch rewards": "Récompenses de lancement",
    "Badges": "Badges",
    "Rankings": "Classements",
    "No score yet": "Pas encore de score",
    "Updated": "Mis à jour",
    "Loading game cards": "Chargement des cartes du jeu",
    "Loading dashboard": "Chargement du tableau de bord",
    "Loading certificate": "Chargement du certificat",
    "Loading profile": "Chargement du profil",
    "Loading analytics": "Chargement des analyses",
    "No active game yet": "Aucun jeu actif pour le moment",
    "Choose your problem cards first.": "Choisissez d’abord vos cartes problèmes.",
    "Go to Problem Selection": "Aller à la sélection des problèmes",
    "Welcome back,": "Bon retour,",
    "Build your AI solution.": "Construisez votre solution IA.",
    "Current Problem": "Problème actuel",
    "Problem Card": "Carte problème",
    "Problem Card Revealed": "Carte problème révélée",
    "Click to reveal the full problem card.": "Cliquez pour révéler toute la carte problème.",
    "Click again to return to the cover.": "Cliquez encore pour revenir à la couverture.",
    "Step 1": "Étape 1",
    "Step 2": "Étape 2",
    "Step 3": "Étape 3",
    "Choose your AI cards first.": "Choisissez d’abord vos cartes IA.",
    "Selected AI solution cards.": "Cartes de solution IA sélectionnées.",
    "Choose or drag up to 3 AI cards here.": "Choisissez ou glissez jusqu’à 3 cartes IA ici.",
    "Explain why you chose those AI cards.": "Expliquez pourquoi vous avez choisi ces cartes IA.",
    "Submit Answer": "Envoyer la réponse",
    "Checking your solution...": "Vérification de votre solution...",
    "Live multiplayer arena": "Arène multijoueur en direct",
    "Create rooms, request access, open lobbies, start rounds, submit answers, end sessions and track timestamps.": "Créez des salles, demandez l’accès, ouvrez des lobbies, lancez des manches, envoyez des réponses, terminez les sessions et suivez les horodatages.",
    "Live summary": "Résumé en direct",
    "All modes": "Tous les modes",
    "Room name": "Nom de la salle",
    "Quest / event theme": "Thème de quête / événement",
    "Max players": "Joueurs maximum",
    "Create room and open lobby": "Créer la salle et ouvrir le lobby",
    "Room code": "Code de salle",
    "Join room by code": "Rejoindre par code",
    "Back to Rooms": "Retour aux salles",
    "Players and live status": "Joueurs et statut en direct",
    "Invites and access requests": "Invitations et demandes d’accès",
    "Invite player by email or UID": "Inviter un joueur par e-mail ou UID",
    "Send room invite": "Envoyer l’invitation de salle",
    "Notifications": "Notifications",
    "Live invites and requests": "Invitations et demandes en direct",
    "No multiplayer notifications yet.": "Aucune notification multijoueur pour le moment.",
    "Open / Accept": "Ouvrir / Accepter",
    "Decline": "Refuser",
    "Read": "Lu",
    "Pending access requests": "Demandes d’accès en attente",
    "Accept": "Accepter",
    "Team name": "Nom de l’équipe",
    "Create Team": "Créer une équipe",
    "Teams": "Équipes",
    "No teams yet.": "Aucune équipe pour le moment.",
    "Delete Team": "Supprimer l’équipe",
    "Debate prompt": "Sujet du débat",
    "Save Debate Prompt": "Enregistrer le sujet du débat",
    "Vote category": "Catégorie de vote",
    "Submit Debate Vote": "Envoyer le vote du débat",
    "Tournament title": "Titre du tournoi",
    "Start Tournament": "Lancer le tournoi",
    "Finish Tournament and Finalise Ranks": "Terminer le tournoi et finaliser les rangs",
    "Room activity log": "Journal d’activité de la salle",
    "Clear all logs": "Effacer tous les journaux",
    "No activity yet.": "Aucune activité pour le moment.",
    "Challenge Mode": "Mode défi",
    "Team Mode": "Mode équipe",
    "Debate Mode": "Mode débat",
    "Tournament Mode": "Mode tournoi",
    "Create Event": "Créer un événement",
    "Join / Request": "Rejoindre / Demander",
    "Open Lobby": "Ouvrir le lobby",
    "Request Access": "Demander l’accès",
    "Join Room": "Rejoindre la salle",
    "Start Challenge": "Lancer le défi",
    "Submit Challenge Answer": "Envoyer la réponse du défi",
    "Submit Team Solution": "Envoyer la solution d’équipe",
    "Submit Debate Argument": "Envoyer l’argument du débat",
    "Submit Tournament Round": "Envoyer la manche du tournoi",
    "Live timeline": "Chronologie en direct",
    "Loading live multiplayer data...": "Chargement des données multijoueur en direct...",
    "No lobby opened.": "Aucun lobby ouvert.",
    "Back to Home": "Retour à l’accueil",
    "Scoring in progress": "Notation en cours",
    "Please wait while the system checks relevance, feasibility, SDG alignment, creativity and responsible use.": "Veuillez patienter pendant que le système vérifie la pertinence, la faisabilité, l’alignement ODD, la créativité et l’usage responsable.",
    "Player settings": "Paramètres du joueur",
    "Professional player settings": "Paramètres professionnels du joueur",
    "Player experience controls": "Contrôles de l’expérience joueur",
    "Choose one language for the full system.": "Choisissez une langue pour tout le système.",
    "Preferred language": "Langue préférée",
    "Accessibility": "Accessibilité",
    "Make AfriQuest easier to read and use.": "Rendre AfriQuest plus facile à lire et à utiliser.",
    "Game display": "Affichage du jeu",
    "Control how game cards behave.": "Contrôlez le comportement des cartes du jeu.",
    "High contrast": "Contraste élevé",
    "Large text": "Texte agrandi",
    "Reduce motion": "Réduire les animations",
    "Compact mode": "Mode compact",
    "Enabled": "Activé",
    "Disabled": "Désactivé",
    "Save settings": "Enregistrer les paramètres",
    "Settings saved. Refreshing the system so the new language applies everywhere...": "Paramètres enregistrés. Actualisation du système pour appliquer la nouvelle langue partout...",
    "Settings saved to the system and applied across the player system.": "Paramètres enregistrés dans le système et appliqués à l’espace joueur.",
    "Admin Dashboard": "Tableau de bord admin",
    "Problem Cards": "Cartes problèmes",
    "AI Cards": "Cartes IA",
    "SDG Mappings": "Correspondances ODD",
    "Scoring Rubrics": "Grilles de notation",
    "Global Settings": "Paramètres globaux",
    "Player Analytics": "Analytique des joueurs",
    "Player Details": "Détails du joueur",
    "Feedback Inbox": "Boîte de retours",
    "Card Images": "Images des cartes",
    "Admin Portal": "Portail administrateur",
    "Admin workspace": "Espace administrateur",
    "Back to Player App": "Retour à l’application joueur",
    "Signed in as": "Connecté en tant que",
    "Overview": "Vue d’ensemble",
    "Cards": "Cartes",
    "Deck": "Deck",
    "Rules": "Règles",
    "Add languages": "Ajouter des langues",
    "Accounts": "Comptes",
    "Wallets": "Portefeuilles",
    "Moderation": "Modération",
    "Modes": "Modes",
    "Issues": "Problèmes",
    "Assets": "Ressources",
    "Templates": "Modèles",
    "Impact": "Impact",
    "Export": "Exporter"
  },
  "ar": {
    "AfriQuest Access": "دخول AfriQuest",
    "Forgot password?": "هل نسيت كلمة المرور؟",
    "Reset password": "إعادة تعيين كلمة المرور",
    "Create account": "إنشاء حساب",
    "Welcome back": "مرحباً بعودتك",
    "Email address": "عنوان البريد الإلكتروني",
    "Send reset email": "إرسال بريد إعادة التعيين",
    "First name": "الاسم الأول",
    "Phone number": "رقم الهاتف",
    "Please wait...": "يرجى الانتظار...",
    "Create Account": "إنشاء حساب",
    "Already have an account? Login": "لديك حساب بالفعل؟ سجّل الدخول",
    "Back to login": "العودة إلى تسجيل الدخول",
    "No account yet? Register": "ليس لديك حساب؟ سجّل",
    "Preparing your AI learning journey...": "جارٍ تجهيز رحلة تعلم الذكاء الاصطناعي...",
    "Admin Login": "دخول المسؤول",
    "Logout": "تسجيل الخروج",
    "Start Quest": "ابدأ المهمة",
    "Explore Project": "استكشف المشروع",
    "About the project": "حول المشروع",
    "Contact us": "اتصل بنا",
    "General Enquiries": "استفسارات عامة",
    "Official Website": "الموقع الرسمي",
    "Visit GRIT Lab Africa": "زر GRIT Lab Africa",
    "Project Showroom": "معرض المشروع",
    "Explore the Showroom": "استكشف المعرض",
    "Powered by GRIT Lab Africa": "بدعم من GRIT Lab Africa",
    "Problem cards": "بطاقات المشكلات",
    "Solution cards": "بطاقات الحلول",
    "Learning rewards": "مكافآت التعلم",
    "How the game works": "كيف تعمل اللعبة",
    "Educational purpose": "الغرض التعليمي",
    "Start learning": "ابدأ التعلم",
    "Journey": "الرحلة",
    "Dashboard": "لوحة التحكم",
    "Certificate": "شهادة",
    "Profile": "الملف الشخصي",
    "Achievements": "الإنجازات",
    "Levels": "المستويات",
    "Leaderboard": "لوحة الصدارة",
    "Analytics": "التحليلات",
    "Settings": "الإعدادات",
    "Multiplayer": "تعدد اللاعبين",
    "Rewards": "المكافآت",
    "completed": "مكتمل",
    "Completed": "مكتمل",
    "Average": "المتوسط",
    "balance": "الرصيد",
    "Unlocked": "مفتوح",
    "Player details": "تفاصيل اللاعب",
    "App settings": "إعدادات التطبيق",
    "Rooms": "الغرف",
    "Launch rewards": "مكافآت الإطلاق",
    "Badges": "الشارات",
    "Rankings": "الترتيبات",
    "No score yet": "لا توجد نتيجة بعد",
    "Updated": "تم التحديث",
    "Loading game cards": "جارٍ تحميل بطاقات اللعبة",
    "Loading dashboard": "جارٍ تحميل لوحة التحكم",
    "Loading certificate": "جارٍ تحميل الشهادة",
    "Loading profile": "جارٍ تحميل الملف الشخصي",
    "Loading analytics": "جارٍ تحميل التحليلات",
    "No active game yet": "لا توجد لعبة نشطة حالياً",
    "Choose your problem cards first.": "اختر بطاقات المشكلات أولاً.",
    "Go to Problem Selection": "اذهب لاختيار المشكلات",
    "Welcome back,": "مرحباً بعودتك،",
    "Build your AI solution.": "ابنِ حل الذكاء الاصطناعي الخاص بك.",
    "Current Problem": "المشكلة الحالية",
    "Problem Card": "بطاقة المشكلة",
    "Problem Card Revealed": "تم كشف بطاقة المشكلة",
    "Click to reveal the full problem card.": "انقر لكشف بطاقة المشكلة كاملة.",
    "Click again to return to the cover.": "انقر مرة أخرى للعودة إلى الغلاف.",
    "Step 1": "الخطوة 1",
    "Step 2": "الخطوة 2",
    "Step 3": "الخطوة 3",
    "Choose your AI cards first.": "اختر بطاقات الذكاء الاصطناعي أولاً.",
    "Selected AI solution cards.": "بطاقات حل الذكاء الاصطناعي المختارة.",
    "Choose or drag up to 3 AI cards here.": "اختر أو اسحب حتى 3 بطاقات ذكاء اصطناعي هنا.",
    "Explain why you chose those AI cards.": "اشرح لماذا اخترت بطاقات الذكاء الاصطناعي هذه.",
    "Submit Answer": "إرسال الإجابة",
    "Checking your solution...": "جارٍ فحص الحل الخاص بك...",
    "Live multiplayer arena": "ساحة تعدد اللاعبين المباشرة",
    "Create rooms, request access, open lobbies, start rounds, submit answers, end sessions and track timestamps.": "أنشئ غرفاً واطلب الوصول وافتح الردهات وابدأ الجولات وأرسل الإجابات وأنهِ الجلسات وتتبع الأوقات.",
    "Live summary": "ملخص مباشر",
    "All modes": "كل الأوضاع",
    "Room name": "اسم الغرفة",
    "Quest / event theme": "موضوع المهمة / الحدث",
    "Max players": "الحد الأقصى للاعبين",
    "Create room and open lobby": "إنشاء الغرفة وفتح الردهة",
    "Room code": "رمز الغرفة",
    "Join room by code": "انضم للغرفة بالرمز",
    "Back to Rooms": "العودة إلى الغرف",
    "Players and live status": "اللاعبون والحالة المباشرة",
    "Invites and access requests": "الدعوات وطلبات الوصول",
    "Invite player by email or UID": "ادعُ لاعباً بالبريد الإلكتروني أو UID",
    "Send room invite": "إرسال دعوة الغرفة",
    "Notifications": "الإشعارات",
    "Live invites and requests": "دعوات وطلبات مباشرة",
    "No multiplayer notifications yet.": "لا توجد إشعارات تعدد لاعبين بعد.",
    "Open / Accept": "فتح / قبول",
    "Decline": "رفض",
    "Read": "مقروء",
    "Pending access requests": "طلبات وصول معلقة",
    "Accept": "قبول",
    "Team name": "اسم الفريق",
    "Create Team": "إنشاء فريق",
    "Teams": "الفرق",
    "No teams yet.": "لا توجد فرق بعد.",
    "Delete Team": "حذف الفريق",
    "Debate prompt": "موضوع النقاش",
    "Save Debate Prompt": "حفظ موضوع النقاش",
    "Vote category": "فئة التصويت",
    "Submit Debate Vote": "إرسال تصويت النقاش",
    "Tournament title": "عنوان البطولة",
    "Start Tournament": "بدء البطولة",
    "Finish Tournament and Finalise Ranks": "إنهاء البطولة وتأكيد الترتيب",
    "Room activity log": "سجل نشاط الغرفة",
    "Clear all logs": "مسح كل السجلات",
    "No activity yet.": "لا يوجد نشاط بعد.",
    "Challenge Mode": "وضع التحدي",
    "Team Mode": "وضع الفريق",
    "Debate Mode": "وضع النقاش",
    "Tournament Mode": "وضع البطولة",
    "Create Event": "إنشاء حدث",
    "Join / Request": "انضم / اطلب",
    "Open Lobby": "فتح الردهة",
    "Request Access": "طلب الوصول",
    "Join Room": "انضم للغرفة",
    "Start Challenge": "بدء التحدي",
    "Submit Challenge Answer": "إرسال إجابة التحدي",
    "Submit Team Solution": "إرسال حل الفريق",
    "Submit Debate Argument": "إرسال حجة النقاش",
    "Submit Tournament Round": "إرسال جولة البطولة",
    "Live timeline": "الخط الزمني المباشر",
    "Loading live multiplayer data...": "جارٍ تحميل بيانات تعدد اللاعبين المباشرة...",
    "No lobby opened.": "لا توجد ردهة مفتوحة.",
    "Back to Home": "العودة للرئيسية",
    "Scoring in progress": "جارٍ احتساب النقاط",
    "Please wait while the system checks relevance, feasibility, SDG alignment, creativity and responsible use.": "يرجى الانتظار بينما يفحص النظام الملاءمة والجدوى ومواءمة أهداف التنمية المستدامة والإبداع والاستخدام المسؤول.",
    "Player settings": "إعدادات اللاعب",
    "Professional player settings": "إعدادات اللاعب الاحترافية",
    "Player experience controls": "عناصر التحكم بتجربة اللاعب",
    "Choose one language for the full system.": "اختر لغة واحدة للنظام بالكامل.",
    "Preferred language": "اللغة المفضلة",
    "Accessibility": "إتاحة الوصول",
    "Make AfriQuest easier to read and use.": "اجعل AfriQuest أسهل للقراءة والاستخدام.",
    "Game display": "عرض اللعبة",
    "Control how game cards behave.": "تحكم في طريقة عمل بطاقات اللعبة.",
    "High contrast": "تباين عالٍ",
    "Large text": "نص كبير",
    "Reduce motion": "تقليل الحركة",
    "Compact mode": "وضع مضغوط",
    "Enabled": "مفعل",
    "Disabled": "معطل",
    "Save settings": "حفظ الإعدادات",
    "Settings saved. Refreshing the system so the new language applies everywhere...": "تم حفظ الإعدادات. جارٍ تحديث النظام لتطبيق اللغة الجديدة في كل مكان...",
    "Settings saved to the system and applied across the player system.": "تم حفظ الإعدادات في النظام وتطبيقها في نظام اللاعب.",
    "Admin Dashboard": "لوحة تحكم المسؤول",
    "Problem Cards": "بطاقات المشكلات",
    "AI Cards": "بطاقات الذكاء الاصطناعي",
    "SDG Mappings": "ربط أهداف التنمية المستدامة",
    "Scoring Rubrics": "معايير التقييم",
    "Global Settings": "الإعدادات العامة",
    "Player Analytics": "تحليلات اللاعبين",
    "Player Details": "تفاصيل اللاعب",
    "Feedback Inbox": "صندوق الملاحظات",
    "Card Images": "صور البطاقات",
    "Admin Portal": "بوابة المسؤول",
    "Admin workspace": "مساحة عمل المسؤول",
    "Back to Player App": "العودة لتطبيق اللاعب",
    "Signed in as": "تم تسجيل الدخول باسم",
    "Overview": "نظرة عامة",
    "Cards": "بطاقات",
    "Deck": "مجموعة",
    "Rules": "القواعد",
    "Add languages": "إضافة لغات",
    "Accounts": "الحسابات",
    "Wallets": "المحافظ",
    "Moderation": "الإشراف",
    "Modes": "الأوضاع",
    "Issues": "المشكلات",
    "Assets": "الأصول",
    "Templates": "القوالب",
    "Impact": "الأثر",
    "Export": "تصدير"
  },
  "pt": {
    "AfriQuest Access": "Acesso ao AfriQuest",
    "Forgot password?": "Esqueceu a palavra-passe?",
    "Reset password": "Repor palavra-passe",
    "Create account": "Criar conta",
    "Welcome back": "Bem-vindo de volta",
    "Email address": "Endereço de e-mail",
    "Send reset email": "Enviar e-mail de reposição",
    "First name": "Nome próprio",
    "Phone number": "Número de telefone",
    "Please wait...": "Aguarde...",
    "Create Account": "Criar conta",
    "Already have an account? Login": "Já tem conta? Iniciar sessão",
    "Back to login": "Voltar ao início de sessão",
    "No account yet? Register": "Ainda sem conta? Registar",
    "Preparing your AI learning journey...": "A preparar a sua jornada de aprendizagem de IA...",
    "Admin Login": "Início de sessão do administrador",
    "Logout": "Terminar sessão",
    "Start Quest": "Iniciar missão",
    "Explore Project": "Explorar projeto",
    "About the project": "Sobre o projeto",
    "Contact us": "Contacte-nos",
    "General Enquiries": "Consultas gerais",
    "Official Website": "Site oficial",
    "Visit GRIT Lab Africa": "Visitar GRIT Lab Africa",
    "Project Showroom": "Mostruário do projeto",
    "Explore the Showroom": "Explorar o mostruário",
    "Powered by GRIT Lab Africa": "Com o apoio da GRIT Lab Africa",
    "Problem cards": "Cartas de problemas",
    "Solution cards": "Cartas de solução",
    "Learning rewards": "Recompensas de aprendizagem",
    "How the game works": "Como o jogo funciona",
    "Educational purpose": "Objetivo educativo",
    "Start learning": "Começar a aprender",
    "Journey": "Jornada",
    "Dashboard": "Painel",
    "Certificate": "Certificado",
    "Profile": "Perfil",
    "Achievements": "Conquistas",
    "Levels": "Níveis",
    "Leaderboard": "Classificação",
    "Analytics": "Análises",
    "Settings": "Definições",
    "Multiplayer": "Multijogador",
    "Rewards": "Recompensas",
    "completed": "concluído",
    "Completed": "Concluído",
    "Average": "Média",
    "balance": "saldo",
    "Unlocked": "Desbloqueado",
    "Player details": "Detalhes do jogador",
    "App settings": "Definições da aplicação",
    "Rooms": "Salas",
    "Launch rewards": "Recompensas de lançamento",
    "Badges": "Distintivos",
    "Rankings": "Classificações",
    "No score yet": "Ainda sem pontuação",
    "Updated": "Atualizado",
    "Loading game cards": "A carregar cartas do jogo",
    "Loading dashboard": "A carregar painel",
    "Loading certificate": "A carregar certificado",
    "Loading profile": "A carregar perfil",
    "Loading analytics": "A carregar análises",
    "No active game yet": "Ainda não há jogo ativo",
    "Choose your problem cards first.": "Escolha primeiro as suas cartas de problemas.",
    "Go to Problem Selection": "Ir para seleção de problemas",
    "Welcome back,": "Bem-vindo de volta,",
    "Build your AI solution.": "Construa a sua solução de IA.",
    "Current Problem": "Problema atual",
    "Problem Card": "Carta de problema",
    "Problem Card Revealed": "Carta de problema revelada",
    "Click to reveal the full problem card.": "Clique para revelar a carta de problema completa.",
    "Click again to return to the cover.": "Clique novamente para voltar à capa.",
    "Step 1": "Passo 1",
    "Step 2": "Passo 2",
    "Step 3": "Passo 3",
    "Choose your AI cards first.": "Escolha primeiro as suas cartas de IA.",
    "Selected AI solution cards.": "Cartas de solução de IA selecionadas.",
    "Choose or drag up to 3 AI cards here.": "Escolha ou arraste até 3 cartas de IA aqui.",
    "Explain why you chose those AI cards.": "Explique por que escolheu essas cartas de IA.",
    "Submit Answer": "Enviar resposta",
    "Checking your solution...": "A verificar a sua solução...",
    "Live multiplayer arena": "Arena multijogador em direto",
    "Create rooms, request access, open lobbies, start rounds, submit answers, end sessions and track timestamps.": "Crie salas, peça acesso, abra lobbies, inicie rondas, envie respostas, termine sessões e acompanhe horários.",
    "Live summary": "Resumo em direto",
    "All modes": "Todos os modos",
    "Room name": "Nome da sala",
    "Quest / event theme": "Tema da missão / evento",
    "Max players": "Máximo de jogadores",
    "Create room and open lobby": "Criar sala e abrir lobby",
    "Room code": "Código da sala",
    "Join room by code": "Entrar por código",
    "Back to Rooms": "Voltar às salas",
    "Players and live status": "Jogadores e estado em direto",
    "Invites and access requests": "Convites e pedidos de acesso",
    "Invite player by email or UID": "Convidar jogador por e-mail ou UID",
    "Send room invite": "Enviar convite da sala",
    "Notifications": "Notificações",
    "Live invites and requests": "Convites e pedidos em direto",
    "No multiplayer notifications yet.": "Ainda não há notificações multijogador.",
    "Open / Accept": "Abrir / Aceitar",
    "Decline": "Recusar",
    "Read": "Lido",
    "Pending access requests": "Pedidos de acesso pendentes",
    "Accept": "Aceitar",
    "Team name": "Nome da equipa",
    "Create Team": "Criar equipa",
    "Teams": "Equipas",
    "No teams yet.": "Ainda não há equipas.",
    "Delete Team": "Eliminar equipa",
    "Debate prompt": "Tema do debate",
    "Save Debate Prompt": "Guardar tema do debate",
    "Vote category": "Categoria de voto",
    "Submit Debate Vote": "Enviar voto do debate",
    "Tournament title": "Título do torneio",
    "Start Tournament": "Iniciar torneio",
    "Finish Tournament and Finalise Ranks": "Terminar torneio e finalizar classificações",
    "Room activity log": "Registo de atividade da sala",
    "Clear all logs": "Limpar todos os registos",
    "No activity yet.": "Ainda sem atividade.",
    "Challenge Mode": "Modo desafio",
    "Team Mode": "Modo equipa",
    "Debate Mode": "Modo debate",
    "Tournament Mode": "Modo torneio",
    "Create Event": "Criar evento",
    "Join / Request": "Entrar / Pedir",
    "Open Lobby": "Abrir lobby",
    "Request Access": "Pedir acesso",
    "Join Room": "Entrar na sala",
    "Start Challenge": "Iniciar desafio",
    "Submit Challenge Answer": "Enviar resposta do desafio",
    "Submit Team Solution": "Enviar solução da equipa",
    "Submit Debate Argument": "Enviar argumento do debate",
    "Submit Tournament Round": "Enviar ronda do torneio",
    "Live timeline": "Cronologia em direto",
    "Loading live multiplayer data...": "A carregar dados multijogador em direto...",
    "No lobby opened.": "Nenhum lobby aberto.",
    "Back to Home": "Voltar ao início",
    "Scoring in progress": "Pontuação em curso",
    "Please wait while the system checks relevance, feasibility, SDG alignment, creativity and responsible use.": "Aguarde enquanto o sistema verifica relevância, viabilidade, alinhamento com os ODS, criatividade e uso responsável.",
    "Player settings": "Definições do jogador",
    "Professional player settings": "Definições profissionais do jogador",
    "Player experience controls": "Controlos da experiência do jogador",
    "Choose one language for the full system.": "Escolha um idioma para todo o sistema.",
    "Preferred language": "Idioma preferido",
    "Accessibility": "Acessibilidade",
    "Make AfriQuest easier to read and use.": "Tornar o AfriQuest mais fácil de ler e usar.",
    "Game display": "Visualização do jogo",
    "Control how game cards behave.": "Controle como as cartas do jogo se comportam.",
    "High contrast": "Alto contraste",
    "Large text": "Texto grande",
    "Reduce motion": "Reduzir movimento",
    "Compact mode": "Modo compacto",
    "Enabled": "Ativado",
    "Disabled": "Desativado",
    "Save settings": "Guardar definições",
    "Settings saved. Refreshing the system so the new language applies everywhere...": "Definições guardadas. A atualizar o sistema para aplicar o novo idioma em todo o lado...",
    "Settings saved to the system and applied across the player system.": "Definições guardadas no sistema e aplicadas na área do jogador.",
    "Admin Dashboard": "Painel do administrador",
    "Problem Cards": "Cartas de problemas",
    "AI Cards": "Cartas de IA",
    "SDG Mappings": "Mapeamentos ODS",
    "Scoring Rubrics": "Rubricas de pontuação",
    "Global Settings": "Definições globais",
    "Player Analytics": "Análises dos jogadores",
    "Player Details": "Detalhes do jogador",
    "Feedback Inbox": "Caixa de feedback",
    "Card Images": "Imagens das cartas",
    "Admin Portal": "Portal do administrador",
    "Admin workspace": "Área do administrador",
    "Back to Player App": "Voltar à aplicação do jogador",
    "Signed in as": "Sessão iniciada como",
    "Overview": "Visão geral",
    "Cards": "Cartas",
    "Deck": "Baralho",
    "Rules": "Regras",
    "Add languages": "Adicionar idiomas",
    "Accounts": "Contas",
    "Wallets": "Carteiras",
    "Moderation": "Moderação",
    "Modes": "Modos",
    "Issues": "Questões",
    "Assets": "Recursos",
    "Templates": "Modelos",
    "Impact": "Impacto",
    "Export": "Exportar"
  },
  "sw": {
    "AfriQuest Access": "Ufikiaji wa AfriQuest",
    "Forgot password?": "Umesahau nenosiri?",
    "Reset password": "Weka upya nenosiri",
    "Create account": "Fungua akaunti",
    "Welcome back": "Karibu tena",
    "Email address": "Anwani ya barua pepe",
    "Send reset email": "Tuma barua ya kuweka upya",
    "First name": "Jina la kwanza",
    "Phone number": "Nambari ya simu",
    "Please wait...": "Tafadhali subiri...",
    "Create Account": "Fungua Akaunti",
    "Already have an account? Login": "Tayari una akaunti? Ingia",
    "Back to login": "Rudi kwenye kuingia",
    "No account yet? Register": "Huna akaunti bado? Jisajili",
    "Preparing your AI learning journey...": "Tunaandaa safari yako ya kujifunza AI...",
    "Admin Login": "Kuingia kwa msimamizi",
    "Logout": "Toka",
    "Start Quest": "Anza Safari",
    "Explore Project": "Chunguza Mradi",
    "About the project": "Kuhusu mradi",
    "Contact us": "Wasiliana nasi",
    "General Enquiries": "Maswali ya jumla",
    "Official Website": "Tovuti rasmi",
    "Visit GRIT Lab Africa": "Tembelea GRIT Lab Africa",
    "Project Showroom": "Onyesho la mradi",
    "Explore the Showroom": "Chunguza onyesho",
    "Powered by GRIT Lab Africa": "Inaendeshwa na GRIT Lab Africa",
    "Problem cards": "Kadi za matatizo",
    "Solution cards": "Kadi za suluhisho",
    "Learning rewards": "Zawadi za kujifunza",
    "How the game works": "Jinsi mchezo unavyofanya kazi",
    "Educational purpose": "Lengo la elimu",
    "Start learning": "Anza kujifunza",
    "Journey": "Safari",
    "Dashboard": "Dashibodi",
    "Certificate": "Cheti",
    "Profile": "Wasifu",
    "Achievements": "Mafanikio",
    "Levels": "Viwango",
    "Leaderboard": "Ubao wa viongozi",
    "Analytics": "Uchanganuzi",
    "Settings": "Mipangilio",
    "Multiplayer": "Wachezaji wengi",
    "Rewards": "Zawadi",
    "completed": "imekamilika",
    "Completed": "Imekamilika",
    "Average": "Wastani",
    "balance": "salio",
    "Unlocked": "Imefunguliwa",
    "Player details": "Maelezo ya mchezaji",
    "App settings": "Mipangilio ya programu",
    "Rooms": "Vyumba",
    "Launch rewards": "Zawadi za uzinduzi",
    "Badges": "Beji",
    "Rankings": "Nafasi",
    "No score yet": "Bado hakuna alama",
    "Updated": "Imesasishwa",
    "Loading game cards": "Inapakia kadi za mchezo",
    "Loading dashboard": "Inapakia dashibodi",
    "Loading certificate": "Inapakia cheti",
    "Loading profile": "Inapakia wasifu",
    "Loading analytics": "Inapakia uchanganuzi",
    "No active game yet": "Hakuna mchezo unaoendelea bado",
    "Choose your problem cards first.": "Chagua kwanza kadi zako za matatizo.",
    "Go to Problem Selection": "Nenda kwenye uteuzi wa matatizo",
    "Welcome back,": "Karibu tena,",
    "Build your AI solution.": "Jenga suluhisho lako la AI.",
    "Current Problem": "Tatizo la sasa",
    "Problem Card": "Kadi ya tatizo",
    "Problem Card Revealed": "Kadi ya tatizo imefunuliwa",
    "Click to reveal the full problem card.": "Bofya kufunua kadi kamili ya tatizo.",
    "Click again to return to the cover.": "Bofya tena kurudi kwenye jalada.",
    "Step 1": "Hatua ya 1",
    "Step 2": "Hatua ya 2",
    "Step 3": "Hatua ya 3",
    "Choose your AI cards first.": "Chagua kwanza kadi zako za AI.",
    "Selected AI solution cards.": "Kadi za suluhisho la AI zilizochaguliwa.",
    "Choose or drag up to 3 AI cards here.": "Chagua au buruta hadi kadi 3 za AI hapa.",
    "Explain why you chose those AI cards.": "Eleza kwa nini umechagua kadi hizo za AI.",
    "Submit Answer": "Wasilisha jibu",
    "Checking your solution...": "Tunaangalia suluhisho lako...",
    "Live multiplayer arena": "Uwanja wa moja kwa moja wa wachezaji wengi",
    "Create rooms, request access, open lobbies, start rounds, submit answers, end sessions and track timestamps.": "Unda vyumba, omba ufikiaji, fungua lobi, anza raundi, wasilisha majibu, maliza vipindi na fuatilia muda.",
    "Live summary": "Muhtasari wa moja kwa moja",
    "All modes": "Njia zote",
    "Room name": "Jina la chumba",
    "Quest / event theme": "Mada ya safari / tukio",
    "Max players": "Wachezaji wa juu zaidi",
    "Create room and open lobby": "Unda chumba na ufungue lobi",
    "Room code": "Msimbo wa chumba",
    "Join room by code": "Jiunge na chumba kwa msimbo",
    "Back to Rooms": "Rudi kwenye vyumba",
    "Players and live status": "Wachezaji na hali ya moja kwa moja",
    "Invites and access requests": "Mialiko na maombi ya ufikiaji",
    "Invite player by email or UID": "Alika mchezaji kwa barua pepe au UID",
    "Send room invite": "Tuma mwaliko wa chumba",
    "Notifications": "Arifa",
    "Live invites and requests": "Mialiko na maombi ya moja kwa moja",
    "No multiplayer notifications yet.": "Bado hakuna arifa za wachezaji wengi.",
    "Open / Accept": "Fungua / Kubali",
    "Decline": "Kataa",
    "Read": "Imesomwa",
    "Pending access requests": "Maombi ya ufikiaji yanayosubiri",
    "Accept": "Kubali",
    "Team name": "Jina la timu",
    "Create Team": "Unda Timu",
    "Teams": "Timu",
    "No teams yet.": "Bado hakuna timu.",
    "Delete Team": "Futa Timu",
    "Debate prompt": "Mada ya mjadala",
    "Save Debate Prompt": "Hifadhi mada ya mjadala",
    "Vote category": "Kipengele cha kura",
    "Submit Debate Vote": "Wasilisha kura ya mjadala",
    "Tournament title": "Kichwa cha mashindano",
    "Start Tournament": "Anza Mashindano",
    "Finish Tournament and Finalise Ranks": "Maliza mashindano na kamilisha nafasi",
    "Room activity log": "Kumbukumbu ya shughuli za chumba",
    "Clear all logs": "Futa kumbukumbu zote",
    "No activity yet.": "Bado hakuna shughuli.",
    "Challenge Mode": "Hali ya Changamoto",
    "Team Mode": "Hali ya Timu",
    "Debate Mode": "Hali ya Mjadala",
    "Tournament Mode": "Hali ya Mashindano",
    "Create Event": "Unda Tukio",
    "Join / Request": "Jiunge / Omba",
    "Open Lobby": "Fungua Lobi",
    "Request Access": "Omba Ufikiaji",
    "Join Room": "Jiunge na Chumba",
    "Start Challenge": "Anza Changamoto",
    "Submit Challenge Answer": "Wasilisha jibu la changamoto",
    "Submit Team Solution": "Wasilisha suluhisho la timu",
    "Submit Debate Argument": "Wasilisha hoja ya mjadala",
    "Submit Tournament Round": "Wasilisha raundi ya mashindano",
    "Live timeline": "Mfuatano wa moja kwa moja",
    "Loading live multiplayer data...": "Inapakia data ya wachezaji wengi moja kwa moja...",
    "No lobby opened.": "Hakuna lobi iliyofunguliwa.",
    "Back to Home": "Rudi Nyumbani",
    "Scoring in progress": "Utoaji alama unaendelea",
    "Please wait while the system checks relevance, feasibility, SDG alignment, creativity and responsible use.": "Tafadhali subiri mfumo ukiangalia umuhimu, uwezekano, ulinganifu wa SDG, ubunifu na matumizi ya uwajibikaji.",
    "Player settings": "Mipangilio ya mchezaji",
    "Professional player settings": "Mipangilio ya kitaalamu ya mchezaji",
    "Player experience controls": "Vidhibiti vya uzoefu wa mchezaji",
    "Choose one language for the full system.": "Chagua lugha moja kwa mfumo mzima.",
    "Preferred language": "Lugha unayopendelea",
    "Accessibility": "Ufikiaji",
    "Make AfriQuest easier to read and use.": "Fanya AfriQuest iwe rahisi kusoma na kutumia.",
    "Game display": "Mwonekano wa mchezo",
    "Control how game cards behave.": "Dhibiti jinsi kadi za mchezo zinavyofanya kazi.",
    "High contrast": "Utofauti mkubwa",
    "Large text": "Maandishi makubwa",
    "Reduce motion": "Punguza mwendo",
    "Compact mode": "Hali fupi",
    "Enabled": "Imewashwa",
    "Disabled": "Imezimwa",
    "Save settings": "Hifadhi mipangilio",
    "Settings saved. Refreshing the system so the new language applies everywhere...": "Mipangilio imehifadhiwa. Mfumo unasasishwa ili lugha mpya itumike kila mahali...",
    "Settings saved to the system and applied across the player system.": "Mipangilio imehifadhiwa kwenye mfumo na kutumika kwa mfumo wa mchezaji.",
    "Admin Dashboard": "Dashibodi ya msimamizi",
    "Problem Cards": "Kadi za matatizo",
    "AI Cards": "Kadi za AI",
    "SDG Mappings": "Ulinganifu wa SDG",
    "Scoring Rubrics": "Vigezo vya alama",
    "Global Settings": "Mipangilio ya jumla",
    "Player Analytics": "Uchanganuzi wa wachezaji",
    "Player Details": "Maelezo ya mchezaji",
    "Feedback Inbox": "Kikasha cha maoni",
    "Card Images": "Picha za kadi",
    "Admin Portal": "Lango la msimamizi",
    "Admin workspace": "Eneo la msimamizi",
    "Back to Player App": "Rudi kwenye programu ya mchezaji",
    "Signed in as": "Umeingia kama",
    "Overview": "Muhtasari",
    "Cards": "Kadi",
    "Deck": "Seti",
    "Rules": "Sheria",
    "Add languages": "Ongeza lugha",
    "Accounts": "Akaunti",
    "Wallets": "Pochi",
    "Moderation": "Usimamizi",
    "Modes": "Njia",
    "Issues": "Masuala",
    "Assets": "Rasilimali",
    "Templates": "Violezo",
    "Impact": "Athari",
    "Export": "Hamisha"
  }
}

const partialPhraseTranslations = {
  zu: {
    'Problem Card': 'Ikhadi Lenkinga', 'AI Card': 'Ikhadi le-AI', 'Select Card': 'Khetha ikhadi', 'Selected': 'Kukhethiwe', 'Tap to flip': 'Thinta ukuze uphendule', 'Back to cover': 'Buyela embozweni', 'Submit': 'Thumela', 'Cancel': 'Khansela', 'Create': 'Dala', 'Join': 'Joyina', 'Invite': 'Mema', 'Room': 'Igumbi', 'Team': 'Iqembu', 'Debate': 'Ingxoxo', 'Tournament': 'Itournament', 'Score': 'Amaphuzu', 'Feedback': 'Impendulo', 'Rewards': 'Imivuzo', 'Settings': 'Izilungiselelo', 'Language': 'Ulimi'
  },
  fr: {
    'Problem Card': 'Carte problème', 'AI Card': 'Carte IA', 'Select Card': 'Choisir la carte', 'Selected': 'Sélectionné', 'Tap to flip': 'Touchez pour retourner', 'Back to cover': 'Retour à la couverture', 'Submit': 'Envoyer', 'Cancel': 'Annuler', 'Create': 'Créer', 'Join': 'Rejoindre', 'Invite': 'Inviter', 'Room': 'Salle', 'Team': 'Équipe', 'Debate': 'Débat', 'Tournament': 'Tournoi', 'Score': 'Score', 'Feedback': 'Retour', 'Rewards': 'Récompenses', 'Settings': 'Paramètres', 'Language': 'Langue'
  },
  ar: {
    'Problem Card': 'بطاقة المشكلة', 'AI Card': 'بطاقة الذكاء الاصطناعي', 'Select Card': 'اختر البطاقة', 'Selected': 'تم الاختيار', 'Tap to flip': 'اضغط للقلب', 'Back to cover': 'العودة للغلاف', 'Submit': 'إرسال', 'Cancel': 'إلغاء', 'Create': 'إنشاء', 'Join': 'انضمام', 'Invite': 'دعوة', 'Room': 'غرفة', 'Team': 'فريق', 'Debate': 'نقاش', 'Tournament': 'بطولة', 'Score': 'النتيجة', 'Feedback': 'ملاحظات', 'Rewards': 'مكافآت', 'Settings': 'الإعدادات', 'Language': 'اللغة'
  },
  pt: {
    'Problem Card': 'Carta de problema', 'AI Card': 'Carta de IA', 'Select Card': 'Selecionar carta', 'Selected': 'Selecionado', 'Tap to flip': 'Toque para virar', 'Back to cover': 'Voltar à capa', 'Submit': 'Enviar', 'Cancel': 'Cancelar', 'Create': 'Criar', 'Join': 'Entrar', 'Invite': 'Convidar', 'Room': 'Sala', 'Team': 'Equipa', 'Debate': 'Debate', 'Tournament': 'Torneio', 'Score': 'Pontuação', 'Feedback': 'Feedback', 'Rewards': 'Recompensas', 'Settings': 'Definições', 'Language': 'Idioma'
  },
  sw: {
    'Problem Card': 'Kadi ya tatizo', 'AI Card': 'Kadi ya AI', 'Select Card': 'Chagua kadi', 'Selected': 'Imechaguliwa', 'Tap to flip': 'Gusa kugeuza', 'Back to cover': 'Rudi kwenye jalada', 'Submit': 'Wasilisha', 'Cancel': 'Ghairi', 'Create': 'Unda', 'Join': 'Jiunge', 'Invite': 'Alika', 'Room': 'Chumba', 'Team': 'Timu', 'Debate': 'Mjadala', 'Tournament': 'Mashindano', 'Score': 'Alama', 'Feedback': 'Maoni', 'Rewards': 'Zawadi', 'Settings': 'Mipangilio', 'Language': 'Lugha'
  }
}

function buildFallbackPhraseMap(languageCode) {
  const code = normaliseLanguageCode(languageCode)
  const dictionary = { ...englishDictionary, ...(baseTranslations[code] || {}) }
  const phraseMap = {}

  commonSourcePhrases.forEach(([sourceText, key]) => {
    if (dictionary[key]) phraseMap[sourceText] = dictionary[key]
  })

  return phraseMap
}

const phraseTranslations = {
  en: {},
  zu: { ...buildFallbackPhraseMap('zu'), ...(uiPhraseCatalog.zu || {}) },
  fr: { ...buildFallbackPhraseMap('fr'), ...(uiPhraseCatalog.fr || {}) },
  ar: { ...buildFallbackPhraseMap('ar'), ...(uiPhraseCatalog.ar || {}) },
  pt: { ...buildFallbackPhraseMap('pt'), ...(uiPhraseCatalog.pt || {}) },
  sw: { ...buildFallbackPhraseMap('sw'), ...(uiPhraseCatalog.sw || {}) }
}

const LanguageContext = createContext(null)

async function getCollectionRows(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
}

function mergeLanguageOptions(remoteLanguages = []) {
  const byCode = new Map()
  SUPPORTED_LANGUAGES.forEach((language) => byCode.set(language.languageCode, language))

  remoteLanguages
    .filter((language) => language.isActive !== false)
    .forEach((language) => {
      const languageCode = normaliseLanguageCode(language.languageCode || language.code || language.firestoreId)
      const supported = SUPPORTED_LANGUAGES.find((item) => item.languageCode === languageCode)
      if (!supported) return
      byCode.set(languageCode, {
        ...supported,
        ...language,
        languageCode,
        languageName: cleanText(language.languageName || language.language || language.name) || supported.languageName,
        isActive: true,
        order: Number(language.order || supported.order)
      })
    })

  return Array.from(byCode.values()).sort((a, b) => Number(a.order || 99) - Number(b.order || 99) || a.languageName.localeCompare(b.languageName))
}

function buildTranslationMap(languageCode, rows) {
  const code = normaliseLanguageCode(languageCode)
  const map = { ...englishDictionary, ...(baseTranslations[code] || {}) }
  const phraseMap = { ...(phraseTranslations[code] || {}) }

  rows
    .filter((row) => normaliseLanguageCode(row.languageCode || row.language || '') === code)
    .forEach((row) => {
      const key = cleanText(row.key || row.translationKey || row.firestoreId)
      const value = cleanText(row.translatedText || row.text || row.value)
      const sourceText = cleanText(row.sourceText || row.englishText)
      if (key && value) map[key] = value
      if (sourceText && value) phraseMap[sourceText] = value
    })

  return { map, phraseMap }
}

const domOriginalTextMap = new WeakMap()
const translatedAttrPrefix = 'data-gla-original'

function isProtectedUiText(value) {
  const text = cleanText(value)
  if (!text) return true
  if (/^[\d\s%.,:;#/+\-()]+$/.test(text)) return true
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(text)) return true
  if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) return true
  if (/^(AC|PC|GLA-AI|UID)[\w-]*$/i.test(text)) return true
  return false
}

function buildReversePhraseMap(phraseMap = {}) {
  return Object.entries(phraseMap).reduce((reverseMap, [source, translated]) => {
    const cleanSource = cleanText(source)
    const cleanTranslated = cleanText(translated)
    if (cleanSource && cleanTranslated) reverseMap[cleanTranslated] = cleanSource
    return reverseMap
  }, {})
}

function restoreEnglishSourceText(value, reversePhraseMap = {}) {
  const cleanValue = cleanText(value)
  if (!cleanValue) return value
  const exactSource = reversePhraseMap[cleanValue]
  if (exactSource) return String(value).replace(cleanValue, exactSource)
  return value
}

function applyExactPhraseSegments(text, languageCode, phraseMap = {}) {
  const code = normaliseLanguageCode(languageCode)
  if (code === 'en' || isProtectedUiText(text)) return text

  return Object.entries(phraseMap)
    .filter(([source]) => cleanText(source).length >= 4)
    .sort((a, b) => cleanText(b[0]).length - cleanText(a[0]).length)
    .reduce((nextText, [source, translated]) => {
      const cleanSource = cleanText(source)
      if (!cleanSource || !translated || cleanSource === nextText) return nextText
      const escaped = cleanSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return nextText.replace(new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'g'), `$1${translated}$2`)
    }, text)
}

function applyPartialTranslations(text, languageCode) {
  const replacements = partialPhraseTranslations[normaliseLanguageCode(languageCode)] || {}
  return Object.entries(replacements).reduce((nextText, [source, translated]) => {
    return nextText.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), translated)
  }, text)
}


const API_TRANSLATION_CACHE_PREFIX = 'gla_api_translation_cache_'
const MAX_API_TEXTS_PER_REQUEST = 45
const MAX_API_TEXT_LENGTH = 650

function getApiCacheKey(languageCode) {
  return `${API_TRANSLATION_CACHE_PREFIX}${normaliseLanguageCode(languageCode)}`
}

function loadApiTranslationCache(languageCode) {
  try {
    return JSON.parse(localStorage.getItem(getApiCacheKey(languageCode)) || '{}') || {}
  } catch {
    return {}
  }
}

function saveApiTranslationCache(languageCode, cache) {
  try {
    localStorage.setItem(getApiCacheKey(languageCode), JSON.stringify(cache || {}))
  } catch {
    // The app still works without local cache; it will just request translations again.
  }
}

function shouldSendTextToLanguageApi(value) {
  const text = cleanText(value)
  if (!text || isProtectedUiText(text)) return false
  if (text.length < 2 || text.length > MAX_API_TEXT_LENGTH) return false
  if (/^[{}[\]().,;:!?\-+*/#%&|<>='"`~\s]+$/.test(text)) return false
  return /[A-Za-zÀ-ž]/.test(text)
}

function useDomTranslator(languageCode, phraseMap, enabled) {
  useEffect(() => {
    const code = normaliseLanguageCode(languageCode)
    document.documentElement.lang = code
    document.documentElement.dir = 'ltr'
    document.documentElement.style.direction = 'ltr'
    document.body?.setAttribute('data-gla-language', code)
    const reversePhraseMap = buildReversePhraseMap(phraseMap)

    let isDisposed = false
    let isTranslating = false
    let translateTimer = null
    let apiRequestInFlight = false
    let apiTranslationCache = loadApiTranslationCache(code)
    const pendingApiTexts = new Set()

    function shouldSkipTextElement(node) {
      const tag = node?.tagName?.toLowerCase()
      if (['script', 'style', 'textarea', 'input', 'select', 'option', 'code', 'pre', 'svg', 'canvas'].includes(tag)) return true
      if (node?.closest?.([
        '[data-gla-no-translate="true"]',
        '[data-gla-database-value="true"]',
        '[data-gla-dynamic-text="true"]',
        '[data-gla-card-content="true"]',
        '[data-gla-ai-card="true"]',
        '.glaDoNotTranslate'
      ].join(', '))) return true
      return false
    }

    function shouldSkipAttributeElement(node) {
      const tag = node?.tagName?.toLowerCase()
      if (['script', 'style', 'svg', 'canvas'].includes(tag)) return true
      if (node?.closest?.([
        '[data-gla-no-translate="true"]',
        '[data-gla-database-value="true"]',
        '[data-gla-dynamic-text="true"]',
        '[data-gla-card-content="true"]',
        '[data-gla-ai-card="true"]',
        '.glaDoNotTranslate'
      ].join(', '))) return true
      return false
    }

    function restoreTextNodes(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)
      nodes.forEach((node) => {
        const original = domOriginalTextMap.get(node)
        if (original !== undefined) node.nodeValue = original
      })
    }

    function translateTextValue(value) {
      const sourceValue = restoreEnglishSourceText(value, reversePhraseMap)
      const cleanValue = cleanText(sourceValue)
      if (!cleanValue || code === 'en' || isProtectedUiText(cleanValue)) return sourceValue

      const exact = phraseMap[cleanValue]
      if (exact) return String(sourceValue).replace(cleanValue, exact)

      const segmented = applyExactPhraseSegments(cleanValue, code, phraseMap)
      const partial = applyPartialTranslations(segmented, code)
      if (partial !== cleanValue) return String(sourceValue).replace(cleanValue, partial)

      const cached = apiTranslationCache[cleanValue]
      if (cached) return String(sourceValue).replace(cleanValue, cached)

      if (shouldSendTextToLanguageApi(cleanValue)) {
        pendingApiTexts.add(cleanValue)
      }

      return sourceValue
    }

    function translateTextNodes(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
          let parent = node.parentElement
          while (parent) {
            if (shouldSkipTextElement(parent)) return NodeFilter.FILTER_REJECT
            parent = parent.parentElement
          }
          return NodeFilter.FILTER_ACCEPT
        }
      })

      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)

      nodes.forEach((node) => {
        const original = domOriginalTextMap.get(node) || restoreEnglishSourceText(node.nodeValue, reversePhraseMap)
        domOriginalTextMap.set(node, original)
        node.nodeValue = translateTextValue(original)
      })
    }

    function translateAttributes(root) {
      const elements = root.querySelectorAll?.('[placeholder], [title], [aria-label]') || []
      elements.forEach((element) => {
        if (shouldSkipAttributeElement(element)) return
        ;['placeholder', 'title', 'aria-label'].forEach((attribute) => {
          const value = element.getAttribute(attribute)
          if (!value) return
          const originalKey = `${translatedAttrPrefix}-${attribute}`
          const original = element.getAttribute(originalKey) || restoreEnglishSourceText(value, reversePhraseMap)
          element.setAttribute(originalKey, original)
          element.setAttribute(attribute, translateTextValue(original))
        })
      })
    }

    function restoreAttributes(root) {
      const elements = root.querySelectorAll?.('[data-gla-original-placeholder], [data-gla-original-title], [data-gla-original-aria-label]') || []
      elements.forEach((element) => {
        ;['placeholder', 'title', 'aria-label'].forEach((attribute) => {
          const original = element.getAttribute(`${translatedAttrPrefix}-${attribute}`)
          if (original) element.setAttribute(attribute, original)
        })
      })
    }

    async function requestMissingTranslations() {
      if (apiRequestInFlight || pendingApiTexts.size === 0 || code === 'en') return

      const texts = Array.from(pendingApiTexts)
        .filter((text) => !apiTranslationCache[text])
        .slice(0, MAX_API_TEXTS_PER_REQUEST)

      texts.forEach((text) => pendingApiTexts.delete(text))
      if (texts.length === 0) return

      apiRequestInFlight = true
      try {
        const translations = await translateInterfaceTexts({ texts, targetLanguage: code })
        if (isDisposed) return
        apiTranslationCache = { ...apiTranslationCache, ...(translations || {}) }
        texts.forEach((text) => {
          if (!apiTranslationCache[text]) apiTranslationCache[text] = text
        })
        saveApiTranslationCache(code, apiTranslationCache)
        scheduleTranslate(40)
      } catch {
        texts.forEach((text) => {
          apiTranslationCache[text] = text
        })
        saveApiTranslationCache(code, apiTranslationCache)
      } finally {
        apiRequestInFlight = false
      }
    }

    const translatePage = () => {
      if (!document.body || isTranslating || isDisposed) return

      isTranslating = true
      try {
        restoreTextNodes(document.body)
        restoreAttributes(document.body)
        if (enabled && code !== 'en') {
          translateTextNodes(document.body)
          translateAttributes(document.body)
          requestMissingTranslations()
        }
      } finally {
        isTranslating = false
      }
    }

    const scheduleTranslate = (delay = 180) => {
      if (translateTimer) window.clearTimeout(translateTimer)
      translateTimer = window.setTimeout(translatePage, delay)
    }

    if (!enabled || code === 'en') {
      if (document.body) {
        restoreTextNodes(document.body)
        restoreAttributes(document.body)
      }

      return () => {
        isDisposed = true
        if (translateTimer) window.clearTimeout(translateTimer)
        if (document.body) {
          restoreTextNodes(document.body)
          restoreAttributes(document.body)
        }
      }
    }

    translatePage()
    const observer = new MutationObserver(() => scheduleTranslate())
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true })
    }
    return () => {
      isDisposed = true
      observer.disconnect()
      if (translateTimer) window.clearTimeout(translateTimer)
      if (document.body) {
        restoreTextNodes(document.body)
        restoreAttributes(document.body)
      }
    }
  }, [languageCode, phraseMap, enabled])
}

export function LanguageProvider({ children }) {
  const { currentUser } = useAuth()
  const [languageCode, setLanguageCode] = useState(() => normaliseLanguageCode(localStorage.getItem(STORAGE_KEY) || 'en'))
  const [languageOptions, setLanguageOptions] = useState(fallbackLanguages)
  const [translations, setTranslations] = useState({ ...englishDictionary })
  const [phraseMap, setPhraseMap] = useState({})
  const [autoTranslate, setAutoTranslateState] = useState(() => localStorage.getItem(AUTO_TRANSLATE_STORAGE_KEY) !== 'false')

  function setAutoTranslatePreference(value) {
    const next = Boolean(value)
    setAutoTranslateState(next)
    localStorage.setItem(AUTO_TRANSLATE_STORAGE_KEY, String(next))
  }

  async function loadLanguagesAndTranslations(code = languageCode) {
    const safeCode = normaliseLanguageCode(code)
    try {
      const [languages, uiRows] = await Promise.all([
        getCollectionRows(COLLECTIONS.languageVersions),
        getCollectionRows(COLLECTIONS.uiTranslations)
      ])

      setLanguageOptions(mergeLanguageOptions(languages))

      const result = buildTranslationMap(safeCode, uiRows)
      setTranslations({ ...englishDictionary, ...(baseTranslations[safeCode] || {}), ...result.map })
      setPhraseMap(result.phraseMap)
    } catch {
      setLanguageOptions(fallbackLanguages)
      setTranslations({ ...englishDictionary, ...(baseTranslations[safeCode] || {}) })
      setPhraseMap(phraseTranslations[safeCode] || {})
    }
  }

  async function changeLanguage(nextLanguageCode) {
    const code = normaliseLanguageCode(nextLanguageCode)

    localStorage.setItem(STORAGE_KEY, code)
    document.documentElement.lang = code
    document.documentElement.dir = 'ltr'
    document.body?.setAttribute('data-gla-language', code)

    const result = await loadLanguagesAndTranslations(code)
    setLanguageCode(code)

    try {
      window.dispatchEvent(new CustomEvent('gla-language-changed', { detail: { languageCode: code } }))
    } catch {
      // Custom events are optional in older browsers.
    }

    if (currentUser?.uid) {
      await setDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
        preferredLanguage: code,
        languageUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })
    }

    return result
  }

  useEffect(() => {
    loadLanguagesAndTranslations(languageCode)
  }, [])

  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      const code = normaliseLanguageCode(event.newValue)
      setLanguageCode(code)
      loadLanguagesAndTranslations(code)
      document.documentElement.lang = code
      document.documentElement.dir = 'ltr'
      document.body?.setAttribute('data-gla-language', code)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useDomTranslator(languageCode, phraseMap, autoTranslate)

  const value = useMemo(() => ({
    languageCode,
    languageOptions,
    translations,
    phraseMap,
    autoTranslate,
    setAutoTranslate: setAutoTranslatePreference,
    setLanguage: changeLanguage,
    loadLanguagesAndTranslations,
    t: (key, fallback = '') => translations[key] || fallback || key
  }), [languageCode, languageOptions, translations, phraseMap, autoTranslate])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      languageCode: 'en',
      languageOptions: fallbackLanguages,
      translations: englishDictionary,
      phraseMap: {},
      autoTranslate: true,
      setAutoTranslate: () => {},
      setLanguage: async () => {},
      loadLanguagesAndTranslations: async () => {},
      t: (key, fallback = '') => fallback || key
    }
  }
  return context
}
