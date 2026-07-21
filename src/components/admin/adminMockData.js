import { aiCards } from '../../data/aiCards'
import problemCards from '../../assets/json/grit_lab_africa_problem_cards.json'
import { adminReportRows, rubricRows, sdgOptions } from '../../data/mockUiData'

export const adminProblemCards = problemCards.cards || []
export const adminAiCards = aiCards
export const adminRubricRows = rubricRows
export const adminSdgOptions = sdgOptions
export const adminReports = adminReportRows

export const adminPlayers = [
  { id: 1, name: 'Lerato M.', status: 'Active', completed: 16, average: 91, coin: 1380, certificate: 'Issued' },
  { id: 2, name: 'Thabo K.', status: 'Active', completed: 14, average: 87, coin: 1218, certificate: 'Issued' },
  { id: 3, name: 'Amina D.', status: 'Active', completed: 12, average: 84, coin: 1025, certificate: 'Issued' },
  { id: 4, name: 'Sipho N.', status: 'Inactive', completed: 7, average: 76, coin: 532, certificate: 'Pending' },
  { id: 5, name: 'Naledi R.', status: 'Active', completed: 4, average: 68, coin: 314, certificate: 'Pending' }
]

export const adminAnalytics = {
  registeredPlayers: 128,
  activePlayers: 76,
  certificatesIssued: 23,
  completionRate: '42%',
  replayRate: '31%',
  hintsRequested: 318,
  mostSelectedProblems: [
    { id: 1, title: 'Youth Unemployment', count: 54 },
    { id: 2, title: 'Career Guidance Gap', count: 48 },
    { id: 3, title: 'Poor Access to Healthcare Information', count: 42 },
    { id: 4, title: 'Illegal Dumping', count: 39 }
  ],
  mostUsedAiCards: [
    { id: 1, title: 'AI Career Guidance Chatbot', count: 61 },
    { id: 2, title: 'AI Opportunity Notifier', count: 56 },
    { id: 3, title: 'AI Image Recognition', count: 44 },
    { id: 4, title: 'AI Civic Reporting Chatbot', count: 41 }
  ],
  commonCombinations: [
    { id: 1, combination: 'Career Guidance + Opportunity Notifier + Future Skills', count: 31 },
    { id: 2, combination: 'Image Recognition + Fault Map + Civic Reporting', count: 27 },
    { id: 3, combination: 'Health Assistant + Queue Management + Text AI', count: 19 }
  ],
  averageScoreByProblem: [
    { id: 1, title: 'Youth Unemployment', average: 78 },
    { id: 2, title: 'Illegal Dumping', average: 74 },
    { id: 3, title: 'Water Leaks', average: 81 },
    { id: 4, title: 'Public Transport Confusion', average: 72 }
  ],
  averageScoreByCategory: [
    { id: 1, category: 'AI Card Relevance', average: '16/20' },
    { id: 2, category: 'Combination Strength', average: '11/15' },
    { id: 3, category: 'Practical Feasibility', average: '12/15' },
    { id: 4, category: 'African Context', average: '10/15' },
    { id: 5, category: 'SDG Alignment', average: '12/15' },
    { id: 6, category: 'Creativity', average: '7/10' },
    { id: 7, category: 'Responsible AI', average: '8/10' }
  ]
}

export const adminLanguages = [
  { id: 1, language: 'French', deckStatus: 'Draft', cardsTranslated: 18, reviewer: 'Pending' },
  { id: 2, language: 'Portuguese', deckStatus: 'Draft', cardsTranslated: 16, reviewer: 'Pending' },
  { id: 3, language: 'Arabic', deckStatus: 'Planning', cardsTranslated: 6, reviewer: 'Pending' },
  { id: 4, language: 'Kiswahili', deckStatus: 'Planning', cardsTranslated: 10, reviewer: 'Pending' },
  { id: 5, language: 'isiZulu', deckStatus: 'Draft', cardsTranslated: 21, reviewer: 'Pending' }
]
