import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { MetricCard, SectionHeader, Pill } from '../game/ui'
import { getAdminAnalyticsDashboardData } from '../../services/admin/adminAnalyticsService'

function AdminAnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tableFilter, setTableFilter] = useState('all')
  const [minimumCount, setMinimumCount] = useState('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAnalyticsData() {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminAnalyticsDashboardData()
      setAnalyticsData(data)
    } catch (err) {
      setError(err.message || 'Could not load analytics dashboard from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const tables = useMemo(() => {
    if (!analyticsData) return []

    return [
      {
        id: 'problems',
        title: 'Most Selected Problem Cards Analytics',
        rows: analyticsData.mostSelectedProblems,
        columns: [
          { key: 'title', label: 'Problem Card' },
          { key: 'count', label: 'Selections' }
        ]
      },
      {
        id: 'ai-cards',
        title: 'Most Used AI Cards Analytics',
        rows: analyticsData.mostUsedAiCards,
        columns: [
          { key: 'title', label: 'AI Card' },
          { key: 'count', label: 'Uses' }
        ]
      },
      {
        id: 'combinations',
        title: 'Common AI Card Combinations Analytics',
        rows: analyticsData.commonCombinations,
        columns: [
          { key: 'combination', label: 'Combination' },
          { key: 'count', label: 'Uses' }
        ]
      },
      {
        id: 'problem-scores',
        title: 'Average Score Per Problem Card Analytics',
        rows: analyticsData.averageScoreByProblem,
        columns: [
          { key: 'title', label: 'Problem' },
          { key: 'average', label: 'Average Score' },
          { key: 'count', label: 'Attempts' }
        ]
      },
      {
        id: 'category-scores',
        title: 'Average Score Per Scoring Category Analytics',
        rows: analyticsData.averageScoreByCategory,
        columns: [
          { key: 'category', label: 'Scoring Category' },
          { key: 'average', label: 'Average' },
          { key: 'count', label: 'Entries' }
        ]
      }
    ]
  }, [analyticsData])

  const filteredTables = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()
    const minCount = Number(minimumCount) || 0

    return tables
      .filter((table) => tableFilter === 'all' || table.id === tableFilter)
      .map((table) => {
        const rows = table.rows.filter((row) => {
          const searchableText = Object.values(row).join(' ').toLowerCase()
          const matchesSearch =
            !cleanSearch || searchableText.includes(cleanSearch)

          const rowCount = Number(row.count || row.uses || row.selections || 0)
          const matchesCount = rowCount >= minCount

          return matchesSearch && matchesCount
        })

        return {
          ...table,
          rows
        }
      })
  }, [tables, searchTerm, tableFilter, minimumCount])

  if (loading) {
    return (
      <div style={styles.panel}>
        <SectionHeader
          eyebrow="Analytics dashboard"
          title="Learning analytics and impact reporting."
        >
          Loading analytics from the system...
        </SectionHeader>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.panel}>
        <SectionHeader
          eyebrow="Analytics dashboard"
          title="Learning analytics and impact reporting."
        >
          platform analytics could not load.
        </SectionHeader>

        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(153, 27, 27, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
          <button type="button" onClick={loadAnalyticsData} style={secondaryButtonStyle}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Analytics dashboard"
        title="Learning analytics and impact reporting."
      >
        Includes registered players, active players, card usage, hints,
        certificates, completion and replay metrics from the system.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button
          type="button"
          onClick={loadAnalyticsData}
          style={secondaryButtonStyle}
        >
          Refresh Analytics
        </button>
      </div>

      <div style={styles.metricGrid}>
        <MetricCard
          title="Registered Players"
          value={analyticsData.metrics.registeredPlayers}
        />
        <MetricCard
          title="Active Players"
          value={analyticsData.metrics.activePlayers}
        />
        <MetricCard
          title="Hints Requested"
          value={analyticsData.metrics.hintsRequested}
        />
        <MetricCard
          title="Certificates Issued"
          value={analyticsData.metrics.certificatesIssued}
        />
        <MetricCard
          title="Completion Rate"
          value={analyticsData.metrics.completionRate}
        />
        <MetricCard
          title="Replay Rate"
          value={analyticsData.metrics.replayRate}
        />
      </div>

      <div style={styles.metricGrid}>
        <MetricCard
          title="Game Sessions"
          value={analyticsData.metrics.gameSessions}
        />
        <MetricCard
          title="Attempts"
          value={analyticsData.metrics.attempts}
        />
        <MetricCard
          title="Filtered Tables"
          value={filteredTables.length}
        />
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Filter analytics tables</h3>
          </div>

          <Pill>platform analytics</Pill>
        </div>

        <div style={filterGridStyle}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search problems, AI cards, combinations or scoring categories..."
            style={inputStyle}
          />

          <select
            value={tableFilter}
            onChange={(event) => setTableFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All analytics tables</option>
            <option value="problems">Problem cards</option>
            <option value="ai-cards">AI cards</option>
            <option value="combinations">AI combinations</option>
            <option value="problem-scores">Problem scores</option>
            <option value="category-scores">Category scores</option>
          </select>

          <select
            value={minimumCount}
            onChange={(event) => setMinimumCount(event.target.value)}
            style={inputStyle}
          >
            <option value="0">Any count</option>
            <option value="2">At least 2</option>
            <option value="5">At least 5</option>
            <option value="10">At least 10</option>
          </select>
        </div>
      </div>

      {filteredTables.map((table) => (
        <AnalyticsTable
          key={table.id}
          title={table.title}
          rows={table.rows}
          columns={table.columns}
        />
      ))}
    </div>
  )
}

function AnalyticsTable({ title, rows, columns }) {
  return (
    <div style={{ ...styles.smallCard, marginTop: 18 }}>
      <div style={styles.rowBetween}>
        <div>
          <p style={styles.eyebrow}>{title}</p>
          <h3 style={styles.smallCardTitle}>{rows.length} rows</h3>
        </div>

        <Pill>{rows.length === 0 ? 'No data' : 'Live data'}</Pill>
      </div>

      {rows.length === 0 ? (
        <p style={{ ...styles.smallCardText, marginTop: 16 }}>
          No analytics rows found for this table yet.
        </p>
      ) : (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={thStyle}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.id || rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key} style={tdStyle}>
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const filterGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 1fr) 230px 180px',
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

const secondaryButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: 999,
  padding: '11px 16px',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#5c3512',
  fontWeight: 850
}

const tableWrapStyle = {
  marginTop: 16,
  width: '100%',
  overflowX: 'auto'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 800
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

export default AdminAnalyticsScreen