import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { getRows, saveDocument } from './adminDataHelpers'

export async function getReportDashboardData() {
  const [users, attempts, certificates, rewards, rooms, feedback] = await Promise.all([
    getRows(COLLECTIONS.users), getRows(COLLECTIONS.attempts), getRows(COLLECTIONS.certificates), getRows(COLLECTIONS.sponsorRewards), getRows(COLLECTIONS.multiplayerRooms), getRows(COLLECTIONS.feedback)
  ])
  return [
    { report: 'Player progress report', type: 'CSV', status: 'Ready', owner: 'Admin', rows: users.length },
    { report: 'Scoring attempts report', type: 'CSV', status: 'Ready', owner: 'Admin', rows: attempts.length },
    { report: 'Certificate report', type: 'CSV', status: 'Ready', owner: 'Admin', rows: certificates.length },
    { report: 'Rewards report', type: 'CSV', status: 'Ready', owner: 'Admin', rows: rewards.length },
    { report: 'Multiplayer rooms report', type: 'CSV', status: 'Ready', owner: 'Admin', rows: rooms.length },
    { report: 'Feedback inbox report', type: 'CSV', status: 'Ready', owner: 'Admin', rows: feedback.length }
  ]
}

export async function saveReportExport(reportRows, reportName = 'Admin report export') {
  const reportId = `report_${Date.now()}`
  return saveDocument(COLLECTIONS.adminReports, reportId, {
    reportId,
    reportName,
    rows: reportRows,
    rowCount: reportRows.length,
    createdAt: serverTimestamp()
  }, { actionType: 'save_report_export' })
}
