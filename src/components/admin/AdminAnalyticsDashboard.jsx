import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts'
import { getAdminAnalyticsDashboardData } from '../../services/admin/adminAnalyticsService'
import { getGoogleAnalyticsData } from '../../services/admin/adminGoogleAnalyticsService'
import PlayerLocationMap from './PlayerLocationMap'

const PALETTE = ['#2f6fb2', '#83b4f7', '#1a3a6b', '#5b9ad9', '#9cc3ef', '#37618f', '#b8d3f2', '#6a8ab8']

const CHART_OPTIONS = [
  { id: 'area', label: 'Player Registrations (Area)', shape: 'Area chart', description: 'Shows how many new players created accounts each day over the last 30 days.' },
  { id: 'line', label: 'Average Score Trend (Line)', shape: 'Line chart', description: 'Shows the average solution score players achieved each day over the last 30 days.' },
  { id: 'bar', label: 'Hints Requested (Bar)', shape: 'Bar chart', description: 'Shows how many hints players requested each day over the last 30 days.' },
  { id: 'composed', label: 'Daily Engagement (Combo)', shape: 'Composed chart', description: 'Combines attempts submitted (bars) with the average score (line) for each day.' },
  { id: 'donut', label: 'Registered vs Active (Donut)', shape: 'Donut chart', description: 'Splits registered players into active and inactive accounts.' },
  { id: 'pie', label: 'Player Status (Pie)', shape: 'Pie chart', description: 'Shows the share of player accounts that are active versus inactive.' },
  { id: 'radar', label: 'Scoring Category Profile (Radar)', shape: 'Radar chart', description: 'Compares average scores across all scoring categories, showing strengths and weaknesses.' },
  { id: 'radial', label: 'GLA Coins per Problem (Gauge)', shape: 'Radial bar chart', description: 'Gauge bars showing the average GLA coins earned per problem card.' },
  { id: 'scatter', label: 'Score vs Attempts (Bubble)', shape: 'Scatter chart', description: 'Each bubble is a problem card: position shows average score (Y) and number of attempts (X), bubble size = attempts.' },
  { id: 'funnel', label: 'Learning Conversion Funnel', shape: 'Funnel chart', description: 'Shows how many players move from registered → active → completed 10+ problems → certified.' },
  { id: 'treemap', label: 'Most Used AI Cards (Treemap)', shape: 'Treemap', description: 'Tiles sized by how often each AI card was used; larger tiles = more usage.' },
  { id: 'map', label: 'Players by Location (Map)', shape: 'Map', description: 'A live world map showing where players are playing from, using location data captured at signup.' },
  { id: 'google', label: 'Google Analytics Overview', shape: 'Overview', description: 'Event analytics mirrored from Google Analytics (Firebase) — totals, top events and recent activity.' }
]

