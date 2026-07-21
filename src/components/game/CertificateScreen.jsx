import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { styles } from './gameStyles'
import { ActionButton, MetricCard, SectionHeader } from './ui'

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
  issueDate,
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
        backgroundColor: '#fff8eb'
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
      <style>{`
        .certificateCanvas { max-width: 100%; overflow-wrap: anywhere; }
        @media (max-width: 700px) {
          .certificateCanvas { padding: 24px !important; border-radius: 20px !important; }
          .certificateCanvas h1 { font-size: 1.65rem !important; }
          .certificateCanvas h2 { font-size: 1.45rem !important; }
        }
      `}</style>
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
          marginTop: '24px',
          padding: '42px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #fff8eb, #f4d28a)',
          border: '3px solid rgba(154, 106, 34, 0.65)',
          boxShadow: '0 22px 48px rgba(80, 52, 20, 0.18)',
          textAlign: 'center',
          color: '#3b2817'
        }}
      >
        <p style={{ margin: 0, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a6a22' }}>
          GRIT Lab Africa
        </p>

        <h1 style={{ margin: '18px 0 8px', fontSize: '2.3rem', color: '#5c3512' }}>
          Certificate of Achievement
        </h1>

        <p style={{ margin: '16px 0', fontSize: '1.05rem', fontWeight: 700 }}>
          This certificate is proudly awarded to
        </p>

        <h2 style={{ margin: '10px 0', fontSize: '2rem', color: '#9a6a22' }}>
          {fullName || 'Player'}
        </h2>

        <p style={{ margin: '18px auto', maxWidth: '850px', lineHeight: 1.7, fontSize: '1rem', fontWeight: 700 }}>
          for successfully completing the Artificial Intelligence and Practical Applications:
          Gaming SDG Problems and Ideating Solutions for Africa learning journey.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap', marginTop: '22px' }}>
          <span>Completed Problems: {completedProblems}</span>
          <span>Average Score: {averageScore}%</span>
<span>
  Date: {certificateUnlocked
    ? issueDate || new Date().toLocaleDateString('en-ZA')
    : 'Pending'}
</span>        </div>

        <p style={{ marginTop: '26px', fontSize: '0.9rem', fontWeight: 800 }}>
          Certificate ID: {certificateUnlocked ? certificateId : 'Pending'}
        </p>
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
