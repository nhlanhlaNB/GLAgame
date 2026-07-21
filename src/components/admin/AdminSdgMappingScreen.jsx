import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import {
  getAdminProblemCards,
  updateProblemCardSdgMapping
} from '../../services/admin/adminCardService'

const sdgOptions = [
  'SDG 1',
  'SDG 2',
  'SDG 3',
  'SDG 4',
  'SDG 5',
  'SDG 6',
  'SDG 7',
  'SDG 8',
  'SDG 9',
  'SDG 10',
  'SDG 11',
  'SDG 12',
  'SDG 13',
  'SDG 14',
  'SDG 15',
  'SDG 16',
  'SDG 17'
]

function normaliseSdgList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function AdminSdgMappingScreen() {
  const [problemCards, setProblemCards] = useState([])
  const [drafts, setDrafts] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [mappingFilter, setMappingFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadProblemCards() {
    setLoading(true)
    setError('')

    try {
      const rows = await getAdminProblemCards()
      setProblemCards(rows)

      const nextDrafts = {}
      rows.forEach((card) => {
        nextDrafts[card.firestoreId] = normaliseSdgList(card.sdg_goals).join(', ')
      })
      setDrafts(nextDrafts)
    } catch (err) {
      setError(err.message || 'Could not load SDG mappings from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProblemCards()
  }, [])

  const filteredCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return problemCards.filter((card) => {
      const sdgs = normaliseSdgList(card.sdg_goals)
      const searchable = [card.title, card.problem_type, card.problem, sdgs.join(' ')].join(' ').toLowerCase()
      const matchesSearch = !term || searchable.includes(term)
      const matchesFilter =
        mappingFilter === 'all' ||
        (mappingFilter === 'mapped' && sdgs.length > 0) ||
        (mappingFilter === 'unmapped' && sdgs.length === 0)

      return matchesSearch && matchesFilter
    })
  }, [problemCards, searchTerm, mappingFilter])

  const mappedCount = problemCards.filter((card) => normaliseSdgList(card.sdg_goals).length > 0).length
  const unmappedCount = problemCards.length - mappedCount

  function updateDraft(card, value) {
    setDrafts((previous) => ({ ...previous, [card.firestoreId]: value }))
  }

  function addSdg(card, sdg) {
    const current = normaliseSdgList(drafts[card.firestoreId])
    if (current.includes(sdg)) return
    updateDraft(card, [...current, sdg].join(', '))
  }

  async function saveMapping(card) {
    setSavingId(card.firestoreId)
    setError('')
    setMessage('')

    try {
      await updateProblemCardSdgMapping(card, drafts[card.firestoreId])
      setMessage(`SDG mapping saved for ${card.title}.`)
      await loadProblemCards()
    } catch (err) {
      setError(err.message || 'Could not save SDG mapping.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Admin SDG mapping management" title="Manage problem-card SDG links.">
        SDG mapping belongs on each problem card as the sdg_goals field. This screen edits that field in the system problemCards.
      </SectionHeader>

      {error && (
        <div style={{ ...styles.smallCard, marginTop: 18, borderColor: 'rgba(153, 27, 27, 0.28)' }}>
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {message && (
        <div style={{ ...styles.smallCard, marginTop: 18, borderColor: 'rgba(22, 101, 52, 0.28)' }}>
          <p style={{ ...styles.smallCardText, color: '#166534' }}>{message}</p>
        </div>
      )}

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Problem cards</p>
          <h3 style={styles.smallCardTitle}>{problemCards.length}</h3>
          <p style={styles.smallCardText}>Loaded from the system problemCards.</p>
        </div>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Mapped cards</p>
          <h3 style={styles.smallCardTitle}>{mappedCount}</h3>
          <p style={styles.smallCardText}>Cards with at least one SDG.</p>
        </div>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Unmapped cards</p>
          <h3 style={styles.smallCardTitle}>{unmappedCount}</h3>
          <p style={styles.smallCardText}>Cards that still need SDG links.</p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <p style={styles.eyebrow}>Why this structure is correct</p>
        <h3 style={styles.smallCardTitle}>SDGs stay inside problemCards</h3>
        <p style={styles.smallCardText}>
          The GLA design says each problem card must have a title, problem type, description, examples, reflection question and linked SDG goal or goals. That means a separate SDG mapping table is not required for the current version.
        </p>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Review problem-card SDGs</h3>
          </div>
          <Pill>{filteredCards.length} cards</Pill>
        </div>

        <div style={filterGridStyle}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search problem cards or SDGs..." style={inputStyle} />
          <select value={mappingFilter} onChange={(event) => setMappingFilter(event.target.value)} style={inputStyle}>
            <option value="all">All cards</option>
            <option value="mapped">Mapped only</option>
            <option value="unmapped">Unmapped only</option>
          </select>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Problem card records</p>
            <h3 style={styles.smallCardTitle}>Edit SDG links</h3>
          </div>
          <Pill>{loading ? 'Loading...' : `${filteredCards.length} shown`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>Loading SDG mappings...</p>
        ) : filteredCards.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>No problem cards match your search.</p>
        ) : (
          <div style={cardGridStyle}>
            {filteredCards.map((card) => {
              const sdgs = normaliseSdgList(card.sdg_goals)
              return (
                <div key={card.firestoreId || card.id} style={mappingCardStyle}>
                  <div style={styles.rowBetween}>
                    <div>
                      <p style={styles.eyebrow}>Problem #{card.id}</p>
                      <h3 style={styles.smallCardTitle}>{card.title}</h3>
                    </div>
                    <Pill tone={sdgs.length ? 'success' : 'default'}>{sdgs.length ? 'Mapped' : 'Unmapped'}</Pill>
                  </div>

                  <p style={{ ...styles.smallCardText, marginTop: 8 }}>{card.problem_type || 'No problem type saved.'}</p>

                  <label style={fieldStyle}>
                    Linked SDGs
                    <input value={drafts[card.firestoreId] || ''} onChange={(event) => updateDraft(card, event.target.value)} placeholder="Example: SDG 1, SDG 4, SDG 8" style={inputStyle} />
                  </label>

                  <div style={sdgGridStyle}>
                    {sdgOptions.map((sdg) => (
                      <button key={sdg} type="button" onClick={() => addSdg(card, sdg)} style={miniButtonStyle}>+ {sdg}</button>
                    ))}
                  </div>

                  <button type="button" onClick={() => saveMapping(card)} disabled={savingId === card.firestoreId} style={saveButtonStyle}>
                    {savingId === card.firestoreId ? 'Saving...' : 'Save mapping'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const filterGridStyle = { marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 190px', gap: 12 }
const inputStyle = { width: '100%', padding: '13px 15px', borderRadius: 16, border: '1px solid rgba(139, 92, 40, 0.24)', background: 'rgba(255, 255, 255, 0.76)', color: '#3b2817', outline: 'none' }
const cardGridStyle = { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }
const mappingCardStyle = { padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.64)', border: '1px solid rgba(139,92,40,0.16)' }
const fieldStyle = { marginTop: 14, display: 'grid', gap: 8, color: '#5c3512', fontWeight: 850 }
const sdgGridStyle = { marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }
const miniButtonStyle = { border: '1px solid rgba(139, 92, 40, 0.18)', borderRadius: 999, padding: '7px 10px', cursor: 'pointer', background: 'rgba(244, 210, 138, 0.2)', color: '#5c3512', fontSize: '0.78rem', fontWeight: 850 }
const saveButtonStyle = { marginTop: 14, border: 0, borderRadius: 999, padding: '10px 15px', cursor: 'pointer', background: 'linear-gradient(135deg, #9a6a22, #5c3512)', color: '#fff8eb', fontWeight: 850, width: 'auto' }

export default AdminSdgMappingScreen
