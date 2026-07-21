import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function seedPhaseThreeCollections() {
  const collections = [
    {
      collectionName: 'scores',
      documentId: '_schema',
      data: {
        scoreId: '_schema',
        userId: 'sample_user_id',
        attemptId: 'sample_attempt_id',
        sessionId: 'sample_session_id',
        problemCardId: 'problem_1',
        rubricId: 'default',
        totalScore: 0,
        glaCoinEarned: 0,
        isBestScore: false,
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'subScores',
      documentId: '_schema',
      data: {
        subScoreId: '_schema',
        scoreId: 'sample_score_id',
        attemptId: 'sample_attempt_id',
        rubricKey: 'ai_card_relevance',
        label: 'AI Card Relevance',
        score: 0,
        maxScore: 20,
        feedback: 'Sample sub-score feedback.',
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'feedback',
      documentId: '_schema',
      data: {
        feedbackId: '_schema',
        userId: 'sample_user_id',
        attemptId: 'sample_attempt_id',
        scoreId: 'sample_score_id',
        problemCardId: 'problem_1',
        overallFeedback: 'Sample overall feedback.',
        improvementSuggestion: 'Sample improvement suggestion.',
        strengths: ['Clear idea', 'Good AI card choice'],
        weaknesses: ['Needs more context', 'Needs practical detail'],
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'userFeedback',
      documentId: '_schema',
      data: {
        userFeedbackId: '_schema',
        userId: 'sample_user_id',
        sessionId: 'sample_session_id',
        rating: 5,
        category: 'game_experience',
        comment: 'Sample user feedback.',
        status: 'new',
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'aiScoringReviews',
      documentId: '_schema',
      data: {
        reviewId: '_schema',
        attemptId: 'sample_attempt_id',
        evaluationId: 'sample_evaluation_id',
        reviewedByUserId: 'sample_admin_user_id',
        originalScore: 0,
        reviewedScore: 0,
        scoreDifference: 0,
        reviewStatus: 'pending',
        reviewNotes: 'Sample AI scoring review note.',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'cardReviewNotes',
      documentId: '_schema',
      data: {
        reviewNoteId: '_schema',
        cardId: 'problem_1',
        cardCollection: 'problemCards',
        reviewedByUserId: 'sample_admin_user_id',
        noteType: 'wording',
        note: 'Sample card review note.',
        status: 'open',
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'analyticsEvents',
      documentId: '_schema',
      data: {
        eventId: '_schema',
        userId: 'sample_user_id',
        eventType: 'sample_event',
        eventName: 'problem_card_selected',
        screenName: 'Problem Selection',
        metadata: {
          problemCardId: 'problem_1',
          aiCardId: 'ai_1'
        },
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'languageVersions',
      documentId: 'english',
      data: {
        languageId: 'english',
        languageCode: 'en',
        languageName: 'English',
        isDefault: true,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'cardTranslations',
      documentId: '_schema',
      data: {
        translationId: '_schema',
        cardId: 'problem_1',
        cardCollection: 'problemCards',
        languageCode: 'en',
        translatedTitle: 'Sample translated title',
        translatedProblem: 'Sample translated problem text.',
        translatedThinkAboutIt: 'Sample translated reflection question.',
        translatedExamples: ['Sample example 1', 'Sample example 2'],
        translatedSdgGoals: ['SDG 1: No Poverty'],
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'achievements',
      documentId: '_schema',
      data: {
        achievementId: '_schema',
        title: 'First Solution',
        description: 'Awarded when a player submits their first solution.',
        achievementType: 'milestone',
        iconName: 'first-solution',
        requiredValue: 1,
        glaCoinReward: 0,
        isActive: true,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'playerAchievements',
      documentId: '_schema',
      data: {
        playerAchievementId: '_schema',
        userId: 'sample_user_id',
        achievementId: 'sample_achievement_id',
        progressValue: 0,
        isUnlocked: false,
        unlockedAt: null,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'adminUsers',
      documentId: '_schema',
      data: {
        adminUserId: '_schema',
        userId: 'sample_user_id',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['manage_cards', 'review_scores', 'view_analytics'],
        isActive: true,
        isSchema: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    },
    {
      collectionName: 'adminActivityLogs',
      documentId: '_schema',
      data: {
        activityLogId: '_schema',
        adminUserId: 'sample_admin_user_id',
        actionType: 'sample_action',
        collectionName: 'problemCards',
        documentId: 'problem_1',
        beforeData: {},
        afterData: {},
        description: 'Sample admin activity log.',
        isSchema: true,
        createdAt: serverTimestamp()
      }
    },
    {
      collectionName: 'appSettings',
      documentId: 'default',
      data: {
        settingsId: 'default',
        hintCost: 20,
        certificateRequiredCompletedCards: 10,
        certificateRequiredAverage: 75,
        maxAiCardsPerAttempt: 3,
        maxExplanationWords: 100,
        defaultLanguageCode: 'en',
        maintenanceMode: false,
        allowUserRegistration: true,
        allowHints: true,
        allowCertificates: true,
        updatedAt: serverTimestamp()
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