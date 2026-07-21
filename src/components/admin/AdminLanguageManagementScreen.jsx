import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import {
  deleteLanguageVersion,
  getLanguages,
  saveLanguageVersion,
  seedStarterLanguages,
  updateLanguageStatus
} from '../../services/admin/adminLocalizationService'
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

const emptyForm = {
  languageName: '',
  languageCode: '',
  deckStatus: 'Draft',
  reviewer: '',
  order: '',
  isActive: true
}

function AdminLanguageManagementScreen() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    try {
      setRows(await getLanguages())
    } catch (err) {
      setError(err.message || 'Could not load languages from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return rows.filter((row) => {
      const searchable = [row.languageName, row.languageCode, row.deckStatus, row.reviewer].join(' ').toLowerCase()
      const matchesSearch = !term || searchable.includes(term)
      const matchesStatus = statusFilter === 'all' || String(row.deckStatus).toLowerCase() === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await saveLanguageVersion(form)
      setForm(emptyForm)
      setMessage('Language saved successfully.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not save language.')
    } finally {
      setSaving(false)
    }
  }

  async function seedLanguages() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const count = await seedStarterLanguages()
      setMessage(`${count} starter languages saved.`)
      await load()
    } catch (err) {
      setError(err.message || 'Could not create starter languages.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row) {
    setError('')
    setMessage('')

    try {
      await updateLanguageStatus(row, !row.isActive)
      setMessage('Language status updated.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not update language status.')
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row.languageName}?`)) return

    setError('')
    setMessage('')

    try {
      await deleteLanguageVersion(row)
      setMessage('Language deleted.')
      await load()
    } catch (err) {
      setError(err.message || 'Could not delete language.')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Language management" title="Add languages for the game.">
        This screen only manages available languages. It does not manage UI translation text.
      </SectionHeader>

      <MessageCard message={error} tone="error" />
      <MessageCard message={message} />

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Languages</p>
          <h3 style={styles.smallCardTitle}>{rows.length}</h3>
          <p style={styles.smallCardText}>Saved in languageVersions.</p>
        </div>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Active</p>
          <h3 style={styles.smallCardTitle}>{rows.filter((row) => row.isActive).length}</h3>
          <p style={styles.smallCardText}>Shown in the language selector.</p>
        </div>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Filtered results</p>
          <h3 style={styles.smallCardTitle}>{filteredRows.length}</h3>
          <p style={styles.smallCardText}>Based on search and status.</p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Add language</p>
            <h3 style={styles.smallCardTitle}>Create a language option</h3>
          </div>
          <button type="button" onClick={seedLanguages} disabled={saving} style={secondaryButtonStyle}>
            Add starter languages
          </button>
        </div>

        <form onSubmit={submit} style={formGridStyle}>
          <Field label="Language name">
            <input style={inputStyle} value={form.languageName} onChange={(event) => setForm({ ...form, languageName: event.target.value })} placeholder="Example: French" />
          </Field>
          <Field label="Language code">
            <input style={inputStyle} value={form.languageCode} onChange={(event) => setForm({ ...form, languageCode: event.target.value })} placeholder="Example: fr" />
          </Field>
          <Field label="Deck status">
            <select style={inputStyle} value={form.deckStatus} onChange={(event) => setForm({ ...form, deckStatus: event.target.value })}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Paused">Paused</option>
            </select>
          </Field>
          <Field label="Reviewer">
            <input style={inputStyle} value={form.reviewer} onChange={(event) => setForm({ ...form, reviewer: event.target.value })} placeholder="Example: GRIT Lab Africa" />
          </Field>
          <Field label="Display order">
            <input style={inputStyle} type="number" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} placeholder="Example: 1" />
          </Field>
          <label style={checkLabelStyle}>
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            Active in language selector
          </label>
          <div style={buttonRowStyle}>
            <button type="submit" disabled={saving} style={compactPrimaryButtonStyle}>{saving ? 'Saving...' : 'Save language'}</button>
            <button type="button" onClick={() => setForm(emptyForm)} disabled={saving} style={secondaryButtonStyle}>Clear form</button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Language list</h3>
          </div>
          <Pill>{filteredRows.length} results</Pill>
        </div>

        <div style={filterGridStyle}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search name, code, reviewer or status..." />
          <select style={inputStyle} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <SimpleTable
          loading={loading}
          rows={filteredRows}
          emptyText="No languages found."
          columns={[
            { key: 'languageName', label: 'Language' },
            { key: 'languageCode', label: 'Code' },
            { key: 'deckStatus', label: 'Deck status' },
            { key: 'reviewer', label: 'Reviewer' },
            { key: 'isActive', label: 'Active', render: (row) => <StatusPill value={row.isActive ? 'active' : 'inactive'} /> },
            {
              key: 'actions',
              label: 'Actions',
              render: (row) => (
                <div style={actionRowStyle}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => toggleActive(row)}>{row.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => remove(row)}>Delete</button>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  )
}

const formGridStyle = { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'end' }
const filterGridStyle = { marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 220px', gap: 12 }
const buttonRowStyle = { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', gridColumn: '1 / -1' }
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const compactPrimaryButtonStyle = { ...primaryButtonStyle, width: 'auto', minWidth: 145, justifySelf: 'start' }
const checkLabelStyle = { display: 'flex', gap: 8, alignItems: 'center', color: '#5c3512', fontWeight: 850, minHeight: 44 }

export default AdminLanguageManagementScreen
