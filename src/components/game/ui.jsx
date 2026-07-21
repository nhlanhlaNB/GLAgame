import { styles, colors } from './gameStyles'

export function SectionHeader({ eyebrow, title, children, centered = false }) {
  return (
    <div style={{ textAlign: centered ? 'center' : 'left' }}>
      {eyebrow && <p style={styles.eyebrow}>{eyebrow}</p>}
      <h1 style={centered ? styles.bigTitle : styles.sectionTitle}>{title}</h1>
      {children && <p style={styles.paragraph}>{children}</p>}
    </div>
  )
}

export function MetricCard({ title, value, helper }) {
  return (
    <div
      style={{
        padding: '18px',
        borderRadius: '22px',
        background: 'rgba(255, 255, 255, 0.6)',
        border: '1px solid rgba(139, 92, 40, 0.16)'
      }}
    >
      <strong
        style={{
          display: 'block',
          color: colors.brown,
          fontSize: '1.55rem',
          lineHeight: '1.1',
          overflowWrap: 'anywhere'
        }}
      >
        {value}
      </strong>
      <span style={{ color: colors.brown2, fontSize: '0.9rem', fontWeight: '650' }}>
        {title}
      </span>
      {helper && (
        <p style={{ margin: '8px 0 0', color: colors.text, fontSize: '0.82rem', lineHeight: '1.5' }}>
          {helper}
        </p>
      )}
    </div>
  )
}

export function ActionButton({ children, variant = 'primary', disabled, ...props }) {
  const base = variant === 'primary' ? styles.primaryButton : styles.secondaryButton

  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...base,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'default' : 'pointer'
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div style={styles.smallCard}>
      <h3 style={styles.smallCardTitle}>{title}</h3>
      <p style={styles.smallCardText}>{children}</p>
    </div>
  )
}

export function ProgressBar({ value, max = 100 }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div
      style={{
        width: '100%',
        height: '9px',
        marginTop: '10px',
        borderRadius: '999px',
        background: 'rgba(139, 92, 40, 0.16)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: '999px',
          background: `linear-gradient(135deg, ${colors.gold}, ${colors.brown})`
        }}
      ></div>
    </div>
  )
}

export function DataTable({ columns, rows, emptyText = 'No data available yet.' }) {
  if (!rows || rows.length === 0) {
    return <EmptyState title="Nothing to show yet">{emptyText}</EmptyState>
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={styles.th}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((column) => (
                <td key={column.key} style={styles.td}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pill({ children, tone = 'default' }) {
  const toneStyle =
    tone === 'success'
      ? { background: 'rgba(21, 128, 61, 0.12)', color: colors.success }
      : tone === 'danger'
        ? { background: 'rgba(185, 28, 28, 0.1)', color: colors.danger }
        : {}

  return <span style={{ ...styles.chip, ...toneStyle }}>{children}</span>
}



export function LoadingPage({ title = 'Loading data', message = 'Connecting to the system and preparing this page...', compact = false }) {
  return (
    <div
      style={{
        ...styles.panel,
        minHeight: compact ? '220px' : 'min(520px, 70vh)',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-40% -10% auto auto',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,210,138,0.42), rgba(154,106,34,0))'
        }}
      />
      <style>{'@keyframes glaSpin { to { transform: rotate(360deg); } }'}</style>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
        <div style={loadingSpinnerStyle} aria-hidden="true" />
        <p style={{ ...styles.eyebrow, marginTop: 18 }}>Please wait</p>
        <h2 style={{ ...styles.sectionTitle, fontSize: 'clamp(2rem, 4vw, 3.2rem)', marginBottom: 10 }}>
          {title}
        </h2>
        <p style={{ ...styles.paragraph, fontWeight: 700 }}>{message}</p>
      </div>
    </div>
  )
}

const loadingSpinnerStyle = {
  width: 58,
  height: 58,
  margin: '0 auto',
  borderRadius: '50%',
  border: '6px solid rgba(154, 106, 34, 0.18)',
  borderTopColor: colors.gold,
  animation: 'glaSpin 0.85s linear infinite'
}

export function Toggle({ label, checked, onChange, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        ...styles.smallCard,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: checked ? '2px solid rgba(154, 106, 34, 0.62)' : styles.smallCard.border
      }}
    >
      <div style={styles.rowBetween}>
        <div>
          <h3 style={styles.smallCardTitle}>{label}</h3>
          {description && <p style={styles.smallCardText}>{description}</p>}
        </div>
        <span style={{ ...styles.chip, minWidth: '64px', justifyContent: 'center' }}>
          {checked ? 'On' : 'Off'}
        </span>
      </div>
    </button>
  )
}
