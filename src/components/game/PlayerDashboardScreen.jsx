import { styles } from './gameStyles'
import { ActionButton, DataTable, EmptyState, MetricCard, Pill, SectionHeader } from './ui'

function formatDate(value) {
  if (!value) return 'Not available'

  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString()
  }

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return 'Not available'
}

function safeText(value, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function PlayerDashboardScreen({
  firstName,
  selectedProblemStack = [],
  completedProblemRows = [],
  completedProblems = 0,
  averageScore = 0,
  certificateUnlocked = false,
  certificationProgress = 0,
  glaCoinBalance = 0,
  totalGlaCoinEarned = 0,
  glaCoinSpentOnHints = 0,
  attempts = [],
  attemptStatsByProblem = {},
  bestScoringProblems = [],
  latestAttempt,
  onOpenCoinHistory,
  onOpenLatestScore,
  onOpenCertificate,
  onOpenProfile
}) {
  const safeCompletedRows = completedProblemRows.map((row) => ({
    ...row,
    problemTitle: safeText(row.problemTitle, 'Problem'),
    bestScore: safeNumber(row.bestScore),
    latestScore: safeNumber(row.latestScore),
    attempts: safeNumber(row.attempts)
  }))

  const safeBestScoringProblems = bestScoringProblems.map((item) => ({
    ...item,
    problemId: safeText(item.problemId, item.id || item.problemTitle || 'problem'),
    problemTitle: safeText(item.problemTitle, 'Problem'),
    bestScore: safeNumber(item.bestScore)
  }))

  const safeAttemptStats = Object.values(attemptStatsByProblem || {}).map((row) => ({
    ...row,
    problemTitle: safeText(row.problemTitle, 'Problem'),
    firstScore: safeNumber(row.first?.totalScore),
    latestScore: safeNumber(row.latest?.totalScore),
    bestScore: safeNumber(row.best?.totalScore),
    count: safeNumber(row.count)
  }))

  const safeAttempts = attempts.map((attempt) => ({
    ...attempt,
    id: attempt.id || attempt.attemptId || `${attempt.problemCardId || attempt.problemId}-${attempt.attemptNumber || Math.random()}`,
    problemTitle: safeText(attempt.problemTitle || attempt.problemCardTitle, 'Problem'),
    attemptNumber: safeNumber(attempt.attemptNumber, 1),
    createdAtText: formatDate(attempt.createdAt),
    totalScore: safeNumber(attempt.totalScore),
    feedback: safeText(attempt.feedback || attempt.overallFeedback, 'No feedback available yet.')
  }))

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Player dashboard" title="Your GRIT Lab Africa progress.">
        This dashboard shows your selected problem stack, completed problems, best scores, attempts and GLA coin activity.
      </SectionHeader>

      <div style={styles.metricGrid}>
        <MetricCard title="Player" value={safeText(firstName, 'Player')} />
        <MetricCard title="Selected Problems" value={selectedProblemStack.length} />
        <MetricCard title="Completed Problems" value={safeNumber(completedProblems)} />
        <MetricCard title="Average Score" value={`${safeNumber(averageScore)}%`} />
        <MetricCard title="Current GLA Coin" value={safeNumber(glaCoinBalance)} />
        <MetricCard title="Total Earned" value={safeNumber(totalGlaCoinEarned)} />
        <MetricCard title="Spent on Hints" value={safeNumber(glaCoinSpentOnHints)} />
        <MetricCard title="Certificate" value={certificateUnlocked ? 'Unlocked' : 'Locked'} />
      </div>

      <div style={styles.twoColumnGrid}>
        <div style={{ ...styles.smallCard, marginTop: '18px' }}>
          <p style={styles.eyebrow}>Best-scoring problem cards</p>

          {safeBestScoringProblems.length === 0 ? (
            <EmptyState title="No best scores yet">
              Submit your first solution to start tracking best-scoring problem cards.
            </EmptyState>
          ) : (
            <div style={styles.listGrid}>
              {safeBestScoringProblems.map((item, index) => (
                <div key={item.problemId} style={historyItemStyle}>
                  <strong style={{ color: '#5c3512' }}>
                    {index + 1}. {item.problemTitle}
                  </strong>
                  <Pill>{item.bestScore}/100</Pill>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...styles.smallCard, marginTop: '18px' }}>
          <p style={styles.eyebrow}>Certificate status</p>
          <h3 style={styles.smallCardTitle}>
            {certificateUnlocked ? 'Certificate unlocked' : 'Certificate locked'}
          </h3>
          <p style={styles.smallCardText}>
            Complete 10 problem cards with an average score of 75 or higher.
            Current progress: {safeNumber(certificationProgress)}/10 with an average of {safeNumber(averageScore)}%.
          </p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>Completed problem cards list</p>
        <DataTable
          columns={[
            { key: 'problemTitle', label: 'Problem' },
            { key: 'bestScore', label: 'Best Score', render: (row) => `${safeNumber(row.bestScore)}/100` },
            { key: 'latestScore', label: 'Latest Score', render: (row) => `${safeNumber(row.latestScore)}/100` },
            { key: 'attempts', label: 'Attempts' }
          ]}
          rows={safeCompletedRows}
          emptyText="Completed problem cards will appear here after submissions."
        />
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>Selected problem stack full view</p>

        <div style={{ ...styles.cardGrid, marginTop: '12px' }}>
          {selectedProblemStack.map((card) => (
            <div key={card.id} style={styles.smallCard}>
              <h3 style={styles.smallCardTitle}>{safeText(card.title, 'Problem card')}</h3>
              <p style={styles.smallCardText}>{safeText(card.problem, 'No problem description available.')}</p>
              <div style={{ marginTop: '10px' }}>
                <Pill>{safeText(card.problem_type, 'Problem')}</Pill>
              </div>
            </div>
          ))}

          {selectedProblemStack.length === 0 && (
            <EmptyState title="No selected cards">
              Select problem cards from the Play Journey screen.
            </EmptyState>
          )}
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>First / latest / best score view</p>
        <DataTable
          columns={[
            { key: 'problemTitle', label: 'Problem' },
            { key: 'firstScore', label: 'First', render: (row) => `${safeNumber(row.firstScore)}/100` },
            { key: 'latestScore', label: 'Latest', render: (row) => `${safeNumber(row.latestScore)}/100` },
            { key: 'bestScore', label: 'Best', render: (row) => `${safeNumber(row.bestScore)}/100` },
            { key: 'count', label: 'Attempts' }
          ]}
          rows={safeAttemptStats}
          emptyText="Submit a solution first."
        />
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>Attempt history</p>

        {safeAttempts.length === 0 ? (
          <EmptyState title="No attempts yet">
            Your attempts will appear here after you submit solutions.
          </EmptyState>
        ) : (
          <div style={styles.listGrid}>
            {safeAttempts.map((attempt) => (
              <div key={attempt.id} style={attemptCardStyle}>
                <div style={styles.rowBetween}>
                  <div>
                    <h3 style={styles.smallCardTitle}>{attempt.problemTitle}</h3>
                    <p style={styles.smallCardText}>
                      Attempt #{attempt.attemptNumber} • {attempt.createdAtText}
                    </p>
                  </div>
                  <Pill>{attempt.totalScore}/100</Pill>
                </div>

                <p style={{ ...styles.smallCardText, marginTop: '10px' }}>
                  {attempt.feedback}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.centerButtonRow}>
        <ActionButton onClick={onOpenCoinHistory}>
          View GLA Coin History
        </ActionButton>

        <ActionButton variant="secondary" onClick={onOpenLatestScore} disabled={!latestAttempt}>
          View Latest Score
        </ActionButton>

        <ActionButton variant="secondary" onClick={onOpenCertificate}>
          View Certificate
        </ActionButton>

        <ActionButton variant="secondary" onClick={onOpenProfile}>
          Player Profile
        </ActionButton>
      </div>
    </div>
  )
}

const historyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '14px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.62)',
  border: '1px solid rgba(139,92,40,0.12)'
}

const attemptCardStyle = {
  padding: '16px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.58)',
  border: '1px solid rgba(139,92,40,0.14)'
}

export default PlayerDashboardScreen