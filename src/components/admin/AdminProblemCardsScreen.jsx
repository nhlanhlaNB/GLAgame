import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import {
  addAdminProblemCard,
  deleteAdminProblemCard,
  getAdminProblemCards
} from '../../services/admin/adminCardService'

const emptyForm = {
  title: '',
  problem_type: '',
  problem: '',
  examples: '',
  think_about_it: '',
  sdg_goals: ''
}

function AdminProblemCardsScreen() {
  const [problemCards, setProblemCards] = useState([])
  const [formValues, setFormValues] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadProblemCards() {
    setLoading(true)
    setError('')

    try {
      const cards = await getAdminProblemCards()
      setProblemCards(cards)
    } catch (err) {
      setError(
        err.message ||
          'Could not load problem cards from the system.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProblemCards()
  }, [])

  function updateFormField(field, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [field]: value
    }))
  }

  async function handleAddProblemCard(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      await addAdminProblemCard(formValues)
      setFormValues(emptyForm)
      setSuccessMessage('Problem card added successfully.')
      await loadProblemCards()
    } catch (err) {
      setError(
        err.message ||
          'Could not add problem card to the system.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProblemCard(card) {
    const confirmed = window.confirm(
      `Delete "${card.title}" from the system problemCards?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(card.firestoreId)
    setError('')
    setSuccessMessage('')

    try {
      await deleteAdminProblemCard(card)
      setSuccessMessage('Problem card deleted successfully.')
      await loadProblemCards()
    } catch (err) {
      setError(
        err.message ||
          'Could not delete problem card from the system.'
      )
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Admin problem card management"
        title="Manage problem cards."
      >
        Add or delete African SDG problem cards directly from the system.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button type="button" onClick={loadProblemCards} style={secondaryButtonStyle}>
          Refresh Problem Cards
        </button>
      </div>

      {error && (
        <div style={{ ...styles.smallCard, marginTop: 18, borderColor: 'rgba(153, 27, 27, 0.28)' }}>
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {successMessage && (
        <div style={{ ...styles.smallCard, marginTop: 18, borderColor: 'rgba(22, 101, 52, 0.28)' }}>
          <p style={{ ...styles.smallCardText, color: '#166534' }}>{successMessage}</p>
        </div>
      )}

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Content controls</p>
            <h3 style={styles.smallCardTitle}>Add new problem card</h3>
          </div>

          <Pill>{problemCards.length} saved cards</Pill>
        </div>

        <form onSubmit={handleAddProblemCard} style={formGridStyle}>
          <label style={fieldStyle}>
            Problem card title
            <input
              value={formValues.title}
              onChange={(event) => updateFormField('title', event.target.value)}
              placeholder="Example: Youth Unemployment"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            Problem type
            <input
              value={formValues.problem_type}
              onChange={(event) => updateFormField('problem_type', event.target.value)}
              placeholder="Example: Jobs and income"
              style={inputStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Problem description
            <textarea
              value={formValues.problem}
              onChange={(event) => updateFormField('problem', event.target.value)}
              placeholder="Describe the African SDG-related problem."
              rows={4}
              style={textareaStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Examples
            <textarea
              value={formValues.examples}
              onChange={(event) => updateFormField('examples', event.target.value)}
              placeholder="Write each example on a new line."
              rows={3}
              style={textareaStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Reflection question
            <textarea
              value={formValues.think_about_it}
              onChange={(event) => updateFormField('think_about_it', event.target.value)}
              placeholder="Example: How could technology help young people find work or create work?"
              rows={3}
              style={textareaStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Linked SDG goals
            <input
              value={formValues.sdg_goals}
              onChange={(event) => updateFormField('sdg_goals', event.target.value)}
              placeholder="Example: SDG 1, SDG 4, SDG 8, SDG 9"
              style={inputStyle}
            />
          </label>

          <div style={{ ...styles.centerButtonRow, gridColumn: '1 / -1' }}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving ? 'Saving...' : 'Add Problem Card'}
            </button>

            <button
              type="button"
              onClick={() => setFormValues(emptyForm)}
              disabled={saving}
              style={secondaryButtonStyle}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Problem card records</p>
            <h3 style={styles.smallCardTitle}>Current problem cards</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${problemCards.length} cards`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading problem cards from the system...
          </p>
        ) : problemCards.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No problem cards found in the system yet.
          </p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Problem Card Title</th>
                  <th style={thStyle}>Problem Type</th>
                  <th style={thStyle}>SDGs</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {problemCards.map((card) => (
                  <tr key={card.firestoreId || card.id}>
                    <td style={tdStyle}>{card.id}</td>
                    <td style={tdStyle}>
                      <strong>{card.title}</strong>
                      <p style={tableSmallTextStyle}>
                        {card.think_about_it || 'No reflection question saved.'}
                      </p>
                    </td>
                    <td style={tdStyle}>{card.problem_type}</td>
                    <td style={tdStyle}>
                      {Array.isArray(card.sdg_goals)
                        ? card.sdg_goals.join(', ')
                        : card.sdg_goals || 'Not mapped'}
                    </td>
                    <td style={tdStyle}>
                      <Pill tone={card.isActive === false ? 'default' : 'success'}>
                        {card.isActive === false ? 'Inactive' : 'Active'}
                      </Pill>
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => handleDeleteProblemCard(card)}
                        disabled={deletingId === card.firestoreId}
                        style={dangerButtonStyle}
                      >
                        {deletingId === card.firestoreId ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const formGridStyle = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
}

const fieldStyle = {
  display: 'grid',
  gap: 8,
  color: '#5c3512',
  fontWeight: 850
}

const inputStyle = {
  width: '100%',
  padding: '13px 15px',
  borderRadius: 16,
  border: '1px solid rgba(139, 92, 40, 0.24)',
  background: 'rgba(255, 255, 255, 0.76)',
  color: '#3b2817',
  outline: 'none'
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 96
}

const primaryButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: '12px 18px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
  color: '#fff8eb',
  fontWeight: 850,
  boxShadow: '0 14px 30px rgba(92, 53, 18, 0.18)'
}

const secondaryButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: 999,
  padding: '11px 16px',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#5c3512',
  fontWeight: 850
}

const dangerButtonStyle = {
  border: '1px solid rgba(153, 27, 27, 0.28)',
  borderRadius: 999,
  padding: '9px 13px',
  cursor: 'pointer',
  background: 'rgba(254, 226, 226, 0.86)',
  color: '#991b1b',
  fontWeight: 850
}

const tableWrapStyle = {
  marginTop: 16,
  width: '100%',
  overflowX: 'auto'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 900
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  color: '#5c3512',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(139, 92, 40, 0.2)',
  background: 'rgba(244, 210, 138, 0.22)'
}

const tdStyle = {
  padding: '14px',
  color: '#3b2817',
  borderBottom: '1px solid rgba(139, 92, 40, 0.14)',
  verticalAlign: 'top'
}

const tableSmallTextStyle = {
  margin: '6px 0 0',
  color: '#6b5847',
  fontSize: '0.86rem',
  lineHeight: 1.45
}

export default AdminProblemCardsScreen