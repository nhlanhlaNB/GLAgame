import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getAdminAnalyticsDashboardData } from '../../services/admin/adminAnalyticsService'
import {
  getSavedAdminSession,
  onAdminAuthStateChanged
} from '../../services/admin/adminAuthService'

const PALETTE = ['#9a6a22', '#5c3512', '#d9a441', '#e8b96a', '#7c5a1e', '#b98a44', '#f0c987', '#8a6a3a']

function formatDate(millis) {
  if (!millis) return '—'
  return new Date(millis).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="adaChartCard">
      <p className="adaChartEyebrow">{subtitle || 'Analytics'}</p>
      <h3 className="adaChartTitle">{title}</h3>
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
    { label: 'Completion Rate', value: metrics.completionRate, icon: '🏁' },
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

function DonutChartCard({ title, subtitle, data, centerLabel }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="adaDonutWrap">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              label={(props) => `${Math.round(props.percent * 100)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.label}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} players`} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel ? <p className="adaDonutCenter">{centerLabel}</p> : null}
      </div>
    </ChartCard>
  )
}

function AdminAnalyticsDashboard() {
  const [isAdmin, setIsAdmin] = useState(() => Boolean(getSavedAdminSession()))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState(null)

  useEffect(() => {
    if (!getSavedAdminSession()) {
      window.location.replace('/admin')
      return undefined
    }

    const unsubscribe = onAdminAuthStateChanged((session) => {
      setIsAdmin(Boolean(session))
      if (!session) {
        window.location.replace('/admin')
      }
    })

    return unsubscribe
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const result = await getAdminAnalyticsDashboardData()
      setData(result)
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

  const charts = useMemo(() => {
    if (!data) return []

    const d = data
    const m = d.metrics
    const t = d.trends
    const dist = d.distributions
    const pp = d.perProblem

    return [
      {
        id: 'players-trend',
        span: 'wide',
        title: 'Player Registrations',
        subtitle: 'New players per day · last 30 days',
        render: (
          <AreaChart data={t.playersOverTime}>
            <defs>
              <linearGradient id="gradPlayers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9a6a22" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#9a6a22" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a6a3a' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" name="Players" stroke="#9a6a22" strokeWidth={2.5} fill="url(#gradPlayers)" />
          </AreaChart>
        )
      },
      {
        id: 'attempts-trend',
        span: 'wide',
        title: 'Attempts Over Time',
        subtitle: 'Solutions submitted per day · last 30 days',
        render: (
          <AreaChart data={t.attemptsOverTime}>
            <defs>
              <linearGradient id="gradAttempts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5c3512" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#5c3512" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a6a3a' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" name="Attempts" stroke="#5c3512" strokeWidth={2.5} fill="url(#gradAttempts)" />
          </AreaChart>
        )
      },
      {
        id: 'hints-trend',
        span: 'wide',
        title: 'Hints Requested',
        subtitle: 'Hint requests per day · last 30 days',
        render: (
          <BarChart data={t.hintsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a6a3a' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="value" name="Hints" fill="#d9a441" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        )
      },
      {
        id: 'coins-trend',
        span: 'wide',
        title: 'GLA Coins Earned',
        subtitle: 'Total coins awarded per day · last 30 days',
        render: (
          <AreaChart data={t.coinsOverTime}>
            <defs>
              <linearGradient id="gradCoins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b98a44" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#b98a44" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a6a3a' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" name="Coins" stroke="#b98a44" strokeWidth={2.5} fill="url(#gradCoins)" />
          </AreaChart>
        )
      },
      {
        id: 'avg-score-trend',
        span: 'wide',
        title: 'Average Score Trend',
        subtitle: 'Average solution score per day · last 30 days',
        render: (
          <LineChart data={t.averageScoreOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a6a3a' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="average" name="Avg score" stroke="#5c3512" strokeWidth={2.5} dot={false} />
          </LineChart>
        )
      },
      {
        id: 'score-distribution',
        span: 'wide',
        title: 'Score Distribution',
        subtitle: 'Attempts grouped by score band (0-100)',
        render: (
          <BarChart data={dist.scoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#8a6a3a' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="count" name="Attempts" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {dist.scoreDistribution.map((entry, index) => (
                <Cell key={entry.range} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        )
      },
      {
        id: 'most-selected',
        span: 'wide',
        title: 'Most Selected Problem Cards',
        subtitle: 'Top 10 problems by selections',
        render: (
          <BarChart layout="vertical" data={d.mostSelectedProblems} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#8a6a3a' }} />
            <YAxis type="category" dataKey="title" width={210} tick={{ fontSize: 11, fill: '#5c3512' }} tickFormatter={(value) => (value.length > 26 ? `${value.slice(0, 26)}…` : value)} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="count" name="Selections" fill="#9a6a22" radius={[0, 6, 6, 0]} maxBarSize={18} />
          </BarChart>
        )
      },
      {
        id: 'most-used-ai',
        span: 'wide',
        title: 'Most Used AI Cards',
        subtitle: 'Top 10 AI cards by usage',
        render: (
          <BarChart layout="vertical" data={d.mostUsedAiCards} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#8a6a3a' }} />
            <YAxis type="category" dataKey="title" width={210} tick={{ fontSize: 11, fill: '#5c3512' }} tickFormatter={(value) => (value.length > 26 ? `${value.slice(0, 26)}…` : value)} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="count" name="Uses" fill="#d9a441" radius={[0, 6, 6, 0]} maxBarSize={18} />
          </BarChart>
        )
      },
      {
        id: 'combinations',
        span: 'wide',
        title: 'Common AI Card Combinations',
        subtitle: 'Top 10 AI card combos used together',
        render: (
          <BarChart layout="vertical" data={d.commonCombinations} margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#8a6a3a' }} />
            <YAxis type="category" dataKey="combination" width={240} tick={{ fontSize: 11, fill: '#5c3512' }} tickFormatter={(value) => (value.length > 30 ? `${value.slice(0, 30)}…` : value)} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="count" name="Uses" fill="#7c5a1e" radius={[0, 6, 6, 0]} maxBarSize={18} />
          </BarChart>
        )
      },
      {
        id: 'avg-by-problem',
        span: 'wide',
        title: 'Average Score Per Problem',
        subtitle: 'Average score per problem card · top 10',
        render: (
          <BarChart data={d.averageScoreByProblem} margin={{ bottom: 40, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#5c3512' }} angle={-32} textAnchor="end" height={72} interval={0} tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)} />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="average" name="Average" fill="#9a6a22" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        )
      },
      {
        id: 'coins-by-problem',
        span: 'wide',
        title: 'GLA Coins Per Problem',
        subtitle: 'Average coins earned per problem card · top 10',
        render: (
          <BarChart data={pp.coinsByProblem} margin={{ bottom: 40, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#5c3512' }} angle={-32} textAnchor="end" height={72} interval={0} tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)} />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="coins" name="Coins" fill="#b98a44" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        )
      },
      {
        id: 'hints-by-problem',
        span: 'wide',
        title: 'Hints Per Problem',
        subtitle: 'Hint requests by problem card · top 10',
        render: (
          <BarChart data={pp.hintsByProblem} margin={{ bottom: 40, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,53,18,0.12)" vertical={false} />
            <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#5c3512' }} angle={-32} textAnchor="end" height={72} interval={0} tickFormatter={(value) => (value.length > 18 ? `${value.slice(0, 18)}…` : value)} />
            <YAxis tick={{ fontSize: 11, fill: '#8a6a3a' }} width={30} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,164,65,0.12)' }} />
            <Bar dataKey="count" name="Hints" fill="#d9a441" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        )
      },
      {
        id: 'score-category-radar',
        span: 'wide',
        title: 'Scoring Category Profile',
        subtitle: 'Average score across scoring categories',
        render: (
          <RadarChart data={d.averageScoreByCategory} outerRadius={120}>
            <PolarGrid stroke="rgba(92,53,18,0.2)" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#5c3512' }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: '#8a6a3a' }} angle={30} domain={[0, 100]} />
            <Radar name="Average" dataKey="average" stroke="#9a6a22" fill="#9a6a22" fillOpacity={0.4} strokeWidth={2.5} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        )
      },
      {
        id: 'active-registered',
        span: 'half',
        title: 'Registered vs Active',
        subtitle: 'Active player share',
        centerLabel: `${m.registeredPlayers > 0 ? Math.round((m.activePlayers / m.registeredPlayers) * 100) : 0}% active`,
        donut: true,
        data: dist.activeVsRegistered
      },
      {
        id: 'completion',
        span: 'half',
        title: 'Completion Rate',
        subtitle: 'Players who completed 10+ problems',
        centerLabel: `${m.completionRateValue}%`,
        donut: true,
        data: dist.completionSplit
      },
      {
        id: 'replay',
        span: 'half',
        title: 'Replay Rate',
        subtitle: 'Players who replayed a problem',
        centerLabel: `${m.replayRateValue}%`,
        donut: true,
        data: dist.replaySplit
      },
      {
        id: 'certificates',
        span: 'half',
        title: 'Certificates',
        subtitle: 'Issued vs pending certificates',
        centerLabel: `${m.certificatesIssued} issued`,
        donut: true,
        data: dist.certificateSplit
      },
      {
        id: 'player-status',
        span: 'half',
        title: 'Player Status',
        subtitle: 'Active vs inactive accounts',
        centerLabel: `${m.activePlayers} active`,
        donut: true,
        data: dist.playerStatusSplit
      }
    ]
  }, [data])

  const rendered = charts.map((chart) => {
    if (chart.donut) {
      return (
        <div key={chart.id} className={chart.span === 'half' ? 'adaHalf' : 'adaFull'}>
          <DonutChartCard
            title={chart.title}
            subtitle={chart.subtitle}
            data={chart.data}
            centerLabel={chart.centerLabel}
          />
        </div>
      )
    }

    return (
      <div key={chart.id} className={chart.span === 'half' ? 'adaHalf' : 'adaFull'}>
        <ChartCard title={chart.title} subtitle={chart.subtitle}>
          <ResponsiveContainer width="100%" height={300}>
            {chart.render}
          </ResponsiveContainer>
        </ChartCard>
      </div>
    )
  })

  if (!isAdmin) {
    return null
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
          <h1 className="adaHeaderTitle">GRIT Lab Africa Learning Analytics</h1>
          <p className="adaMuted">
            {data.metrics.registeredPlayers} registered players · {data.metrics.attempts} attempts ·{' '}
            {data.metrics.certificatesIssued} certificates · generated {formatDate(generatedAt)}
          </p>
        </div>

        <div className="adaHeaderActions">
          <button type="button" className="adaButton" onClick={loadData}>
            Refresh
          </button>
          <a href="/admin" className="adaBackLink">
            ← Back to Admin
          </a>
        </div>
      </header>

      <MetricStrip metrics={data.metrics} />

      <div className="adaGrid">
        {rendered}
      </div>

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
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(139, 92, 40, 0.2)',
  background: 'rgba(255, 248, 235, 0.96)',
  color: '#3b2817',
  fontSize: '0.82rem',
  fontWeight: 750,
  boxShadow: '0 12px 30px rgba(80, 52, 20, 0.14)'
}

const dashboardCss = `
  .adaPage {
    min-height: 100vh;
    padding: 30px;
    background:
      radial-gradient(circle at top left, rgba(244, 210, 138, 0.22), transparent 30rem),
      linear-gradient(135deg, rgba(255, 248, 235, 0.94), rgba(232, 214, 170, 0.7));
    font-family: inherit;
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
    color: #9a6a22;
    font-size: 0.74rem;
    font-weight: 850;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .adaHeaderTitle {
    margin: 0 0 8px;
    color: #4b2b10;
    font-size: clamp(1.7rem, 3.4vw, 3rem);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .adaTitle {
    margin: 0 0 10px;
    color: #4b2b10;
    font-size: clamp(1.5rem, 3vw, 2.6rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  .adaMuted {
    margin: 0;
    color: #7a6248;
    line-height: 1.6;
  }

  .adaHeaderActions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .adaButton {
    border: 1px solid rgba(139, 92, 40, 0.22);
    border-radius: 999px;
    padding: 11px 18px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.72);
    color: #5c3512;
    font-weight: 850;
  }

  .adaBackLink {
    border-radius: 999px;
    padding: 11px 18px;
    background: linear-gradient(135deg, #9a6a22, #5c3512);
    color: #fff8eb;
    text-decoration: none;
    font-weight: 850;
    box-shadow: 0 12px 28px rgba(92, 53, 18, 0.24);
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
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(139, 92, 40, 0.16);
    box-shadow: 0 14px 34px rgba(80, 52, 20, 0.1);
  }

  .adaMetricIcon {
    font-size: 1.5rem;
  }

  .adaMetricValue {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 950;
    color: #4b2b10;
    line-height: 1;
  }

  .adaMetricLabel {
    margin: 4px 0 0;
    color: #7a6248;
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .adaGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .adaFull {
    grid-column: 1 / -1;
  }

  .adaChartCard {
    height: 100%;
    padding: 20px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(139, 92, 40, 0.16);
    box-shadow: 0 16px 40px rgba(80, 52, 20, 0.1);
  }

  .adaChartEyebrow {
    margin: 0 0 6px;
    color: #9a6a22;
    font-size: 0.68rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .adaChartTitle {
    margin: 0 0 14px;
    color: #4b2b10;
    font-size: 1.06rem;
    letter-spacing: -0.02em;
  }

  .adaChartBody {
    position: relative;
  }

  .adaDonutWrap {
    position: relative;
  }

  .adaDonutCenter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -58%);
    margin: 0;
    color: #5c3512;
    font-weight: 950;
    font-size: 1.05rem;
    pointer-events: none;
    text-align: center;
  }

  .adaPanel {
    margin-top: 22px;
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(139, 92, 40, 0.16);
    box-shadow: 0 16px 40px rgba(80, 52, 20, 0.1);
  }

  .adaSectionTitle {
    margin: 0 0 16px;
    color: #4b2b10;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  .adaTableWrap {
    width: 100%;
    overflow-x: auto;
  }

  .adaTable {
    width: 100%;
    border-collapse: collapse;
    min-width: 920px;
  }

  .adaTable th {
    padding: 12px 14px;
    text-align: left;
    color: #5c3512;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(139, 92, 40, 0.2);
    background: rgba(244, 210, 138, 0.22);
  }

  .adaTable td {
    padding: 13px 14px;
    color: #3b2817;
    border-bottom: 1px solid rgba(139, 92, 40, 0.12);
    font-size: 0.86rem;
  }

  .adaName {
    font-weight: 850;
    color: #4b2b10;
  }

  .adaStatus {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 850;
    text-transform: capitalize;
  }

  .adaStatus-active {
    background: rgba(63, 118, 74, 0.16);
    color: #2f6b3c;
  }

  .adaStatus-inactive {
    background: rgba(153, 27, 27, 0.12);
    color: #991b1b;
  }

  @media (max-width: 1100px) {
    .adaGrid { grid-template-columns: 1fr; }
  }

  @media (max-width: 620px) {
    .adaPage { padding: 16px; }
    .adaHeader { flex-direction: column; }
  }
`

export default AdminAnalyticsDashboard
