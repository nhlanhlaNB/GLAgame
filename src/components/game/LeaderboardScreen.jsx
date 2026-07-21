import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { styles } from './gameStyles'
import { LoadingPage, Pill, SectionHeader } from './ui'
import {
  getPlayerLeaderboardRows,
  syncCurrentPlayerLeaderboardProfile
} from '../../services/player/playerLeaderboardService'

function LeaderboardScreen({
  fullName = 'Player',
  averageScore = 0,
  completedProblems = 0,
  totalGlaCoinEarned = 0
}) {
  const { currentUser } = useAuth()
  const [leaderboardRows, setLeaderboardRows] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rankBy, setRankBy] = useState('overallPoints')
  const [certificateFilter, setCertificateFilter] = useState('all')
  const [minimumCompleted, setMinimumCompleted] = useState('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadLeaderboard() {
    setLoading(true)
    setError('')

    try {
      if (currentUser?.uid) {
        await syncCurrentPlayerLeaderboardProfile({
          userId: currentUser.uid,
          fullName,
          averageScore,
          completedProblems,
          totalGlaCoinEarned
        })
      }

      const rows = await getPlayerLeaderboardRows(currentUser?.uid || '')
      setLeaderboardRows(rows)
    } catch (err) {
      setError(err.message || 'Could not load leaderboard from the system.')
      setLeaderboardRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [
    currentUser?.uid,
    fullName,
    averageScore,
    completedProblems,
    totalGlaCoinEarned
  ])

  const sortedRows = useMemo(() => {
    const rows = [...leaderboardRows]

    rows.sort((a, b) => {
      if (rankBy === 'averageScore') {
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore
        return b.completedProblems - a.completedProblems
      }

      if (rankBy === 'completedProblems') {
        if (b.completedProblems !== a.completedProblems) {
          return b.completedProblems - a.completedProblems
        }
        return b.averageScore - a.averageScore
      }

      if (rankBy === 'totalGlaCoinEarned') {
        if (b.totalGlaCoinEarned !== a.totalGlaCoinEarned) {
          return b.totalGlaCoinEarned - a.totalGlaCoinEarned
        }
        return b.averageScore - a.averageScore
      }

      if (b.overallPoints !== a.overallPoints) {
        return b.overallPoints - a.overallPoints
      }

      return b.averageScore - a.averageScore
    })

    return rows.map((row, index) => ({
      ...row,
      rank: index + 1
    }))
  }, [leaderboardRows, rankBy])

  const filteredRows = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()
    const minimum = Number(minimumCompleted) || 0

    return sortedRows.filter((row) => {
      const searchableText = [
        row.name,
        row.email,
        row.certificate,
        row.completedProblems,
        row.averageScore,
        row.totalGlaCoinEarned
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = !cleanSearch || searchableText.includes(cleanSearch)

      const matchesCertificate =
        certificateFilter === 'all' ||
        String(row.certificate || '').toLowerCase() === certificateFilter

      const matchesCompleted = Number(row.completedProblems || 0) >= minimum

      return matchesSearch && matchesCertificate && matchesCompleted
    })
  }, [sortedRows, searchTerm, certificateFilter, minimumCompleted])

  const currentPlayerRow = sortedRows.find((row) => row.isCurrentUser)
  const topPlayer = sortedRows[0] || null
  const certifiedCount = sortedRows.filter((row) => row.certificate === 'Issued').length

  if (loading) {
    return (
      <LoadingPage
        title="Loading leaderboard"
        message="Preparing rankings from the system leaderboard and player progress data."
      />
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Player leaderboard"
        title="Compare progress with other players."
      >
        The leaderboard is calculated from player records, attempts,
        glaCoinTransactions and certificates. No separate leaderboard collection
        is needed for now.
      </SectionHeader>

      {error && (
        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(153, 27, 27, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Your Rank</p>
          <h3 style={styles.smallCardTitle}>
            {currentPlayerRow ? `#${currentPlayerRow.rank}` : 'Pending'}
          </h3>
          <p style={styles.smallCardText}>Based on the selected ranking mode.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Top Player</p>
          <h3 style={styles.smallCardTitle}>{topPlayer?.name || 'No players yet'}</h3>
          <p style={styles.smallCardText}>
            {topPlayer ? `${topPlayer.overallPoints} overall points` : 'Waiting for platform data.'}
          </p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Players Ranked</p>
          <h3 style={styles.smallCardTitle}>{sortedRows.length}</h3>
          <p style={styles.smallCardText}>Player records loaded from the system.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Certified Players</p>
          <h3 style={styles.smallCardTitle}>{certifiedCount}</h3>
          <p style={styles.smallCardText}>Players with issued certificates.</p>
        </div>
      </div>

      {currentPlayerRow && (
        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <div style={styles.rowBetween}>
            <div>
              <p style={styles.eyebrow}>Your leaderboard summary</p>
              <h3 style={styles.smallCardTitle}>
                #{currentPlayerRow.rank} — {currentPlayerRow.name}
              </h3>
            </div>

            <Pill tone="success">You</Pill>
          </div>

          <div style={summaryGridStyle}>
            <SmallSummary title="Overall Points" value={currentPlayerRow.overallPoints} />
            <SmallSummary title="Average Score" value={`${currentPlayerRow.averageScore}%`} />
            <SmallSummary title="Completed" value={currentPlayerRow.completedProblems} />
            <SmallSummary title="GLA Coin" value={currentPlayerRow.totalGlaCoinEarned} />
          </div>
        </div>
      )}

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Find leaderboard players</h3>
          </div>

          <Pill>{filteredRows.length} results</Pill>
        </div>

        <div style={filterGridStyle}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search player name, email, certificate or score..."
            style={inputStyle}
          />

          <select
            value={rankBy}
            onChange={(event) => setRankBy(event.target.value)}
            style={inputStyle}
          >
            <option value="overallPoints">Rank by overall points</option>
            <option value="totalGlaCoinEarned">Rank by GLA coin</option>
            <option value="averageScore">Rank by average score</option>
            <option value="completedProblems">Rank by completed problems</option>
          </select>

          <select
            value={certificateFilter}
            onChange={(event) => setCertificateFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All certificates</option>
            <option value="issued">Certified only</option>
            <option value="pending">Pending only</option>
          </select>

          <select
            value={minimumCompleted}
            onChange={(event) => setMinimumCompleted(event.target.value)}
            style={inputStyle}
          >
            <option value="0">Any completed count</option>
            <option value="1">1+ completed</option>
            <option value="5">5+ completed</option>
            <option value="10">10+ completed</option>
            <option value="15">15+ completed</option>
          </select>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>the system leaderboard data</p>
            <h3 style={styles.smallCardTitle}>Player ranking table</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${filteredRows.length} players`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading leaderboard from the system...
          </p>
        ) : filteredRows.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No leaderboard rows match your filters.
          </p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Player</th>
                  <th style={thStyle}>Overall Points</th>
                  <th style={thStyle}>GLA Coin</th>
                  <th style={thStyle}>Completed</th>
                  <th style={thStyle}>Average</th>
                  <th style={thStyle}>Best</th>
                  <th style={thStyle}>Attempts</th>
                  <th style={thStyle}>Certificate</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.userId || row.email}
                    style={row.isCurrentUser ? currentUserRowStyle : undefined}
                  >
                    <td style={tdStyle}>
                      <strong>#{row.rank}</strong>
                    </td>

                    <td style={tdStyle}>
                      <strong>{row.name}</strong>
                      {row.isCurrentUser && (
                        <span style={youBadgeStyle}>You</span>
                      )}
                    </td>

                    <td style={tdStyle}>{row.overallPoints}</td>
                    <td style={tdStyle}>{row.totalGlaCoinEarned}</td>
                    <td style={tdStyle}>{row.completedProblems}</td>
                    <td style={tdStyle}>{row.averageScore}%</td>
                    <td style={tdStyle}>{row.bestScore}%</td>
                    <td style={tdStyle}>{row.attempts}</td>
                    <td style={tdStyle}>
                      <Pill tone={row.certificate === 'Issued' ? 'success' : 'default'}>
                        {row.certificate}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SmallSummary({ title, value }) {
  return (
    <div style={smallSummaryStyle}>
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  )
}

const summaryGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10
}

const smallSummaryStyle = {
  padding: 14,
  borderRadius: 18,
  background: 'rgba(244, 210, 138, 0.22)',
  border: '1px solid rgba(139, 92, 40, 0.14)'
}

const filterGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 1fr) 230px 190px 190px',
  gap: 12
}

const inputStyle = {
  width: '100%',
  padding: '13px 15px',
  borderRadius: 16,
  border: '1px solid rgba(139, 92, 40, 0.24)',
  background: 'rgba(255, 255, 255, 0.76)',
  color: '#3b2817',
  outline: 'none'
}

const tableWrapStyle = {
  marginTop: 16,
  width: '100%',
  overflowX: 'auto'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 1050
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  color: '#5c3512',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(139, 92, 40, 0.2)',
  background: 'rgba(244, 210, 138, 0.22)'
}

const tdStyle = {
  padding: '14px',
  color: '#3b2817',
  borderBottom: '1px solid rgba(139, 92, 40, 0.14)',
  verticalAlign: 'top'
}

const currentUserRowStyle = {
  background: 'rgba(244, 210, 138, 0.18)'
}

const youBadgeStyle = {
  marginLeft: 8,
  padding: '4px 8px',
  borderRadius: 999,
  background: 'rgba(22, 101, 52, 0.12)',
  color: '#166534',
  fontSize: '0.72rem',
  fontWeight: 900
}

export default LeaderboardScreen