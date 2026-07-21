import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { gradeExplanation } from '../services/scoringService'
import problemCards from '../assets/json/grit_lab_africa_problem_cards.json'
import card1 from '../assets/images/card1.jpeg'

import { aiCards } from '../data/aiCards'
import GameSidebar from './game/GameSidebar'
import JourneyTabs from './game/JourneyTabs'
import GameGuideScreen from './game/GameGuideScreen'
import ProblemSelectionScreen from './game/ProblemSelectionScreen'
import PlayGameScreen from './game/PlayGameScreen'
import { LoadingPage } from './game/ui'
import { usePlayerLanguage } from '../hooks/usePlayerLanguage'
import { DEFAULT_PLAYER_SETTINGS, getPlayerSettings, applyPlayerSettingsToDocument } from '../services/player/playerSettingsService'
import {
  createSelectedProblemStack,
  getActiveAiCards,
  getActiveProblemCards,
  saveAttemptWithScoring,
  startGameSession,
  requestPlayerHint,
  refreshPlayerProgressFromAttempts
} from '../services/player/playerJourneyService'
import { getPlayerDashboardData } from '../services/player/playerDashboardService'
import { getPlayerAnalyticsData } from '../services/player/playerAnalyticsService'
import {
  ensurePlayerProfile,
  updatePlayerProfile
} from '../services/player/playerProfileService'
import { seedRemainingCollections } from '../utils/seedRemainingCollections'
import { seedMultiplayerRealtimeCollections } from '../utils/seedMultiplayerRealtimeCollections'
import { resetAndSeedAiCards } from '../utils/resetAndSeedAiCards'

const ScoringFeedbackScreen = lazy(() => import('./game/ScoringFeedbackScreen'))
const RetryAttemptScreen = lazy(() => import('./game/RetryAttemptScreen'))
const PlayerDashboardScreen = lazy(() => import('./game/PlayerDashboardScreen'))
const CoinHistoryScreen = lazy(() => import('./game/CoinHistoryScreen'))
const CertificateScreen = lazy(() => import('./game/CertificateScreen'))
const PlayerProfileScreen = lazy(() => import('./game/PlayerProfileScreen'))
const AchievementsBadgesScreen = lazy(() => import('./game/AchievementsBadgesScreen'))
const LevelsProgressionScreen = lazy(() => import('./game/LevelsProgressionScreen'))
const LeaderboardScreen = lazy(() => import('./game/LeaderboardScreen'))
const AnalyticsDashboardScreen = lazy(() => import('./game/AnalyticsDashboardScreen'))
const AccessibilityScreen = lazy(() => import('./game/AccessibilityScreen'))
const MultiplayerHubScreen = lazy(() => import('./game/MultiplayerHubScreen'))
const RewardsLaunchScreen = lazy(() => import('./game/RewardsLaunchScreen'))

const card2 = "/assets/images/optimized/AI_1.webp"
const aiCardImageUrl = (id) => `/assets/images/optimized/AI_${id}.webp`
function createRound(cards) {
  if (!cards.length) return { card: null }
  return { card: cards[Math.floor(Math.random() * cards.length)] }
}



async function handleResetAndSeedAiCards() {
  const confirmed = window.confirm('This will delete all existing AI cards and insert AI cards 1 to 30. Continue?')

  if (!confirmed) return

  try {
    const result = await resetAndSeedAiCards()
    alert(`AI cards reset complete. Deleted: ${result.deletedCount}. Inserted: ${result.insertedCount}.`)
  } catch (error) {
    console.error(error)
    alert(error.message || 'Could not reset and seed AI cards.')
  }
}

