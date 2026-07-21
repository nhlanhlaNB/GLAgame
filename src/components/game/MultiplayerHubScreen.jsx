import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { styles } from './gameStyles'
import { Pill, SectionHeader } from './ui'
import { usePlayerLanguage } from '../../hooks/usePlayerLanguage'
import problemCardData from '../../assets/json/grit_lab_africa_problem_cards.json'
import aiCards from '../../data/aiCards'
import {
  acceptRoomInvite,
  acceptRoomJoinRequest,
  createMultiplayerRoom,
  createRoomInvite,
  createTeam,
  clearRoomEvents,
  deleteRoomEvent,
  deleteTeam,
  declineRoomInvite,
  declineRoomJoinRequest,
  endMultiplayerRoom,
  finishTournamentRoom,
  joinMultiplayerRoom,
  joinTeam,
  markNotificationRead,
  requestToJoinRoom,
  seedMultiplayerRealtimeCollections,
  setTournamentRound,
  startChallengeRoom,
  startTeamRoom,
  startTournamentRoom,
  submitChallengeAttempt,
  submitDebateArgument,
  submitDebateVote,
  submitTeamSolution,
  submitTournamentRound,
  subscribeMultiplayerHubData,
  subscribeRoomDetails,
  subscribeUserNotifications,
  updateDebatePrompt,
  updatePlayerPresence
} from '../../services/player/playerMultiplayerService'

const modeDetails = {
  challenge: {
    label: 'Challenge',
    title: 'Challenge Mode',
    description: 'Everyone solves the same problem individually and compares ranked scores.',
    accent: '⚔️'
  },
  team: {
    label: 'Team',
    title: 'Team Mode',
    description: 'Players join teams and submit one shared team solution.',
    accent: '🤝'
  },
  debate: {
    label: 'Debate',
    title: 'Debate Mode',
    description: 'Players submit arguments and vote for the strongest reasoning.',
    accent: '🎙️'
  },
  tournament: {
    label: 'Tournament',
    title: 'Tournament Mode',
    description: 'Players compete over multiple timed rounds with a live leaderboard.',
    accent: '🏆'
  }
}

const voteCategories = [
  { value: 'most_realistic', label: 'Most realistic' },
  { value: 'most_innovative', label: 'Most innovative' },
  { value: 'most_ethical', label: 'Most ethical' },
  { value: 'most_scalable_african_solution', label: 'Most scalable African solution' }
]

const problemCards = Array.isArray(problemCardData?.cards) ? problemCardData.cards : []
const MAX_AI_CARDS_PER_SUBMISSION = 3
const MAX_EXPLANATION_WORDS = 100

