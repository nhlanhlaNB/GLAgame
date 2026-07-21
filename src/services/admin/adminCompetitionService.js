import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, makeSafeId, saveDocument, toNumber } from './adminDataHelpers'

export async function getCompetitionData() {
  const [teams, teamSessions, debates, debateVotes, tournaments, tournamentPlayers] = await Promise.all([
    getRows(COLLECTIONS.teams), getRows(COLLECTIONS.teamSessions), getRows(COLLECTIONS.debates),
    getRows(COLLECTIONS.debateVotes), getRows(COLLECTIONS.tournaments), getRows(COLLECTIONS.tournamentPlayers)
  ])
  return { teams, teamSessions, debates, debateVotes, tournaments, tournamentPlayers }
}

export async function saveTeam(formValues) {
  const teamName = cleanText(formValues.teamName) || 'Team'
  const teamId = cleanText(formValues.teamId || formValues.firestoreId) || makeSafeId(teamName, 'team')
  return saveDocument(COLLECTIONS.teams, teamId, { teamId, teamName, teamStatus: cleanText(formValues.teamStatus) || 'active', score: toNumber(formValues.score), createdAt: formValues.createdAt || serverTimestamp() }, { actionType: 'save_team' })
}

export async function saveDebate(formValues) {
  const title = cleanText(formValues.title) || 'Debate'
  const debateId = cleanText(formValues.debateId || formValues.firestoreId) || makeSafeId(title, 'debate')
  return saveDocument(COLLECTIONS.debates, debateId, { debateId, title, prompt: cleanText(formValues.prompt), debateStatus: cleanText(formValues.debateStatus) || 'open', createdAt: formValues.createdAt || serverTimestamp() }, { actionType: 'save_debate' })
}

export async function saveTournament(formValues) {
  const title = cleanText(formValues.title) || 'Tournament'
  const tournamentId = cleanText(formValues.tournamentId || formValues.firestoreId) || makeSafeId(title, 'tournament')
  return saveDocument(COLLECTIONS.tournaments, tournamentId, { tournamentId, title, tournamentStatus: cleanText(formValues.tournamentStatus) || 'planning', maxPlayers: toNumber(formValues.maxPlayers, 32), createdAt: formValues.createdAt || serverTimestamp() }, { actionType: 'save_tournament' })
}
