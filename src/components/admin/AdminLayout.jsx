import { useLanguage } from '../../context/LanguageContext'

function AdminLayout({ adminUser, activeScreen, onScreenChange, onLogout, children }) {
  const { languageCode, languageOptions, setLanguage, t } = useLanguage()

  const navItems = [
    { id: 'dashboard', label: t('adminDashboard', 'Admin Dashboard'), icon: '📊', description: 'Overview' },
    { id: 'problem-cards', label: t('problemCards', 'Problem Cards'), icon: '🧩', description: 'Cards' },
    { id: 'ai-cards', label: t('aiCards', 'AI Cards'), icon: '🤖', description: 'Deck' },
    { id: 'sdg-mappings', label: t('sdgMappings', 'SDG Mappings'), icon: '🌍', description: 'Problem SDGs' },
    { id: 'rubrics', label: t('scoringRubrics', 'Scoring Rubrics'), icon: '🧮', description: 'Rubric' },
    { id: 'rewards-admin', label: t('rewards', 'Rewards'), icon: '🎁', description: 'Claims' },
    { id: 'global-settings', label: t('globalSettings', 'Global Settings'), icon: '⚙️', description: 'Rules' },
    { id: 'languages-admin', label: t('languages', 'Languages'), icon: '🗣️', description: 'Add languages' },
    { id: 'levels-admin', label: t('levels', 'Levels'), icon: '🏆', description: 'Progression' },
    { id: 'achievements-admin', label: t('achievements', 'Achievements'), icon: '🏅', description: 'Badges' },
    { id: 'players', label: t('playerAnalytics', 'Player Analytics'), icon: '👥', description: 'Progress' },
    { id: 'player-details', label: t('playerDetails', 'Player Details'), icon: '🪪', description: 'Accounts' },
    { id: 'wallet-audit', label: t('walletAudit', 'GLA Coin Audit'), icon: '🪙', description: 'Wallets' },
    { id: 'leaderboard-admin', label: t('leaderboard', 'Leaderboard'), icon: '🥇', description: 'Export' },
    { id: 'multiplayer-admin', label: t('rooms', 'Rooms'), icon: '🎮', description: 'Moderation' },
    { id: 'competition-admin', label: t('teamsDebates', 'Teams/Debates'), icon: '⚔️', description: 'Modes' },
    { id: 'feedback-inbox', label: t('feedbackInbox', 'Feedback Inbox'), icon: '📥', description: 'Issues' },
    { id: 'card-images', label: t('cardImages', 'Card Images'), icon: '🖼️', description: 'Assets' },
    { id: 'certificate-templates', label: t('certificates', 'Certificates'), icon: '🎓', description: 'Templates' },
    { id: 'analytics', label: t('analytics', 'Analytics Dashboard'), icon: '📈', description: 'Impact' },
    { id: 'reports', label: t('reports', 'Reports'), icon: '📤', description: 'Export' }
  ]

  return (
    <main className="adminShell">
      <style>{layoutCss}</style>

      <aside className="adminSidebar">
        <div className="adminSidebarTop">
          <div className="adminLogo">GLA</div>
          <div>
            <h1>{t('adminPortal', 'Admin Portal')}</h1>
            <p>{adminUser?.role || 'Administrator'}</p>
          </div>
        </div>

        <nav className="adminNav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onScreenChange(item.id)}
              className={`adminNavButton ${activeScreen === item.id ? 'active' : ''}`}
            >
              <span className="adminNavIcon">{item.icon}</span>
              <span>
                <span className="adminNavLabel">{item.label}</span>
                <span className="adminNavDescription">{item.description}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="adminSidebarFooter">
          <p>Signed in as</p>
          <strong>{adminUser?.email}</strong>
          <button type="button" onClick={onLogout}>{t('logout', 'Logout')}</button>
        </div>
      </aside>

      <section className="adminContent">
        <header className="adminHeader">
          <div>
            <p>GRIT Lab Africa</p>
            <h2>{t('adminWorkspace', 'Admin workspace')}</h2>
          </div>

          <div className="adminHeaderActions">
            <select value={languageCode} onChange={(event) => setLanguage(event.target.value)}>
              {languageOptions.map((language) => (
                <option key={language.languageCode} value={language.languageCode}>
                  {language.languageName}
                </option>
              ))}
            </select>
            <a href="/" className="adminBackLink">{t('backToPlayerApp', 'Back to Player App')}</a>
          </div>
        </header>

        {children}
      </section>
    </main>
  )
}