function formatDate(millis) {
  if (!millis) return '—'
  return new Date(millis).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function ChartCard({ title, shape, description, children }) {
  return (
    <div className="adaChartCard">
      <div className="adaChartHead">
        <div>
          <p className="adaChartEyebrow">{shape}</p>
          <h3 className="adaChartTitle">{title}</h3>
        </div>
        <span className="adaChartShape">{shape}</span>
      </div>
      <p className="adaChartDesc">{description}</p>
      <div className="adaChartBody">{children}</div>
    </div>
  )
}

function MetricStrip({ metrics }) {
  const items = [
    { label: 'Registered Players', value: metrics.registeredPlayers, icon: '👥' },
    { label: 'Active Players', value: metrics.activePlayers, icon: '✅' },
    { label: 'Attempts', value: metrics.attempts, icon: '✍️' },
    { label: 'Game Sessions', value: metrics.gameSessions, icon: '🎮' },
    { label: 'Hints Requested', value: metrics.hintsRequested, icon: '💡' },
    { label: 'Certificates Issued', value: metrics.certificatesIssued, icon: '🎓' },
    { label: 'Completed 10+', value: metrics.completedPlayers, icon: '🏁' },
    { label: 'Replay Rate', value: metrics.replayRate, icon: '🔁' }
  ]

  return (
    <div className="adaMetricGrid">
      {items.map((item) => (
        <div key={item.label} className="adaMetricCard">
          <span className="adaMetricIcon">{item.icon}</span>
          <div>
            <p className="adaMetricValue">{item.value}</p>
            <p className="adaMetricLabel">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TreemapContent(props) {
  const { x, y, width, height, name, index, size } = props
  const fill = PALETTE[(index || 0) % PALETTE.length]

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={7} />
      {width > 70 && height > 30 ? (
        <text x={x + 8} y={y + 18} fill="#ffffff" fontSize={12} fontWeight={850}>
          {name.length > 22 ? `${name.slice(0, 22)}…` : name}
        </text>
      ) : null}
      {width > 120 && height > 46 ? (
        <text x={x + 8} y={y + 38} fill="rgba(255,255,255,0.85)" fontSize={11}>
          {size} uses
        </text>
      ) : null}
    </g>
  )
}

function GoogleAnalyticsOverview({ gaData }) {
  const metricItems = [
    { label: 'Total Events', value: gaData.totalEvents, icon: '📊' },
    { label: 'Active Users', value: gaData.uniqueUsers, icon: '👥' },
    { label: 'Events Today', value: gaData.todayEvents, icon: '📅' },
    { label: 'Events Last 7 Days', value: gaData.last7DayEvents, icon: '🗓️' },
    { label: 'Active Last 30 Min', value: gaData.last30MinEvents, icon: '⚡' }
  ]

  return (
    <div>
      <div className="adaMetricGrid">
        {metricItems.map((item) => (
          <div key={item.label} className="adaMetricCard">
            <span className="adaMetricIcon">{item.icon}</span>
            <div>
              <p className="adaMetricValue">{item.value}</p>
              <p className="adaMetricLabel">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="adaGaColumns">
        <div className="adaGaList">
          <p className="adaEyebrow">Top events</p>
          <h4 className="adaGaListTitle">Event count by name</h4>
          {gaData.eventsByName.length === 0 ? (
            <p className="adaMuted">No events recorded yet.</p>
          ) : (
            gaData.eventsByName.slice(0, 12).map((row) => (
              <div key={row.id} className="adaGaRow">
                <span className="adaGaRowLabel">{row.id}</span>
                <div className="adaGaBarTrack">
                  <div
                    className="adaGaBar adaGaBarBlue"
                    style={{ width: `${Math.max(6, (row.count / gaData.eventsByName[0].count) * 100)}%` }}
                  />
                </div>
                <span className="adaGaRowCount">{row.count}</span>
              </div>
            ))
          )}
        </div>

        <div className="adaGaList">
          <p className="adaEyebrow">Top players</p>
          <h4 className="adaGaListTitle">Most active players</h4>
          {gaData.topUsers.length === 0 ? (
            <p className="adaMuted">No player activity recorded yet.</p>
          ) : (
            gaData.topUsers.slice(0, 10).map((row, index) => (
              <div key={`${row.id}-${index}`} className="adaGaRow">
                <span className="adaGaRowLabel">{index + 1}. {row.id}</span>
                <div className="adaGaBarTrack">
                  <div
                    className="adaGaBar adaGaBarDeep"
                    style={{ width: `${Math.max(6, (row.count / gaData.topUsers[0].count) * 100)}%` }}
                  />
                </div>
                <span className="adaGaRowCount">{row.count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="adaPanel" style={{ marginTop: 18 }}>
        <p className="adaEyebrow">Live activity</p>
        <h4 className="adaGaListTitle">Recent player events</h4>
        {gaData.recentEvents.length === 0 ? (
          <p className="adaMuted">No player events recorded yet.</p>
        ) : (
          <div className="adaTableWrap">
            <table className="adaTable">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Screen</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {gaData.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="adaName">{event.userName}</td>
                    <td>{event.eventName}</td>
                    <td>{event.eventType}</td>
                    <td>{event.screenName || '—'}</td>
                    <td>{formatDate(event.createdAt)}</td>
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

function AdminAnalyticsDashboard({ adminUser, onLogout }) {
  const [data, setData] = useState(null)
  const [gaData, setGaData] = useState(null)
  const [selectedChart, setSelectedChart] = useState('area')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [analyticsResult, googleResult] = await Promise.all([
        getAdminAnalyticsDashboardData(),
        getGoogleAnalyticsData()
      ])
      setData(analyticsResult)
      setGaData(googleResult)
      setGeneratedAt(new Date())
    } catch (err) {
      setError(err.message || 'Could not load analytics from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectedOption = CHART_OPTIONS.find((option) => option.id === selectedChart) || CHART_OPTIONS[0]

  const dailyEngagement = useMemo(() => {
    if (!data) return []
    return data.trends.averageScoreOverTime.map((row, index) => ({
      label: row.label,
      attempts: data.trends.attemptsOverTime[index]?.value || 0,
      average: row.average
    }))
  }, [data])

  const renderSelectedChart = () => {
    if (!data) return null
    if (!gaData) return null

    const t = data.trends
    const dist = data.distributions
    const pp = data.perProblem

    switch (selectedChart) {
      case 'area':
        return (
          <AreaChart data={t.playersOverTime}>
            <defs>
              <linearGradient id="gradPlayers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2f6fb2" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#2f6fb2" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,111,178,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6a8ab8' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#6a8ab8' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" name="Players" stroke="#2f6fb2" strokeWidth={2.5} fill="url(#gradPlayers)" />
          </AreaChart>
        )

      case 'line':
        return (
          <LineChart data={t.averageScoreOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,111,178,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6a8ab8' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#6a8ab8' }} width={30} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="average" name="Avg score" stroke="#1a3a6b" strokeWidth={2.5} dot={false} />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={t.hintsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,111,178,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6a8ab8' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#6a8ab8' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(131,180,247,0.12)' }} />
            <Bar dataKey="value" name="Hints" fill="#83b4f7" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart data={dailyEngagement}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,111,178,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6a8ab8' }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" dataKey="attempts" tick={{ fontSize: 11, fill: '#6a8ab8' }} width={34} />
            <YAxis yAxisId="right" orientation="right" dataKey="average" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6a8ab8' }} width={36} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(131,180,247,0.12)' }} />
            <Legend verticalAlign="top" iconType="circle" iconSize={9} />
            <Bar yAxisId="left" dataKey="attempts" name="Attempts" fill="#2f6fb2" radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Line yAxisId="right" type="monotone" dataKey="average" name="Avg score" stroke="#1a3a6b" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        )

      case 'donut':
        return (
          <PieChart>
            <Pie data={dist.activeVsRegistered} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={2} label={(p) => `${Math.round(p.percent * 100)}%`}>
              {dist.activeVsRegistered.map((entry, index) => (
                <Cell key={entry.label} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} players`} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
          </PieChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie data={dist.playerStatusSplit} dataKey="value" nameKey="label" outerRadius={110} label={(p) => `${Math.round(p.percent * 100)}%`}>
              {dist.playerStatusSplit.map((entry, index) => (
                <Cell key={entry.label} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} players`} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
          </PieChart>
        )

      case 'radar':
        return (
          <RadarChart data={data.averageScoreByCategory} outerRadius={130}>
            <PolarGrid stroke="rgba(47,111,178,0.2)" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#1a3a6b' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: '#6a8ab8' }} angle={30} domain={[0, 100]} />
            <Radar name="Average" dataKey="average" stroke="#2f6fb2" fill="#2f6fb2" fillOpacity={0.4} strokeWidth={2.5} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        )

      case 'radial':
        return (
          <RadialBarChart innerRadius="18%" outerRadius="100%" data={pp.coinsByProblem} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="coins" name="Coins" cornerRadius={7} background={{ fill: 'rgba(47,111,178,0.1)' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
          </RadialBarChart>
        )

      case 'scatter':
        return (
          <ScatterChart margin={{ top: 12, right: 20, bottom: 34, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,111,178,0.12)" />
            <XAxis type="number" dataKey="x" name="Attempts" tick={{ fontSize: 11, fill: '#6a8ab8' }} label={{ value: 'Attempts', position: 'insideBottom', offset: -24, fill: '#6a8ab8', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="Average score" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6a8ab8' }} width={36} />
            <ZAxis type="number" range={[90, 420]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data.averageScoreByProblem.map((row) => ({ name: row.title, x: row.count, y: row.average }))} fill="#2f6fb2" />
          </ScatterChart>
        )

      case 'funnel':
        return (
          <FunnelChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Funnel dataKey="value" data={dist.conversionFunnel} isAnimationActive>
              <LabelList position="right" fill="#191817" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        )

      case 'treemap':
        return (
          <Treemap
            data={data.mostUsedAiCards.map((row) => ({ name: row.title, size: row.count }))}
            dataKey="size"
            nameKey="name"
            stroke="#ffffff"
            fill="#2f6fb2"
            content={<TreemapContent />}
          />
        )

      case 'map':
        return (
          <PlayerLocationMap markers={data.playerLocations?.markers || []} />
        )

      case 'google':
        return <GoogleAnalyticsOverview gaData={gaData} />

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="adaPage">
        <style>{dashboardCss}</style>
        <div className="adaPanel">
          <p className="adaEyebrow">Analytics dashboard</p>
          <h2 className="adaTitle">GRIT Lab Africa learning analytics</h2>
          <p className="adaMuted">Loading analytics from the system...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="adaPage">
        <style>{dashboardCss}</style>
        <div className="adaPanel">
          <p className="adaEyebrow">Analytics dashboard</p>
          <h2 className="adaTitle">Learning analytics could not load</h2>
          <p className="adaMuted">{error}</p>
          <button type="button" className="adaButton" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="adaPage">
      <style>{dashboardCss}</style>

      <header className="adaHeader">
        <div>
          <p className="adaEyebrow">Analytics dashboard</p>
          <h2 className="adaTitle">GRIT Lab Africa Learning Analytics</h2>
          <p className="adaMuted">
            {data.metrics.registeredPlayers} registered players · {data.metrics.attempts} attempts ·{' '}
            {data.metrics.certificatesIssued} certificates · generated {formatDate(generatedAt)}
          </p>
        </div>

        <div className="adaHeaderActions">
          {adminUser?.email ? <span className="adaSignedIn">{adminUser.email}</span> : null}
          <button type="button" className="adaButton" onClick={loadData}>
            Refresh
          </button>
          <button type="button" className="adaSignOut" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <MetricStrip metrics={data.metrics} />

      <div className="adaPanel">
        <p className="adaEyebrow">Player summary</p>
        <h3 className="adaSectionTitle">All players at a glance</h3>

        {data.topPlayers.length === 0 ? (
          <p className="adaMuted">No player activity recorded yet.</p>
        ) : (
          <div className="adaTableWrap">
            <table className="adaTable">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Completed</th>
                  <th>Avg</th>
                  <th>Best</th>
                  <th>Coins</th>
                  <th>Attempts</th>
                  <th>Certificate</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {data.topPlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="adaName">{player.name}</td>
                    <td>{player.email || '—'}</td>
                    <td>
                      <span className={`adaStatus adaStatus-${player.status.toLowerCase()}`}>
                        {player.status}
                      </span>
                    </td>
                    <td>{player.completed}</td>
                    <td>{player.average}</td>
                    <td>{player.best}</td>
                    <td>{player.coins}</td>
                    <td>{player.attempts}</td>
                    <td>{player.certificate}</td>
                    <td>{formatDate(player.lastLogin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="adaPicker">
        <label className="adaPickerLabel" htmlFor="adaChartSelect">
          Select a chart
        </label>
        <select
          id="adaChartSelect"
          className="adaPickerSelect"
          value={selectedChart}
          onChange={(event) => setSelectedChart(event.target.value)}
        >
          {CHART_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div key={selectedOption.id} className="adaChartAnimate">
        {selectedOption.id === 'google' ? (
          <div className="adaPanel">
            <p className="adaChartEyebrow">Google Analytics (Firebase)</p>
            <h3 className="adaChartTitle">{selectedOption.label}</h3>
            <p className="adaChartDesc">{selectedOption.description}</p>
            <div className="adaChartBody">{renderSelectedChart()}</div>
          </div>
        ) : selectedOption.id === 'map' ? (
          <ChartCard
            title={selectedOption.label}
            shape={selectedOption.shape}
            description={selectedOption.description}
          >
            {renderSelectedChart()}
          </ChartCard>
        ) : (
          <ChartCard
            title={selectedOption.label}
            shape={selectedOption.shape}
            description={selectedOption.description}
          >
            <ResponsiveContainer width="100%" height={360}>
              {renderSelectedChart()}
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(47, 111, 178, 0.2)',
  background: 'rgba(255, 255, 255, 0.97)',
  color: '#191817',
  fontSize: '0.82rem',
  fontWeight: 750,
  boxShadow: '0 12px 30px rgba(47, 111, 178, 0.14)'
}

const dashboardCss = `
  .adaPage {
    font-family: inherit;
    padding: 8px;
    background:
      radial-gradient(circle at top right, rgba(131, 180, 247, 0.22), transparent 26rem),
      radial-gradient(circle at bottom left, rgba(47, 111, 178, 0.1), transparent 30rem),
      #f6f8fc;
    min-height: 100vh;
    border-radius: 24px;
  }

  .adaHeader {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }

  .adaEyebrow {
    margin: 0 0 8px;
    color: #2f6fb2;
    font-size: 0.74rem;
    font-weight: 850;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .adaTitle {
    margin: 0 0 8px;
    color: #191817;
    font-size: clamp(1.5rem, 3vw, 2.6rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  .adaMuted { margin: 0; color: #5a6b8c; line-height: 1.6; }

  .adaHeaderActions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .adaSignedIn {
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(47, 111, 178, 0.18);
    color: #2f6fb2;
    font-size: 0.78rem;
    font-weight: 850;
  }

  .adaButton {
    border: 1px solid rgba(47, 111, 178, 0.24);
    border-radius: 999px;
    padding: 11px 18px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.8);
    color: #2f6fb2;
    font-weight: 850;
  }

  .adaSignOut {
    border: 0;
    border-radius: 999px;
    padding: 11px 18px;
    cursor: pointer;
    font-weight: 850;
    background: linear-gradient(135deg, #2f6fb2, #1a3a6b);
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(47, 111, 178, 0.24);
  }

  .adaMetricGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 14px;
    margin-bottom: 22px;
  }

  .adaMetricCard {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(47, 111, 178, 0.16);
    box-shadow: 0 14px 34px rgba(47, 111, 178, 0.1);
  }

  .adaMetricIcon { font-size: 1.5rem; }

  .adaMetricValue {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 950;
    color: #191817;
    line-height: 1;
  }

  .adaMetricLabel {
    margin: 4px 0 0;
    color: #5a6b8c;
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .adaPanel {
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(47, 111, 178, 0.16);
    box-shadow: 0 16px 40px rgba(47, 111, 178, 0.1);
  }

  .adaSectionTitle {
    margin: 0 0 16px;
    color: #191817;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  .adaTableWrap { width: 100%; overflow-x: auto; }

  .adaTable { width: 100%; border-collapse: collapse; min-width: 920px; }

  .adaTable th {
    padding: 12px 14px;
    text-align: left;
    color: #2f6fb2;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(47, 111, 178, 0.2);
    background: rgba(131, 180, 247, 0.18);
  }

  .adaTable td {
    padding: 13px 14px;
    color: #191817;
    border-bottom: 1px solid rgba(47, 111, 178, 0.12);
    font-size: 0.86rem;
  }

  .adaName { font-weight: 850; color: #191817; }

  .adaStatus {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 850;
    text-transform: capitalize;
  }

  .adaStatus-active { background: rgba(63, 118, 74, 0.16); color: #2f6b3c; }
  .adaStatus-inactive { background: rgba(153, 27, 27, 0.12); color: #991b1b; }

  .adaPicker {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 22px 0;
    flex-wrap: wrap;
  }

  .adaPickerLabel {
    color: #2f6fb2;
    font-weight: 850;
    font-size: 0.9rem;
  }

  .adaPickerSelect {
    flex: 1;
    min-width: 280px;
    max-width: 520px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(47, 111, 178, 0.24);
    background: rgba(255, 255, 255, 0.9);
    color: #191817;
    font-weight: 750;
    outline: none;
    box-shadow: 0 10px 26px rgba(47, 111, 178, 0.08);
  }

  .adaChartCard {
    padding: 22px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(47, 111, 178, 0.16);
    box-shadow: 0 16px 40px rgba(47, 111, 178, 0.12);
  }

  .adaChartHead {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .adaChartEyebrow {
    margin: 0 0 6px;
    color: #2f6fb2;
    font-size: 0.68rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .adaChartTitle {
    margin: 0;
    color: #191817;
    font-size: 1.1rem;
    letter-spacing: -0.02em;
  }

  .adaChartShape {
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(131, 180, 247, 0.28);
    color: #2f6fb2;
    font-size: 0.7rem;
    font-weight: 850;
    white-space: nowrap;
  }

  .adaChartDesc {
    margin: 10px 0 16px;
    color: #5a6b8c;
    font-size: 0.86rem;
    line-height: 1.55;
  }

  .adaChartBody { position: relative; }

  .adaChartAnimate {
    animation: adaFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes adaFadeIn {
    from { opacity: 0; transform: translateY(16px) scale(0.99); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .adaGaColumns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .adaGaList {
    padding: 20px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(47, 111, 178, 0.14);
  }

  .adaGaListTitle {
    margin: 0 0 14px;
    color: #191817;
    font-size: 1rem;
    letter-spacing: -0.02em;
  }

  .adaGaRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 40px;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
  }

  .adaGaRowLabel {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #191817;
    font-size: 0.84rem;
    font-weight: 750;
  }

  .adaGaBarTrack {
    height: 9px;
    border-radius: 999px;
    background: rgba(47, 111, 178, 0.12);
    overflow: hidden;
  }

  .adaGaBar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #83b4f7, #2f6fb2);
  }

  .adaGaBarBlue {
    background: linear-gradient(90deg, #83b4f7, #2f6fb2);
  }

  .adaGaBarDeep {
    background: linear-gradient(90deg, #2f6fb2, #1a3a6b);
  }

  .adaGaRowCount {
    text-align: right;
    color: #2f6fb2;
    font-weight: 900;
    font-size: 0.84rem;
  }

  .adaMapWrap {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(47, 111, 178, 0.18);
    box-shadow: 0 10px 28px rgba(47, 111, 178, 0.1);
    background: #eaf0f8;
  }

  .adaMapCanvas {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 18px;
    background: #eaf0f8;
  }

  .adaMapCanvas .leaflet-container {
    width: 100%;
    height: 100%;
    font-family: inherit;
    border-radius: 18px;
  }

  .adaMapStatus {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 24px;
    background: rgba(246, 248, 252, 0.92);
  }

  .adaMapStatusTitle {
    margin: 0 0 6px;
    color: #191817;
    font-weight: 850;
    font-size: 1rem;
  }

  .adaMapStatusSub {
    margin: 0;
    color: #5a6b8c;
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .adaMapPin {
    background: transparent;
    border: 0;
  }

  .adaMapPopTitle {
    margin: 0 0 4px;
    color: #191817;
    font-weight: 850;
    font-size: 0.95rem;
  }

  .adaMapPopSub {
    margin: 0 0 8px;
    color: #5a6b8c;
    font-size: 0.82rem;
  }

  .adaMapRow {
    padding: 3px 0;
    color: #2f6fb2;
    font-size: 0.84rem;
    font-weight: 750;
  }

  @keyframes adaPinPulse {
    0% { opacity: 0.85; }
    70% { opacity: 0.15; }
    100% { opacity: 0; }
  }

  @media (max-width: 900px) {
    .adaGaColumns { grid-template-columns: 1fr; }
  }
`

export default AdminAnalyticsDashboard
