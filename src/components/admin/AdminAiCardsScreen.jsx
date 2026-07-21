import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import {
  addAdminAiCard,
  deleteAdminAiCard,
  getAdminAiCards
} from '../../services/admin/adminCardService'

const emptyForm = {
  title: '',
  ai_type: '',
  what_it_can_do: '',
  examples: '',
  think_about_it: ''
}

function AdminAiCardsScreen() {
  const [aiCards, setAiCards] = useState([])
  const [formValues, setFormValues] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadAiCards() {
    setLoading(true)
    setError('')

    try {
      const cards = await getAdminAiCards()
      setAiCards(cards)
    } catch (err) {
      setError(err.message || 'Could not load AI cards from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAiCards()
  }, [])

  function updateFormField(field, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [field]: value
    }))
  }

  async function handleAddAiCard(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      await addAdminAiCard(formValues)
      setFormValues(emptyForm)
      setSuccessMessage('AI card added successfully.')
      await loadAiCards()
    } catch (err) {
      setError(err.message || 'Could not add AI card to the system.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAiCard(card) {
    const confirmed = window.confirm(
      `Delete "${card.title}" from the system aiCards?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(card.firestoreId)
    setError('')
    setSuccessMessage('')

    try {
      await deleteAdminAiCard(card)
      setSuccessMessage('AI card deleted successfully.')
      await loadAiCards()
    } catch (err) {
      setError(err.message || 'Could not delete AI card from the system.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Admin AI card management"
        title="Manage AI cards."
      >
        Add or delete AI capability cards directly from the system.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button type="button" onClick={loadAiCards} style={secondaryButtonStyle}>
          Refresh AI Cards
        </button>
      </div>

      {error && (
        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(153, 27, 27, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(22, 101, 52, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#166534' }}>
            {successMessage}
          </p>
        </div>
      )}

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Content controls</p>
            <h3 style={styles.smallCardTitle}>Add new AI card</h3>
          </div>

          <Pill>{aiCards.length} saved cards</Pill>
        </div>

        <form onSubmit={handleAddAiCard} style={formGridStyle}>
          <label style={fieldStyle}>
            AI card title
            <input
              value={formValues.title}
              onChange={(event) => updateFormField('title', event.target.value)}
              placeholder="Example: AI that Understands Text"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            Type of AI
            <input
              value={formValues.ai_type}
              onChange={(event) => updateFormField('ai_type', event.target.value)}
              placeholder="Example: AI that understands written language"
              style={inputStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            What this AI can do
            <textarea
              value={formValues.what_it_can_do}
              onChange={(event) =>
                updateFormField('what_it_can_do', event.target.value)
              }
              placeholder="Explain what this AI capability can do."
              rows={4}
              style={textareaStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Examples
            <textarea
              value={formValues.examples}
              onChange={(event) =>
                updateFormField('examples', event.target.value)
              }
              placeholder="Write each example on a new line. Example: Chatbots"
              rows={3}
              style={textareaStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Reflection question
            <textarea
              value={formValues.think_about_it}
              onChange={(event) =>
                updateFormField('think_about_it', event.target.value)
              }
              placeholder="Example: How could this AI help learners study better?"
              rows={3}
              style={textareaStyle}
            />
          </label>

          <div style={{ ...styles.centerButtonRow, gridColumn: '1 / -1' }}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving ? 'Saving...' : 'Add AI Card'}
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
            <p style={styles.eyebrow}>AI card records</p>
            <h3 style={styles.smallCardTitle}>Current AI cards</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${aiCards.length} cards`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading AI cards from the system...
          </p>
        ) : aiCards.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No AI cards found in the system yet.
          </p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>AI Card Title</th>
                  <th style={thStyle}>Type of AI</th>
                  <th style={thStyle}>What It Can Do</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {aiCards.map((card) => (
                  <tr key={card.firestoreId || card.id}>
                    <td style={tdStyle}>{card.id}</td>

                    <td style={tdStyle}>
                      <strong>{card.title}</strong>
                      <p style={tableSmallTextStyle}>
                        {card.think_about_it || 'No reflection question saved.'}
                      </p>
                    </td>

                    <td style={tdStyle}>{card.ai_type || card.type}</td>

                    <td style={tdStyle}>
                      {card.what_it_can_do || card.canDo || 'No capability saved.'}
                    </td>

                    <td style={tdStyle}>
                      <Pill tone={card.isActive === false ? 'default' : 'success'}>
                        {card.isActive === false ? 'Inactive' : 'Active'}
                      </Pill>
                    </td>

                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => handleDeleteAiCard(card)}
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

export default AdminAiCardsScreen