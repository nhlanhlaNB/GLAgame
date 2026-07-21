import { styles } from './gameStyles'
import { DataTable, MetricCard, SectionHeader } from './ui'

function AnalyticsDashboardScreen({ analyticsData }) {
  const data = analyticsData || {}

  const categoryAverageRows = data.categoryAverageRows || []
  const mostSelectedProblemRows = data.mostSelectedProblemRows || []
  const aiCardUsageRows = data.aiCardUsageRows || []
  const commonAiCombinationRows = data.commonAiCombinationRows || []
  const averageScorePerProblemRows = data.averageScorePerProblemRows || []

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Player analytics"
        title="Your learning analytics and reporting view."
      >
        This screen shows analytics from your own gameplay data, including selected
        problems, AI card usage, scores, hints, certificates and replay activity.
      </SectionHeader>

      <div style={styles.metricGrid}>
        <MetricCard title="Game Sessions" value={data.sessionsStarted || 0} />
        <MetricCard title="Attempts Submitted" value={data.totalAttempts || 0} />
        <MetricCard title="Scores Received" value={data.totalScores || 0} />
        <MetricCard title="Average Score" value={`${data.averageScore || 0}%`} />
        <MetricCard title="Hints Requested" value={data.hintsRequested || 0} />
        <MetricCard title="Certificates Issued" value={data.certificateCount || 0} />
        <MetricCard title="Completion Rate" value={`${data.completionRate || 0}%`} />
        <MetricCard title="Replay Count" value={data.replayRate || 0} />
        <MetricCard title="GLA Coin Earned" value={data.totalGlaCoinEarned || 0} />
        <MetricCard title="GLA Coin Spent" value={data.totalGlaCoinSpent || 0} />
      </div>
            <div style={styles.twoColumnGrid}>
        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>Average score per scoring category</p>
          <DataTable
            columns={[
              { key: 'name', label: 'Category' },
              {
                key: 'average',
                label: 'Average',
                render: (row) => `${row.average}%`
              },
              { key: 'count', label: 'Count' }
            ]}
            rows={categoryAverageRows}
            emptyText="Scoring category analytics will appear after scored submissions."
          />
        </div>

        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>Average score per problem card</p>
          <DataTable
            columns={[
              { key: 'title', label: 'Problem' },
              { key: 'problem_type', label: 'Type' },
              {
                key: 'averageScore',
                label: 'Average',
                render: (row) => `${row.averageScore}%`
              },
              { key: 'count', label: 'Attempts' }
            ]}
            rows={averageScorePerProblemRows}
            emptyText="Problem score analytics will appear after submissions."
          />
        </div>
      </div>

      <div style={styles.twoColumnGrid}>
        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>Problem cards selected most often</p>
          <DataTable
            columns={[
              { key: 'title', label: 'Problem' },
              { key: 'problem_type', label: 'Type' },
              { key: 'count', label: 'Selected' }
            ]}
            rows={mostSelectedProblemRows}
            emptyText="Selected problem analytics will appear after creating a problem stack."
          />
        </div>

        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>AI cards used most often</p>
          <DataTable
            columns={[
              { key: 'aiCard', label: 'AI Card' },
              { key: 'count', label: 'Used' }
            ]}
            rows={aiCardUsageRows}
            emptyText="AI card usage analytics will appear after submitting attempts."
          />
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <p style={styles.eyebrow}>Common AI card combinations</p>
        <DataTable
          columns={[
            { key: 'combination', label: 'Combination' },
            { key: 'count', label: 'Used' }
          ]}
          rows={commonAiCombinationRows}
          emptyText="AI card combinations will appear after submissions."
        />
      </div>
    </div>
  )
}

export default AnalyticsDashboardScreen