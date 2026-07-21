import { styles, colors } from './gameStyles'
import { rubricRows } from '../../data/mockUiData'
import { ActionButton, EmptyState, MetricCard, ProgressBar, SectionHeader } from './ui'

function formatAttemptDate(value) {
  if (!value) return 'recently'

  try {
    if (typeof value === 'string') return value
    if (value?.toDate) return value.toDate().toLocaleDateString()
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString()
    if (value instanceof Date) return value.toLocaleDateString()
  } catch (error) {
    return 'recently'
  }

  return 'recently'
}

function getAttemptScore(attempt) {
  const score = Number(attempt?.totalScore ?? attempt?.total_score ?? attempt?.score ?? attempt?.overallScore ?? 0)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0
}

function getCoinEarned(attempt) {
  const coin = Number(attempt?.glaCoinEarned ?? attempt?.GLA_coin_earned ?? attempt?.coinsEarned ?? attempt?.glaCoin ?? getAttemptScore(attempt))
  return Number.isFinite(coin) ? Math.round(coin) : 0
}

function getProblemTitle(attempt) {
  return attempt?.problemTitle || attempt?.problemCardTitle || attempt?.problem?.title || 'Problem card'
}

function getFeedbackText(attempt) {
  return attempt?.overallFeedback || attempt?.feedback || attempt?.feedbackText || 'Your solution has been reviewed. Use the score breakdown to improve your next answer.'
}

function getImprovementText(attempt) {
  return attempt?.improvementSuggestion || attempt?.improvement || attempt?.nextSteps || 'Try adding more practical African context, clearer AI use, and stronger SDG impact detail.'
}

function getAiCards(attempt) {
  if (Array.isArray(attempt?.selectedAiCards) && attempt.selectedAiCards.length > 0) {
    return attempt.selectedAiCards.map((card, index) => ({
      id: card?.id || card?.aiCardId || card?.title || `ai-${index}`,
      title: card?.title || card?.name || String(card)
    }))
  }

  if (Array.isArray(attempt?.selectedAiCardTitles) && attempt.selectedAiCardTitles.length > 0) {
    return attempt.selectedAiCardTitles.map((title, index) => ({ id: `title-${index}`, title }))
  }

  if (Array.isArray(attempt?.selectedAiCardIds) && attempt.selectedAiCardIds.length > 0) {
    return attempt.selectedAiCardIds.map((id, index) => ({ id: `id-${index}`, title: String(id) }))
  }

  return []
}

function getSubScoreStatus(score, max) {
  const percentage = max > 0 ? (score / max) * 100 : 0

  if (percentage >= 80) return { label: 'Excellent', color: colors.success, message: 'This part is strong and presentation-ready.' }
  if (percentage >= 65) return { label: 'Good', color: colors.gold, message: 'This part works, but can still be made sharper.' }
  if (percentage >= 45) return { label: 'Developing', color: colors.warning, message: 'This part needs clearer detail.' }
  return { label: 'Needs work', color: colors.danger, message: 'This part needs stronger explanation before it feels complete.' }
}

function getAreaFeedback(attempt, key, fallback) {
  const areaFeedback = attempt?.areaFeedback || attempt?.feedback_by_area || attempt?.feedbackByArea || attempt?.feedback?.by_area || {}
  const value = areaFeedback[key]

  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object') return value.feedback || value.reason || value.comment || fallback

  return fallback
}

function getPreciseSubScoreRows(attempt) {
  const subScores = attempt?.subScores || attempt?.sub_scores || {}

  return rubricRows.map((row) => {
    const rawScore = Number(subScores[row.key] ?? 0)
    const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(row.max, Math.round(rawScore))) : 0
    const status = getSubScoreStatus(score, row.max)

    return {
      ...row,
      score,
      percentage: row.max > 0 ? Math.round((score / row.max) * 100) : 0,
      status,
      feedback: getAreaFeedback(attempt, row.key, row.meaning)
    }
  })
}