const layoutCss = `
.adminShell { min-height: 100vh; display: grid; grid-template-columns: 310px minmax(0, 1fr); background: radial-gradient(circle at top left, rgba(244,210,138,.22), transparent 26rem), linear-gradient(135deg, rgba(255,248,235,.94), rgba(232,214,170,.72)); }
.adminSidebar { height: 100vh; position: sticky; top: 0; overflow-y: auto; padding: 16px; color: #fff8eb; background: linear-gradient(145deg, rgba(92,53,18,.97), rgba(18,18,18,.94)); border-right: 1px solid rgba(244,210,138,.22); box-shadow: 0 26px 70px rgba(45,27,10,.28); scrollbar-width: thin; }
.adminSidebarTop { display:flex; align-items:center; gap:12px; padding:13px; border-radius:22px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); margin-bottom:14px; }
.adminLogo { width:48px; height:48px; border-radius:17px; display:grid; place-items:center; background:linear-gradient(135deg,#f4d28a,#9a6a22); color:#3b2817; font-weight:950; }
.adminSidebarTop h1 { margin:0; font-size:1.05rem; line-height:1.15; letter-spacing:-.04em; }
.adminSidebarTop p { margin:4px 0 0; color:rgba(255,248,235,.64); font-size:.76rem; }
.adminNav { display:grid; gap:7px; }
.adminNavButton { width:100%; border:1px solid transparent; border-radius:18px; padding:10px 11px; display:grid; grid-template-columns:36px 1fr; gap:10px; align-items:center; text-align:left; cursor:pointer; background:transparent; color:rgba(255,248,235,.78); transition:.2s; }
.adminNavButton:hover { transform:translateX(3px); background:rgba(255,255,255,.08); border-color:rgba(244,210,138,.18); }
.adminNavButton.active { background:rgba(244,210,138,.14); color:#fff8eb; border-color:rgba(244,210,138,.28); }
.adminNavIcon { width:36px; height:36px; border-radius:14px; display:grid; place-items:center; background:rgba(255,255,255,.08); }
.adminNavButton.active .adminNavIcon { background:linear-gradient(135deg,#f4d28a,#9a6a22); color:#3b2817; }
.adminNavLabel { display:block; font-size:.9rem; font-weight:900; line-height:1.15; }
.adminNavDescription { display:block; margin-top:3px; font-size:.7rem; font-weight:750; color:rgba(255,248,235,.5); }
.adminSidebarFooter { margin-top:16px; padding:14px; border-radius:20px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1); }
.adminSidebarFooter p { margin:0 0 4px; color:rgba(255,248,235,.58); font-size:.72rem; }
.adminSidebarFooter strong { display:block; color:#f4d28a; overflow-wrap:anywhere; font-size:.84rem; }
.adminSidebarFooter button { margin-top:12px; width:100%; border:1px solid rgba(255,255,255,.12); border-radius:999px; padding:10px 14px; cursor:pointer; background:rgba(255,255,255,.08); color:#fff8eb; font-weight:850; }
.adminContent { min-width:0; padding:28px; }
.adminHeader { margin-bottom:18px; display:flex; justify-content:space-between; gap:16px; align-items:center; }
.adminHeader p { margin:0 0 6px; color:#9a6a22; font-size:.74rem; font-weight:850; letter-spacing:.14em; text-transform:uppercase; }
.adminHeader h2 { margin:0; color:#4b2b10; font-size:2.1rem; line-height:.95; letter-spacing:-.06em; }
.adminHeaderActions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
.adminHeaderActions select { border-radius:999px; padding:10px 13px; border:1px solid rgba(139,92,40,.22); background:rgba(255,255,255,.78); color:#5c3512; font-weight:850; }
.adminBackLink { border-radius:999px; padding:11px 16px; background:rgba(255,255,255,.68); border:1px solid rgba(139,92,40,.22); color:#5c3512; text-decoration:none; font-weight:850; }
@media (max-width:980px){ .adminShell{grid-template-columns:1fr;} .adminSidebar{position:relative;height:auto;max-height:72vh;} .adminContent{padding:18px;} .adminHeader{align-items:flex-start;flex-direction:column;} }
`

export default AdminLayout
