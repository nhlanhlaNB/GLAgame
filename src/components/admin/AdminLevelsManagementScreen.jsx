import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import { deleteAdminLevel, getAdminLevels, saveAdminLevel } from '../../services/admin/adminLevelsService'
import {
  Field,
  MessageCard,
  SearchBox,
  SimpleTable,
  StatusPill,
  dangerButtonStyle,
  inputStyle,
  primaryButtonStyle,
  secondaryButtonStyle
} from './shared/AdminFeatureUi'

const empty = {
  level: '',
  levelId: '',
  title: '',
  badge: '🏅',
  description: '',
  requiredCoin: '',
  requiredCompletedProblems: '',
  requiredAverageScore: '',
  isActive: true
}

function AdminLevelsManagementScreen() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    try {
      setRows(await getAdminLevels())
    } catch (err) {
      setError(err.message || 'Could not load levels.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => [row.title, row.levelId, row.description].join(' ').toLowerCase().includes(term))
  }, [rows, search])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      await saveAdminLevel(form)
      setForm(empty)
      setMessage('Level saved.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not save level.')
    }
  }

  async function remove(row) {
    if (!window.confirm('Delete level?')) return

    setError('')
    setMessage('')

    try {
      await deleteAdminLevel(row)
      setMessage('Level deleted.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not delete level.')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Levels management" title="Manage player progression levels.">
        Levels control the player journey from beginner to impact leader.
      </SectionHeader>

      <MessageCard message={error} tone="error" />
      <MessageCard message={message} />

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <form onSubmit={submit} style={gridStyle}>
          <Field label="Level number">
            <input style={inputStyle} type="number" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} />
          </Field>
          <Field label="Title">
            <input style={inputStyle} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Badge">
            <input style={inputStyle} value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} />
          </Field>
          <Field label="Required coin">
            <input style={inputStyle} type="number" value={form.requiredCoin} onChange={(event) => setForm({ ...form, requiredCoin: event.target.value })} />
          </Field>
          <Field label="Required completed">
            <input style={inputStyle} type="number" value={form.requiredCompletedProblems} onChange={(event) => setForm({ ...form, requiredCompletedProblems: event.target.value })} />
          </Field>
          <Field label="Required average">
            <input style={inputStyle} type="number" value={form.requiredAverageScore} onChange={(event) => setForm({ ...form, requiredAverageScore: event.target.value })} />
          </Field>
          <Field label="Description">
            <textarea style={inputStyle} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <div style={buttonRowStyle}>
            <button type="submit" style={compactPrimaryButtonStyle}>Save level</button>
            <button type="button" style={secondaryButtonStyle} onClick={() => setForm(empty)}>Clear form</button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search levels..." />
          <Pill>{filtered.length}</Pill>
        </div>
        <SimpleTable
          loading={loading}
          rows={filtered}
          columns={[
            { key: 'level', label: 'Level' },
            { key: 'badge', label: 'Badge' },
            { key: 'title', label: 'Title' },
            { key: 'requiredCoin', label: 'Coin' },
            { key: 'requiredCompletedProblems', label: 'Completed' },
            { key: 'requiredAverageScore', label: 'Average' },
            { key: 'isActive', label: 'Status', render: (row) => <StatusPill value={row.isActive ? 'active' : 'inactive'} /> },
            { key: 'actions', label: 'Actions', render: (row) => <button type="button" style={dangerButtonStyle} onClick={() => remove(row)}>Delete</button> }
          ]}
        />
      </div>
    </div>
  )
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'end' }
const buttonRowStyle = { gridColumn: '1 / -1', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }
const compactPrimaryButtonStyle = { ...primaryButtonStyle, width: 'auto', minWidth: 132, justifySelf: 'start' }

export default AdminLevelsManagementScreen