function MultiplayerHubScreen({ fullName = 'Player' }) {
  const { currentUser } = useAuth()
  const { t } = usePlayerLanguage()

  const [page, setPage] = useState('home')
  const [hubData, setHubData] = useState(emptyHubData)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [activeMode, setActiveMode] = useState('challenge')
  const [modeFilter, setModeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [roomLoading, setRoomLoading] = useState(false)
  const [scoringMessage, setScoringMessage] = useState('')
  const [scoringProgress, setScoringProgress] = useState(0)
  const [toast, setToast] = useState(null)
  const knownNotificationIdsRef = useRef(new Set())
  const notificationsReadyRef = useRef(false)

  const [roomName, setRoomName] = useState('')
  const [mode, setMode] = useState('challenge')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [questTitle, setQuestTitle] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinRequestMessage, setJoinRequestMessage] = useState('')
  const [inviteUserId, setInviteUserId] = useState('')

  const [problemCardId, setProblemCardId] = useState('')
  const [problemTitle, setProblemTitle] = useState('')
  const [selectedAiCardIds, setSelectedAiCardIds] = useState('')
  const [selectedAiCardTitles, setSelectedAiCardTitles] = useState('')
  const [explanation, setExplanation] = useState('')
  const [endReason, setEndReason] = useState('Session completed.')

  const [teamName, setTeamName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [debatePrompt, setDebatePrompt] = useState('')
  const [voteCategory, setVoteCategory] = useState('most_realistic')
  const [voteTargetUserId, setVoteTargetUserId] = useState('')
  const [tournamentTitle, setTournamentTitle] = useState('')
  const [roundCount, setRoundCount] = useState('3')
  const [roundNumber, setRoundNumber] = useState('1')

  const userId = currentUser?.uid || ''
  const displayName = fullName || currentUser?.displayName || currentUser?.email || 'Player'
  const selectedRoom = selectedRoomDetails?.room || null
  const selectedMode = selectedRoom?.mode || activeMode || 'challenge'
  const currentPlayer = selectedRoomDetails?.roomPlayers?.find((player) => player.userId === userId)
  const isHost = selectedRoom?.createdBy === userId || currentPlayer?.role === 'host'
  const selectedTournament = selectedRoomDetails?.tournaments?.[0] || null
  const selectedDebate = selectedRoomDetails?.debates?.[0] || null
  const unreadCount = notifications.filter((item) => item.status === 'unread').length

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeMultiplayerHubData((data) => {
      setHubData(data)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!userId) return
    const unsubscribe = subscribeUserNotifications(userId, setNotifications)
    return unsubscribe
  }, [userId])


  useEffect(() => {
    if (!statusMessage) return
    setToast({ tone: 'success', title: 'Multiplayer update', message: statusMessage })
  }, [statusMessage])

  useEffect(() => {
    if (!error) return
    setToast({ tone: 'error', title: 'Action needed', message: error })
  }, [error])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 5500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!notificationsReadyRef.current) {
      knownNotificationIdsRef.current = new Set(notifications.map((notification) => notification.notificationId))
      notificationsReadyRef.current = true
      return
    }

    const newNotification = notifications.find((notification) => {
      return notification.status === 'unread' && !knownNotificationIdsRef.current.has(notification.notificationId)
    })

    knownNotificationIdsRef.current = new Set(notifications.map((notification) => notification.notificationId))

    if (newNotification) {
      const roomAwareLabel = newNotification.actionData?.roomId ? 'Open room' : (newNotification.actionType ? 'Open / Accept' : 'Open notification')

      setToast({
        tone: 'info',
        title: newNotification.title || 'New multiplayer notification',
        message: newNotification.message || 'Open notifications to continue.',
        notification: newNotification,
        actionLabel: roomAwareLabel
      })
    }
  }, [notifications])

  useEffect(() => {
    if (!scoringMessage) return undefined
    setScoringProgress(8)
    const interval = setInterval(() => {
      setScoringProgress((progress) => Math.min(92, progress + Math.max(3, Math.round((96 - progress) * 0.12))))
    }, 420)

    return () => clearInterval(interval)
  }, [scoringMessage])

  useEffect(() => {
    if (!userId) return

    updatePlayerPresence({
      userId,
      displayName,
      status: 'online',
      currentRoomId: selectedRoomId,
      currentRoomCode: selectedRoom?.roomCode || '',
      currentScreen: 'Multiplayer'
    })

    const interval = setInterval(() => {
      updatePlayerPresence({
        userId,
        displayName,
        status: 'online',
        currentRoomId: selectedRoomId,
        currentRoomCode: selectedRoom?.roomCode || '',
        currentScreen: 'Multiplayer'
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [userId, displayName, selectedRoomId, selectedRoom?.roomCode])

  useEffect(() => {
    if (!selectedRoomId) {
      setSelectedRoomDetails(null)
      return
    }

    setRoomLoading(true)
    const unsubscribe = subscribeRoomDetails(selectedRoomId, (details) => {
      setSelectedRoomDetails(details)
      setRoomLoading(false)

      if (details?.room) {
        setActiveMode(details.room.mode || 'challenge')
        setProblemCardId(details.room.currentProblemId || '')
        setProblemTitle(details.room.currentProblemTitle || '')
        setQuestTitle(details.room.currentQuestTitle || '')
        setRoundNumber(String(details.room.currentRound || 1))
      }
    })

    return unsubscribe
  }, [selectedRoomId])

  const rooms = hubData.rooms || []

  const presenceByUserId = useMemo(() => {
    const lookup = {}
    ;(hubData.presence || []).forEach((item) => {
      lookup[item.userId] = item
    })
    return lookup
  }, [hubData.presence])

  const livePlayerCount = useMemo(() => {
    return Object.values(presenceByUserId).filter((presence) => isPresenceOnline(presence)).length
  }, [presenceByUserId])

  const modeCounts = useMemo(() => {
    return rooms.reduce((counts, room) => {
      counts[room.mode] = Number(counts[room.mode] || 0) + 1
      return counts
    }, {})
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()

    return rooms.filter((room) => {
      const text = [room.roomName, room.roomCode, room.mode, room.status, room.createdByName, room.currentQuestTitle]
        .join(' ')
        .toLowerCase()

      const matchesSearch = !cleanSearch || text.includes(cleanSearch)
      const matchesMode = modeFilter === 'all' || room.mode === modeFilter
      const matchesActiveMode = activeMode === 'all' || room.mode === activeMode

      return matchesSearch && matchesMode && matchesActiveMode
    })
  }, [rooms, searchTerm, modeFilter, activeMode])

  const challengeResults = useMemo(() => rankRows(
    (selectedRoomDetails?.roomAttempts || []).filter((attempt) => attempt.multiplayerMode === 'challenge')
  ), [selectedRoomDetails?.roomAttempts])

  const debateArguments = useMemo(() => rankRows(
    (selectedRoomDetails?.roomAttempts || []).filter((attempt) => attempt.multiplayerMode === 'debate')
  ), [selectedRoomDetails?.roomAttempts])

  const debateVoteSummary = useMemo(() => {
    const summary = {}

    ;(selectedRoomDetails?.debateVotes || []).forEach((vote) => {
      const key = `${vote.targetUserId}_${vote.voteCategory}`
      if (!summary[key]) {
        summary[key] = {
          targetUserId: vote.targetUserId,
          targetDisplayName: vote.targetDisplayName || vote.targetUserId,
          voteCategory: vote.voteCategory,
          count: 0
        }
      }
      summary[key].count += 1
    })

    return Object.values(summary).sort((a, b) => b.count - a.count)
  }, [selectedRoomDetails?.debateVotes])

  const tournamentLeaderboard = useMemo(() => {
    return [...(selectedRoomDetails?.tournamentPlayers || [])]
      .sort((a, b) => Number(a.rank || 9999) - Number(b.rank || 9999) || Number(b.totalScore || 0) - Number(a.totalScore || 0))
  }, [selectedRoomDetails?.tournamentPlayers])

  function handleError(err, fallback) {
    console.error(err)
    setError(err.message || fallback)
  }

  async function runScoredAction(message, action) {
    setScoringMessage(message)
    setScoringProgress(8)

    try {
      const result = await action()
      setScoringProgress(100)
      return result
    } finally {
      setTimeout(() => {
        setScoringMessage('')
        setScoringProgress(0)
      }, 650)
    }
  }

  function resetPlayForm() {
    setSelectedAiCardIds('')
    setSelectedAiCardTitles('')
    setExplanation('')
  }

  function openRoom(roomId) {
    setError('')
    setStatusMessage('')
    setSelectedRoomId(roomId)
    setPage('room')
  }

  function goHome() {
    setPage('home')
    setSelectedRoomId('')
    setSelectedRoomDetails(null)
  }

  async function handleSeedCollections() {
    setError('')
    setStatusMessage('')

    try {
      const count = await seedMultiplayerRealtimeCollections({ userId: userId || 'schema_user', displayName })
      setStatusMessage(`${count} multiplayer setup checked.`)
    } catch (err) {
      handleError(err, 'Could not create multiplayer collections.')
    }
  }

  async function handleCreateRoom(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const roomId = await createMultiplayerRoom({
        userId,
        displayName,
        roomName,
        mode,
        maxPlayers,
        requiresApproval,
        questTitle
      })

      setRoomName('')
      setQuestTitle('')
      setActiveMode(mode)
      setModeFilter(mode)
      openRoom(roomId)
      setStatusMessage(`${modeDetails[mode]?.label || 'Room'} room created. Lobby is open.`)
    } catch (err) {
      handleError(err, 'Could not create multiplayer room.')
    }
  }

  async function handleJoinRoom(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const roomId = await joinMultiplayerRoom({ userId, displayName, roomCode: joinCode })
      setJoinCode('')
      openRoom(roomId)
      setStatusMessage('Room joined successfully.')
    } catch (err) {
      handleError(err, 'Could not join multiplayer room.')
    }
  }

  async function handleRequestJoinRoom(roomId) {
    setError('')
    setStatusMessage('')

    try {
      await requestToJoinRoom({ roomId, userId, displayName, message: joinRequestMessage })
      setJoinRequestMessage('')
      setStatusMessage('Join request sent to the host.')
    } catch (err) {
      handleError(err, 'Could not send join request.')
    }
  }

  async function handleAcceptRoomRequest(requestId) {
    setError('')
    setStatusMessage('')

    try {
      await acceptRoomJoinRequest({ requestId, hostUserId: userId })
      setStatusMessage('Room request accepted.')
    } catch (err) {
      handleError(err, 'Could not accept room request.')
    }
  }

  async function handleDeclineRoomRequest(requestId) {
    setError('')
    setStatusMessage('')

    try {
      await declineRoomJoinRequest({ requestId, hostUserId: userId })
      setStatusMessage('Room request declined.')
    } catch (err) {
      handleError(err, 'Could not decline room request.')
    }
  }

  async function sendInviteToRecipient(recipientUserId) {
    if (!recipientUserId) throw new Error('Choose or enter a player to invite.')

    await createRoomInvite({
      roomId: selectedRoomId,
      recipientUserId,
      senderUserId: userId,
      senderDisplayName: displayName
    })
  }

  async function handleSendInvite(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await sendInviteToRecipient(inviteUserId)
      setInviteUserId('')
      setStatusMessage('Invite sent. The player will see it in their notifications.')
    } catch (err) {
      handleError(err, 'Could not send invite.')
    }
  }

  async function handleSendInviteTo(recipientUserId) {
    setError('')
    setStatusMessage('')

    try {
      await sendInviteToRecipient(recipientUserId)
      setStatusMessage('Invite sent. The player will see it in their notifications.')
    } catch (err) {
      handleError(err, 'Could not send invite.')
    }
  }

  async function handleRoomCardAction(room) {
    setError('')
    setStatusMessage('')

    try {
      const isMember = (room.roomPlayers || []).some((player) => player.userId === userId)
      const isHostRoom = room.createdBy === userId

      if (isMember || isHostRoom) {
        openRoom(room.roomId)
        return
      }

      if (room.requiresApproval) {
        await requestToJoinRoom({ roomId: room.roomId, userId, displayName, message: joinRequestMessage })
        setJoinRequestMessage('')
        setStatusMessage('Access request sent to the host. When accepted, you will receive a notification.')
        return
      }

      const roomId = await joinMultiplayerRoom({ userId, displayName, roomCode: room.roomCode })
      openRoom(roomId)
      setStatusMessage('Room joined successfully. You are now in the lobby.')
    } catch (err) {
      handleError(err, 'Could not open or join this room.')
    }
  }

  async function handleNotificationAction(notification) {
    setError('')
    setStatusMessage('')

    try {
      if (notification.actionType === 'accept_room_invite') {
        const roomId = await acceptRoomInvite({ notificationId: notification.notificationId, userId, displayName })
        openRoom(roomId)
        setStatusMessage('Invite accepted. You joined the room.')
        return
      }


      if (notification.actionData?.roomId) {
        openRoom(notification.actionData.roomId)
      }

      await markNotificationRead(notification.notificationId)
    } catch (err) {
      handleError(err, 'Could not complete notification action.')
    }
  }

  async function handleDeclineNotification(notification) {
    setError('')
    setStatusMessage('')

    try {
      if (notification.actionType === 'accept_room_invite') {
        await declineRoomInvite(notification.notificationId)
      } else {
        await markNotificationRead(notification.notificationId)
      }

      setStatusMessage('Notification updated.')
    } catch (err) {
      handleError(err, 'Could not update notification.')
    }
  }

  async function handleStartChallenge(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await startChallengeRoom({ roomId: selectedRoomId, problemCardId, problemTitle, actorUserId: userId, actorDisplayName: displayName })
      setStatusMessage('Challenge started. Players can now submit answers.')
    } catch (err) {
      handleError(err, 'Could not start challenge.')
    }
  }

  async function handleSubmitChallenge(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const result = await runScoredAction('Scoring your challenge answer...', () => submitChallengeAttempt({
        roomId: selectedRoomId,
        userId,
        displayName,
        problemCardId: problemCardId || selectedRoom?.currentProblemId,
        problemTitle: problemTitle || selectedRoom?.currentProblemTitle,
        selectedAiCardIds,
        selectedAiCardTitles,
        explanation
      }))

      resetPlayForm()
      setStatusMessage(`Challenge submitted. Score: ${result.totalScore}/100.`)
    } catch (err) {
      handleError(err, 'Could not submit challenge answer.')
    }
  }

  async function handleCreateTeam(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const teamId = await createTeam({ roomId: selectedRoomId, teamName, userId, displayName })
      setSelectedTeamId(teamId)
      setTeamName('')
      setStatusMessage('Team created and joined.')
    } catch (err) {
      handleError(err, 'Could not create team.')
    }
  }

  async function handleJoinTeam(teamId) {
    setError('')
    setStatusMessage('')

    try {
      await joinTeam({ roomId: selectedRoomId, teamId, userId, displayName })
      setSelectedTeamId(teamId)
      setStatusMessage('You joined the team. Your team space is ready.')
    } catch (err) {
      handleError(err, 'Could not join team.')
    }
  }

  async function handleDeleteTeam(teamId) {
    setError('')
    setStatusMessage('')

    try {
      await deleteTeam({ roomId: selectedRoomId, teamId, userId, displayName })
      if (selectedTeamId === teamId) setSelectedTeamId('')
      setStatusMessage('Team removed successfully.')
    } catch (err) {
      handleError(err, 'Could not delete team.')
    }
  }

  async function handleDeleteRoomLog(eventId) {
    setError('')
    setStatusMessage('')

    try {
      await deleteRoomEvent({ eventId })
      setStatusMessage('Activity log deleted.')
    } catch (err) {
      handleError(err, 'Could not delete activity log.')
    }
  }

  async function handleClearRoomLogs() {
    setError('')
    setStatusMessage('')

    try {
      const count = await clearRoomEvents({ roomId: selectedRoomId })
      setStatusMessage(`${count} activity log${count === 1 ? '' : 's'} cleared.`)
    } catch (err) {
      handleError(err, 'Could not clear room activity logs.')
    }
  }

  async function handleStartTeamMode(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await startTeamRoom({ roomId: selectedRoomId, problemCardId, problemTitle, actorUserId: userId, actorDisplayName: displayName })
      setStatusMessage('Team room started.')
    } catch (err) {
      handleError(err, 'Could not start team room.')
    }
  }

  async function handleSubmitTeam(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const teamId = selectedTeamId || currentPlayer?.teamId
      const result = await runScoredAction('Scoring the team solution...', () => submitTeamSolution({
        roomId: selectedRoomId,
        teamId,
        userId,
        displayName,
        problemCardId: problemCardId || selectedRoom?.currentProblemId,
        problemTitle: problemTitle || selectedRoom?.currentProblemTitle,
        selectedAiCardIds,
        selectedAiCardTitles,
        explanation
      }))

      resetPlayForm()
      setStatusMessage(`Team solution submitted. Score: ${result.totalScore}/100.`)
    } catch (err) {
      handleError(err, 'Could not submit team solution.')
    }
  }

  async function handleSetDebatePrompt(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await updateDebatePrompt({ roomId: selectedRoomId, prompt: debatePrompt, actorUserId: userId, actorDisplayName: displayName })
      setDebatePrompt('')
      setStatusMessage('Debate prompt saved. Players can now submit arguments.')
    } catch (err) {
      handleError(err, 'Could not save debate prompt.')
    }
  }

  async function handleSubmitDebateArgument(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const debateId = selectedDebate?.debateId || `${selectedRoomId}_debate`
      const result = await runScoredAction('Scoring your debate argument...', () => submitDebateArgument({
        roomId: selectedRoomId,
        debateId,
        userId,
        displayName,
        argumentText: explanation,
        selectedAiCardIds,
        selectedAiCardTitles
      }))

      resetPlayForm()
      setStatusMessage(`Debate argument submitted. Score: ${result.totalScore}/100.`)
    } catch (err) {
      handleError(err, 'Could not submit debate argument.')
    }
  }

  async function handleVote(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const targetPlayer = selectedRoomDetails?.roomPlayers?.find((player) => player.userId === voteTargetUserId)
      await submitDebateVote({
        roomId: selectedRoomId,
        debateId: selectedDebate?.debateId || `${selectedRoomId}_debate`,
        voterUserId: userId,
        voterDisplayName: displayName,
        targetUserId: voteTargetUserId,
        targetDisplayName: targetPlayer?.displayName || voteTargetUserId,
        voteCategory
      })

      setVoteTargetUserId('')
      setStatusMessage('Debate vote saved.')
    } catch (err) {
      handleError(err, 'Could not submit vote.')
    }
  }

  async function handleStartTournament(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await startTournamentRoom({ roomId: selectedRoomId, title: tournamentTitle || selectedRoom?.roomName, roundCount, createdBy: userId, createdByName: displayName })
      setStatusMessage('Tournament started.')
    } catch (err) {
      handleError(err, 'Could not start tournament.')
    }
  }

  async function handleSetTournamentRound(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await setTournamentRound({
        roomId: selectedRoomId,
        tournamentId: selectedTournament?.tournamentId,
        roundNumber,
        problemCardId,
        problemTitle,
        actorUserId: userId,
        actorDisplayName: displayName
      })

      setStatusMessage(`Round ${roundNumber} is ready.`)
    } catch (err) {
      handleError(err, 'Could not set tournament round.')
    }
  }

  async function handleSubmitTournamentRound(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const result = await runScoredAction('Scoring this tournament round...', () => submitTournamentRound({
        roomId: selectedRoomId,
        tournamentId: selectedTournament?.tournamentId,
        userId,
        displayName,
        roundNumber,
        problemCardId: problemCardId || selectedRoom?.currentProblemId,
        problemTitle: problemTitle || selectedRoom?.currentProblemTitle,
        selectedAiCardIds,
        selectedAiCardTitles,
        explanation
      }))

      resetPlayForm()
      setStatusMessage(`Round submitted. Round score: ${result.totalScore}/100.`)
    } catch (err) {
      handleError(err, 'Could not submit tournament round.')
    }
  }

  async function handleFinishTournament() {
    setError('')
    setStatusMessage('')

    try {
      await finishTournamentRoom({ roomId: selectedRoomId, tournamentId: selectedTournament?.tournamentId, actorUserId: userId, actorDisplayName: displayName })
      setStatusMessage('Tournament completed and leaderboard finalised.')
    } catch (err) {
      handleError(err, 'Could not finish tournament.')
    }
  }

  async function handleEndRoom(event) {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      await endMultiplayerRoom({ roomId: selectedRoomId, actorUserId: userId, actorDisplayName: displayName, endReason })
      setStatusMessage('Room ended successfully.')
    } catch (err) {
      handleError(err, 'Could not end room.')
    }
  }

  return (
    <div className="mpRootPanel" style={styles.panel}>
      <style>{pageCss}</style>
      <ScoringOverlay active={Boolean(scoringMessage)} message={scoringMessage} progress={scoringProgress} />
      <PopupToast toast={toast} onClose={() => setToast(null)} onAction={() => {
        if (toast?.notification) {
          handleNotificationAction(toast.notification)
        }
        setToast(null)
      }} />

      <div className="mpHero">
        <div>
          <h1 className="mpHeroTitle">Live multiplayer arena</h1>
          <p className="mpHeroText">
            Create rooms, request access, open lobbies, start rounds, submit answers, end sessions and track timestamps.
          </p>
        </div>
        <div className="mpHeroStatsWrap">
          <div className="mpHeroStats">
            <strong>{rooms.length}</strong>
            <span>rooms </span>
            
          </div>

          <div className="mpHeroStats live">
            <span className="mpLivePulse"></span>
            <strong>{livePlayerCount}</strong>
            <span>live players </span>
            <small>currently online</small>
          </div>
        </div>
      </div>

      

      <PageTabs page={page} unreadCount={unreadCount} onChange={setPage} onHome={goHome} />

      {error && <MessageCard message={error} tone="error" />}
      {statusMessage && <MessageCard message={statusMessage} tone="success" />}

      {loading && <div style={cardStyle}><p style={styles.smallCardText}>Loading live multiplayer data...</p></div>}

      {!loading && page === 'home' && (
        <HomePage
          rooms={filteredRooms}
          allRooms={rooms}
          notifications={notifications}
          unreadCount={unreadCount}
          activeMode={activeMode}
          modeFilter={modeFilter}
          searchTerm={searchTerm}
          modeCounts={modeCounts}
          presenceByUserId={presenceByUserId}
          userId={userId}
          joinRequestMessage={joinRequestMessage}
          onModeChange={(nextMode) => {
            setActiveMode(nextMode)
            setModeFilter(nextMode)
            setMode(nextMode)
          }}
          onModeFilterChange={setModeFilter}
          onSearchChange={setSearchTerm}
          onCreate={() => setPage('create')}
          onJoin={() => setPage('join')}
          onOpen={openRoom}
          onRequest={handleRequestJoinRoom}
          onRoomAction={handleRoomCardAction}
          onSeed={handleSeedCollections}
          onJoinRequestMessageChange={setJoinRequestMessage}
          onNotificationAction={handleNotificationAction}
          onNotificationDecline={handleDeclineNotification}
          onMarkRead={markNotificationRead}
        />
      )}

      {!loading && page === 'create' && (
        <CreateRoomPage
          roomName={roomName}
          mode={mode}
          maxPlayers={maxPlayers}
          requiresApproval={requiresApproval}
          questTitle={questTitle}
          onRoomNameChange={setRoomName}
          onModeChange={setMode}
          onMaxPlayersChange={setMaxPlayers}
          onRequiresApprovalChange={setRequiresApproval}
          onQuestTitleChange={setQuestTitle}
          onCreate={handleCreateRoom}
          onBack={() => setPage('home')}
        />
      )}

      {!loading && page === 'join' && (
        <JoinRoomPage
          joinCode={joinCode}
          joinRequestMessage={joinRequestMessage}
          rooms={rooms}
          presenceByUserId={presenceByUserId}
          userId={userId}
          onJoinCodeChange={setJoinCode}
          onJoinRequestMessageChange={setJoinRequestMessage}
          onJoin={handleJoinRoom}
          onRequest={handleRequestJoinRoom}
          onOpen={openRoom}
          onRoomAction={handleRoomCardAction}
          onBack={() => setPage('home')}
        />
      )}

      {!loading && page === 'notifications' && (
        <NotificationsPage
          notifications={notifications}
          unreadCount={unreadCount}
          presenceByUserId={presenceByUserId}
          onNotificationAction={handleNotificationAction}
          onNotificationDecline={handleDeclineNotification}
          onMarkRead={markNotificationRead}
        />
      )}

      {!loading && page === 'room' && selectedRoom && (
        <RoomPage
          roomLoading={roomLoading}
          selectedRoom={selectedRoom}
          selectedRoomDetails={selectedRoomDetails}
          selectedMode={selectedMode}
          isHost={isHost}
          currentPlayer={currentPlayer}
          presenceByUserId={presenceByUserId}
          inviteUserId={inviteUserId}
          endReason={endReason}
          problemCardId={problemCardId}
          problemTitle={problemTitle}
          selectedAiCardIds={selectedAiCardIds}
          selectedAiCardTitles={selectedAiCardTitles}
          explanation={explanation}
          teamName={teamName}
          selectedTeamId={selectedTeamId || currentPlayer?.teamId || ''}
          debatePrompt={debatePrompt}
          voteCategory={voteCategory}
          voteTargetUserId={voteTargetUserId}
          tournamentTitle={tournamentTitle}
          roundCount={roundCount}
          roundNumber={roundNumber}
          selectedTournament={selectedTournament}
          selectedDebate={selectedDebate}
          challengeResults={challengeResults}
          debateArguments={debateArguments}
          debateVoteSummary={debateVoteSummary}
          tournamentLeaderboard={tournamentLeaderboard}
          onInviteUserIdChange={setInviteUserId}
          onSendInvite={handleSendInvite}
          onSendInviteTo={handleSendInviteTo}
          onEndReasonChange={setEndReason}
          onEndRoom={handleEndRoom}
          onAcceptRoomRequest={handleAcceptRoomRequest}
          onDeclineRoomRequest={handleDeclineRoomRequest}
          onProblemCardIdChange={setProblemCardId}
          onProblemTitleChange={setProblemTitle}
          onSelectedAiCardIdsChange={setSelectedAiCardIds}
          onSelectedAiCardTitlesChange={setSelectedAiCardTitles}
          onExplanationChange={setExplanation}
          onStartChallenge={handleStartChallenge}
          onSubmitChallenge={handleSubmitChallenge}
          onTeamNameChange={setTeamName}
          onSelectedTeamIdChange={setSelectedTeamId}
          onCreateTeam={handleCreateTeam}
          onJoinTeam={handleJoinTeam}
          onDeleteTeam={handleDeleteTeam}
          onStartTeam={handleStartTeamMode}
          onSubmitTeam={handleSubmitTeam}
          onDebatePromptChange={setDebatePrompt}
          onSetDebatePrompt={handleSetDebatePrompt}
          onSubmitDebateArgument={handleSubmitDebateArgument}
          onVoteCategoryChange={setVoteCategory}
          onVoteTargetUserIdChange={setVoteTargetUserId}
          onVote={handleVote}
          onTournamentTitleChange={setTournamentTitle}
          onRoundCountChange={setRoundCount}
          onRoundNumberChange={setRoundNumber}
          onStartTournament={handleStartTournament}
          onSetTournamentRound={handleSetTournamentRound}
          onSubmitTournamentRound={handleSubmitTournamentRound}
          onFinishTournament={handleFinishTournament}
          onDeleteRoomLog={handleDeleteRoomLog}
          onClearRoomLogs={handleClearRoomLogs}
          onBack={() => setPage('home')}
        />
      )}

      {!loading && page === 'room' && selectedRoomId && !selectedRoom && (
        <div style={cardStyle}>
          <h3 style={styles.smallCardTitle}>Opening lobby...</h3>
          <p style={styles.smallCardText}>Syncing the live room details.</p>
        </div>
      )}

      {!loading && page === 'room' && !selectedRoomId && !selectedRoom && (
        <div style={cardStyle}>
          <h3 style={styles.smallCardTitle}>No lobby opened.</h3>
          <p style={styles.smallCardText}>Choose a room from Home or Join first.</p>
          <button type="button" onClick={() => setPage('home')} style={secondaryButtonStyle}>Back to Home</button>
        </div>
      )}
    </div>
  )
}

