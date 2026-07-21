import { styles } from '../../game/gameStyles'
import { Pill } from '../../game/ui'

export const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 16,
  border: '1px solid rgba(139, 92, 40, 0.24)', background: 'rgba(255,255,255,0.76)', color: '#3b2817', outline: 'none'
}

export const primaryButtonStyle = {
  border: 0, borderRadius: 999, padding: '11px 16px', cursor: 'pointer',
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)', color: '#fff8eb', fontWeight: 850
}

export const secondaryButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)', borderRadius: 999, padding: '11px 16px', cursor: 'pointer',
  background: 'rgba(255,255,255,0.72)', color: '#5c3512', fontWeight: 850
}

export const dangerButtonStyle = {
  border: '1px solid rgba(153, 27, 27, 0.28)', borderRadius: 999, padding: '8px 11px', cursor: 'pointer',
  background: 'rgba(254,226,226,0.86)', color: '#991b1b', fontWeight: 850
}

export function MessageCard({ message, tone = 'success' }) {
  if (!message) return null
  const isError = tone === 'error'
  return (
    <div style={{ ...styles.smallCard, marginTop: 18, borderColor: isError ? 'rgba(153,27,27,0.28)' : 'rgba(22,101,52,0.28)' }}>
      <p style={{ ...styles.smallCardText, color: isError ? '#991b1b' : '#166534' }}>{message}</p>
    </div>
  )
}

export function Field({ label, children }) {
  return <label style={{ display: 'grid', gap: 8, color: '#5c3512', fontWeight: 850 }}>{label}{children}</label>
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
}

export function SimpleTable({ rows, columns, loading, emptyText = 'No data found.' }) {
  if (loading) return <p style={{ ...styles.smallCardText, marginTop: 16 }}>Loading data...</p>
  if (!rows.length) return <p style={{ ...styles.smallCardText, marginTop: 16 }}>{emptyText}</p>
  return (
    <div style={{ marginTop: 16, width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{columns.map((column) => <th key={column.key} style={thStyle}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.firestoreId || row.id || row.userId || row.rewardId || index}>
              {columns.map((column) => <td key={column.key} style={tdStyle}>{column.render ? column.render(row) : String(row[column.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusPill({ value }) {
  const text = String(value || 'pending')
  const good = ['active', 'approved', 'issued', 'open', 'published', 'ready', 'completed'].includes(text.toLowerCase())
  return <Pill tone={good ? 'success' : 'default'}>{text}</Pill>
}

export function downloadCsv(filename, rows) {
  const safeRows = rows || []
  const headers = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row))))
  const csv = [headers.join(','), ...safeRows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const thStyle = { padding: '12px 14px', textAlign: 'left', color: '#5c3512', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid rgba(139,92,40,0.2)', background: 'rgba(244,210,138,0.22)' }
const tdStyle = { padding: 14, color: '#3b2817', borderBottom: '1px solid rgba(139,92,40,0.14)', verticalAlign: 'top' }
