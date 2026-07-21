import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function seedRemainingCollections() {
  const collections = [
    {
      collectionName: 'uiTranslations',
      documentId: 'en_sidebar_dashboard',
      data: {
        translationId: 'en_sidebar_dashboard',
        languageCode: 'en',
        namespace: 'sidebar',
        key: 'dashboard',
        text: 'Dashboard',
        status: 'active',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'multiplayerRooms',
      documentId: '_schema',
      data: {
        roomId: '_schema',
        roomCode: 'ROOM123',
        roomName: 'Sample Room',
        mode: 'standard',
        status: 'waiting',
        maxPlayers: 4,
        playerCount: 0,
        createdBy: 'sample_user_id',
        currentProblemId: 'problem_1',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'roomPlayers',
      documentId: '_schema',
      data: {
        roomPlayerId: '_schema',
        roomId: 'sample_room_id',
        roomCode: 'ROOM123',
        userId: 'sample_user_id',
        displayName: 'Sample Player',
        role: 'player',
        teamId: 'sample_team_id',
        status: 'joined',
        score: 0,
        isSchema: true,
        joinedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'sponsorRewards',
      documentId: '_schema',
      data: {
        rewardId: '_schema',
        title: 'Sample Reward',
        description: 'Sample sponsor reward description.',
        sponsorName: 'Sample Sponsor',
        rewardType: 'certificate_bonus',
        requiredCompletedProblems: 10,
        requiredAverageScore: 75,
        requiredLevel: 1,
        requiredAchievementId: '',
        isActive: true,
        order: 1,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'rewardClaims',
      documentId: '_schema',
      data: {
        claimId: '_schema',
        userId: 'sample_user_id',
        rewardId: 'sample_reward_id',
        rewardTitle: 'Sample Reward',
        sponsorName: 'Sample Sponsor',
        claimStatus: 'pending',
        completedProblems: 0,
        averageScore: 0,
        reviewedBy: '',
        reviewedAt: null,
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'launchSettings',
      documentId: 'default',
      data: {
        launchId: 'default',
        launchStatus: 'pilot',
        launchTitle: 'AfriQuest Pilot Launch',
        launchMessage: 'AfriQuest is currently in pilot launch mode.',
        allowPublicRegistration: true,
        allowRewardClaims: false,
        sponsorMessage: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'levels',
      documentId: '_schema',
      data: {
        levelId: '_schema',
        level: 1,
        title: 'AI Explorer',
        badge: 'ai_explorer',
        description: 'Awarded to players starting their AI learning journey.',
        requiredCoin: 0,
        requiredCompletedProblems: 0,
        requiredAverageScore: 0,
        isActive: true,
        order: 1,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'teams',
      documentId: '_schema',
      data: {
        teamId: '_schema',
        roomId: 'sample_room_id',
        teamName: 'Sample Team',
        teamScore: 0,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'teamSessions',
      documentId: '_schema',
      data: {
        teamSessionId: '_schema',
        roomId: 'sample_room_id',
        teamId: 'sample_team_id',
        problemCardId: 'problem_1',
        selectedAiCardIds: ['ai_1', 'ai_2'],
        sharedExplanation: 'Sample shared explanation.',
        totalScore: 0,
        feedback: 'Sample team feedback.',
        status: 'submitted',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'debates',
      documentId: '_schema',
      data: {
        debateId: '_schema',
        roomId: 'sample_room_id',
        prompt: 'Sample debate prompt.',
        status: 'open',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'debateVotes',
      documentId: '_schema',
      data: {
        voteId: '_schema',
        debateId: 'sample_debate_id',
        roomId: 'sample_room_id',
        voterUserId: 'sample_voter_user_id',
        targetUserId: 'sample_target_user_id',
        voteCategory: 'best_solution',
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'tournaments',
      documentId: '_schema',
      data: {
        tournamentId: '_schema',
        title: 'Sample Tournament',
        status: 'draft',
        roundCount: 3,
        startAt: null,
        endAt: null,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'tournamentPlayers',
      documentId: '_schema',
      data: {
        tournamentPlayerId: '_schema',
        tournamentId: 'sample_tournament_id',
        userId: 'sample_user_id',
        displayName: 'Sample Player',
        totalScore: 0,
        averageScore: 0,
        completedRounds: 0,
        rank: 0,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'cardSkins',
      documentId: '_schema',
      data: {
        skinId: '_schema',
        title: 'Sample Card Skin',
        cardType: 'problem',
        imageUrl: '',
        requiredLevel: 1,
        requiredAchievementId: '',
        isActive: true,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'userCardSkins',
      documentId: '_schema',
      data: {
        userSkinId: '_schema',
        userId: 'sample_user_id',
        skinId: 'sample_skin_id',
        source: 'achievement',
        isSchema: true,
        unlockedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'leaderboards',
      documentId: '_schema',
      data: {
        leaderboardId: '_schema',
        leaderboardType: 'global',
        period: 'all_time',
        rows: [],
        isSchema: true,
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'publicLaunchEvents',
      documentId: '_schema',
      data: {
        eventId: '_schema',
        title: 'Sample Public Launch Event',
        description: 'Sample public launch event description.',
        eventDate: null,
        eventStatus: 'draft',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'hintRequests',
      documentId: '_schema',
      data: {
        hintRequestId: '_schema',
        userId: 'sample_user_id',
        sessionId: 'sample_session_id',
        problemCardId: 'problem_1',
        hintText: 'Sample hint text.',
        cost: 20,
        isSchema: true,
        createdAt: serverTimestamp()
      }
    }
  ]

  const uploadTasks = collections.map((item) =>
    setDoc(doc(db, item.collectionName, item.documentId), item.data, {
      merge: true
    })
  )

  await Promise.all(uploadTasks)

  return collections.length
}