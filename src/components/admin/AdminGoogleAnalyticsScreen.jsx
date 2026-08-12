import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { MetricCard, Pill, SectionHeader } from '../game/ui'
import { getGoogleAnalyticsData } from '../../services/admin/adminGoogleAnalyticsService'
import { downloadCsv } from './shared/AdminFeatureUi'

function formatDate(millis) {
  if (!millis) return '—'
  return new Date(millis).toLocaleString()
}

function AdminGoogleAnalyticsScreen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tableFilter, setTableFilter] = useState('all')

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      setData(await getGoogleAnalyticsData())
    } catch (err) {
      setError(err.message || 'Could not load Google analytics from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const tables = useMemo(() => {
    if (!data) return []

    return [
      {
        id: 'types',
        title: 'Events by Type',
        rows: data.eventsByType,
        columns: [
          { key: 'id', label: 'Event Type' },
          { key: 'count', label: 'Count' }
        ]
      },
      {
        id: 'names',
        title: 'Events by Name',
        rows: data.eventsByName,
        columns: [
          { key: 'id', label: 'Event Name' },
          { key: 'count', label: 'Count' }
        ]
      },
      {
        id: 'users',
        title: 'Most Active Players',
        rows: data.topUsers,
        columns: [
          { key: 'id', label: 'Player' },
          { key: 'count', label: 'Events' }
        ]
      }
    ]
  }, [data])

  const filteredTables = useMemo(() => {
    return tables.filter(
      (table) => tableFilter === 'all' || table.id === tableFilter
    )
  }, [tables, tableFilter])

  if (loading) {
    return (
      <div style={styles.panel}>
        <SectionHeader
          eyebrow="Google Analytics"
          title="Real-time player event analytics."
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
          eyebrow="Google Analytics"
          title="Real-time player event analytics."
        >
          Google analytics could not load.
        </SectionHeader>

        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(153, 27, 27, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
          <button
            type="button"
            onClick={loadData}
            style={{
              border: '1px solid rgba(139, 92, 40, 0.22)',
              borderRadius: 999,
              padding: '11px 16px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.72)',
              color: '#5c3512',
              fontWeight: 850
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Google Analytics"
        title="Player event analytics from the system."
      >
        Events are logged to Google Analytics (GA4) and mirrored to the
        system&apos;s Firestore analyticsEvents collection for display here.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button
          type="button"
          onClick={loadData}
          style={{
            border: '1px solid rgba(139, 92, 40, 0.22)',
            borderRadius: 999,
            padding: '11px 16px',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.72)',
            color: '#5c3512',
            fontWeight: 850
          }}
        >
          Refresh Analytics
        </button>
        <button
          type="button"
          onClick={() => downloadCsv('google_analytics_events.csv', data.recentEvents)}
          style={{
            border: '1px solid rgba(139, 92, 40, 0.22)',
            borderRadius: 999,
            padding: '11px 16px',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.72)',
            color: '#5c3512',
            fontWeight: 850
          }}
        >
          Export CSV
        </button>
      </div>

      <div style={styles.metricGrid}>
        <MetricCard title="Total Events" value={data.totalEvents} />
        <MetricCard title="Unique Players" value={data.uniqueUsers} />
        <MetricCard title="Events Today" value={data.todayEvents} />
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Analytics tables</p>
            <h3 style={styles.smallCardTitle}>Event breakdowns</h3>
          </div>

          <Pill>Google Analytics</Pill>
        </div>

        <select
          value={tableFilter}
          onChange={(event) => setTableFilter(event.target.value)}
          style={{
            marginTop: 12,
            width: '100%',
            maxWidth: 340,
            padding: '13px 15px',
            borderRadius: 16,
            border: '1px solid rgba(139, 92, 40, 0.24)',
            background: 'rgba(255, 255, 255, 0.76)',
            color: '#3b2817',
            outline: 'none'
          }}
        >
          <option value="all">All analytics tables</option>
          <option value="types">Events by type</option>
          <option value="names">Events by name</option>
          <option value="users">Most active players</option>
        </select>
      </div>

      {filteredTables.map((table) => (
        <AnalyticsTable
          key={table.id}
          title={table.title}
          rows={table.rows}
          columns={table.columns}
        />
      ))}

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Live activity</p>
            <h3 style={styles.smallCardTitle}>Recent player events</h3>
          </div>

          <Pill>Latest 25</Pill>
        </div>

        {data.recentEvents.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No player events recorded yet.
          </p>
        ) : (
          <div style={{ marginTop: 16, width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Player', 'Event', 'Type', 'Screen', 'When'].map((label) => (
                    <th key={label} style={thStyle}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td style={tdStyle}>{event.userName}</td>
                    <td style={tdStyle}>{event.eventName}</td>
                    <td style={tdStyle}>{event.eventType}</td>
                    <td style={tdStyle}>{event.screenName || '—'}</td>
                    <td style={tdStyle}>{formatDate(event.createdAt)}</td>
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
        <div style={{ marginTop: 16, width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse' }}>
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

export default AdminGoogleAnalyticsScreen
