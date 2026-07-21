import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import {
  getAdminCardImageTargets,
  getCertificateTemplate,
  saveCertificateTemplate,
  uploadCardImage,
  uploadCertificateTemplateAsset
} from '../../services/admin/adminAssetTemplateService'

const emptyCertificateForm = {
  certificateTitle: '',
  certificateSubtitle: '',
  bodyText: '',
  signerName: '',
  signerTitle: '',
  verificationText: ''
}

function AdminAssetTemplateScreen({ type }) {
  const isCertificate = type === 'certificate'

  if (isCertificate) {
    return <CertificateTemplateManager />
  }

  return <CardImageManager />
}

function CardImageManager() {
  const [cards, setCards] = useState([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [imageRole, setImageRole] = useState('front')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadCards() {
    setLoading(true)
    setError('')

    try {
      const rows = await getAdminCardImageTargets()
      setCards(rows)
      if (!selectedCardId && rows.length > 0) {
        setSelectedCardId(`${rows[0].cardType}:${rows[0].firestoreId}`)
      }
    } catch (err) {
      setError(err.message || 'Could not load cards from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [])

  const selectedCard = useMemo(() => {
    return cards.find(
      (card) => `${card.cardType}:${card.firestoreId}` === selectedCardId
    )
  }, [cards, selectedCardId])

  async function handleUploadCardImage(event) {
    event.preventDefault()
    setUploading(true)
    setError('')
    setSuccessMessage('')

    try {
      await uploadCardImage({
        cardType: selectedCard?.cardType,
        card: selectedCard,
        imageRole,
        file: selectedFile
      })

      setSelectedFile(null)
      setSuccessMessage('Card image uploaded and saved successfully.')
      await loadCards()
    } catch (err) {
      setError(err.message || 'Could not upload card image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Admin card image upload"
        title="Upload and manage card images."
      >
        Upload problem-card and AI-card images to secure file storage, then save
        the image URL back into the selected the system card document.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button type="button" onClick={loadCards} style={secondaryButtonStyle}>
          Refresh Cards
        </button>
      </div>

      {error && (
        <MessageCard message={error} tone="error" />
      )}

      {successMessage && (
        <MessageCard message={successMessage} tone="success" />
      )}

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Image upload controls</p>
            <h3 style={styles.smallCardTitle}>Upload card image</h3>
          </div>

          <Pill>{cards.length} cards loaded</Pill>
        </div>

        <form onSubmit={handleUploadCardImage} style={formGridStyle}>
          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Select card
            <select
              value={selectedCardId}
              onChange={(event) => setSelectedCardId(event.target.value)}
              style={inputStyle}
            >
              {cards.map((card) => (
                <option
                  key={`${card.cardType}:${card.firestoreId}`}
                  value={`${card.cardType}:${card.firestoreId}`}
                >
                  {card.cardType === 'ai' ? 'AI Card' : 'Problem Card'} #{card.id} - {card.title}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            Image position
            <select
              value={imageRole}
              onChange={(event) => setImageRole(event.target.value)}
              style={inputStyle}
            >
              <option value="front">Front image</option>
              <option value="back">Back image</option>
            </select>
          </label>

          <label style={fieldStyle}>
            Choose image file
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              style={inputStyle}
            />
          </label>

          <div style={{ ...styles.centerButtonRow, gridColumn: '1 / -1' }}>
            <button
              type="submit"
              disabled={uploading || loading || cards.length === 0}
              style={primaryButtonStyle}
            >
              {uploading ? 'Uploading...' : 'Upload Card Image'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>saved cards</p>
            <h3 style={styles.smallCardTitle}>Current card image status</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${cards.length} cards`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading card image data from the system...
          </p>
        ) : cards.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No cards found in the system yet.
          </p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Card</th>
                  <th style={thStyle}>Front Image</th>
                  <th style={thStyle}>Back Image</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {cards.map((card) => (
                  <tr key={`${card.cardType}:${card.firestoreId}`}>
                    <td style={tdStyle}>
                      {card.cardType === 'ai' ? 'AI Card' : 'Problem Card'}
                    </td>

                    <td style={tdStyle}>
                      <strong>#{card.id} {card.title}</strong>
                    </td>

                    <td style={tdStyle}>
                      {card.frontImageUrl ? (
                        <a href={card.frontImageUrl} target="_blank" rel="noreferrer">
                          View front image
                        </a>
                      ) : (
                        'Not uploaded'
                      )}
                    </td>

                    <td style={tdStyle}>
                      {card.backImageUrl ? (
                        <a href={card.backImageUrl} target="_blank" rel="noreferrer">
                          View back image
                        </a>
                      ) : (
                        card.backImageName || 'Not uploaded'
                      )}
                    </td>

                    <td style={tdStyle}>
                      <Pill tone={card.frontImageUrl || card.backImageUrl ? 'success' : 'default'}>
                        {card.frontImageUrl || card.backImageUrl ? 'Has image' : 'Needs image'}
                      </Pill>
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

function CertificateTemplateManager() {
  const [formValues, setFormValues] = useState(emptyCertificateForm)
  const [template, setTemplate] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [backgroundFile, setBackgroundFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAsset, setUploadingAsset] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadTemplate() {
    setLoading(true)
    setError('')

    try {
      const row = await getCertificateTemplate()
      setTemplate(row)
      setFormValues({
        certificateTitle: row.certificateTitle || '',
        certificateSubtitle: row.certificateSubtitle || '',
        bodyText: row.bodyText || '',
        signerName: row.signerName || '',
        signerTitle: row.signerTitle || '',
        verificationText: row.verificationText || ''
      })
    } catch (err) {
      setError(err.message || 'Could not load certificate template.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplate()
  }, [])

  function updateFormField(field, value) {
    setFormValues((previousValues) => ({
      ...previousValues,
      [field]: value
    }))
  }

  async function handleSaveTemplate(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      await saveCertificateTemplate(formValues)
      setSuccessMessage('Certificate template saved successfully.')
      await loadTemplate()
    } catch (err) {
      setError(err.message || 'Could not save certificate template.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadAsset(assetType, file) {
    setUploadingAsset(assetType)
    setError('')
    setSuccessMessage('')

    try {
      await uploadCertificateTemplateAsset({ assetType, file })
      setSuccessMessage(`${assetType} asset uploaded successfully.`)

      if (assetType === 'logo') setLogoFile(null)
      if (assetType === 'background') setBackgroundFile(null)
      if (assetType === 'signature') setSignatureFile(null)

      await loadTemplate()
    } catch (err) {
      setError(err.message || `Could not upload ${assetType} asset.`)
    } finally {
      setUploadingAsset('')
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Admin certificate template management"
        title="Manage certificate templates."
      >
        Save certificate wording in platform settings and upload certificate
        assets to secure file storage.
      </SectionHeader>

      <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
        <button type="button" onClick={loadTemplate} style={secondaryButtonStyle}>
          Refresh Template
        </button>
      </div>

      {error && (
        <MessageCard message={error} tone="error" />
      )}

      {successMessage && (
        <MessageCard message={successMessage} tone="success" />
      )}

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Certificate wording</p>
            <h3 style={styles.smallCardTitle}>Edit certificate template</h3>
          </div>

          <Pill>{loading ? 'Loading...' : 'appSettings/certificateTemplate'}</Pill>
        </div>

        <form onSubmit={handleSaveTemplate} style={formGridStyle}>
          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Certificate title
            <input
              value={formValues.certificateTitle}
              onChange={(event) =>
                updateFormField('certificateTitle', event.target.value)
              }
              placeholder="Artificial Intelligence and Practical Applications"
              style={inputStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Certificate subtitle
            <input
              value={formValues.certificateSubtitle}
              onChange={(event) =>
                updateFormField('certificateSubtitle', event.target.value)
              }
              placeholder="Gaming SDG Problems and Ideating Solutions for Africa"
              style={inputStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Body text
            <textarea
              value={formValues.bodyText}
              onChange={(event) =>
                updateFormField('bodyText', event.target.value)
              }
              placeholder="This certifies that..."
              rows={4}
              style={textareaStyle}
            />
          </label>

          <label style={fieldStyle}>
            Signer name
            <input
              value={formValues.signerName}
              onChange={(event) =>
                updateFormField('signerName', event.target.value)
              }
              placeholder="GRIT Lab Africa"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            Signer title
            <input
              value={formValues.signerTitle}
              onChange={(event) =>
                updateFormField('signerTitle', event.target.value)
              }
              placeholder="Innovation and AI Literacy Programme"
              style={inputStyle}
            />
          </label>

          <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            Verification text
            <input
              value={formValues.verificationText}
              onChange={(event) =>
                updateFormField('verificationText', event.target.value)
              }
              placeholder="Certificate verification ID"
              style={inputStyle}
            />
          </label>

          <div style={{ ...styles.centerButtonRow, gridColumn: '1 / -1' }}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>
              {saving ? 'Saving...' : 'Save Certificate Template'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Certificate assets</p>
            <h3 style={styles.smallCardTitle}>Upload logo, background and signature</h3>
          </div>

          <Pill>secure file storage</Pill>
        </div>

        <div style={assetGridStyle}>
          <AssetUploadBox
            title="Certificate logo"
            currentUrl={template?.logoUrl}
            file={logoFile}
            onFileChange={setLogoFile}
            onUpload={() => handleUploadAsset('logo', logoFile)}
            uploading={uploadingAsset === 'logo'}
          />

          <AssetUploadBox
            title="Certificate background"
            currentUrl={template?.backgroundUrl}
            file={backgroundFile}
            onFileChange={setBackgroundFile}
            onUpload={() => handleUploadAsset('background', backgroundFile)}
            uploading={uploadingAsset === 'background'}
          />

          <AssetUploadBox
            title="Signature image"
            currentUrl={template?.signatureUrl}
            file={signatureFile}
            onFileChange={setSignatureFile}
            onUpload={() => handleUploadAsset('signature', signatureFile)}
            uploading={uploadingAsset === 'signature'}
          />
        </div>
      </div>
    </div>
  )
}

function AssetUploadBox({
  title,
  currentUrl,
  file,
  onFileChange,
  onUpload,
  uploading
}) {
  return (
    <div style={assetBoxStyle}>
      <p style={styles.eyebrow}>{title}</p>

      {currentUrl ? (
        <a href={currentUrl} target="_blank" rel="noreferrer" style={assetLinkStyle}>
          View current asset
        </a>
      ) : (
        <p style={styles.smallCardText}>No asset uploaded yet.</p>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        style={inputStyle}
      />

      <button
        type="button"
        onClick={onUpload}
        disabled={!file || uploading}
        style={primaryButtonStyle}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}

function MessageCard({ message, tone }) {
  const isError = tone === 'error'

  return (
    <div
      style={{
        ...styles.smallCard,
        marginTop: 18,
        borderColor: isError
          ? 'rgba(153, 27, 27, 0.28)'
          : 'rgba(22, 101, 52, 0.28)'
      }}
    >
      <p
        style={{
          ...styles.smallCardText,
          color: isError ? '#991b1b' : '#166534'
        }}
      >
        {message}
      </p>
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

const assetGridStyle = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
}

const assetBoxStyle = {
  padding: 18,
  borderRadius: 22,
  background: 'rgba(255, 255, 255, 0.64)',
  border: '1px solid rgba(139, 92, 40, 0.16)',
  display: 'grid',
  gap: 12
}

const assetLinkStyle = {
  color: '#9a6a22',
  fontWeight: 850,
  textDecoration: 'underline'
}

export default AdminAssetTemplateScreen