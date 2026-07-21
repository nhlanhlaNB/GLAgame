export const colors = {
  dark: '#3b2817',
  dark2: '#4b2b10',
  brown: '#5c3512',
  brown2: '#6b5540',
  gold: '#9a6a22',
  lightGold: '#f4d28a',
  cream: '#fff8eb',
  text: '#5c4632',
  danger: '#991b1b',
  success: '#166534'
}

export const styles = {
  panel: {
    padding: '36px',
    borderRadius: '34px',
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(232, 214, 170, 0.68))',
    border: '1px solid rgba(139, 92, 40, 0.22)',
    boxShadow: '0 30px 80px rgba(80, 52, 20, 0.18)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)'
  },
  panelInner: {
    padding: '24px',
    borderRadius: '28px',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(139, 92, 40, 0.18)',
    boxShadow: '0 18px 42px rgba(80, 52, 20, 0.12)'
  },
  eyebrow: {
    margin: '0 0 10px',
    color: colors.gold,
    fontSize: '0.74rem',
    fontWeight: '850',
    letterSpacing: '0.14em',
    textTransform: 'uppercase'
  },
  bigTitle: {
    margin: '0 0 18px',
    color: colors.dark2,
    fontSize: 'clamp(2.5rem, 5vw, 4.8rem)',
    lineHeight: '0.95',
    letterSpacing: '-0.07em',
    fontWeight: '950',
    textAlign: 'center'
  },
  sectionTitle: {
    margin: '0 0 18px',
    color: colors.dark2,
    fontSize: 'clamp(2.2rem, 4vw, 3.8rem)',
    lineHeight: '1',
    letterSpacing: '-0.06em',
    fontWeight: '900'
  },
  paragraph: {
    margin: '0',
    color: colors.text,
    fontSize: '1rem',
    lineHeight: '1.7'
  },
  smallCard: {
    padding: '20px',
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.66)',
    border: '1px solid rgba(139, 92, 40, 0.18)',
    boxShadow: '0 14px 34px rgba(80, 52, 20, 0.1)'
  },
  smallCardTitle: {
    margin: '0 0 10px',
    color: colors.brown,
    fontSize: '1.2rem',
    lineHeight: '1.2',
    letterSpacing: '-0.035em'
  },
  smallCardText: {
    margin: '0',
    color: colors.text,
    lineHeight: '1.6',
    fontSize: '0.94rem'
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '18px'
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    marginTop: '18px'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
    marginTop: '24px'
  },
  centerButtonRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '26px'
  },
  primaryButton: {
    border: '0',
    borderRadius: '999px',
    padding: '13px 24px',
    cursor: 'pointer',
    background: `linear-gradient(135deg, ${colors.gold}, ${colors.brown})`,
    color: colors.cream,
    fontWeight: '850',
    fontSize: '0.95rem',
    boxShadow: '0 14px 30px rgba(92, 53, 18, 0.22)'
  },
  secondaryButton: {
    border: '1px solid rgba(139, 92, 40, 0.22)',
    borderRadius: '999px',
    padding: '13px 20px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.68)',
    color: colors.brown,
    fontWeight: '850'
  },
  dangerText: {
    margin: '12px 0 0',
    color: colors.danger,
    lineHeight: '1.6',
    fontWeight: '750'
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    marginTop: '14px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '680px'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    color: colors.brown,
    borderBottom: '1px solid rgba(139, 92, 40, 0.2)',
    background: 'rgba(255, 255, 255, 0.5)'
  },
  td: {
    padding: '12px',
    color: colors.text,
    borderBottom: '1px solid rgba(139, 92, 40, 0.12)'
  },
  listGrid: {
    display: 'grid',
    gap: '12px',
    marginTop: '12px'
  },
  rowBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap'
  },
  chip: {
    display: 'inline-flex',
    padding: '9px 12px',
    borderRadius: '999px',
    background: 'rgba(154, 106, 34, 0.13)',
    color: colors.brown,
    fontWeight: '900',
    fontSize: '0.82rem'
  }
}
