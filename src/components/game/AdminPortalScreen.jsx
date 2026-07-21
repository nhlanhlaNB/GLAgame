import { useState } from 'react'
import { styles } from './gameStyles'
import { adminReportRows, rubricRows, sdgOptions } from '../../data/mockUiData'
import { aiCards } from '../../data/aiCards'
import { ActionButton, DataTable, MetricCard, Pill, SectionHeader } from './ui'

function AdminPortalScreen({ cards, attempts, selectedProblemStack, certificateUnlocked }) {
  const [unlocked, setUnlocked] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [tab, setTab] = useState('dashboard')

  if (!unlocked) {
    return (
      <div style={styles.panel}>
        <SectionHeader eyebrow="Admin access" title="GRIT Lab Africa admin access.">
          Enter your administrator access code to continue.
        </SectionHeader>
        <div style={{ ...styles.smallCard, maxWidth: 520 }}>
          <h3 style={styles.smallCardTitle}>Enter admin access code</h3>
          <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Enter access code" style={inputStyle} />
          <div style={styles.centerButtonRow}><ActionButton onClick={() => setUnlocked(true)}>Open Admin Portal</ActionButton></div>
        </div>
      </div>
    )
  }

  const tabs = ['dashboard', 'problem cards', 'AI cards', 'SDG mappings', 'rubrics', 'card images', 'certificates', 'languages', 'player analytics', 'reports']
  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Admin portal" title="Manage content, analytics and reports." />
      <div style={tabRowStyle}>{tabs.map((item) => <ActionButton key={item} variant={tab === item ? 'primary' : 'secondary'} onClick={() => setTab(item)}>{item}</ActionButton>)}</div>
      {tab === 'dashboard' && <AdminDashboard attempts={attempts} cards={cards} certificateUnlocked={certificateUnlocked} />}
      {tab === 'problem cards' && <Manager title="Admin Problem Card Management" rows={cards} columns={[{ key: 'title', label: 'Title' }, { key: 'problem_type', label: 'Type' }]} />}
      {tab === 'AI cards' && <Manager title="Admin AI Card Management" rows={aiCards} columns={[{ key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }]} />}
      {tab === 'SDG mappings' && <Manager title="Admin SDG Mapping Management" rows={sdgOptions.map((sdg, id) => ({ id, sdg, status: 'Mapped' }))} columns={[{ key: 'sdg', label: 'SDG' }, { key: 'status', label: 'Status' }]} />}
      {tab === 'rubrics' && <Manager title="Admin Scoring Rubric Management" rows={rubricRows} columns={[{ key: 'label', label: 'Area' }, { key: 'max', label: 'Max Score' }, { key: 'meaning', label: 'Meaning' }]} />}
      {tab === 'card images' && <UploadMock title="Admin Card Image Upload" />}
      {tab === 'certificates' && <UploadMock title="Admin Certificate Template Management" />}
      {tab === 'languages' && <Manager title="Admin Language Version Management" rows={['French', 'Portuguese', 'Arabic', 'Kiswahili', 'isiZulu'].map((language, id) => ({ id, language, status: 'Draft deck available' }))} columns={[{ key: 'language', label: 'Language' }, { key: 'status', label: 'Status' }]} />}
      {tab === 'player analytics' && <Manager title="Admin Player Analytics" rows={selectedProblemStack.map((card) => ({ id: card.id, title: card.title, selected: 'Selected by current player' }))} columns={[{ key: 'title', label: 'Problem' }, { key: 'selected', label: 'Status' }]} />}
      {tab === 'reports' && <Manager title="Admin Reports Export" rows={adminReportRows} columns={[{ key: 'report', label: 'Report' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'owner', label: 'Owner' }]} />}
    </div>
  )
}

function AdminDashboard({ attempts, cards, certificateUnlocked }) {
  return <div style={styles.metricGrid}><MetricCard title="Admin Dashboard" value="Open" /><MetricCard title="Problem Cards" value={cards.length} /><MetricCard title="Submissions" value={attempts.length} /><MetricCard title="Certificates" value={certificateUnlocked ? 1 : 0} /></div>
}
function Manager({ title, rows, columns }) { return <div style={{ ...styles.smallCard, marginTop: 18 }}><p style={styles.eyebrow}>{title}</p><div style={{ marginBottom: 12 }}><Pill>UI only</Pill></div><DataTable rows={rows} columns={columns} /></div> }
function UploadMock({ title }) { return <div style={{ ...styles.smallCard, marginTop: 18 }}><p style={styles.eyebrow}>{title}</p><div style={uploadBoxStyle}>Drop files here or click to upload. UI placeholder only.</div></div> }

const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(139,92,40,0.22)', background: 'rgba(255,255,255,0.75)', color: '#3b2817' }
const tabRowStyle = { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }
const uploadBoxStyle = { padding: 34, borderRadius: 22, border: '2px dashed rgba(154,106,34,0.38)', background: 'rgba(255,255,255,0.62)', color: '#5c4632', textAlign: 'center' }

export default AdminPortalScreen
