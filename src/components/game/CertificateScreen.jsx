import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { styles } from './gameStyles'
import { ActionButton, MetricCard, SectionHeader } from './ui'
import certificateBg from '../../assets/images/certificate-bg.jpg'

const NAME_TOP_PERCENT = 56.5
const NAME_FONT_SIZE_PERCENT = 3.1

function makeSafeFileName(value) {
  return String(value || 'GLA-AI-Certificate')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'GLA-AI-Certificate'
}

function downloadHtmlCertificate({ certificateHtml, certificateId }) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${certificateId}</title></head><body>${certificateHtml}</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${makeSafeFileName(certificateId)}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function CertificateScreen({
  fullName,
  completedProblems,
  averageScore,
  certificateUnlocked,
  certificateId,
  issueDate: _issueDate,
  onBackToDashboard
}) {
  const certificateRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownloadCertificate() {
    if (!certificateUnlocked || !certificateRef.current) return

    setIsDownloading(true)

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null
      })

      const imageData = canvas.toDataURL('image/png', 1)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageRatio = canvas.width / canvas.height
      let renderWidth = pageWidth
      let renderHeight = renderWidth / imageRatio

      if (renderHeight > pageHeight) {
        renderHeight = pageHeight
        renderWidth = renderHeight * imageRatio
      }

      const x = (pageWidth - renderWidth) / 2
      const y = (pageHeight - renderHeight) / 2

      pdf.addImage(imageData, 'PNG', x, y, renderWidth, renderHeight)
      pdf.save(`${makeSafeFileName(certificateId || 'GLA-AI-Certificate')}.pdf`)
    } catch (error) {
      console.error(error)
      downloadHtmlCertificate({
        certificateHtml: certificateRef.current.outerHTML,
        certificateId: certificateId || 'GLA-AI-Certificate'
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Certificate" title="GRIT Lab Africa certificate">
        Complete 10 problem cards with an average score of 75 or higher to unlock your certificate.
      </SectionHeader>

      <div style={styles.metricGrid}>
        <MetricCard title="Completed Problems" value={completedProblems} />
        <MetricCard title="Average Score" value={`${averageScore}%`} />
        <MetricCard title="Certificate Status" value={certificateUnlocked ? 'Unlocked' : 'Locked'} />
        <MetricCard title="Certificate ID" value={certificateUnlocked ? certificateId : 'Pending'} />
      </div>

      <div
        ref={certificateRef}
        className="certificateCanvas"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          marginTop: '24px',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 22px 48px rgba(80, 52, 20, 0.18)'
        }}
      >
        <img
          src={certificateBg}
          alt="Certificate"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        <div
          style={{
            position: 'absolute',
            top: `${NAME_TOP_PERCENT}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '56%',
            textAlign: 'center',
            fontFamily: "'Brush Script MT', cursive",
            fontSize: `${NAME_FONT_SIZE_PERCENT}vw`,
            color: '#0b1f3a',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {fullName || 'Player'}
        </div>
      </div>

      {!certificateUnlocked && (
        <p style={{ ...styles.dangerText, textAlign: 'center', marginTop: '18px' }}>
          Certificate is still locked. You need 10 completed problem cards and an average score of at least 75%.
        </p>
      )}

      <div style={styles.centerButtonRow}>
        <ActionButton onClick={handleDownloadCertificate} disabled={!certificateUnlocked || isDownloading}>
          {isDownloading ? 'Preparing PDF...' : 'Download Certificate PDF'}
        </ActionButton>

        <ActionButton variant="secondary" onClick={onBackToDashboard}>
          Back to Dashboard
        </ActionButton>
      </div>
    </div>
  )
}

export default CertificateScreen