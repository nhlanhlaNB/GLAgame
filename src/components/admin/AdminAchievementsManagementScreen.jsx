import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import { deleteAdminAchievement, getAdminAchievements, saveAdminAchievement } from '../../services/admin/adminAchievementService'
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
  title: '',
  description: '',
  icon: '🏅',
  category: 'Progress',
  conditionType: 'attempts',
  targetValue: '1',
  rewardCoin: '0',
  order: '99',
  isActive: true
}

function AdminAchievementsManagementScreen() {
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
      setRows(await getAdminAchievements())
    } catch (err) {
      setError(err.message || 'Could not load achievements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => [row.title, row.category, row.conditionType].join(' ').toLowerCase().includes(term))
  }, [rows, search])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      await saveAdminAchievement(form)
      setForm(empty)
      setMessage('Achievement saved.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not save achievement.')
    }
  }

  async function remove(row) {
    if (!window.confirm('Delete achievement?')) return

    setError('')
    setMessage('')

    try {
      await deleteAdminAchievement(row)
      setMessage('Achievement deleted.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not delete achievement.')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Achievements/badge management" title="Manage achievement badges.">
        Create the badges that players unlock through scoring, progress, coin earning and responsible AI behaviour.
      </SectionHeader>

      <MessageCard message={error} tone="error" />
      <MessageCard message={message} />

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <form onSubmit={submit} style={gridStyle}>
          <Field label="Title">
            <input style={inputStyle} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Icon">
            <input style={inputStyle} value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          </Field>
          <Field label="Category">
            <input style={inputStyle} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </Field>
          <Field label="Condition type">
            <input style={inputStyle} value={form.conditionType} onChange={(event) => setForm({ ...form, conditionType: event.target.value })} />
          </Field>
          <Field label="Target">
            <input style={inputStyle} type="number" value={form.targetValue} onChange={(event) => setForm({ ...form, targetValue: event.target.value })} />
          </Field>
          <Field label="Reward coin">
            <input style={inputStyle} type="number" value={form.rewardCoin} onChange={(event) => setForm({ ...form, rewardCoin: event.target.value })} />
          </Field>
          <Field label="Description">
            <textarea style={inputStyle} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <div style={buttonRowStyle}>
            <button type="submit" style={compactPrimaryButtonStyle}>Save achievement</button>
            <button type="button" style={secondaryButtonStyle} onClick={() => setForm(empty)}>Clear form</button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search achievements..." />
          <Pill>{filtered.length}</Pill>
        </div>
        <SimpleTable
          loading={loading}
          rows={filtered}
          columns={[
            { key: 'icon', label: 'Icon' },
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'conditionType', label: 'Condition' },
            { key: 'targetValue', label: 'Target' },
            { key: 'rewardCoin', label: 'Coin' },
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
const compactPrimaryButtonStyle = { ...primaryButtonStyle, width: 'auto', minWidth: 165, justifySelf: 'start' }

export default AdminAchievementsManagementScreen
