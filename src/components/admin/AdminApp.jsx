import { useState } from 'react'
import AdminLoginScreen from './AdminLoginScreen'
import AdminLayout from './AdminLayout'
import AdminDashboardScreen from './AdminDashboardScreen'
import AdminProblemCardsScreen from './AdminProblemCardsScreen'
import AdminAiCardsScreen from './AdminAiCardsScreen'
import AdminSdgMappingScreen from './AdminSdgMappingScreen'
import AdminScoringRubricScreen from './AdminScoringRubricScreen'
import AdminAssetTemplateScreen from './AdminAssetTemplateScreen'
import AdminPlayerAnalyticsScreen from './AdminPlayerAnalyticsScreen'
import AdminAnalyticsScreen from './AdminAnalyticsScreen'
import AdminReportsScreen from './AdminReportsScreen'
import AdminRewardsManagementScreen from './AdminRewardsManagementScreen'
import AdminGlobalSettingsScreen from './AdminGlobalSettingsScreen'
import AdminLanguageManagementScreen from './AdminLanguageManagementScreen'
import AdminLevelsManagementScreen from './AdminLevelsManagementScreen'
import AdminAchievementsManagementScreen from './AdminAchievementsManagementScreen'
import AdminMultiplayerModerationScreen from './AdminMultiplayerModerationScreen'
import AdminCompetitionManagementScreen from './AdminCompetitionManagementScreen'
import AdminLeaderboardAdminScreen from './AdminLeaderboardAdminScreen'
import AdminWalletAuditScreen from './AdminWalletAuditScreen'
import AdminPlayerDetailsScreen from './AdminPlayerDetailsScreen'
import AdminFeedbackInboxScreen from './AdminFeedbackInboxScreen'

function AdminApp() {
  const [adminUser, setAdminUser] = useState(null)
  const [activeScreen, setActiveScreen] = useState('dashboard')

  if (!adminUser) {
    return <AdminLoginScreen onLogin={setAdminUser} />
  }

  return (
    <AdminLayout
      adminUser={adminUser}
      activeScreen={activeScreen}
      onScreenChange={setActiveScreen}
      onLogout={() => setAdminUser(null)}
    >
      {activeScreen === 'dashboard' && <AdminDashboardScreen />}
      {activeScreen === 'problem-cards' && <AdminProblemCardsScreen />}
      {activeScreen === 'ai-cards' && <AdminAiCardsScreen />}
      {activeScreen === 'sdg-mappings' && <AdminSdgMappingScreen />}
      {activeScreen === 'rubrics' && <AdminScoringRubricScreen />}
      {activeScreen === 'rewards-admin' && <AdminRewardsManagementScreen />}
      {activeScreen === 'global-settings' && <AdminGlobalSettingsScreen />}
      {activeScreen === 'languages-admin' && <AdminLanguageManagementScreen />}
      {activeScreen === 'levels-admin' && <AdminLevelsManagementScreen />}
      {activeScreen === 'achievements-admin' && <AdminAchievementsManagementScreen />}
      {activeScreen === 'players' && <AdminPlayerAnalyticsScreen />}
      {activeScreen === 'player-details' && <AdminPlayerDetailsScreen />}
      {activeScreen === 'wallet-audit' && <AdminWalletAuditScreen />}
      {activeScreen === 'leaderboard-admin' && <AdminLeaderboardAdminScreen />}
      {activeScreen === 'multiplayer-admin' && <AdminMultiplayerModerationScreen />}
      {activeScreen === 'competition-admin' && <AdminCompetitionManagementScreen />}
      {activeScreen === 'feedback-inbox' && <AdminFeedbackInboxScreen />}
      {activeScreen === 'card-images' && <AdminAssetTemplateScreen type="card-images" />}
      {activeScreen === 'certificate-templates' && <AdminAssetTemplateScreen type="certificate" />}
      {activeScreen === 'analytics' && <AdminAnalyticsScreen />}
      {activeScreen === 'reports' && <AdminReportsScreen />}
    </AdminLayout>
  )
}

export default AdminApp