function ScoringOverlay({ active, message, progress }) {
  if (!active) return null

  return (
    <div className="mpScoringOverlay" role="status" aria-live="polite">
      <div className="mpScoringCard">
        <div className="mpScoringSpinner"></div>
        <p style={styles.eyebrow}>Scoring in progress</p>
        <h3 style={styles.smallCardTitle}>{message || 'Scoring your answer...'}</h3>
        <p style={styles.smallCardText}>Please wait while the system checks relevance, feasibility, SDG alignment, creativity and responsible use.</p>
        <div className="mpProgressTrack">
          <span style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}></span>
        </div>
        <small style={mutedTextStyle}>{Math.round(Math.max(8, Math.min(100, progress)))}% complete</small>
      </div>
    </div>
  )
}

function PopupToast({ toast, onClose, onAction }) {
  if (!toast) return null
  const toneClass = toast.tone === 'error' ? 'error' : toast.tone === 'info' ? 'info' : 'success'

  return (
    <aside className={`mpToast ${toneClass}`} role="alert">
      <div>
        <strong>{toast.title || 'Notification'}</strong>
        <p>{toast.message}</p>
        {toast.actionLabel && (
          <button type="button" onClick={onAction} className="mpToastAction">
            {toast.actionLabel}
          </button>
        )}
      </div>
      <button type="button" onClick={onClose} className="mpToastClose" aria-label="Close notification">×</button>
    </aside>
  )
}

const emptyHubData = {
  rooms: [],
  roomPlayers: [],
  teams: [],
  teamSessions: [],
  debates: [],
  debateVotes: [],
  tournaments: [],
  tournamentPlayers: [],
  attempts: [],
  scores: [],
  subScores: [],
  feedback: [],
  presence: [],
  roomEvents: [],
  roomRequests: []
}

function rankRows(rows) {
  return [...rows]
    .sort((a, b) => Number(b.totalScore || 0) - Number(a.totalScore || 0))
    .map((item, index) => ({ ...item, rank: index + 1 }))
}

