import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import {
  addAdminScoringRubric,
  deleteAdminScoringRubric,
  getAdminScoringRubrics,
  getRubricTotalScore,
  seedDefaultScoringRubrics
} from '../../services/admin/adminRubricService'

const emptyForm = {
  categoryName: '',
  maxScore: '',
  description: '',
  order: ''
}

function AdminScoringRubricScreen() {
  const [rubrics, setRubrics] = useState([])
  const [formValues, setFormValues] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadRubrics() {
    setLoading(true)
    setError('')

    try {
      const rows = await getAdminScoringRubrics()
      setRubrics(rows)
    } catch (err) {
      setError(err.message || 'Could not load scoring rubrics from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRubrics()
  }, [])

  function updateFormField(field, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [field]: value
    }))
  }

  async function handleSeedDefaultRubrics() {
    const confirmed = window.confirm(
      'Create or update the default 7 scoring rubric areas in the system?'
    )

    if (!confirmed) {
      return
    }

    setSeeding(true)
    setError('')
    setSuccessMessage('')

    try {
      const count = await seedDefaultScoringRubrics()
      setSuccessMessage(`${count} default scoring rubric areas saved.`)
      await loadRubrics()
    } catch (err) {
      setError(err.message || 'Could not seed default scoring rubrics.')
    } finally {
      setSeeding(false)
    }
  }

  async function handleAddRubric(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      await addAdminScoringRubric(formValues)
      setFormValues(emptyForm)
      setSuccessMessage('Scoring rubric area saved successfully.')
      await loadRubrics()
    } catch (err) {
      setError(err.message || 'Could not save scoring rubric area.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRubric(rubric) {
    const confirmed = window.confirm(
      `Delete "${rubric.categoryName}" from the system scoringRubrics?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(rubric.firestoreId)
    setError('')
    setSuccessMessage('')

    try {
      await deleteAdminScoringRubric(rubric)
      setSuccessMessage('Scoring rubric area deleted successfully.')
      await loadRubrics()
    } catch (err) {
      setError(err.message || 'Could not delete scoring rubric area.')
    } finally {
      setDeletingId('')
    }
  }

  const totalScore = getRubricTotalScore(rubrics)

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Admin scoring rubric management"
        title="Manage the scoring engine evaluation rubric."
      >
        These rubric areas define how player explanations are scored out of 100.
        Data is loaded from the system scoringRubrics.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button type="button" onClick={loadRubrics} style={secondaryButtonStyle}>
          Refresh Rubrics
        </button>

        <button
          type="button"
          onClick={handleSeedDefaultRubrics}
          disabled={seeding}
          style={primaryButtonStyle}
        >
          {seeding ? 'Creating...' : 'Create Default 100-Point Rubric'}
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

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Rubric Areas</p>
          <h3 style={styles.smallCardTitle}>{rubrics.length}</h3>
          <p style={styles.smallCardText}>Loaded from the system.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Total Score</p>
          <h3 style={styles.smallCardTitle}>{totalScore}/100</h3>
          <p style={styles.smallCardText}>
            The scoring rubric should add up to 100.
          </p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Rubric Status</p>
          <h3 style={styles.smallCardTitle}>
            {totalScore === 100 ? 'Ready' : 'Check Total'}
          </h3>
          <p style={styles.smallCardText}>
            {totalScore === 100
              ? 'The rubric is correctly balanced.'
              : 'Adjust the max scores until they equal 100.'}
          </p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Content controls</p>
            <h3 style={styles.smallCardTitle}>Add scoring rubric area</h3>
          </div>

          <Pill>{rubrics.length} the system rows</Pill>
        </div>

        <form onSubmit={handleAddRubric} style={formGridStyle}>
          <label style={fieldStyle}>
            Rubric category name
            <input
              value={formValues.categoryName}
              onChange={(event) =>
                updateFormField('categoryName', event.target.value)
              }
              placeholder="Example: AI Card Relevance"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            Maximum score
            <input
              value={formValues.maxScore}
              onChange={(event) =>
                updateFormField('maxScore', event.target.value)
              }
              placeholder="Example: 20"
              type="number"
              min="1"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            Display order
            <input
              value={formValues.order}
              onChange={(event) =>
                updateFormField('order', event.target.value)
              }
              placeholder="Example: 1"
              type="number"
              min="1"
              style={inputStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Description
            <textarea
              value={formValues.description}
              onChange={(event) =>
                updateFormField('description', event.target.value)
              }
              placeholder="Explain what this scoring area measures."
              rows={3}
              style={textareaStyle}
            />
          </label>

          <div style={{ ...styles.centerButtonRow, gridColumn: '1 / -1' }}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving ? 'Saving...' : 'Save Rubric Area'}
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
            <p style={styles.eyebrow}>the system scoringRubrics collection</p>
            <h3 style={styles.smallCardTitle}>Current scoring rubric</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${rubrics.length} areas`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading scoring rubric from the system...
          </p>
        ) : rubrics.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No scoring rubric found. Click “Create Default 100-Point Rubric”.
          </p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Scoring Area</th>
                  <th style={thStyle}>Max Score</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rubrics.map((rubric) => (
                  <tr key={rubric.firestoreId || rubric.rubricId}>
                    <td style={tdStyle}>{rubric.order}</td>

                    <td style={tdStyle}>
                      <strong>{rubric.categoryName}</strong>
                    </td>

                    <td style={tdStyle}>{rubric.maxScore}</td>

                    <td style={tdStyle}>{rubric.description}</td>

                    <td style={tdStyle}>
                      <Pill tone={rubric.isActive === false ? 'default' : 'success'}>
                        {rubric.isActive === false ? 'Inactive' : 'Active'}
                      </Pill>
                    </td>

                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => handleDeleteRubric(rubric)}
                        disabled={deletingId === rubric.firestoreId}
                        style={dangerButtonStyle}
                      >
                        {deletingId === rubric.firestoreId
                          ? 'Deleting...'
                          : 'Delete'}
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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

export default AdminScoringRubricScreen