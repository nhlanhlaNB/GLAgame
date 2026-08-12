import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { MetricCard, SectionHeader, Pill, ProgressBar } from '../game/ui'
import { getAdminDashboardStats } from '../../services/admin/adminAnalyticsService'

function AdminDashboardScreen({ onGoToAnalytics, onLogout }) {
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboardStats() {
    setLoading(true)
    setError('')

    try {
      const stats = await getAdminDashboardStats()
      setDashboardStats(stats)
    } catch (err) {
      setError(
        err.message ||
          'Could not load admin dashboard data from the system.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardStats()
  }, [])

  if (loading) {
    return (
      <div style={styles.panel}>
        <SectionHeader
          eyebrow="Admin dashboard"
          title="GRIT Lab Africa administration overview."
        >
          Loading dashboard data from the system...
        </SectionHeader>

        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.smallCardText}>Please wait while platform data loads.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.panel}>
        <SectionHeader
          eyebrow="Admin dashboard"
          title="GRIT Lab Africa administration overview."
        >
          dashboard data could not load.
        </SectionHeader>

        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
          <button type="button" onClick={loadDashboardStats} style={secondaryButtonStyle}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="glaAdminHome">
      <style>{homeCss}</style>

      <header className="glaHomeHeader">
        <div>
          <p className="glaEyebrow">GRIT Lab Africa</p>
          <h1>Admin Dashboard</h1>
        </div>

        <div className="glaHomeActions">
          <button type="button" className="glaPrimaryButton" onClick={onGoToAnalytics}>
            Go To Analytics
          </button>
          <button type="button" className="glaGhostButton" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.panel}>
      <SectionHeader
        eyebrow="Admin dashboard"
        title="GRIT Lab Africa administration overview."
      >
        Live overview from the system for content management, player activity,
        analytics and certification.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button type="button" onClick={loadDashboardStats} style={secondaryButtonStyle}>
          Refresh Dashboard
        </button>
      </div>

      <div style={styles.metricGrid}>
        <MetricCard
          title="Registered Players"
          value={dashboardStats.registeredPlayers}
        />
        <MetricCard
          title="Active Players"
          value={dashboardStats.activePlayers}
        />
        <MetricCard
          title="Problem Cards"
          value={dashboardStats.problemCards}
        />
        <MetricCard
          title="AI Cards"
          value={dashboardStats.aiCards}
        />
        <MetricCard
          title="Certificates Issued"
          value={dashboardStats.certificatesIssued}
        />
        <MetricCard
          title="Hints Requested"
          value={dashboardStats.hintsRequested}
        />
      </div>

      <div style={styles.twoColumnGrid}>
        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>Platform readiness</p>
          <h3 style={styles.smallCardTitle}>Admin tools included</h3>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill>Cards</Pill>
            <Pill>SDGs</Pill>
            <Pill>Rubrics</Pill>
            <Pill>Languages</Pill>
            <Pill>Reports</Pill>
            <Pill>Analytics</Pill>
          </div>
        </div>

        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>Completion rate</p>
          <h3 style={styles.smallCardTitle}>{dashboardStats.completionRate}</h3>

          <ProgressBar value={dashboardStats.completionRateValue} />

          <p style={{ ...styles.smallCardText, marginTop: 10 }}>
            Calculated from player records who have completed at least 10
            problem cards.
          </p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <p style={styles.eyebrow}>Recent player activity</p>

        {dashboardStats.recentPlayers.length === 0 ? (
          <p style={styles.smallCardText}>
            No player activity found in the system yet.
          </p>
        ) : (
          <div style={styles.listGrid}>
            {dashboardStats.recentPlayers.map((player) => (
              <div key={player.id} style={styles.rowBetween}>
                <div>
                  <h3 style={styles.smallCardTitle}>{player.name}</h3>
                  <p style={styles.smallCardText}>
                    {player.completed} completed • {player.average}% average
                  </p>
                </div>

                <Pill tone={player.certificate === 'Issued' ? 'success' : 'default'}>
                  {player.certificate}
                </Pill>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </main>
  )
}

const secondaryButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: 999,
  padding: '11px 16px',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#5c3512',
  fontWeight: 850
}

const homeCss = `
  .glaAdminHome {
    min-height: 100vh;
    padding: 30px;
    background:
      radial-gradient(circle at top left, rgba(244, 210, 138, 0.22), transparent 30rem),
      linear-gradient(135deg, rgba(255, 248, 235, 0.94), rgba(232, 214, 170, 0.7));
  }

  .glaHomeHeader {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }

  .glaEyebrow {
    margin: 0 0 8px;
    color: #9a6a22;
    font-size: 0.74rem;
    font-weight: 850;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .glaHomeHeader h1 {
    margin: 0;
    color: #4b2b10;
    font-size: clamp(1.7rem, 3.4vw, 3rem);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .glaHomeActions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .glaPrimaryButton {
    border: 0;
    border-radius: 999px;
    padding: 13px 22px;
    cursor: pointer;
    font-weight: 850;
    background: linear-gradient(135deg, #9a6a22, #5c3512);
    color: #fff8eb;
    box-shadow: 0 14px 30px rgba(92, 53, 18, 0.24);
  }

  .glaGhostButton {
    border: 1px solid rgba(139, 92, 40, 0.22);
    border-radius: 999px;
    padding: 13px 22px;
    cursor: pointer;
    font-weight: 850;
    background: rgba(255, 255, 255, 0.72);
    color: #5c3512;
  }

  @media (max-width: 620px) {
    .glaAdminHome { padding: 16px; }
  }
`

export default AdminDashboardScreen