function ScoringFeedbackScreen({ currentAttempt, currentProblemAttemptStats, glaCoinBalance, onOpenRetry, onNextProblem, onOpenDashboard, onOpenCoinHistory }) {
  if (!currentAttempt) {
    return (
      <div style={styles.panel}>
        <SectionHeader eyebrow="Scoring and feedback" title="No score yet.">
          Submit a solution first. AI feedback and the detailed sub-score breakdown will appear here.
        </SectionHeader>
        <div style={styles.centerButtonRow}><ActionButton onClick={onOpenDashboard}>Go to Dashboard</ActionButton></div>
      </div>
    )
  }

  const totalScore = getAttemptScore(currentAttempt)
  const glaCoinEarned = getCoinEarned(currentAttempt)
  const selectedAiCards = getAiCards(currentAttempt)
  const subScoreRows = getPreciseSubScoreRows(currentAttempt)
  const subScoreTotal = subScoreRows.reduce((sum, row) => sum + row.score, 0)
  const certificationTrackable = currentAttempt.certificationTrackable !== false

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Scoring and feedback" title="The scoring engine reviewed your solution.">
        This page follows the GRIT Lab Africa seven-part scoring rubric: relevance, combination, practicality, African context, SDGs, creativity, and responsible AI.
      </SectionHeader>

      <div style={scoreHeroStyle}>
        <div style={scoreCircleStyle}>{totalScore}</div>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <p style={{ ...styles.eyebrow, color: colors.lightGold }}>{totalScore >= 75 ? 'Strong certification-level attempt' : totalScore >= 50 ? 'Good start, improve the details' : 'Needs more practical detail'}</p>
          <h2 style={scoreTitleStyle}>{glaCoinEarned} GLA coin earned</h2>
          <p style={scoreTextStyle}>Current Current wallet balance: <strong>{glaCoinBalance || 0} GLA coin</strong></p>
        </div>
        <div style={scoreMiniPanelStyle}>
          <span style={miniLabelStyle}>Rubric total</span>
          <strong>{subScoreTotal}/100</strong>
          <span style={miniLabelStyle}>{certificationTrackable ? 'Counts for certificate tracking' : 'Practice attempt only'}</span>
        </div>
      </div>

      <div style={styles.twoColumnGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Problem solved</p>
          <h3 style={styles.smallCardTitle}>{getProblemTitle(currentAttempt)}</h3>
          <p style={styles.smallCardText}>Attempt #{currentAttempt.attemptNumber || 1} submitted on {formatAttemptDate(currentAttempt.createdAt)}.</p>
        </div>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>AI cards used</p>
          {selectedAiCards.length === 0 ? (
            <p style={styles.smallCardText}>No AI cards were found for this attempt.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedAiCards.map((card) => <span key={card.id} style={styles.chip}>{card.title}</span>)}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>Educational feedback</p>
        <h3 style={styles.smallCardTitle}>Overall feedback</h3>
        <p style={styles.smallCardText}>{getFeedbackText(currentAttempt)}</p>
        <h3 style={{ ...styles.smallCardTitle, marginTop: '18px' }}>How to improve</h3>
        <p style={styles.smallCardText}>{getImprovementText(currentAttempt)}</p>
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Detailed sub-score breakdown</p>
            <h3 style={styles.smallCardTitle}>Precise rubric marking</h3>
          </div>
          <span style={styles.chip}>{subScoreTotal}/100 total</span>
        </div>
        <div style={subScoreGridStyle}>
          {subScoreRows.map((row) => (
            <div key={row.key} style={subScoreCardStyle}>
              <div style={styles.rowBetween}>
                <strong style={{ color: colors.brown }}>{row.label}</strong>
                <span style={{ ...styles.chip, background: 'rgba(244,210,138,0.28)' }}>{row.score}/{row.max}</span>
              </div>
              <ProgressBar value={row.score} max={row.max} />
              <div style={subScoreMetaStyle}>
                <span style={{ ...statusPillStyle, color: row.status.color, borderColor: row.status.color }}>{row.status.label}</span>
                <span>{row.percentage}% of this category</span>
              </div>
              <p style={{ ...styles.smallCardText, fontSize: '0.9rem', marginTop: '10px' }}>{row.feedback}</p>
              <p style={{ ...styles.smallCardText, fontSize: '0.82rem', marginTop: '8px', opacity: 0.78 }}>{row.status.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>First / latest / best score</p>
        {currentProblemAttemptStats ? (
          <div style={styles.metricGrid}>
            <MetricCard title="First Score" value={`${currentProblemAttemptStats.first?.totalScore || 0}/100`} />
            <MetricCard title="Latest Score" value={`${currentProblemAttemptStats.latest?.totalScore || 0}/100`} />
            <MetricCard title="Best Score" value={`${currentProblemAttemptStats.best?.totalScore || 0}/100`} />
            <MetricCard title="Attempts" value={currentProblemAttemptStats.count || 0} />
          </div>
        ) : <EmptyState title="No history">No score history found for this problem yet.</EmptyState>}
      </div>

      <div style={styles.centerButtonRow}>
        <ActionButton onClick={onOpenRetry}>Retry This Problem</ActionButton>
        <ActionButton variant="secondary" onClick={onNextProblem}>Next Problem</ActionButton>
        <ActionButton variant="secondary" onClick={onOpenDashboard}>Dashboard</ActionButton>
        <ActionButton variant="secondary" onClick={onOpenCoinHistory}>GLA Coin History</ActionButton>
      </div>
    </div>
  )
}

const scoreHeroStyle = { marginTop: '24px', padding: '26px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(92,53,18,0.96), rgba(154,106,34,0.92))', color: colors.cream, boxShadow: '0 24px 60px rgba(92,53,18,0.2)' }
const scoreCircleStyle = { width: '96px', height: '96px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,248,235,0.16)', border: '2px solid rgba(244,210,138,0.45)', color: colors.lightGold, fontSize: '2.05rem', fontWeight: '950' }
const scoreTitleStyle = { margin: '0 0 8px', color: colors.cream, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: '1.05', letterSpacing: '-0.05em' }
const scoreTextStyle = { margin: 0, color: 'rgba(255,248,235,0.88)', lineHeight: '1.6' }
const scoreMiniPanelStyle = { padding: '14px 16px', borderRadius: '18px', border: '1px solid rgba(244,210,138,0.34)', background: 'rgba(255,248,235,0.12)', display: 'grid', gap: '4px', minWidth: '170px' }
const miniLabelStyle = { fontSize: '0.76rem', color: 'rgba(255,248,235,0.72)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }
const subScoreGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: '12px', marginTop: '16px' }
const subScoreCardStyle = { padding: '16px', borderRadius: '20px', background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,248,235,0.72))', border: '1px solid rgba(139,92,40,0.16)', boxShadow: '0 14px 36px rgba(92,53,18,0.08)' }
const subScoreMetaStyle = { marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', color: colors.muted, fontSize: '0.82rem', fontWeight: '800' }
const statusPillStyle = { padding: '5px 9px', borderRadius: '999px', border: '1px solid', background: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: '900' }

export default ScoringFeedbackScreen
