import { styles } from './gameStyles'
import { ActionButton, MetricCard, SectionHeader } from './ui'

function RetryAttemptScreen({ currentProblem, currentProblemAttemptStats, onStartRetry, onCancel, onNextProblem }) {
  if (!currentProblem) {
    return (
      <div style={styles.panel}>
        <SectionHeader eyebrow="Retry attempt" title="No active problem to retry.">Start the game first, then submit an attempt.</SectionHeader>
        <div style={styles.centerButtonRow}><ActionButton onClick={onCancel}>Go Back</ActionButton></div>
      </div>
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Retry attempt" title="Try the same problem again.">
        You can retry this problem to improve your solution. Your old attempt is kept in the history, and the dashboard will show first, latest and best scores.
      </SectionHeader>
      <div style={{ ...styles.smallCard, marginTop: '24px' }}>
        <p style={styles.eyebrow}>Problem card</p>
        <h3 style={styles.smallCardTitle}>{currentProblem.title}</h3>
        <p style={styles.smallCardText}>{currentProblem.problem}</p>
      </div>
      {currentProblemAttemptStats && (
        <div style={{ ...styles.smallCard, marginTop: '18px' }}>
          <p style={styles.eyebrow}>Your score history</p>
          <div style={styles.metricGrid}>
            <MetricCard title="First Score" value={`${currentProblemAttemptStats.first?.totalScore || 0}/100`} />
            <MetricCard title="Latest Score" value={`${currentProblemAttemptStats.latest?.totalScore || 0}/100`} />
            <MetricCard title="Best Score" value={`${currentProblemAttemptStats.best?.totalScore || 0}/100`} />
            <MetricCard title="Attempts" value={currentProblemAttemptStats.count || 0} />
          </div>
        </div>
      )}
      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>What will happen now?</p>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#5c4632', lineHeight: '1.8' }}>
          <li>Your selected AI cards will be cleared.</li>
          <li>Your explanation box will be cleared.</li>
          <li>The same problem card will stay active.</li>
          <li>You can submit again and try to improve your score.</li>
        </ul>
      </div>
      <div style={styles.centerButtonRow}>
        <ActionButton onClick={onStartRetry}>Start Retry Attempt</ActionButton>
        <ActionButton variant="secondary" onClick={onCancel}>Cancel</ActionButton>
        <ActionButton variant="secondary" onClick={onNextProblem}>Skip to Next Problem</ActionButton>
      </div>
    </div>
  )
}

export default RetryAttemptScreen
