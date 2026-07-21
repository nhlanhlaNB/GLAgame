import { styles } from './gameStyles'
import { hintLevels } from '../../data/mockUiData'
import { DataTable, MetricCard, SectionHeader } from './ui'

function HintCenterScreen({ coinTransactions, glaCoinSpentOnHints }) {
  const hints = coinTransactions.filter((item) => item.type === 'spent')
  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Hint history" title="Track hints and advanced hint levels." />
      <div style={styles.metricGrid}><MetricCard title="Hints Requested" value={hints.length} /><MetricCard title="GLA Coin Spent" value={glaCoinSpentOnHints} /></div>
      <div style={styles.cardGrid}>{hintLevels.map((hint) => <div key={hint.id} style={styles.smallCard}><h3 style={styles.smallCardTitle}>{hint.title}</h3><p style={styles.smallCardText}>{hint.description}</p><p style={{ ...styles.eyebrow, marginTop: 12 }}>{hint.cost} GLA coin</p></div>)}</div>
      <div style={{ ...styles.smallCard, marginTop: 18 }}><p style={styles.eyebrow}>Hint history</p><DataTable columns={[{ key: 'reason', label: 'Reason' }, { key: 'problemTitle', label: 'Problem' }, { key: 'amount', label: 'Cost' }, { key: 'createdAt', label: 'Date' }]} rows={hints} emptyText="Requested hints will appear here." /></div>
    </div>
  )
}

export default HintCenterScreen
