import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getAdminAnalyticsDashboardData } from '../../services/admin/adminAnalyticsService'
import PlayerLocationMap from './PlayerLocationMap'

const PALETTE = ['#2f6fb2', '#83b4f7', '#1a3a6b', '#5b9ad9', '#9cc3ef', '#37618f', '#b8d3f2', '#6a8ab8']

const GREEN = '#2f9e63'
const AMBER = '#e8a33d'
const RED = '#e0524a'

const FUNNEL_COLORS = ['#2f6fb2', '#5b9ad9', '#83b4f7', '#b8d3f2']

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

function ProblemCard({ number, icon, title, question, insight, insightTone = 'default', children }) {
  return (
    <div className="adaProblemCard">
      <div className="adaProblemHead">
        <span className="adaProblemIcon">{icon}</span>
        <div>
          <p className="adaProblemQuestion">{question}</p>
          <h3 className="adaProblemTitle">
            {number}. {title}
          </h3>
        </div>
      </div>
      <p className={`adaProblemInsight adaInsight-${insightTone}`}>{insight}</p>
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

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(47, 111, 178, 0.2)',
  background: 'rgba(255, 255, 255, 0.97)',
  color: '#191817',
  fontSize: '0.82rem',
  fontWeight: 750,
  boxShadow: '0 12px 30px rgba(47, 111, 178, 0.14)'
}

function AdminAnalyticsDashboard({ adminUser, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState(null)

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

  const insights = useMemo(() => {
    if (!data) return {}

    const funnel = data.distributions.conversionFunnel || []
    let worstDrop = { pct: 0, from: '', to: '' }
    for (let i = 1; i < funnel.length; i += 1) {
      const from = funnel[i - 1].value || 0
      const to = funnel[i].value || 0
      const pct = from ? Math.round(((from - to) / from) * 100) : 0
      if (pct > worstDrop.pct) {
        worstDrop = { pct, from: funnel[i - 1].name, to: funnel[i].name }
      }
    }

    const problems = [...(data.averageScoreByProblem || [])].sort(
      (a, b) => (a.average || 0) - (b.average || 0)
    )
    const hardestProblem = problems[0]

    const hintsPerAttempt =
      data.metrics.attempts > 0
        ? (data.metrics.hintsRequested / data.metrics.attempts).toFixed(2)
        : '0.00'

    const categories = [...(data.averageScoreByCategory || [])].sort(
      (a, b) => (a.average || 0) - (b.average || 0)
    )
    const weakestCategory = categories[0]

    const topProblem = data.mostSelectedProblems?.[0]
    const topAiCard = data.mostUsedAiCards?.[0]

    const attemptsSeries = data.trends.attemptsOverTime || []
    const firstAttempts = attemptsSeries[0]?.value || 0
    const lastAttempts = attemptsSeries[attemptsSeries.length - 1]?.value || 0
    const engagementDir =
      attemptsSeries.length < 2
        ? 'stable'
        : lastAttempts > firstAttempts
          ? 'up'
          : lastAttempts < firstAttempts
            ? 'down'
            : 'stable'

    return {
      worstDrop,
      hardestProblem,
      hintsPerAttempt,
      weakestCategory,
      topProblem,
      topAiCard,
      engagementDir,
      totalPlayers: data.metrics.registeredPlayers,
      completionRate: data.metrics.completionRateValue,
      replayRate: data.metrics.replayRateValue,
      certificateCount: data.metrics.certificatesIssued
    }
  }, [data])

  const dailyEngagement = useMemo(() => {
    if (!data) return []
    return data.trends.averageScoreOverTime.map((row, index) => ({
      label: row.label,
      attempts: data.trends.attemptsOverTime[index]?.value || 0,
      average: row.average
    }))
  }, [data])

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

  const funnelData = (data.distributions.conversionFunnel || []).map((entry) => ({
    status: entry.name,
    count: entry.value || 0
  }))
  const replaySplit = data.distributions.replaySplit || []
  const hintSeries = data.trends.hintsOverTime || []
  const categoryData = data.averageScoreByCategory || []
  const selectedProblems = data.mostSelectedProblems || []
  const aiCardUsage = data.mostUsedAiCards || []
  const problemsSorted = [...(data.averageScoreByProblem || [])].sort(
    (a, b) => (a.average || 0) - (b.average || 0)
  )
  const replayRate = insights.replayRate || 0

  return (
    <div className="adaPage">
      <style>{dashboardCss}</style>

      <header className="adaHeader">
        <div>
          <p className="adaEyebrow">Problem-focused analytics dashboard</p>
          <h2 className="adaTitle">GRIT Lab Africa Learning Analytics</h2>
          <p className="adaMuted">
            Every chart answers a learning problem so issues can be spotted and fixed. Generated{' '}
            {formatDate(generatedAt)}
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

      <div className="adaProblemGrid">
        {/* 1. Where do players drop off in the learning journey? */}
        <ProblemCard
          number={1}
          icon="🎓"
          title="Learning Journey Drop-off"
          question="Where do players lose momentum on the way to certification?"
          insight={
            insights.worstDrop?.pct > 0
              ? `Biggest drop: ${insights.worstDrop.from} → ${insights.worstDrop.to} (−${insights.worstDrop.pct}%)`
              : 'No drop detected between journey stages.'
          }
          insightTone={insights.worstDrop?.pct > 0 ? 'warn' : 'good'}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(47,111,178,0.12)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis
                dataKey="status"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={110}
                fill="#6a8ab8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={26}>
                {funnelData.map((entry, index) => (
                  <Cell key={entry.status} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 2. Which problems are hardest for players? */}
        <ProblemCard
          number={2}
          icon="🧩"
          title="Hardest Problem Cards"
          question="Which problems do players score lowest on?"
          insight={
            insights.hardestProblem
              ? `Hardest: "${insights.hardestProblem.title}" at ${insights.hardestProblem.average}% average`
              : 'No scored submissions yet.'
          }
          insightTone={insights.hardestProblem && insights.hardestProblem.average < 50 ? 'danger' : 'warn'}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={problemsSorted.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(47,111,178,0.12)" />
              <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis
                dataKey="title"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={130}
                fill="#6a8ab8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="average" name="Avg score" radius={[0, 8, 8, 0]} maxBarSize={22}>
                {problemsSorted.slice(0, 8).map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.average >= 70 ? GREEN : entry.average >= 50 ? AMBER : RED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 3. Do players come back and replay? */}
        <ProblemCard
          number={3}
          icon="🔁"
          title="Replay & Retention"
          question="How many players come back to play problems more than once?"
          insight={
            replayRate > 0
              ? `${replayRate}% of players replayed at least one problem.`
              : 'No replay activity recorded yet.'
          }
          insightTone={replayRate >= 40 ? 'good' : replayRate > 0 ? 'warn' : 'default'}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={replaySplit}
                dataKey="value"
                nameKey="label"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                label={(props) => `${props.label} (${props.percent}%)`}
              >
                {replaySplit.map((entry, index) => (
                  <Cell key={entry.label} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} players`} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
            </PieChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 4. How dependent are players on hints? */}
        <ProblemCard
          number={4}
          icon="💡"
          title="Hint Dependency"
          question="Are players relying on hints too heavily to solve problems?"
          insight={
            data.metrics.attempts > 0
              ? `On average each attempt uses ${insights.hintsPerAttempt} hint(s).`
              : 'No attempts recorded yet.'
          }
          insightTone={Number(insights.hintsPerAttempt) > 2 ? 'danger' : Number(insights.hintsPerAttempt) > 1 ? 'warn' : 'good'}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hintSeries} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradHints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#83b4f7" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#83b4f7" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(47,111,178,0.12)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="value"
                name="Hints"
                stroke="#2f6fb2"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#gradHints)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 5. Which scoring skills are weakest? */}
        <ProblemCard
          number={5}
          icon="📐"
          title="Scoring Category Profile"
          question="Which AI-thinking skills do players score weakest on?"
          insight={
            insights.weakestCategory
              ? `Weakest skill: ${insights.weakestCategory.category} (${insights.weakestCategory.average}% avg)`
              : 'No scored categories yet.'
          }
          insightTone={
            insights.weakestCategory && insights.weakestCategory.average < 50 ? 'danger' : 'warn'
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={categoryData} outerRadius={120}>
              <PolarGrid stroke="rgba(47,111,178,0.2)" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#1a3a6b' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#6a8ab8' }} angle={30} domain={[0, 100]} />
              <Radar
                name="Average"
                dataKey="average"
                stroke="#2f6fb2"
                fill="#2f6fb2"
                fillOpacity={0.35}
                strokeWidth={2.5}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={9} />
            </RadarChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 6. Which problems get picked the most? */}
        <ProblemCard
          number={6}
          icon="📌"
          title="Most Selected Problems"
          question="Which problem cards are players choosing most often?"
          insight={
            insights.topProblem
              ? `Top pick: "${insights.topProblem.title}" (${insights.topProblem.count} selections)`
              : 'No problem selections recorded yet.'
          }
          insightTone="good"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={selectedProblems.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(47,111,178,0.12)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis
                dataKey="title"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={130}
                fill="#6a8ab8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Selections" radius={[0, 8, 8, 0]} maxBarSize={22}>
                {selectedProblems.slice(0, 8).map((entry, index) => (
                  <Cell key={entry.id} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 7. Which AI cards do players use most? */}
        <ProblemCard
          number={7}
          icon="🤖"
          title="Most Used AI Cards"
          question="Which AI capabilities are players applying most in their solutions?"
          insight={
            insights.topAiCard
              ? `Most used: "${insights.topAiCard.title}" (${insights.topAiCard.count} uses)`
              : 'No AI card usage recorded yet.'
          }
          insightTone="good"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiCardUsage.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(47,111,178,0.12)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis
                dataKey="title"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={130}
                fill="#6a8ab8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Uses" radius={[0, 8, 8, 0]} maxBarSize={22}>
                {aiCardUsage.slice(0, 8).map((entry, index) => (
                  <Cell key={entry.id} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ProblemCard>

        {/* 8. Is engagement growing? */}
        <ProblemCard
          number={8}
          icon="📈"
          title="Daily Engagement Trend"
          question="Is player activity growing, steady, or slowing down?"
          insight={
            insights.engagementDir === 'up'
              ? 'Engagement is trending upward — activity is growing.'
              : insights.engagementDir === 'down'
                ? 'Engagement is trending downward — investigate what changed.'
                : 'Engagement is steady over the period.'
          }
          insightTone={insights.engagementDir === 'up' ? 'good' : insights.engagementDir === 'down' ? 'danger' : 'default'}
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyEngagement} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(47,111,178,0.12)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis yAxisId="left" dataKey="attempts" tickLine={false} axisLine={false} fontSize={11} fill="#6a8ab8" />
              <YAxis
                yAxisId="right"
                orientation="right"
                dataKey="average"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                fill="#6a8ab8"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="top" iconType="circle" iconSize={9} />
              <Bar yAxisId="left" dataKey="attempts" name="Attempts" fill="#83b4f7" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Line yAxisId="right" type="monotone" dataKey="average" name="Avg score" stroke="#1a3a6b" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ProblemCard>
      </div>

      <div className="adaPanel" style={{ marginBottom: 22 }}>
        <p className="adaEyebrow">Players by location</p>
        <h3 className="adaSectionTitle">Where players are playing from</h3>
        <p className="adaMuted" style={{ marginBottom: 14 }}>
          {data.playerLocations?.markers?.length || 0} located players ·{' '}
          {(data.playerLocations?.countries?.length) || 0} countries
        </p>
        <PlayerLocationMap markers={data.playerLocations?.markers || []} />
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

  .adaProblemGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 22px;
  }

  .adaProblemCard {
    display: flex;
    flex-direction: column;
    padding: 22px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(47, 111, 178, 0.16);
    box-shadow: 0 16px 40px rgba(47, 111, 178, 0.1);
  }

  .adaProblemHead {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .adaProblemIcon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: rgba(131, 180, 247, 0.22);
    font-size: 1.3rem;
    flex-shrink: 0;
  }

  .adaProblemQuestion {
    margin: 0 0 4px;
    color: #5a6b8c;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .adaProblemTitle {
    margin: 0;
    color: #191817;
    font-size: 1.15rem;
    letter-spacing: -0.02em;
  }

  .adaProblemInsight {
    margin: 0 0 16px;
    padding: 9px 13px;
    border-radius: 12px;
    font-size: 0.84rem;
    font-weight: 800;
    line-height: 1.45;
  }

  .adaInsight-default { background: rgba(47, 111, 178, 0.1); color: #1a3a6b; }
  .adaInsight-good { background: rgba(47, 158, 99, 0.12); color: #1f7a4a; }
  .adaInsight-warn { background: rgba(232, 163, 61, 0.16); color: #8a5a10; }
  .adaInsight-danger { background: rgba(224, 82, 74, 0.14); color: #a1241e; }

  .adaChartBody { position: relative; }

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

  .adaStatus-active { background: rgba(47, 158, 99, 0.16); color: #1f7a4a; }
  .adaStatus-inactive { background: rgba(153, 27, 27, 0.12); color: #991b1b; }

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

  @media (max-width: 980px) {
    .adaProblemGrid { grid-template-columns: 1fr; }
  }
`

export default AdminAnalyticsDashboard
