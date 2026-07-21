import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { MetricCard, SectionHeader, Pill, ProgressBar } from '../game/ui'
import { getAdminDashboardStats } from '../../services/admin/adminAnalyticsService'

function AdminDashboardScreen() {
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

export default AdminDashboardScreen