function PageTabs({ page, unreadCount, onChange, onHome }) {
  const items = [
    { key: 'home', label: 'Home' },
    { key: 'create', label: 'Create Event' },
    { key: 'join', label: 'Join / Request' },
    { key: 'notifications', label: `Notifications ${unreadCount ? `(${unreadCount})` : ''}` },
    { key: 'room', label: 'Opened Lobby' }
  ]

  return (
    <div className="mpPageTabs">
      {items.map((item) => (
        <button key={item.key} type="button" onClick={() => item.key === 'home' ? onHome() : onChange(item.key)} className={page === item.key ? 'mpPageTab active' : 'mpPageTab'}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

function HomePage({
  rooms,
  allRooms,
  notifications,
  unreadCount,
  activeMode,
  modeFilter,
  searchTerm,
  modeCounts,
  presenceByUserId,
  userId,
  joinRequestMessage,
  onModeChange,
  onModeFilterChange,
  onSearchChange,
  onCreate,
  onJoin,
  onOpen,
  onRequest,
  onRoomAction,
  onSeed,
  onJoinRequestMessageChange,
  onNotificationAction,
  onNotificationDecline,
  onMarkRead,
}) {
  return (
    <>
      <div className="mpTwoCol">
        <div style={cardStyle}>
          <p style={styles.eyebrow}>Sequential workflow</p>
          <h3 style={styles.smallCardTitle}>Start from one clear action.</h3>
          <div className="mpActionGrid">
            <button type="button" onClick={onCreate} style={primaryButtonStyle}>Create a live event</button>
            <button type="button" onClick={onJoin} style={secondaryButtonStyle}>Join or request access</button>
            <button type="button" onClick={onSeed} style={secondaryButtonStyle}>Refresh multiplayer setup</button>
          </div>
          <p style={styles.smallCardText}>Rooms now have created, lobby, started, ended and last activity timestamps.</p>
        </div>

        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onAction={onNotificationAction}
          onDecline={onNotificationDecline}
          onMarkRead={onMarkRead}
        />
      </div>

      <div style={cardStyle}>
        <p style={styles.eyebrow}>Live summary</p>
        <div className="mpMiniGrid">
          <MiniStat title="Rooms" value={allRooms.length} />
          <MiniStat title="Challenge" value={modeCounts.challenge || 0} />
          <MiniStat title="Team" value={modeCounts.team || 0} />
          <MiniStat title="Debate" value={modeCounts.debate || 0} />
          <MiniStat title="Tournament" value={modeCounts.tournament || 0} />
        </div>
      </div>

      <ModeNav activeMode={activeMode} modeCounts={modeCounts} onModeChange={onModeChange} />

      <div style={sectionCardStyle}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>{modeDetails[activeMode]?.label} rooms</p>
            <h3 style={styles.smallCardTitle}>{modeDetails[activeMode]?.title}</h3>
            <p style={styles.smallCardText}>{modeDetails[activeMode]?.description}</p>
          </div>
          <Pill>{rooms.length} rooms</Pill>
        </div>

        <div className="mpFilterGrid">
          <input value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search room name, code, host, status or quest..." style={inputStyle} />
          <select value={modeFilter} onChange={(event) => onModeFilterChange(event.target.value)} style={inputStyle}>
            <option value="all">All modes</option>
            {Object.entries(modeDetails).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </div>

        <label style={{ ...fieldStyle, marginTop: 14 }}>
          Optional request message
          <input value={joinRequestMessage} onChange={(event) => onJoinRequestMessageChange(event.target.value)} placeholder="Example: Please add me to this event" style={inputStyle} />
        </label>

        {rooms.length === 0 ? (
          <EmptyState title="No rooms found." text="Create a room or change your filters." />
        ) : (
          <div className="mpRoomGrid">
            {rooms.map((room) => (
              <RoomCard key={room.roomId} room={room} userId={userId} presenceByUserId={presenceByUserId} onOpen={() => onOpen(room.roomId)} onRoomAction={() => onRoomAction(room)} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function CreateRoomPage({
  roomName,
  mode,
  maxPlayers,
  requiresApproval,
  questTitle,
  onRoomNameChange,
  onModeChange,
  onMaxPlayersChange,
  onRequiresApprovalChange,
  onQuestTitleChange,
  onCreate,
  onBack
}) {
  return (
    <div style={sectionCardStyle}>
      <WizardHeader step="Step 1 of 3" title="Create a live room event" text="Choose the game mode, set the event details and open a lobby." onBack={onBack} />

      <form onSubmit={onCreate} style={formGridStyle}>
        <div className="mpModeSelectGrid">
          {Object.entries(modeDetails).map(([key, item]) => (
            <button key={key} type="button" onClick={() => onModeChange(key)} className={mode === key ? 'mpModeChoice active' : 'mpModeChoice'}>
              <span>{item.accent}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </button>
          ))}
        </div>

        <div className="mpTwoCol">
          <label style={fieldStyle}>
            Room name
            <input value={roomName} onChange={(event) => onRoomNameChange(event.target.value)} placeholder="Example: GLA SDG Challenge Room" style={inputStyle} />
          </label>

          <label style={fieldStyle}>
            Quest / event theme
            <input value={questTitle} onChange={(event) => onQuestTitleChange(event.target.value)} placeholder="Example: Health innovation quest" style={inputStyle} />
          </label>
        </div>

        <div className="mpTwoCol">
          <label style={fieldStyle}>
            Max players
            <select value={maxPlayers} onChange={(event) => onMaxPlayersChange(event.target.value)} style={inputStyle}>
              <option value="2">2 players</option>
              <option value="4">4 players</option>
              <option value="8">8 players</option>
              <option value="12">12 players</option>
            </select>
          </label>

          <label className="mpCheckRow">
            <input type="checkbox" checked={requiresApproval} onChange={(event) => onRequiresApprovalChange(event.target.checked)} />
            Require host approval before players join
          </label>
        </div>

        <button type="submit" style={primaryButtonStyle}>Create room and open lobby</button>
        <p style={styles.smallCardText}>This event will expire in one hour if no other player joins.</p>
      </form>
    </div>
  )
}

function JoinRoomPage({ joinCode, joinRequestMessage, rooms, presenceByUserId, userId, onJoinCodeChange, onJoinRequestMessageChange, onJoin, onRequest, onOpen, onRoomAction, onBack }) {
  return (
    <div style={sectionCardStyle}>
      <WizardHeader step="Step 1 of 2" title="Join or request access" text="Use the host room code or request access from a room card." onBack={onBack} />

      <form onSubmit={onJoin} style={formGridStyle}>
        <label style={fieldStyle}>
          Room code
          <input value={joinCode} onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase())} placeholder="Example: ABC123" style={{ ...inputStyle, letterSpacing: '0.12em', fontWeight: 950 }} />
        </label>
        <button type="submit" style={primaryButtonStyle}>Join room by code</button>
      </form>

      <label style={{ ...fieldStyle, marginTop: 20 }}>
        Request message
        <input value={joinRequestMessage} onChange={(event) => onJoinRequestMessageChange(event.target.value)} placeholder="Example: Please approve me for the tournament" style={inputStyle} />
      </label>

      <div className="mpRoomGrid">
        {rooms.map((room) => (
          <RoomCard key={room.roomId} room={room} userId={userId} presenceByUserId={presenceByUserId} onOpen={() => onOpen(room.roomId)} onRoomAction={() => onRoomAction(room)} />
        ))}
      </div>
    </div>
  )
}

function NotificationsPage({ notifications, unreadCount, onNotificationAction, onNotificationDecline, onMarkRead }) {
  return (
    <NotificationPanel notifications={notifications} unreadCount={unreadCount} onAction={onNotificationAction} onDecline={onNotificationDecline} onMarkRead={onMarkRead} limit={30} />
  )
}

function RoomPage(props) {
  const {
    roomLoading,
    selectedRoom,
    selectedRoomDetails,
    selectedMode,
    isHost,
    currentPlayer,
    presenceByUserId,
    inviteUserId,
    endReason,
    problemCardId,
    problemTitle,
    selectedAiCardIds,
    selectedAiCardTitles,
    explanation,
    teamName,
    selectedTeamId,
    debatePrompt,
    voteCategory,
    voteTargetUserId,
    tournamentTitle,
    roundCount,
    roundNumber,
    selectedTournament,
    selectedDebate,
    challengeResults,
    debateArguments,
    debateVoteSummary,
    tournamentLeaderboard,
    onInviteUserIdChange,
    onSendInvite,
    onSendInviteTo,
    onEndReasonChange,
    onEndRoom,
    onAcceptRoomRequest,
    onDeclineRoomRequest,
    onProblemCardIdChange,
    onProblemTitleChange,
    onSelectedAiCardIdsChange,
    onSelectedAiCardTitlesChange,
    onExplanationChange,
    onStartChallenge,
    onSubmitChallenge,
    onTeamNameChange,
    onSelectedTeamIdChange,
    onCreateTeam,
    onJoinTeam,
    onDeleteTeam,
    onStartTeam,
    onSubmitTeam,
    onDebatePromptChange,
    onSetDebatePrompt,
    onSubmitDebateArgument,
    onVoteCategoryChange,
    onVoteTargetUserIdChange,
    onVote,
    onTournamentTitleChange,
    onRoundCountChange,
    onRoundNumberChange,
    onStartTournament,
    onSetTournamentRound,
    onSubmitTournamentRound,
    onFinishTournament,
    onDeleteRoomLog,
    onClearRoomLogs,
    onBack
  } = props

  return (
    <div style={lobbyCardStyle}>
      <div style={styles.rowBetween}>
        <div>
          <p style={styles.eyebrow}>{modeDetails[selectedMode]?.title}</p>
          <h2 className="mpLobbyTitle">{modeDetails[selectedMode]?.accent} {selectedRoom.roomName}</h2>
          <p style={styles.smallCardText}>
            Code <strong>{selectedRoom.roomCode}</strong> • {selectedRoom.status} • {selectedRoom.roomPlayers.length}/{selectedRoom.maxPlayers} players
          </p>
        </div>
        <div style={buttonRowStyle}>
          <Pill>{roomLoading ? 'Syncing' : getRoomStatusLabel(selectedRoom)}</Pill>
          <button type="button" onClick={onBack} style={secondaryButtonStyle}>Back to Rooms</button>
        </div>
      </div>

      <LifecyclePanel room={selectedRoom} />

      <div className="mpTwoCol">
        <div style={cardStyle}>
          <p style={styles.eyebrow}>Players and live status</p>
          <PlayerList players={selectedRoomDetails.roomPlayers || []} presenceByUserId={presenceByUserId} />
        </div>

        <div style={cardStyle}>
          <p style={styles.eyebrow}>Invites and access requests</p>
          <form onSubmit={onSendInvite} style={formGridStyle}>
            <label style={fieldStyle}>
              Invite player by email or UID
              <input value={inviteUserId} onChange={(event) => onInviteUserIdChange(event.target.value)} placeholder="Enter player email or UID" style={inputStyle} />
            </label>
            <button type="submit" style={primaryButtonStyle}>Send room invite</button>
          </form>
          <RoomRequests requests={selectedRoomDetails.roomRequests || []} isHost={isHost} onAccept={onAcceptRoomRequest} onDecline={onDeclineRoomRequest} />
        </div>
      </div>

      {selectedMode === 'challenge' && (
        <ChallengeModePanel
          isHost={isHost}
          room={selectedRoom}
          problemCardId={problemCardId}
          problemTitle={problemTitle}
          selectedAiCardIds={selectedAiCardIds}
          selectedAiCardTitles={selectedAiCardTitles}
          explanation={explanation}
          results={challengeResults}
          onProblemCardIdChange={onProblemCardIdChange}
          onProblemTitleChange={onProblemTitleChange}
          onSelectedAiCardIdsChange={onSelectedAiCardIdsChange}
          onSelectedAiCardTitlesChange={onSelectedAiCardTitlesChange}
          onExplanationChange={onExplanationChange}
          onStart={onStartChallenge}
          onSubmit={onSubmitChallenge}
        />
      )}

      {selectedMode === 'team' && (
        <TeamModePanel
          isHost={isHost}
          currentPlayer={currentPlayer}
          room={selectedRoom}
          teams={selectedRoomDetails.teams || []}
          teamSessions={selectedRoomDetails.teamSessions || []}
          teamName={teamName}
          selectedTeamId={selectedTeamId}
          problemCardId={problemCardId}
          problemTitle={problemTitle}
          selectedAiCardIds={selectedAiCardIds}
          selectedAiCardTitles={selectedAiCardTitles}
          explanation={explanation}
          onTeamNameChange={onTeamNameChange}
          onSelectedTeamIdChange={onSelectedTeamIdChange}
          onProblemCardIdChange={onProblemCardIdChange}
          onProblemTitleChange={onProblemTitleChange}
          onSelectedAiCardIdsChange={onSelectedAiCardIdsChange}
          onSelectedAiCardTitlesChange={onSelectedAiCardTitlesChange}
          onExplanationChange={onExplanationChange}
          onCreateTeam={onCreateTeam}
          onJoinTeam={onJoinTeam}
          onDeleteTeam={onDeleteTeam}
          onStart={onStartTeam}
          onSubmit={onSubmitTeam}
        />
      )}

      {selectedMode === 'debate' && (
        <DebateModePanel
          isHost={isHost}
          debate={selectedDebate}
          players={selectedRoomDetails.roomPlayers || []}
          argumentsList={debateArguments}
          voteSummary={debateVoteSummary}
          debatePrompt={debatePrompt}
          selectedAiCardIds={selectedAiCardIds}
          selectedAiCardTitles={selectedAiCardTitles}
          explanation={explanation}
          voteCategory={voteCategory}
          voteTargetUserId={voteTargetUserId}
          onDebatePromptChange={onDebatePromptChange}
          onSelectedAiCardIdsChange={onSelectedAiCardIdsChange}
          onSelectedAiCardTitlesChange={onSelectedAiCardTitlesChange}
          onExplanationChange={onExplanationChange}
          onVoteCategoryChange={onVoteCategoryChange}
          onVoteTargetUserIdChange={onVoteTargetUserIdChange}
          onSetPrompt={onSetDebatePrompt}
          onSubmitArgument={onSubmitDebateArgument}
          onVote={onVote}
        />
      )}

      {selectedMode === 'tournament' && (
        <TournamentModePanel
          isHost={isHost}
          room={selectedRoom}
          tournament={selectedTournament}
          leaderboard={tournamentLeaderboard}
          tournamentTitle={tournamentTitle}
          roundCount={roundCount}
          roundNumber={roundNumber}
          problemCardId={problemCardId}
          problemTitle={problemTitle}
          selectedAiCardIds={selectedAiCardIds}
          selectedAiCardTitles={selectedAiCardTitles}
          explanation={explanation}
          onTournamentTitleChange={onTournamentTitleChange}
          onRoundCountChange={onRoundCountChange}
          onRoundNumberChange={onRoundNumberChange}
          onProblemCardIdChange={onProblemCardIdChange}
          onProblemTitleChange={onProblemTitleChange}
          onSelectedAiCardIdsChange={onSelectedAiCardIdsChange}
          onSelectedAiCardTitlesChange={onSelectedAiCardTitlesChange}
          onExplanationChange={onExplanationChange}
          onStart={onStartTournament}
          onSetRound={onSetTournamentRound}
          onSubmitRound={onSubmitTournamentRound}
          onFinish={onFinishTournament}
        />
      )}

      <EndRoomPanel isHost={isHost} room={selectedRoom} endReason={endReason} onEndReasonChange={onEndReasonChange} onEnd={onEndRoom} />
      <RoomTimeline events={selectedRoomDetails.roomEvents || []} onDelete={onDeleteRoomLog} onClear={onClearRoomLogs} />
    </div>
  )
}

function ModeNav({ activeMode, modeCounts, onModeChange }) {
  return (
    <div className="mpModeNav">
      {Object.entries(modeDetails).map(([key, item]) => (
        <button key={key} type="button" onClick={() => onModeChange(key)} className={activeMode === key ? 'mpModeButton active' : 'mpModeButton'}>
          <span>{item.accent}</span>
          <strong>{item.label}</strong>
          <small>{modeCounts[key] || 0}</small>
        </button>
      ))}
    </div>
  )
}

function LifecyclePanel({ room }) {
  const ended = isEnded(room)

  return (
    <div style={lifecycleStyle}>
      <div className="mpLifecycleHeader">
        <div>
          <p style={styles.eyebrow}>Live event lifecycle</p>
          <h3 style={styles.smallCardTitle}>{ended ? 'This event has ended' : 'This event is still running'}</h3>
        </div>
        <Pill tone={ended ? 'default' : 'success'}>{getRoomStatusLabel(room)}</Pill>
      </div>

      <div className="mpTimeGrid">
        <TimeBox label="Created" value={formatTime(room.createdAt)} />
        <TimeBox label="Lobby opened" value={formatTime(room.lobbyOpenedAt)} />
        <TimeBox label="Started" value={formatTime(room.startedAt)} />
        <TimeBox label="Ended" value={formatTime(room.endedAt || room.completedAt || room.cancelledAt)} />
        <TimeBox label="Expires" value={formatTime(room.expiresAt)} />
        <TimeBox label="Duration" value={formatDuration(room.durationSeconds, room.startedAt, room.endedAt || room.completedAt)} />
        <TimeBox label="Last activity" value={formatTime(room.lastActivityAt || room.updatedAt)} />
      </div>

      <div style={questBoxStyle}>
        <strong>Current quest/problem</strong>
        <span>{room.currentQuestTitle || room.currentProblemTitle || room.currentProblemId || 'Not selected yet'}</span>
        <small>Workflow stage: {room.workflowStage || 'Not available'}</small>
        {room.endReason && <small>End reason: {room.endReason}</small>}
      </div>
    </div>
  )
}

function TimeBox({ label, value }) {
  return (
    <div className="mpTimeBox">
      <span>{label}</span>
      <strong>{value || 'Not yet'}</strong>
    </div>
  )
}

function RoomCard({ room, userId, presenceByUserId, onOpen, onRoomAction }) {
  const hostPresence = presenceByUserId[room.createdBy]
  const online = isPresenceOnline(hostPresence)
  const ended = isEnded(room)
  const isMember = (room.roomPlayers || []).some((player) => player.userId === userId)
  const isHost = room.createdBy === userId
  const actionLabel = ended
    ? 'View Results'
    : isMember || isHost
      ? 'Open Lobby'
      : room.requiresApproval
        ? 'Request Access'
        : 'Join Room'

  return (
    <article className={ended ? 'mpRoomCard ended' : 'mpRoomCard'}>
      <div style={styles.rowBetween}>
        <div>
          <p style={styles.eyebrow}>{room.roomCode}</p>
          <h3 style={styles.smallCardTitle}>{modeDetails[room.mode]?.accent || '🎮'} {room.roomName}</h3>
        </div>
        <Pill tone={ended ? 'default' : room.status === 'waiting' ? 'success' : 'default'}>{getRoomStatusLabel(room)}</Pill>
      </div>

      <p style={styles.smallCardText}>{modeDetails[room.mode]?.label || room.mode} mode • hosted by {room.createdByName}</p>

      <div className="mpRoomMeta">
        <span><LiveDot online={online} /> Host {online ? 'online' : 'offline'}</span>
        <span>{room.playerCount} / {room.maxPlayers} players</span>
        <span>{room.requiresApproval ? 'Host approval required' : 'Open join'}</span>
        <span>Created {formatTime(room.createdAt)}</span>
        <span>Started {formatTime(room.startedAt)}</span>
        <span>Ended {formatTime(room.endedAt || room.completedAt)}</span>
      </div>

      <div className="mpButtonRow">
        <button type="button" onClick={onRoomAction || onOpen} style={primaryButtonStyle}>{actionLabel}</button>
        <button type="button" onClick={onOpen} style={secondaryButtonStyle}>Preview</button>
      </div>
    </article>
  )
}

function NotificationPanel({ notifications, unreadCount, onAction, onDecline, onMarkRead, limit = 6 }) {
  return (
    <div style={cardStyle}>
      <div style={styles.rowBetween}>
        <div>
          <p style={styles.eyebrow}>Notifications</p>
          <h3 style={styles.smallCardTitle}>Live invites and requests</h3>
        </div>
        <Pill>{unreadCount} unread</Pill>
      </div>

      {notifications.length === 0 ? (
        <p style={styles.smallCardText}>No multiplayer notifications yet.</p>
      ) : (
        <div style={listStyle}>
          {notifications.slice(0, limit).map((notification) => (
            <article key={notification.notificationId} style={notification.status === 'unread' ? highlightedItemStyle : itemStyle}>
              <div>
                <strong style={itemTitleStyle}>{notification.title}</strong>
                <p style={styles.smallCardText}>{notification.message}</p>
                <small style={mutedTextStyle}>{formatTime(notification.createdAt)} • {notification.type}</small>
              </div>
              <div style={buttonRowStyle}>
                {notification.actionType && <button type="button" onClick={() => onAction(notification)} style={smallButtonStyle}>Open / Accept</button>}
                {notification.actionType && <button type="button" onClick={() => onDecline(notification)} style={smallButtonSecondaryStyle}>Decline</button>}
                {notification.status === 'unread' && <button type="button" onClick={() => onMarkRead(notification.notificationId)} style={smallButtonSecondaryStyle}>Read</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}


function PlayerList({ players, presenceByUserId }) {
  if (players.length === 0) return <p style={styles.smallCardText}>No players in the room yet.</p>

  return (
    <div style={listStyle}>
      {players.map((player) => {
        const presence = presenceByUserId[player.userId]
        const online = isPresenceOnline(presence)
        return (
          <article key={player.roomPlayerId || player.firestoreId} style={itemStyle}>
            <div>
              <strong style={itemTitleStyle}><LiveDot online={online} /> {player.displayName}</strong>
              <p style={styles.smallCardText}>{player.role || 'player'} • {player.status || 'joined'} • score {player.score || 0}</p>
              <small style={mutedTextStyle}>Joined {formatTime(player.joinedAt)} • Last seen {formatTime(presence?.lastSeenAt || player.lastSeenAt)}</small>
            </div>
            <Pill>{online ? 'live' : 'offline'}</Pill>
          </article>
        )
      })}
    </div>
  )
}

function RoomRequests({ requests, isHost, onAccept, onDecline }) {
  const pending = requests.filter((request) => request.status === 'pending')

  return (
    <div style={{ marginTop: 18 }}>
      <p style={styles.eyebrow}>Pending access requests</p>
      {pending.length === 0 ? (
        <p style={styles.smallCardText}>No pending requests.</p>
      ) : (
        <div style={listStyle}>
          {pending.map((request) => (
            <article key={request.requestId} style={highlightedItemStyle}>
              <div>
                <strong style={itemTitleStyle}>{request.fromDisplayName}</strong>
                <p style={styles.smallCardText}>{request.message || 'No message provided.'}</p>
                <small style={mutedTextStyle}>Requested {formatTime(request.createdAt)}</small>
              </div>
              {isHost && (
                <div style={buttonRowStyle}>
                  <button type="button" onClick={() => onAccept(request.requestId)} style={smallButtonStyle}>Accept</button>
                  <button type="button" onClick={() => onDecline(request.requestId)} style={smallButtonSecondaryStyle}>Decline</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function ChallengeModePanel(props) {
  return (
    <ModePanel title="Challenge workflow" description="Host starts the challenge, players submit individual answers, then ranked results appear live.">
      {props.isHost && <ProblemSetupForm problemCardId={props.problemCardId} problemTitle={props.problemTitle} onProblemCardIdChange={props.onProblemCardIdChange} onProblemTitleChange={props.onProblemTitleChange} onSubmit={props.onStart} buttonText="Start Challenge" />}
      <SubmissionForm selectedAiCardIds={props.selectedAiCardIds} selectedAiCardTitles={props.selectedAiCardTitles} explanation={props.explanation} onSelectedAiCardIdsChange={props.onSelectedAiCardIdsChange} onSelectedAiCardTitlesChange={props.onSelectedAiCardTitlesChange} onExplanationChange={props.onExplanationChange} onSubmit={props.onSubmit} buttonText="Submit Challenge Answer" />
      <ResultsList title="Challenge results" rows={props.results} />
    </ModePanel>
  )
}

function TeamModePanel(props) {
  const userTeamId = props.selectedTeamId || props.currentPlayer?.teamId || ''
  const userCreatedTeam = props.teams.find((team) => team.createdBy === props.currentPlayer?.userId)
  const canCreateTeam = !userCreatedTeam && !userTeamId

  return (
    <ModePanel title="Team workflow" description="Create or join a team, host starts the room, then each team submits one shared solution.">
      <div className="mpTwoCol">
        <form onSubmit={props.onCreateTeam} style={formGridStyle}>
          <label style={fieldStyle}>
            Team name
            <input value={props.teamName} onChange={(event) => props.onTeamNameChange(event.target.value)} placeholder="Example: Team Ubuntu" style={inputStyle} disabled={!canCreateTeam} />
          </label>
          <button type="submit" disabled={!canCreateTeam} style={canCreateTeam ? primaryButtonStyle : disabledButtonStyle}>Create Team</button>
          <p style={styles.smallCardText}>Each player can create one team and can only belong to one team in this room.</p>
        </form>
        <div style={cardStyle}>
          <p style={styles.eyebrow}>Teams</p>
          {props.teams.length === 0 ? <p style={styles.smallCardText}>No teams yet.</p> : props.teams.map((team) => {
            const isMyTeam = userTeamId === team.teamId
            const canDelete = team.createdBy === props.currentPlayer?.userId
            return (
              <div key={team.teamId} style={isMyTeam ? highlightedItemStyle : itemStyle}>
                <div>
                  <strong style={itemTitleStyle}>{team.teamName}</strong>
                  <p style={styles.smallCardText}>{isMyTeam ? 'You are in this team' : `Created by ${team.createdByName || 'Player'}`}</p>
                </div>
                <div style={buttonRowStyle}>
                  <button type="button" disabled={Boolean(userTeamId && !isMyTeam)} onClick={() => props.onJoinTeam(team.teamId)} style={userTeamId && !isMyTeam ? smallButtonSecondaryStyle : smallButtonStyle}>{isMyTeam ? 'Joined' : 'Join Team'}</button>
                  {canDelete && <button type="button" onClick={() => props.onDeleteTeam(team.teamId)} style={smallButtonSecondaryStyle}>Delete Team</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {props.isHost && <ProblemSetupForm problemCardId={props.problemCardId} problemTitle={props.problemTitle} onProblemCardIdChange={props.onProblemCardIdChange} onProblemTitleChange={props.onProblemTitleChange} onSubmit={props.onStart} buttonText="Start Team Room" />}
      <SubmissionForm selectedAiCardIds={props.selectedAiCardIds} selectedAiCardTitles={props.selectedAiCardTitles} explanation={props.explanation} onSelectedAiCardIdsChange={props.onSelectedAiCardIdsChange} onSelectedAiCardTitlesChange={props.onSelectedAiCardTitlesChange} onExplanationChange={props.onExplanationChange} onSubmit={props.onSubmit} buttonText="Submit Team Solution" />
      <ResultsList title="Team submissions" rows={props.teamSessions.map((session) => ({ ...session, displayName: session.submittedByName || session.teamId, totalScore: session.totalScore, problemTitle: session.problemTitle }))} />
    </ModePanel>
  )
}

function DebateModePanel(props) {
  return (
    <ModePanel title="Debate workflow" description="Host sets the prompt, players submit arguments, then everyone votes for the strongest categories.">
      {props.isHost && (
        <form onSubmit={props.onSetPrompt} style={formGridStyle}>
          <label style={fieldStyle}>
            Debate prompt
            <input value={props.debatePrompt} onChange={(event) => props.onDebatePromptChange(event.target.value)} placeholder="Example: Should AI be used for rural health triage?" style={inputStyle} />
          </label>
          <button type="submit" style={primaryButtonStyle}>Save Debate Prompt</button>
        </form>
      )}
      <div style={questBoxStyle}><strong>Prompt</strong><span>{props.debate?.prompt || 'No prompt set yet.'}</span></div>
      <SubmissionForm selectedAiCardIds={props.selectedAiCardIds} selectedAiCardTitles={props.selectedAiCardTitles} explanation={props.explanation} onSelectedAiCardIdsChange={props.onSelectedAiCardIdsChange} onSelectedAiCardTitlesChange={props.onSelectedAiCardTitlesChange} onExplanationChange={props.onExplanationChange} onSubmit={props.onSubmitArgument} buttonText="Submit Debate Argument" />
      <form onSubmit={props.onVote} style={formGridStyle}>
        <div className="mpTwoCol">
          <label style={fieldStyle}>
            Vote category
            <select value={props.voteCategory} onChange={(event) => props.onVoteCategoryChange(event.target.value)} style={inputStyle}>
              {voteCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <label style={fieldStyle}>
            Vote for player
            <select value={props.voteTargetUserId} onChange={(event) => props.onVoteTargetUserIdChange(event.target.value)} style={inputStyle}>
              <option value="">Choose player</option>
              {props.players.map((player) => <option key={player.userId} value={player.userId}>{player.displayName}</option>)}
            </select>
          </label>
        </div>
        <button type="submit" style={primaryButtonStyle}>Submit Debate Vote</button>
      </form>
      <ResultsList title="Debate arguments" rows={props.argumentsList} />
      <ResultsList title="Vote summary" rows={props.voteSummary.map((row) => ({ displayName: row.targetDisplayName, problemTitle: row.voteCategory, totalScore: row.count }))} />
    </ModePanel>
  )
}

function TournamentModePanel(props) {
  return (
    <ModePanel title="Tournament workflow" description="Start the tournament, set each round problem, players submit rounds, then finalise the leaderboard.">
      {props.isHost && (
        <>
          <form onSubmit={props.onStart} style={formGridStyle}>
            <div className="mpTwoCol">
              <label style={fieldStyle}>
                Tournament title
                <input value={props.tournamentTitle} onChange={(event) => props.onTournamentTitleChange(event.target.value)} placeholder="Example: GLA Innovation Tournament" style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                Round count
                <input value={props.roundCount} onChange={(event) => props.onRoundCountChange(event.target.value)} placeholder="3" style={inputStyle} />
              </label>
            </div>
            <button type="submit" style={primaryButtonStyle}>Start Tournament</button>
          </form>
          <form onSubmit={props.onSetRound} style={formGridStyle}>
            <div className="mpTwoCol">
              <label style={fieldStyle}>
                Round number
                <input value={props.roundNumber} onChange={(event) => props.onRoundNumberChange(event.target.value)} style={inputStyle} />
              </label>
              <label style={fieldStyle}>
                Problem card ID
                <input value={props.problemCardId} onChange={(event) => props.onProblemCardIdChange(event.target.value)} style={inputStyle} />
              </label>
            </div>
            <label style={fieldStyle}>
              Problem title
              <input value={props.problemTitle} onChange={(event) => props.onProblemTitleChange(event.target.value)} style={inputStyle} />
            </label>
            <button type="submit" style={primaryButtonStyle}>Set Current Round</button>
          </form>
        </>
      )}
      <SubmissionForm selectedAiCardIds={props.selectedAiCardIds} selectedAiCardTitles={props.selectedAiCardTitles} explanation={props.explanation} onSelectedAiCardIdsChange={props.onSelectedAiCardIdsChange} onSelectedAiCardTitlesChange={props.onSelectedAiCardTitlesChange} onExplanationChange={props.onExplanationChange} onSubmit={props.onSubmitRound} buttonText="Submit Tournament Round" />
      <ResultsList title="Tournament leaderboard" rows={props.leaderboard.map((player) => ({ displayName: `#${player.rank || '-'} ${player.displayName}`, problemTitle: `${player.completedRounds || 0} rounds`, totalScore: player.totalScore }))} />
      {props.isHost && <button type="button" onClick={props.onFinish} style={primaryButtonStyle}>Finish Tournament and Finalise Ranks</button>}
    </ModePanel>
  )
}

function ModePanel({ title, description, children }) {
  return (
    <div style={sectionCardStyle}>
      <p style={styles.eyebrow}>Mode workflow</p>
      <h3 style={styles.smallCardTitle}>{title}</h3>
      <p style={styles.smallCardText}>{description}</p>
      <div className="mpStepGrid">
        {children}
      </div>
    </div>
  )
}

function ProblemSetupForm({ problemCardId, problemTitle, onProblemCardIdChange, onProblemTitleChange, onSubmit, buttonText }) {
  function handleProblemChange(event) {
    const nextId = event.target.value
    const card = problemCards.find((item) => String(item.id) === String(nextId))
    onProblemCardIdChange(nextId)
    onProblemTitleChange(card?.title || '')
  }

  return (
    <form onSubmit={onSubmit} style={formGridStyle}>
      <p style={styles.eyebrow}>Host setup</p>
      <div className="mpTwoCol">
        <label style={fieldStyle}>
          Choose problem card
          <select value={problemCardId} onChange={handleProblemChange} style={inputStyle}>
            <option value="">Choose a problem for the room</option>
            {problemCards.map((card) => (
              <option key={card.id} value={card.id}>{card.title}</option>
            ))}
          </select>
        </label>
        <label style={fieldStyle}>
          Problem / quest title
          <input value={problemTitle} onChange={(event) => onProblemTitleChange(event.target.value)} placeholder="Example: Rural health access" style={inputStyle} />
        </label>
      </div>
      <button type="submit" style={primaryButtonStyle}>{buttonText}</button>
    </form>
  )
}

function SubmissionForm({ selectedAiCardIds, selectedAiCardTitles, explanation, onSelectedAiCardIdsChange, onSelectedAiCardTitlesChange, onExplanationChange, onSubmit, buttonText }) {
  const selectedIds = selectedAiCardIds
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const selectedSet = new Set(selectedIds.map(String))
  const wordCount = countWords(explanation)
  const wordLimitExceeded = wordCount > MAX_EXPLANATION_WORDS

  function updateSelectedCards(nextIds) {
    const nextCards = aiCards.filter((card) => nextIds.includes(String(card.id)))
    onSelectedAiCardIdsChange(nextIds.join(', '))
    onSelectedAiCardTitlesChange(nextCards.map((card) => card.title).join(', '))
  }

  function toggleCard(cardId) {
    const safeId = String(cardId)
    if (selectedSet.has(safeId)) {
      updateSelectedCards(selectedIds.filter((item) => item !== safeId))
      return
    }

    if (selectedIds.length >= MAX_AI_CARDS_PER_SUBMISSION) return
    updateSelectedCards([...selectedIds, safeId])
  }

  return (
    <form onSubmit={onSubmit} style={formGridStyle}>
      <p style={styles.eyebrow}>Player submission</p>
      <div style={questBoxStyle}>
        <strong>Choose up to {MAX_AI_CARDS_PER_SUBMISSION} solution cards</strong>
        <span>{selectedIds.length} selected: {selectedAiCardTitles || 'Choose cards below'}</span>
      </div>

      <div className="mpAiChoiceGrid">
        {aiCards.map((card) => {
          const checked = selectedSet.has(String(card.id))
          const disabled = !checked && selectedIds.length >= MAX_AI_CARDS_PER_SUBMISSION
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => toggleCard(card.id)}
              disabled={disabled}
              className={checked ? 'mpAiChoice active' : 'mpAiChoice'}
            >
              <strong>{card.title}</strong>
              <small>{card.type}</small>
            </button>
          )
        })}
      </div>

      <label style={fieldStyle}>
        Explanation / solution
        <textarea
          value={explanation}
          onChange={(event) => onExplanationChange(event.target.value)}
          placeholder="Write the multiplayer answer here in 100 words or less..."
          style={wordLimitExceeded ? { ...textAreaStyle, borderColor: 'rgba(153, 27, 27, 0.55)' } : textAreaStyle}
        />
      </label>
      <p style={wordLimitExceeded ? styles.dangerText : styles.smallCardText}>{wordCount} / {MAX_EXPLANATION_WORDS} words</p>
      <button type="submit" disabled={wordLimitExceeded} style={wordLimitExceeded ? disabledButtonStyle : primaryButtonStyle}>{buttonText}</button>
    </form>
  )
}

function ResultsList({ title, rows }) {
  return (
    <div style={cardStyle}>
      <p style={styles.eyebrow}>{title}</p>
      {rows.length === 0 ? (
        <p style={styles.smallCardText}>Nothing submitted yet.</p>
      ) : (
        <div style={listStyle}>
          {rows.map((row, index) => (
            <article key={row.attemptId || row.teamSessionId || row.userId || `${title}_${index}`} style={itemStyle}>
              <div>
                <strong style={itemTitleStyle}>{row.rank ? `#${row.rank} ` : ''}{row.displayName || row.submittedByName || row.targetDisplayName || 'Player'}</strong>
                <p style={styles.smallCardText}>{row.problemTitle || row.voteCategory || row.status || 'Submission'}</p>
                <small style={mutedTextStyle}>Submitted {formatTime(row.submittedAt || row.createdAt || row.updatedAt)}</small>
              </div>
              <Pill>{row.totalScore ?? row.count ?? 0}</Pill>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function EndRoomPanel({ isHost, room, endReason, onEndReasonChange, onEnd }) {
  if (!isHost) return null
  if (isEnded(room)) {
    return (
      <div style={cardStyle}>
        <p style={styles.eyebrow}>Room ended</p>
        <p style={styles.smallCardText}>Ended at {formatTime(room.endedAt || room.completedAt)}. Reason: {room.endReason || 'Not provided'}</p>
      </div>
    )
  }

  return (
    <div style={dangerCardStyle}>
      <p style={styles.eyebrow}>End live event</p>
      <h3 style={styles.smallCardTitle}>Close this room when the event is finished.</h3>
      <form onSubmit={onEnd} style={formGridStyle}>
        <label style={fieldStyle}>
          End reason
          <input value={endReason} onChange={(event) => onEndReasonChange(event.target.value)} placeholder="Example: Challenge completed" style={inputStyle} />
        </label>
        <button type="submit" style={dangerButtonStyle}>End Room</button>
      </form>
    </div>
  )
}

function RoomTimeline({ events, onDelete, onClear }) {
  return (
    <div style={sectionCardStyle}>
      <div style={styles.rowBetween}>
        <div>
          <p style={styles.eyebrow}>Live timeline</p>
          <h3 style={styles.smallCardTitle}>Room activity log</h3>
        </div>
        {events.length > 0 && <button type="button" onClick={onClear} style={smallButtonSecondaryStyle}>Clear all logs</button>}
      </div>
      {events.length === 0 ? (
        <p style={styles.smallCardText}>No activity yet.</p>
      ) : (
        <div className="mpLogScroll" style={listStyle}>
          {events.map((event) => (
            <article key={event.eventId || event.firestoreId} style={itemStyle}>
              <div>
                <strong style={itemTitleStyle}>{event.eventType}</strong>
                <p style={styles.smallCardText}>{event.message}</p>
                <small style={mutedTextStyle}>{formatTime(event.createdAt)} • {event.actorDisplayName || 'System'}</small>
              </div>
              <button type="button" onClick={() => onDelete(event.firestoreId || event.eventId)} style={smallButtonSecondaryStyle}>Delete</button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function WizardHeader({ step, title, text, onBack }) {
  return (
    <div style={styles.rowBetween}>
      <div>
        <p style={styles.eyebrow}>{step}</p>
        <h3 style={styles.smallCardTitle}>{title}</h3>
        <p style={styles.smallCardText}>{text}</p>
      </div>
      <button type="button" onClick={onBack} style={secondaryButtonStyle}>Back</button>
    </div>
  )
}

function MiniStat({ title, value }) {
  return (
    <div className="mpMiniStat">
      <strong>{value}</strong>
      <span>{title}</span>
    </div>
  )
}

function MessageCard({ message, tone }) {
  const isError = tone === 'error'
  return (
    <div style={{ ...styles.smallCard, marginTop: 18, borderColor: isError ? 'rgba(153, 27, 27, 0.28)' : 'rgba(22, 101, 52, 0.28)' }}>
      <p style={{ ...styles.smallCardText, color: isError ? '#991b1b' : '#166534' }}>{message}</p>
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div style={emptyStyle}>
      <h3 style={styles.smallCardTitle}>{title}</h3>
      <p style={styles.smallCardText}>{text}</p>
    </div>
  )
}

function LiveDot({ online }) {
  return <span className={online ? 'mpLiveDot online' : 'mpLiveDot'}></span>
}

function isPresenceOnline(presence) {
  if (!presence) return false
  const millis = getMillis(presence.lastSeenAt)
  return presence.status === 'online' && millis > 0 && Date.now() - millis < 90000
}

function isRoomExpiredLocal(room) {
  if (!room) return false
  const status = String(room.status || '').toLowerCase()
  if (status === 'expired') return true
  if (['active', 'completed', 'ended', 'cancelled', 'archived'].includes(status)) return false

  const expiresAt = getMillis(room.expiresAt)
  if (expiresAt && Date.now() >= expiresAt && Number(room.playerCount || 0) <= 1) return true

  const createdAt = getMillis(room.createdAt || room.lobbyOpenedAt)
  return Boolean(createdAt && Number(room.playerCount || 0) <= 1 && Date.now() - createdAt >= 60 * 60 * 1000)
}

function isEnded(room) {
  const status = String(room?.status || '').toLowerCase()
  const lifecycle = String(room?.lifecycleStatus || '').toLowerCase()
  return isRoomExpiredLocal(room) || ['completed', 'ended', 'cancelled', 'archived', 'expired'].includes(status) || ['completed', 'ended', 'cancelled', 'expired'].includes(lifecycle) || Boolean(room?.endedAt || room?.completedAt)
}

function getRoomStatusLabel(room) {
  if (isRoomExpiredLocal(room)) return 'expired'
  return room?.status || room?.lifecycleStatus || 'waiting'
}

function getMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value.seconds) return value.seconds * 1000
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length
}

function formatTime(value) {
  const millis = getMillis(value)
  if (!millis) return 'Not yet'
  return new Date(millis).toLocaleString()
}

function formatDuration(durationSeconds, startedAt, endedAt) {
  let seconds = Number(durationSeconds || 0)
  if (!seconds) {
    const started = getMillis(startedAt)
    const ended = getMillis(endedAt)
    if (started && ended) seconds = Math.max(0, Math.round((ended - started) / 1000))
  }
  if (!seconds) return 'Not available'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${remainder}s`
  return `${remainder}s`
}

const cardStyle = {
  ...styles.smallCard,
  marginTop: 18
}

const sectionCardStyle = {
  ...styles.smallCard,
  marginTop: 22
}

const lobbyCardStyle = {
  ...styles.smallCard,
  marginTop: 22,
  border: '1px solid rgba(154, 106, 34, 0.26)',
  boxShadow: '0 22px 60px rgba(80, 52, 20, 0.12)'
}

const lifecycleStyle = {
  ...styles.smallCard,
  marginTop: 18,
  background: 'linear-gradient(135deg, rgba(255,248,235,0.92), rgba(244,210,138,0.22))'
}

const questBoxStyle = {
  marginTop: 14,
  display: 'grid',
  gap: 5,
  padding: 14,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.62)',
  color: '#5c3512'
}

const dangerCardStyle = {
  ...styles.smallCard,
  marginTop: 22,
  borderColor: 'rgba(153, 27, 27, 0.25)'
}

const formGridStyle = {
  display: 'grid',
  gap: 12,
  marginTop: 14
}

const fieldStyle = {
  display: 'grid',
  gap: 8,
  color: '#5c3512',
  fontWeight: 850
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 15px',
  borderRadius: 16,
  border: '1px solid rgba(139, 92, 40, 0.24)',
  background: 'rgba(255, 255, 255, 0.76)',
  color: '#3b2817',
  outline: 'none'
}

const textAreaStyle = {
  ...inputStyle,
  minHeight: 130,
  resize: 'vertical'
}

const primaryButtonStyle = {
  maxWidth: '100%',
  border: 0,
  borderRadius: 999,
  padding: '13px 18px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
  color: '#fff8eb',
  fontWeight: 850
}

const secondaryButtonStyle = {
  maxWidth: '100%',
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: 999,
  padding: '12px 16px',
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.72)',
  color: '#5c3512',
  fontWeight: 850
}

const dangerButtonStyle = {
  ...primaryButtonStyle,
  background: 'linear-gradient(135deg, #991b1b, #5c1515)'
}

const disabledButtonStyle = {
  ...secondaryButtonStyle,
  cursor: 'not-allowed',
  opacity: 0.6
}

const smallButtonStyle = {
  ...primaryButtonStyle,
  padding: '8px 12px',
  fontSize: '0.8rem'
}

const smallButtonSecondaryStyle = {
  ...secondaryButtonStyle,
  padding: '8px 12px',
  fontSize: '0.8rem'
}

const buttonRowStyle = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap'
}

const listStyle = {
  display: 'grid',
  gap: 10,
  marginTop: 14
}

const itemStyle = {
  minWidth: 0,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(139, 92, 40, 0.14)',
  background: 'rgba(255,255,255,0.62)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}

const highlightedItemStyle = {
  ...itemStyle,
  background: 'rgba(244, 210, 138, 0.26)',
  border: '1px solid rgba(154, 106, 34, 0.24)'
}

const itemTitleStyle = {
  color: '#3b2817',
  fontWeight: 900
}

const mutedTextStyle = {
  display: 'block',
  color: '#7c5d3b',
  marginTop: 4
}

const emptyStyle = {
  marginTop: 18,
  padding: 24,
  borderRadius: 22,
  background: 'rgba(255,255,255,0.52)',
  textAlign: 'center'
}

const pageCss = `
.mpHero {
  padding: 28px;
  border-radius: 32px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22px;
  align-items: center;
  background: radial-gradient(circle at top left, rgba(244, 210, 138, 0.32), transparent 34%), linear-gradient(135deg, #3b2817, #6b3d16 58%, #9a6a22);
  box-shadow: 0 28px 70px rgba(80, 52, 20, 0.28);
  margin-bottom: 18px;
}
.mpHeroTitle {
  margin: 0 0 12px;
  color: #fff8eb;
  font-size: clamp(2rem, 4vw, 4rem);
  line-height: 1;
  letter-spacing: -0.065em;
}
.mpHeroText {
  margin: 0;
  color: rgba(255, 248, 235, 0.84);
  line-height: 1.7;
  max-width: 760px;
}
.mpHeroStatsWrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(130px, 1fr));
  gap: 12px;
}
.mpHeroStats {
  position: relative;
  min-width: 130px;
  padding: 20px;
  border-radius: 28px;
  text-align: center;
  background: rgba(255, 248, 235, 0.14);
  border: 1px solid rgba(255, 248, 235, 0.22);
  color: #fff8eb;
  overflow: hidden;
}
.mpHeroStats.live {
  background: rgba(34, 197, 94, 0.13);
  border-color: rgba(187, 247, 208, 0.35);
}
.mpHeroStats strong {
  display: block;
  color: #f4d28a;
  font-size: 3rem;
  font-weight: 950;
  line-height: 1;
}
.mpHeroStats.live strong {
  color: #bbf7d0;
}
.mpLivePulse {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.65);
  animation: mpPulse 1.4s infinite;
}
@keyframes mpPulse {
  0% { transform: scale(.9); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.65); }
  70% { transform: scale(1.18); box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
  100% { transform: scale(.9); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
.mpPageTabs,
.mpModeNav {
  position: sticky;
  top: 12px;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  padding: 12px;
  margin: 18px 0;
  border-radius: 26px;
  background: rgba(255, 248, 235, 0.94);
  border: 1px solid rgba(154, 106, 34, 0.24);
  box-shadow: 0 18px 44px rgba(80, 52, 20, 0.16);
  backdrop-filter: blur(18px);
}
.mpPageTab,
.mpModeButton,
.mpModeChoice {
  border: 1px solid rgba(139, 92, 40, 0.18);
  border-radius: 20px;
  padding: 12px 14px;
  cursor: pointer;
  background: rgba(255,255,255,0.66);
  color: #5c3512;
  font-weight: 900;
}
.mpModeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.mpPageTab.active,
.mpModeButton.active,
.mpModeChoice.active {
  background: linear-gradient(135deg, #9a6a22, #5c3512);
  color: #fff8eb;
  border-color: rgba(244, 210, 138, 0.42);
  box-shadow: 0 12px 28px rgba(92, 53, 18, 0.18);
}
.mpTwoCol {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}
.mpActionGrid,
.mpStepGrid {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}
.mpModeSelectGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.mpModeChoice {
  min-height: 150px;
  display: grid;
  gap: 8px;
  text-align: left;
}
.mpModeChoice span {
  font-size: 1.7rem;
}
.mpModeChoice small {
  line-height: 1.45;
  opacity: .86;
}
.mpFilterGrid,
.mpTimeGrid,
.mpMiniGrid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.mpRoomGrid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.mpRoomCard {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255,255,255,0.66);
  border: 1px solid rgba(139, 92, 40, 0.16);
  box-shadow: 0 16px 36px rgba(80, 52, 20, 0.08);
}
.mpRoomCard.ended {
  opacity: .78;
  background: rgba(255,255,255,0.44);
}
.mpRoomMeta {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  color: #6b4b2b;
  font-size: .88rem;
}
.mpButtonRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.mpLiveDot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 6px;
  border-radius: 999px;
  background: #9ca3af;
}
.mpLiveDot.online {
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.14), 0 0 16px rgba(34, 197, 94, 0.75);
  animation: mpDotPulse 1.4s infinite;
}
@keyframes mpDotPulse {
  0% { transform: scale(.9); }
  50% { transform: scale(1.35); }
  100% { transform: scale(.9); }
}
.mpLifecycleHeader {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.mpTimeBox,
.mpMiniStat {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.66);
  border: 1px solid rgba(139,92,40,0.12);
  display: grid;
  gap: 5px;
}
.mpTimeBox span,
.mpMiniStat span {
  color: #7c5d3b;
  font-size: .78rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.mpTimeBox strong,
.mpMiniStat strong {
  color: #3b2817;
}
.mpCheckRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.62);
  color: #5c3512;
  font-weight: 850;
}
.mpLobbyTitle {
  margin: 0 0 8px;
  color: #3b2817;
  font-size: clamp(1.6rem, 3vw, 2.6rem);
}
@media (max-width: 850px) {
  .mpHero,
  .mpTwoCol,
  .mpModeSelectGrid {
    grid-template-columns: 1fr;
  }
  .mpHeroStatsWrap {
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }
  .mpPageTabs,
  .mpModeNav {
    position: static;
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 520px) {
  .mpPageTabs,
  .mpModeNav,
  .mpHeroStatsWrap,
  .mpRoomGrid,
  .mpFilterGrid,
  .mpTimeGrid,
  .mpMiniGrid {
    grid-template-columns: 1fr;
  }
  .mpHero {
    padding: 20px;
    border-radius: 24px;
  }
  .mpHeroTitle {
    font-size: 2rem;
  }
}

.mpAiChoiceGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.mpAiChoice {
  border: 1px solid rgba(139, 92, 40, 0.18);
  border-radius: 18px;
  padding: 12px;
  cursor: pointer;
  background: rgba(255,255,255,0.72);
  color: #5c3512;
  text-align: left;
  display: grid;
  gap: 5px;
  min-height: 86px;
}

.mpAiChoice.active {
  background: linear-gradient(135deg, rgba(154,106,34,.18), rgba(244,210,138,.42));
  border-color: rgba(154,106,34,.5);
  box-shadow: 0 12px 28px rgba(80,52,20,.12);
}

.mpAiChoice:disabled {
  cursor: not-allowed;
  opacity: .48;
}

.mpRootPanel {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.mpRootPanel *,
.mpRootPanel *::before,
.mpRootPanel *::after {
  box-sizing: border-box;
}

.mpRootPanel input,
.mpRootPanel select,
.mpRootPanel textarea,
.mpRootPanel button {
  max-width: 100%;
}

.mpScoringOverlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  align-items: center;
  justify-items: center;
  padding: 20px;
  background: rgba(32, 22, 14, 0.58);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mpScoringCard {
  width: min(430px, 100%);
  padding: 26px;
  border-radius: 30px;
  border: 1px solid rgba(244, 210, 138, 0.35);
  background: linear-gradient(135deg, rgba(255, 248, 235, 0.96), rgba(244, 210, 138, 0.92));
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
  display: grid;
  gap: 14px;
  text-align: center;
}

.mpScoringSpinner {
  width: 54px;
  height: 54px;
  margin: 0 auto;
  border-radius: 50%;
  border: 5px solid rgba(154, 106, 34, 0.2);
  border-top-color: rgba(92, 53, 18, 0.95);
  animation: mpSpin 0.88s linear infinite;
}

.mpProgressTrack {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(92, 53, 18, 0.16);
}

.mpProgressTrack span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #9a6a22, #5c3512);
  transition: width 0.22s ease;
}

@keyframes mpSpin {
  to { transform: rotate(360deg); }
}

.mpToast {
  position: fixed;
  right: 18px;
  top: 18px;
  z-index: 10000;
  width: min(380px, calc(100vw - 36px));
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(154, 106, 34, 0.26);
  background: rgba(255, 248, 235, 0.96);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.25);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.mpToast strong {
  color: #3b2817;
  font-weight: 950;
}

.mpToast p {
  margin: 5px 0 0;
  color: #5c3512;
  line-height: 1.45;
}

.mpToast button {
  border: 0;
  cursor: pointer;
  background: rgba(139, 92, 40, 0.13);
  color: #5c3512;
  font-weight: 900;
}

.mpToastClose {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.mpToastAction {
  margin-top: 10px;
  width: auto;
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 999px;
}

.mpToast.success { border-color: rgba(34, 197, 94, 0.32); }
.mpToast.error { border-color: rgba(153, 27, 27, 0.32); }
.mpToast.info { border-color: rgba(37, 99, 235, 0.25); }

.mpLogScroll {
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  scroll-behavior: smooth;
}

.mpLogScroll::-webkit-scrollbar {
  width: 8px;
}

.mpLogScroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(139, 92, 40, 0.32);
}

.mpAiChoiceGrid {
  min-height: 110px;
  align-items: stretch;
}

.mpAiChoice strong,
.mpAiChoice small {
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .mpRootPanel {
    padding: 16px !important;
    border-radius: 22px !important;
  }

  .mpRootPanel h1,
  .mpRootPanel h2,
  .mpRootPanel h3 {
    overflow-wrap: anywhere;
  }

  .mpHero {
    padding: 18px !important;
    border-radius: 22px !important;
  }

  .mpHeroTitle {
    font-size: clamp(1.75rem, 11vw, 2.35rem);
    line-height: 1.03;
  }

  .mpLobbyTitle {
    font-size: clamp(1.35rem, 9vw, 2rem);
  }

  .mpPageTabs,
  .mpModeNav,
  .mpModeSelectGrid,
  .mpTwoCol,
  .mpRoomGrid,
  .mpFilterGrid,
  .mpStepGrid,
  .mpTimeGrid,
  .mpMiniGrid,
  .mpAiChoiceGrid {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  .mpHeroStatsWrap {
    width: 100%;
    grid-template-columns: minmax(0, 1fr) !important;
  }

  .mpButtonRow,
  .mpLifecycleHeader {
    flex-direction: column;
    align-items: stretch;
  }

  .mpButtonRow button,
  .mpPageTabs button,
  .mpModeNav button,
  .mpRootPanel form button {
    width: 100%;
  }

  .mpRootPanel article {
    width: 100%;
  }

  .mpLogScroll {
    max-height: 300px;
    padding-right: 2px;
  }

  .mpToast {
    left: 12px;
    right: 12px;
    top: 12px;
    bottom: auto;
    width: auto;
  }
}
`

export default MultiplayerHubScreen