async function handleSeedRemainingCollections() {
  try {
    const count = await seedRemainingCollections()
    alert(`${count} remaining Firestore collections created successfully.`)
  } catch (error) {
    console.error(error)
    alert(error.message || 'Could not create remaining Firestore collections.')
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function toSafeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function getAiResultScore(result) {
  if (!result) return 0
  if (result.total_score !== undefined) return toSafeNumber(result.total_score)
  if (result.totalScore !== undefined) return toSafeNumber(result.totalScore)
  if (result.score !== undefined) return toSafeNumber(result.score)
  if (result.GLA_coin_earned !== undefined) return toSafeNumber(result.GLA_coin_earned)
  if (result.grade !== undefined) return Math.round(toSafeNumber(result.grade) * 10)
  return 0
}

function normaliseAiResult(result) {
  const totalScore = Math.max(0, Math.min(100, Math.round(getAiResultScore(result))))
  return {
    totalScore,
    glaCoinEarned: toSafeNumber(result?.GLA_coin_earned || result?.glaCoinEarned || result?.gla_coin_earned || totalScore),
    overallFeedback: result?.feedback?.overall || result?.overallFeedback || (typeof result?.feedback === 'string' ? result.feedback : '') || 'The scoring engine has reviewed the idea. Use the feedback to improve your solution.',
    improvement: result?.feedback?.improvement || result?.improvement || 'Make the explanation more specific about how the solution will work in real life.',
    subScores: result?.sub_scores || result?.subScores || {},
    areaFeedback: result?.feedback_by_area || result?.areaFeedback || result?.feedback?.by_area || {},
    certificationTrackable: result?.certification_trackable ?? result?.certificationTrackable ?? totalScore >= 50
  }
}

function generateBasicHint(problemCard) {
  if (!problemCard) return 'Choose AI cards that connect clearly to the problem.'
  return `Look at the problem type: "${problemCard.problem_type}". Choose one AI card that understands the problem, one that helps people access support, and one that makes the solution practical in the community.`
}


function normaliseProblemCard(card) {
  return {
    ...card,
    id: Number(card.id),
    title: card.title || '',
    problem_type: card.problem_type || card.problemType || '',
    problem: card.problem || '',
    examples: card.examples || [],
    think_about_it: card.think_about_it || card.thinkAboutIt || '',
    sdg_goals: card.sdg_goals || card.sdgGoals || []
  }
}

function normaliseAiCard(card) {
  const id = Number(card.id)

  return {
    ...card,
    id,
    title: card.title || '',
    type: card.type || card.aiType || card.ai_type || card.subtitle || '',
    canDo: card.canDo || card.whatThisAiCanDo || card.what_it_can_do || '',
    examples: card.examples || [],
    question: card.question || card.thinkAboutIt || card.think_about_it || '',
    frontImageUrl: Number.isFinite(id) ? aiCardImageUrl(id) : card.frontImageUrl || card.backImageUrl || '',
    backImageUrl: Number.isFinite(id) ? aiCardImageUrl(id) : card.backImageUrl || card.frontImageUrl || '',
    fileName: card.fileName || `AI_${id}.webp`
  }
}


function ScreenSuspense({ children }) {
  return (
    <Suspense fallback={<LoadingPage title="Opening page" message="Preparing this section..." compact />}>
      {children}
    </Suspense>
  )
}

function GameHome({ currentUser }) {
 const fallbackProblemCards = problemCards.cards || []
  const { t } = usePlayerLanguage()

 const [analyticsData, setAnalyticsData] = useState(null)
 const [analyticsLoading, setAnalyticsLoading] = useState(false)
 const [analyticsError, setAnalyticsError] = useState('')
 const [dashboardData, setDashboardData] = useState(null)
 const [dashboardLoading, setDashboardLoading] = useState(false)
 const [dashboardError, setDashboardError] = useState('')
 const [cards, setCards] = useState(fallbackProblemCards)
 const [availableAiCards, setAvailableAiCards] = useState(aiCards)
 const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState('')
  const [screen, setScreen] = useState('intro')
  const [selectedProblemIds, setSelectedProblemIds] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
 const [activeProblemStackId, setActiveProblemStackId] = useState('')
  const [round, setRound] = useState(() => createRound([]))
  const [selectedAiCards, setSelectedAiCards] = useState([])
  const [flippedProblem, setFlippedProblem] = useState(false)
  const [flippedAiCards, setFlippedAiCards] = useState([])
  const [userExplanation, setUserExplanation] = useState('')
  const [hasSubmittedExplanation, setHasSubmittedExplanation] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [attempts, setAttempts] = useState([])
  const [glaCoinBalance, setGlaCoinBalance] = useState(0)
  const [coinTransactions, setCoinTransactions] = useState([])
  const [hintMessage, setHintMessage] = useState('')
  const [showHintConfirm, setShowHintConfirm] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accessibilitySettings, setAccessibilitySettings] = useState(DEFAULT_PLAYER_SETTINGS)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const fullName = useMemo(() => currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player', [currentUser])
  const firstName = fullName.split(' ')[0]
  const email = currentUser?.email || ''

  useEffect(() => {
    let isMounted = true

    async function loadSavedSettings() {
      const savedSettings = await getPlayerSettings(currentUser?.uid)
      if (!isMounted) return
      setAccessibilitySettings(savedSettings)
      applyPlayerSettingsToDocument(savedSettings)
    }

    loadSavedSettings()

    return () => {
      isMounted = false
    }
  }, [currentUser?.uid])

  const activeProblemStack = cards.filter((card) => selectedProblemIds.includes(card.id))
  const wordCount = countWords(userExplanation)
  const explanationTooLong = wordCount > 100

  async function handleSeedMultiplayerRealtimeCollections() {
  try {
    const count = await seedMultiplayerRealtimeCollections({
      userId: currentUser?.uid || 'schema_user',
      displayName: currentUser?.displayName || currentUser?.email || 'Schema Player'
    })

    alert(`${count} multiplayer notification/live collections created successfully.`)
  } catch (error) {
    console.error(error)
    alert(error.message || 'Could not create multiplayer notification/live collections.')
  }
}

  const completedProblemScores = useMemo(() => {
    const scoresByProblem = {}
    attempts.forEach((attempt) => {
      const previousBest = scoresByProblem[attempt.problemId] || 0
      scoresByProblem[attempt.problemId] = Math.max(previousBest, attempt.totalScore)
    })
    return scoresByProblem
  }, [attempts])

  const completedProblems = Object.keys(completedProblemScores).length
  const averageScore = completedProblems > 0 ? Math.round(Object.values(completedProblemScores).reduce((total, score) => total + score, 0) / completedProblems) : 0
  const certificateUnlocked = completedProblems >= 10 && averageScore >= 75
  const certificationProgress = Math.min(10, completedProblems)

  const attemptStatsByProblem = useMemo(() => {
    const stats = {}
    attempts.forEach((attempt) => {
      if (!stats[attempt.problemId]) {
        stats[attempt.problemId] = { problemId: attempt.problemId, problemTitle: attempt.problemTitle, first: attempt, latest: attempt, best: attempt, count: 1 }
        return
      }
      const currentStats = stats[attempt.problemId]
      currentStats.latest = attempt
      currentStats.count += 1
      if (attempt.totalScore > currentStats.best.totalScore) currentStats.best = attempt
    })
    return stats
  }, [attempts])

  const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null
  const currentProblemAttemptStats = round.card ? attemptStatsByProblem[round.card.id] || null : null
  const latestAttemptProblemStats = latestAttempt ? attemptStatsByProblem[latestAttempt.problemId] || null : null

  const bestScoringProblems = useMemo(() => Object.values(attemptStatsByProblem).map((stats) => ({ problemId: stats.problemId, problemTitle: stats.problemTitle, bestScore: stats.best.totalScore, bestAttempt: stats.best })).sort((a, b) => b.bestScore - a.bestScore).slice(0, 5), [attemptStatsByProblem])
  const completedProblemRows = useMemo(() => Object.values(attemptStatsByProblem).map((stats) => ({ id: stats.problemId, problemTitle: stats.problemTitle, bestScore: stats.best.totalScore, latestScore: stats.latest.totalScore, attempts: stats.count })), [attemptStatsByProblem])

  const totalGlaCoinEarned = coinTransactions.filter((transaction) => transaction.type === 'earned').reduce((total, transaction) => total + transaction.amount, 0)
  const glaCoinSpentOnHints = coinTransactions.filter((transaction) => transaction.type === 'spent').reduce((total, transaction) => total + transaction.amount, 0)
  const certificateId = `GLA-AI-${String(fullName).slice(0, 3).toUpperCase()}-${completedProblems}-${averageScore}`.replace(/\s/g, '')
  const issueDate = certificateUnlocked ? new Date().toLocaleDateString() : 'Pending'

  function resetRound() {
    setSelectedAiCards([])
    setFlippedProblem(false)
    setFlippedAiCards([])
    setUserExplanation('')
    setHasSubmittedExplanation(false)
    setAiError('')
    setAiLoading(false)
    setHintMessage('')
    setShowHintConfirm(false)
  }

 async function startGame() {
  const userId = currentUser?.uid
  const stack = cards.filter((card) => selectedProblemIds.includes(card.id))

  if (stack.length < 10) {
    setScreen('select')
    return
  }

  if (!userId) {
    alert('You must be logged in to start the game.')
    return
  }

  try {
   const selectedProblemStackId = await createSelectedProblemStack({
  userId,
  selectedProblemIds
})

const sessionId = await startGameSession({
  userId,
  selectedProblemStackId,
  selectedProblemIds
})

setActiveProblemStackId(selectedProblemStackId)
setActiveSessionId(sessionId)

    setRound(createRound(stack))
    resetRound()
    setScreen('play')
  } catch (error) {
    console.error(error)
    alert(error.message || 'Could not start the game session.')
  }
}

  function handleNextRound() {
    if (activeProblemStack.length < 10) {
      setScreen('select')
      return
    }
    setIsChanging(true)
    setTimeout(() => {
      setRound(createRound(activeProblemStack))
      resetRound()
      setScreen('play')
      setIsChanging(false)
    }, 400)
  }

  function handleRetryCurrentProblem() {
    resetRound()
    setScreen('play')
  }

  function handleSidebarNavigation(value) {
    if (value === 'journey') setScreen('intro')
    else if (value === 'multilingual') setScreen('accessibility')
    else setScreen(value)
    setSidebarOpen(false)
  }

  function handleJourneyNavigation(value) {
    if (value === 'play') {
      if (!round.card) startGame()
      else setScreen('play')
      return
    }
    if (value === 'score' && !firestoreLatestAttempt) return
    setScreen(value)
  }

  function toggleProblemCard(cardId) {
    setSelectedProblemIds((previousIds) => previousIds.includes(cardId) ? previousIds.filter((id) => id !== cardId) : [...previousIds, cardId])
  }

  function toggleAiCard(aiCard) {
    const alreadySelected = selectedAiCards.some((card) => card.id === aiCard.id)
    if (alreadySelected) {
      setSelectedAiCards((previousCards) => previousCards.filter((card) => card.id !== aiCard.id))
      return
    }
    if (selectedAiCards.length >= 3 || hasSubmittedExplanation) return
    setSelectedAiCards((previousCards) => [...previousCards, aiCard])
  }

  function removeSelectedAiCard(cardId) {
    if (hasSubmittedExplanation) return
    setSelectedAiCards((previousCards) => previousCards.filter((card) => card.id !== cardId))
  }

  function handleDragStart(event, aiCardId) {
    event.dataTransfer.setData('text/plain', String(aiCardId))
  }

function handleDrop(event) {
  event.preventDefault()

  const aiCardId = Number(event.dataTransfer.getData('text/plain'))
  const aiCard = availableAiCards.find((card) => card.id === aiCardId)

  if (aiCard) toggleAiCard(aiCard)
}


  function toggleAiFlip(cardId) {
    if (!accessibilitySettings.cardFlipEnabled) return
    setFlippedAiCards((previousIds) => previousIds.includes(cardId) ? previousIds.filter((id) => id !== cardId) : [...previousIds, cardId])
  }

  function toggleProblemFlip() {
    if (!accessibilitySettings.cardFlipEnabled) return
    setFlippedProblem((previous) => !previous)
  }

  async function submitExplanation() {
    const trimmedExplanation = userExplanation.trim()
    if (!round.card) return setAiError('No problem card is active. Please start the game first.')
      if (!activeSessionId) return setAiError('No active game session found. Please start the game again.')
    if (selectedAiCards.length === 0) return setAiError('Please select at least one AI card before submitting.')
    if (selectedAiCards.length > 3) return setAiError('You can only select up to 3 AI cards.')
    if (!trimmedExplanation) return setAiError('Please write your explanation before submitting.')
    if (explanationTooLong) return setAiError('Your explanation must be 100 words or less.')
    if (hasSubmittedExplanation) return
    setAiError('')
    setAiLoading(true)
    try {
      const selectedSolutionForCurrentBackend = { cardId: selectedAiCards[0].id, title: selectedAiCards.map((card) => card.title).join(' + '), description: selectedAiCards.map((card) => `${card.title}: ${card.canDo || card.what_it_can_do || ''}`).join('\n') }
      const result = await gradeExplanation({ problemCard: round.card, selectedSolution: selectedSolutionForCurrentBackend, selectedAiCards, userExplanation: trimmedExplanation })
      const normalisedResult = normaliseAiResult(result)
      const savedAttempt = await saveAttemptWithScoring({
  userId: currentUser.uid,
  sessionId: activeSessionId,
  problemCard: round.card,
  selectedAiCards,
  explanation: trimmedExplanation,
  scoreResult: normalisedResult,
  deepSeekRawResponse: result
})
      const createdAt = new Date().toLocaleString()
      const attemptNumber = attempts.filter((attempt) => attempt.problemId === round.card.id).length + 1
      const balanceAfter = toSafeNumber(savedAttempt.balanceAfter, glaCoinBalance + savedAttempt.glaCoinEarned)
const attemptRecord = {
  id: savedAttempt.attemptId,
  problemId: round.card.id,
  problemTitle: round.card.title,
  selectedAiCards,
  explanation: trimmedExplanation,
  totalScore: savedAttempt.totalScore,
  glaCoinEarned: savedAttempt.glaCoinEarned,
  feedback: savedAttempt.overallFeedback,
  improvement: savedAttempt.improvementSuggestion,
  subScores: savedAttempt.subScores,
  areaFeedback: savedAttempt.areaFeedback,
  certificationTrackable: savedAttempt.certificationTrackable,
  attemptNumber,
  createdAt
}      
const coinTransaction = {
  id: savedAttempt.transactionId,
  type: 'earned',
  amount: savedAttempt.glaCoinEarned,
  balanceAfter,
  reason: 'Scoring reward',
  problemId: round.card.id,
  problemTitle: round.card.title,
  createdAt
}
      setHasSubmittedExplanation(true)
      setGlaCoinBalance(balanceAfter)
      setAttempts((previousAttempts) => [...previousAttempts, attemptRecord])
      setCoinTransactions((previousTransactions) => [coinTransaction, ...previousTransactions])
      setDashboardData((previousDashboard) => {
        if (!previousDashboard) return previousDashboard

        const updatedAttempts = [...(previousDashboard.attempts || []), attemptRecord]
        const updatedTransactions = [coinTransaction, ...(previousDashboard.coinTransactions || [])]
        const updatedProblemStats = { ...(previousDashboard.attemptStatsByProblem || {}) }
        const problemKey = String(round.card.id)
        const existingStats = updatedProblemStats[problemKey]

        updatedProblemStats[problemKey] = existingStats
          ? {
              ...existingStats,
              latest: attemptRecord,
              best: toSafeNumber(attemptRecord.totalScore) > toSafeNumber(existingStats.best?.totalScore) ? attemptRecord : existingStats.best,
              count: toSafeNumber(existingStats.count) + 1
            }
          : {
              problemId: problemKey,
              problemTitle: round.card.title,
              first: attemptRecord,
              latest: attemptRecord,
              best: attemptRecord,
              count: 1
            }

        return {
          ...previousDashboard,
          profile: { ...(previousDashboard.profile || {}), glaCoinBalance: balanceAfter },
          attempts: updatedAttempts,
          coinTransactions: updatedTransactions,
          latestAttempt: attemptRecord,
          attemptStatsByProblem: updatedProblemStats,
          glaCoinBalance: balanceAfter,
          totalGlaCoinEarned: toSafeNumber(previousDashboard.totalGlaCoinEarned) + savedAttempt.glaCoinEarned
        }
      })
      setScreen('score')
      refreshPlayerProgressFromAttempts(currentUser.uid)
        .then(() => loadPlayerDashboard({ silent: true }))
        .catch((error) => console.error('Could not refresh progress in the background.', error))
    } catch (err) {
      setAiError(err.message || 'The scoring engine could not score the explanation.')
    } finally {
      setAiLoading(false)
    }
  }

  async function confirmHintPurchase() {
    const currentBalance = firestoreGlaCoinBalance

    if (currentBalance < 20) {
      setHintMessage('You need at least 20 GLA coin to request a hint.')
      setShowHintConfirm(false)
      return
    }

    if (!currentUser?.uid) {
      setHintMessage('You must be logged in to request a hint.')
      setShowHintConfirm(false)
      return
    }

    const hintText = generateBasicHint(round.card)
    const createdAt = new Date().toLocaleString()

    try {
      const savedHint = await requestPlayerHint({
        userId: currentUser.uid,
        sessionId: activeSessionId || '',
        problemCardId: round.card?.id ? String(round.card.id) : '',
        problemTitle: round.card?.title || 'No active problem',
        hintText
      })

      const balanceAfter = toSafeNumber(savedHint.balanceAfter, currentBalance - 20)
      const hintTransaction = {
        id: savedHint.transactionId,
        transactionId: savedHint.transactionId,
        type: 'spent',
        amount: 20,
        balanceAfter,
        reason: 'Hint request',
        problemId: round.card?.id || '',
        problemCardId: round.card?.id ? String(round.card.id) : '',
        problemTitle: round.card?.title || 'No active problem',
        createdAt,
        createdAtText: createdAt
      }

      setGlaCoinBalance(balanceAfter)
      setCoinTransactions((previousTransactions) => [hintTransaction, ...previousTransactions])
      setDashboardData((previousDashboard) => {
        if (!previousDashboard) return previousDashboard

        return {
          ...previousDashboard,
          profile: {
            ...(previousDashboard.profile || {}),
            glaCoinBalance: balanceAfter,
            totalGlaCoinSpent: toSafeNumber(previousDashboard.profile?.totalGlaCoinSpent) + 20,
            totalHintsUsed: toSafeNumber(previousDashboard.profile?.totalHintsUsed) + 1
          },
          coinTransactions: [hintTransaction, ...(previousDashboard.coinTransactions || [])],
          glaCoinBalance: balanceAfter,
          totalGlaCoinSpent: toSafeNumber(previousDashboard.totalGlaCoinSpent) + 20,
          glaCoinSpentOnHints: toSafeNumber(previousDashboard.glaCoinSpentOnHints) + 20,
          totalHintsUsed: toSafeNumber(previousDashboard.totalHintsUsed) + 1
        }
      })
      setHintMessage(hintText)
      await loadPlayerDashboard()
    } catch (error) {
      console.error(error)
      setHintMessage(error.message || 'Could not save the hint transaction to the system.')
    } finally {
      setShowHintConfirm(false)
    }
  }

  function updateAccessibilitySetting(nextOrKey, value) {
    setAccessibilitySettings((previous) => {
      const next = typeof nextOrKey === 'object' && nextOrKey !== null
        ? { ...previous, ...nextOrKey }
        : { ...previous, [nextOrKey]: value }

      applyPlayerSettingsToDocument(next)
      return next
    })
  }


useEffect(() => {
  if (!currentUser?.uid) {
    setDashboardData(null)
    setAttempts([])
    setCoinTransactions([])
    setGlaCoinBalance(0)
    setSelectedProblemIds([])
    setActiveProblemStackId('')
    setActiveSessionId('')
    return
  }

  loadPlayerDashboard()
}, [currentUser?.uid])

useEffect(() => {
  if (
    currentUser?.uid &&
    (screen === 'dashboard' || screen === 'profile' || screen === 'certificate')
  ) {
    loadPlayerDashboard()
  }
}, [screen, currentUser?.uid])
useEffect(() => {
  if (screen === 'analytics') {
    loadPlayerAnalytics()
  }
}, [screen, currentUser?.uid, cards.length])

  function handleSettingsSaved(nextSettings) {
    setAccessibilitySettings(nextSettings)
  }

  useEffect(() => {
    if (sidebarOpen && currentUser?.uid) {
      loadPlayerDashboard()
    }
  }, [sidebarOpen, currentUser?.uid])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    if (sidebarOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [sidebarOpen])

  const journeyActive = ['intro', 'select', 'play', 'score'].includes(screen)
  const gameHomeClassName = [
    accessibilitySettings.highContrast ? 'glaHighContrast' : '',
    accessibilitySettings.largeText ? 'glaLargeText' : '',
    accessibilitySettings.reduceMotion ? 'glaReduceMotion' : '',
    accessibilitySettings.lowBandwidth || accessibilitySettings.saveDataMode ? 'glaLowBandwidth' : '',
    accessibilitySettings.compactMode ? 'glaCompactCards' : '',
    accessibilitySettings.showCardImages ? '' : 'glaHideCardImages'
  ].filter(Boolean).join(' ')

useEffect(() => {
  async function loadCardsFromFirestore() {
    setCardError('')

    try {
      const [firestoreProblemCards, firestoreAiCards] = await Promise.all([
        getActiveProblemCards(),
        getActiveAiCards()
      ])

      if (firestoreProblemCards.length > 0) {
        setCards(firestoreProblemCards.map(normaliseProblemCard))
      }

      if (firestoreAiCards.length > 0) {
        setAvailableAiCards(firestoreAiCards.map(normaliseAiCard))
      }
    } catch (error) {
      console.error(error)
      setCardError('Could not load cards from Firestore. Using local cards for now.')
    } finally {
      setCardLoading(false)
    }
  }

  loadCardsFromFirestore()
}, [])

async function loadPlayerDashboard({ silent = false } = {}) {
  if (!currentUser?.uid) return

  if (!silent) setDashboardLoading(true)
  setDashboardError('')

  try {
    await ensurePlayerProfile({
      userId: currentUser.uid,
      firstName: currentUser.displayName?.split(' ')[0] || '',
      lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
      email: currentUser.email || ''
    })

    const data = await getPlayerDashboardData(currentUser.uid)

    setDashboardData(data)

    setAttempts(data?.attempts || [])
    setCoinTransactions(data?.coinTransactions || [])
    setGlaCoinBalance(toSafeNumber(data?.glaCoinBalance))

    const stackIds = data?.selectedProblemStack?.selectedProblemIds || []

    if (stackIds.length > 0) {
      const normalisedStackIds = stackIds.map((id) => {
        const numberId = Number(id)
        return Number.isFinite(numberId) ? numberId : id
      })

      setSelectedProblemIds(normalisedStackIds)
    }

    if (data?.selectedProblemStack?.id || data?.selectedProblemStack?.selectedProblemStackId) {
      setActiveProblemStackId(
        data.selectedProblemStack.selectedProblemStackId || data.selectedProblemStack.id
      )
    }

    if (data?.profile?.activeSessionId) {
      setActiveSessionId(data.profile.activeSessionId)
    }
  } catch (error) {
    console.error(error)
    setDashboardError('Could not load dashboard data from Firestore.')
  } finally {
    if (!silent) setDashboardLoading(false)
  }
}

async function handleSaveProfile(profileData) {
  if (!currentUser?.uid) {
    setProfileMessage('You must be logged in to update your profile.')
    return
  }

  setProfileSaving(true)
  setProfileMessage('')

  try {
    await updatePlayerProfile(currentUser.uid, profileData, currentUser)
    if (typeof currentUser.reload === 'function') {
      await currentUser.reload()
    }
    setProfileMessage('Profile updated successfully.')
    await loadPlayerDashboard()
  } catch (error) {
    console.error(error)
    setProfileMessage(error.message || 'Could not update profile.')
  } finally {
    setProfileSaving(false)
  }
}

const firestoreSelectedProblemStackIds =
  dashboardData?.selectedProblemStack?.selectedProblemIds || []

const firestoreSelectedProblemStack =
  firestoreSelectedProblemStackIds.length > 0
    ? cards.filter(
        (card) =>
          firestoreSelectedProblemStackIds.includes(card.id) ||
          firestoreSelectedProblemStackIds.includes(String(card.id))
      )
    : activeProblemStack

const firestoreFullName =
  dashboardData?.profile
    ? `${dashboardData.profile.firstName || ''} ${dashboardData.profile.lastName || ''}`.trim()
    : fullName

const firestoreCertificateUnlocked =
  dashboardData?.certificateUnlocked ?? certificateUnlocked

const firestoreCompletedProblems =
  dashboardData?.completedProblems ?? completedProblems

const firestoreAverageScore =
  dashboardData?.averageScore ?? averageScore

const firestoreCertificationProgress =
  dashboardData?.certificationProgress ?? certificationProgress

const firestoreGlaCoinBalance =
  dashboardData?.glaCoinBalance !== undefined
    ? toSafeNumber(dashboardData.glaCoinBalance)
    : dashboardData?.profile?.glaCoinBalance !== undefined
      ? toSafeNumber(dashboardData.profile.glaCoinBalance)
      : toSafeNumber(glaCoinBalance)

const firestoreTotalGlaCoinEarned =
  dashboardData?.totalGlaCoinEarned ?? totalGlaCoinEarned

const firestoreAttempts =
  dashboardData?.attempts || attempts

const firestoreLatestAttempt =
  dashboardData?.latestAttempt || latestAttempt

const firestoreLatestAttemptProblemStats =
  firestoreLatestAttempt
    ? dashboardData?.attemptStatsByProblem?.[firestoreLatestAttempt.problemId] ||
      latestAttemptProblemStats
    : latestAttemptProblemStats


async function loadPlayerAnalytics() {
  if (!currentUser?.uid) return

  setAnalyticsLoading(true)
  setAnalyticsError('')

  try {
    const data = await getPlayerAnalyticsData(currentUser.uid, cards)
    setAnalyticsData(data)
  } catch (error) {
    console.error(error)
    setAnalyticsError('Could not load analytics data from Firestore.')
  } finally {
    setAnalyticsLoading(false)
  }
}



  return (
    <section style={gameHomeWrapperStyle} className={gameHomeClassName}>
      <style>{pageCss}</style>

      <div className="glaGamePageHeader">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="glaMenuButton"
        >
          <span className="glaMenuIcon">☰</span> {t('menu')}
        </button>

        <p className="glaPageTitle">{t('gameTitle')}</p>
      </div>

      <div className={`glaSidebarOverlay ${sidebarOpen ? 'open' : ''}`}>
        <button
          type="button"
          aria-label="Close menu"
          className="glaSidebarBackdrop"
          onClick={() => setSidebarOpen(false)}
        ></button>

        <div className="glaSidebarDrawer">
          <GameSidebar
            userId={currentUser?.uid || ''}
            screen={screen}
            onNavigate={handleSidebarNavigation}
            onClose={() => setSidebarOpen(false)}
            selectedProblemCount={firestoreSelectedProblemStack.length || selectedProblemIds.length}
            completedProblems={firestoreCompletedProblems}
            certificationProgress={firestoreCertificationProgress}
            averageScore={firestoreAverageScore}
            glaCoinBalance={firestoreGlaCoinBalance}
            certificateUnlocked={firestoreCertificateUnlocked}
            latestAttempt={firestoreLatestAttempt}
          />
        </div>
      </div>

      <main className="glaGameContent">
        {cardError && (
          <p style={{ color: '#9a3412', fontWeight: 800 }}>
            {cardError}
          </p>
        )}




        {journeyActive && (
          <JourneyTabs
            screen={screen}
            selectedProblemCount={selectedProblemIds.length}
            roundActive={Boolean(round.card)}
            latestAttempt={firestoreLatestAttempt}
            onNavigate={handleJourneyNavigation}
          />
        )}

        {screen === 'intro' && (
          <GameGuideScreen
            firstName={firstName}
            onChooseProblems={() => setScreen('select')}
          />
        )}

        {screen === 'select' && (
          <ProblemSelectionScreen
            cards={cards}
            selectedProblemIds={selectedProblemIds}
            onToggleProblem={toggleProblemCard}
            onStartGame={startGame}
          />
        )}

        {screen === 'play' && (
          <PlayGameScreen
            round={round}
            aiCards={availableAiCards}
            selectedAiCards={selectedAiCards}
            flippedProblem={flippedProblem}
            flippedAiCards={flippedAiCards}
            userExplanation={userExplanation}
            wordCount={wordCount}
            explanationTooLong={explanationTooLong}
            hasSubmittedExplanation={hasSubmittedExplanation}
            aiLoading={aiLoading}
            aiError={aiError}
            hintMessage={hintMessage}
            showHintConfirm={showHintConfirm}
glaCoinBalance={firestoreGlaCoinBalance}
certificationProgress={firestoreCertificationProgress}
averageScore={firestoreAverageScore}
            fullName={fullName}
            card1={card1}
            card2={card2}
            isChanging={isChanging}
            onToggleProblemFlip={toggleProblemFlip}
            onToggleAiCard={toggleAiCard}
            onRemoveSelectedAiCard={removeSelectedAiCard}
            onToggleAiFlip={toggleAiFlip}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onExplanationChange={setUserExplanation}
            onSubmit={submitExplanation}
            onShowHintConfirm={() => setShowHintConfirm(true)}
            onCancelHint={() => setShowHintConfirm(false)}
            onConfirmHint={confirmHintPurchase}
            onOpenLatestScore={() => setScreen('score')}
            onNextRound={handleNextRound}
            latestAttempt={firestoreLatestAttempt}
            onGoToSelection={() => setScreen('select')}
            appSettings={accessibilitySettings}
          />
        )}

        {screen === 'score' && (
          <ScreenSuspense>
          <ScoringFeedbackScreen
            currentAttempt={firestoreLatestAttempt}
            currentProblem={round.card}
            currentProblemAttemptStats={firestoreLatestAttemptProblemStats}
            glaCoinBalance={firestoreGlaCoinBalance}
            onOpenRetry={() => setScreen('retry')}
            onNextProblem={handleNextRound}
            onOpenDashboard={() => setScreen('dashboard')}
            onOpenCoinHistory={() => setScreen('coins')}
          />
          </ScreenSuspense>
        )}

        {screen === 'retry' && (
          <ScreenSuspense>
          <RetryAttemptScreen
            currentProblem={round.card}
            currentProblemAttemptStats={currentProblemAttemptStats}
            onStartRetry={handleRetryCurrentProblem}
            onCancel={() => setScreen(firestoreLatestAttempt ? 'score' : 'play')}
            onNextProblem={handleNextRound}
          />
          </ScreenSuspense>
        )}

        {screen === 'dashboard' && dashboardLoading && (
          <LoadingPage
            title="Loading dashboard"
            message="Fetching your selected cards, completed problems, average score and wallet from the system."
          />
        )}

        {screen === 'dashboard' && !dashboardLoading && (
          <>
            {dashboardError && (
              <p style={{ color: '#9a3412', fontWeight: 800 }}>
                {dashboardError}
              </p>
            )}

            <ScreenSuspense>
            <PlayerDashboardScreen
              firstName={firstName}
              selectedProblemStack={firestoreSelectedProblemStack}
              completedProblemRows={dashboardData?.completedProblemRows || completedProblemRows}
              completedProblems={dashboardData?.completedProblems ?? completedProblems}
              averageScore={dashboardData?.averageScore ?? averageScore}
              certificateUnlocked={dashboardData?.certificateUnlocked ?? certificateUnlocked}
              certificationProgress={dashboardData?.certificationProgress ?? certificationProgress}
              glaCoinBalance={dashboardData?.glaCoinBalance ?? glaCoinBalance}
              totalGlaCoinEarned={dashboardData?.totalGlaCoinEarned ?? totalGlaCoinEarned}
              glaCoinSpentOnHints={dashboardData?.glaCoinSpentOnHints ?? glaCoinSpentOnHints}
              attempts={dashboardData?.attempts || attempts}
              attemptStatsByProblem={dashboardData?.attemptStatsByProblem || attemptStatsByProblem}
              bestScoringProblems={dashboardData?.bestScoringProblems || bestScoringProblems}
              latestAttempt={firestoreLatestAttempt}
              onOpenCoinHistory={() => setScreen('coins')}
              onOpenLatestScore={() => setScreen(firestoreLatestAttempt ? 'score' : 'play')}
              onOpenCertificate={() => setScreen('certificate')}
              onOpenProfile={() => setScreen('profile')}
            />
            </ScreenSuspense>
          </>
        )}

        {screen === 'coins' && (
          <ScreenSuspense>
          <CoinHistoryScreen
  glaCoinBalance={firestoreGlaCoinBalance}
  totalGlaCoinEarned={firestoreTotalGlaCoinEarned}
  glaCoinSpentOnHints={dashboardData?.glaCoinSpentOnHints ?? glaCoinSpentOnHints}
  coinTransactions={dashboardData?.coinTransactions || coinTransactions}
  onBackToDashboard={() => setScreen('dashboard')}
/>
          </ScreenSuspense>
        )}

        {screen === 'certificate' && dashboardLoading && (
          <LoadingPage
            title="Loading certificate"
            message="Checking certificate status and saved issue record from the system."
          />
        )}

        {screen === 'certificate' && !dashboardLoading && (
          <ScreenSuspense>
          <CertificateScreen
            fullName={firestoreFullName || fullName}
            completedProblems={dashboardData?.completedProblems ?? completedProblems}
            averageScore={dashboardData?.averageScore ?? averageScore}
            certificateUnlocked={firestoreCertificateUnlocked}
            certificateId={dashboardData?.latestCertificate?.certificateId || certificateId}
            issueDate={
              dashboardData?.latestCertificate?.issuedAt?.toDate
                ? dashboardData.latestCertificate.issuedAt.toDate().toLocaleDateString()
                : issueDate
            }
            onBackToDashboard={() => setScreen('dashboard')}
          />
          </ScreenSuspense>
        )}

        {screen === 'profile' && dashboardLoading && (
          <LoadingPage
            title="Loading profile"
            message="Fetching your saved profile and progress from the system."
          />
        )}

        {screen === 'profile' && !dashboardLoading && (
          <>
            {dashboardError && (
              <p style={{ color: '#9a3412', fontWeight: 800 }}>
                {dashboardError}
              </p>
            )}

            <ScreenSuspense>
            <PlayerProfileScreen
              profile={dashboardData?.profile || {}}
              fullName={firestoreFullName || fullName}
              email={dashboardData?.profile?.email || email}
              firstName={dashboardData?.profile?.firstName || ''}
              lastName={dashboardData?.profile?.lastName || ''}
              phone={dashboardData?.profile?.phone || ''}
              selectedProblemStack={firestoreSelectedProblemStack}
              completedProblemRows={dashboardData?.completedProblemRows || completedProblemRows}
              attempts={dashboardData?.attempts || attempts}
              glaCoinBalance={dashboardData?.glaCoinBalance ?? glaCoinBalance}
              totalGlaCoinEarned={dashboardData?.totalGlaCoinEarned ?? totalGlaCoinEarned}
              totalGlaCoinSpent={dashboardData?.totalGlaCoinSpent ?? glaCoinSpentOnHints}
              completedProblems={dashboardData?.completedProblems ?? completedProblems}
              averageScore={dashboardData?.averageScore ?? averageScore}
              certificateUnlocked={firestoreCertificateUnlocked}
              profileSaving={profileSaving}
              profileMessage={profileMessage}
              onSaveProfile={handleSaveProfile}
            />
            </ScreenSuspense>
          </>
        )}

        {screen === 'achievements' && (
          <ScreenSuspense>
          <AchievementsBadgesScreen
            attempts={firestoreAttempts}
            completedProblems={firestoreCompletedProblems}
            totalGlaCoinEarned={firestoreTotalGlaCoinEarned}
          />
          </ScreenSuspense>
        )}

        {screen === 'levels' && (
          <ScreenSuspense>
          <LevelsProgressionScreen
            totalGlaCoinEarned={firestoreTotalGlaCoinEarned}
            completedProblems={firestoreCompletedProblems}
            averageScore={firestoreAverageScore}
          />
          </ScreenSuspense>
        )}

        {screen === 'leaderboard' && (
          <ScreenSuspense>
          <LeaderboardScreen
  fullName={firestoreFullName || fullName}
  averageScore={firestoreAverageScore}
  completedProblems={firestoreCompletedProblems}
  totalGlaCoinEarned={firestoreTotalGlaCoinEarned}
/>
          </ScreenSuspense>
        )}

        {screen === 'hints' && (
         <ScreenSuspense>
         <HintCenterScreen
  coinTransactions={dashboardData?.coinTransactions || coinTransactions}
  glaCoinSpentOnHints={dashboardData?.glaCoinSpentOnHints ?? glaCoinSpentOnHints}
/>
         </ScreenSuspense>
        )}

        {screen === 'analytics' && analyticsLoading && (
          <LoadingPage
            title="Loading analytics"
            message="Calculating your gameplay analytics from the system attempts, scores and activity data."
          />
        )}

        {screen === 'analytics' && !analyticsLoading && (
          <>
            {analyticsError && (
              <p style={{ color: '#9a3412', fontWeight: 800 }}>
                {analyticsError}
              </p>
            )}

            <ScreenSuspense>
            <AnalyticsDashboardScreen analyticsData={analyticsData} />
            </ScreenSuspense>
          </>
        )}


        {screen === 'accessibility' && (
          <ScreenSuspense>
          <AccessibilityScreen
            settings={accessibilitySettings}
            onChange={updateAccessibilitySetting}
            onSaved={handleSettingsSaved}
          />
          </ScreenSuspense>
        )}

        {screen === 'multiplayer' && (
          <ScreenSuspense>
          <MultiplayerHubScreen fullName={fullName} />
          </ScreenSuspense>
        )}

        {screen === 'rewards' && (
          <ScreenSuspense>
          <RewardsLaunchScreen
  completedProblems={firestoreCompletedProblems}
  averageScore={firestoreAverageScore}
  certificateUnlocked={firestoreCertificateUnlocked}
/>
          </ScreenSuspense>
        )}
      </main>
    </section>
  )
}
const gameHomeWrapperStyle = { width: 'min(1450px, calc(100vw - 48px))', margin: '34px auto 0' }
const pageCss = `
  .glaGamePageHeader { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px; }
  .glaMenuButton { border:0; border-radius:999px; padding:12px 18px; display:inline-flex; align-items:center; gap:10px; cursor:pointer; background:linear-gradient(135deg,#9a6a22,#5c3512); color:#fff8eb; font-weight:900; box-shadow:0 16px 34px rgba(92,53,18,0.22); }
  .glaMenuIcon { font-size:1.15rem; line-height:1; }
  .glaPageTitle { margin:0; color:#5c3512; font-size:0.9rem; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; }
  .glaSidebarOverlay { position:fixed; inset:0; z-index:9999; pointer-events:none; overflow:hidden; }
  .glaSidebarOverlay.open { pointer-events:auto; }
  .glaSidebarBackdrop { position: fixed; inset: 0; border: 0; padding: 0; cursor: pointer; background: rgba(20, 13, 8, 0); backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0); transition: background 0.28s ease, backdrop-filter 0.28s ease, -webkit-backdrop-filter 0.28s ease; }
  .glaSidebarOverlay.open .glaSidebarBackdrop { background: rgba(20, 13, 8, 0.42); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .glaSidebarDrawer { position: fixed; top: 0; left: 0; bottom: 0; height: 100dvh; width: min(360px, 90vw); z-index: 2; transform: translateX(-105%); transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; }
  .glaSidebarOverlay.open .glaSidebarDrawer { transform: translateX(0); }
  .glaGameContent { width:100%; min-width:0; }
  .glaJourneyTabs { position:sticky; top:14px; z-index:80; display:grid; grid-template-columns:repeat(4,minmax(140px,1fr)); gap:10px; margin-bottom:18px; padding:10px; border-radius:26px; background:linear-gradient(135deg,rgba(255,248,235,.96),rgba(244,210,138,.9)); border:1px solid rgba(139,92,40,0.2); box-shadow:0 20px 48px rgba(80,52,20,0.16); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
  .glaJourneyTabButton { border:1px solid rgba(139,92,40,0.14); border-radius:20px; padding:13px 14px; text-align:left; cursor:pointer; background:rgba(255,255,255,0.62); color:#5c3512; transition:transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .glaJourneyTabButton:hover { transform:translateY(-2px); border-color:rgba(154,106,34,0.35); box-shadow:0 14px 28px rgba(80,52,20,0.12); }
  .glaJourneyTabButton.active { background:linear-gradient(135deg,#9a6a22,#5c3512); color:#fff8eb; border-color:rgba(244,210,138,0.4); box-shadow:0 18px 36px rgba(92,53,18,0.22); }
  .glaJourneyTabButton.disabled { opacity:0.45; cursor:default; }
  .glaJourneyTabButton.disabled:hover { transform:none; box-shadow:none; }
  .glaJourneyTabLabel { display:block; font-size:0.92rem; font-weight:900; line-height:1.2; }
  .glaJourneyTabDescription { display:block; margin-top:4px; font-size:0.72rem; font-weight:750; color:rgba(92,53,18,0.65); }
  .glaJourneyTabButton.active .glaJourneyTabDescription { color:rgba(255,248,235,0.72); }
  .glaHighContrast { filter: contrast(1.08); }
  .glaLargeText { font-size: 1.08rem; }
  .glaReduceMotion *, .glaReduceMotion *::before, .glaReduceMotion *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
  html[data-gla-large-text="true"] .glaGameContent, html[data-gla-large-text="true"] .adminContent { font-size: 1.08rem; }
  html[data-gla-high-contrast="true"] .glaGameContent, html[data-gla-high-contrast="true"] .adminContent { filter: contrast(1.08); }
  html[data-gla-reduce-motion="true"] *, html[data-gla-reduce-motion="true"] *::before, html[data-gla-reduce-motion="true"] *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
  html[data-gla-keyboard-mode="true"] button:focus-visible, html[data-gla-keyboard-mode="true"] a:focus-visible, html[data-gla-keyboard-mode="true"] input:focus-visible, html[data-gla-keyboard-mode="true"] textarea:focus-visible, html[data-gla-keyboard-mode="true"] select:focus-visible { outline: 4px solid rgba(154,106,34,0.62) !important; outline-offset: 3px !important; }
  .glaLowBandwidth img, .glaHideCardImages img, html[data-gla-low-bandwidth="true"] img, html[data-gla-show-card-images="false"] img { filter: saturate(0.75); }
  .glaCompactCards article, .glaCompactCards .smallCard { padding: 14px !important; }
  @media (max-width: 980px) { .glaJourneyTabs { grid-template-columns:repeat(2,minmax(0,1fr)); } .gameShell { grid-template-columns: 1fr !important; } }
  @media (max-width: 520px) { .glaGamePageHeader { align-items:flex-start; flex-direction:column; } .glaJourneyTabs { grid-template-columns:1fr; } }

  @media (max-width: 760px) {
    .glaGameContent { overflow-x:hidden; }
    .glaGameContent > * { max-width:100%; }
    .glaGameContent [style*="grid-template-columns"] { grid-template-columns:1fr !important; }
    .glaGameContent [style*="display: flex"], .glaGameContent [style*="display:flex"] { flex-wrap:wrap !important; }
    .glaGameContent button { max-width:100%; white-space:normal; }
    .glaGameContent input, .glaGameContent textarea, .glaGameContent select { width:100% !important; max-width:100%; }
    .glaGameContent table { min-width:620px; }
    .glaGameContent img, .glaGameContent video { max-width:100%; height:auto; }
    .glaSidebarDrawer { width:min(340px, 92vw); }
  }
  @media (max-width: 520px) {
    .glaGameContent [style*="padding: 36px"], .glaGameContent [style*="padding:36px"] { padding:18px !important; border-radius:22px !important; }
    .glaGameContent [style*="padding: 24px"], .glaGameContent [style*="padding:24px"] { padding:16px !important; border-radius:20px !important; }
    .glaGameContent h1 { font-size:clamp(2rem, 12vw, 3rem) !important; }
    .glaGameContent h2 { font-size:clamp(1.6rem, 9vw, 2.4rem) !important; }
    .glaGameContent h3 { font-size:clamp(1.1rem, 7vw, 1.5rem) !important; }
    .glaJourneyTabs { position:relative; top:auto; padding:8px; border-radius:20px; }
    .glaMenuButton { width:100%; justify-content:center; }
    .glaPageTitle { font-size:0.78rem; line-height:1.4; }
  }
`

export default GameHome
