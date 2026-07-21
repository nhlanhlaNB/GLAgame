import { styles } from './gameStyles'
import { ActionButton, SectionHeader } from './ui'

function GameGuideScreen({ firstName, onChooseProblems }) {
  const guideItems = [
    { title: '1. Choose problems', text: 'Select at least 10 problem cards to create your active problem stack.' },
    { title: '2. Pick AI cards', text: 'Use one, two or three AI cards as solution tools for each problem.' },
    { title: '3. Explain your idea', text: 'Write a short explanation of why the selected AI cards can solve the problem.' },
    { title: '4. Earn GLA coin', text: 'The scoring engine gives a score out of 100. That score becomes your GLA coin.' },
    { title: '5. Track progress', text: 'Your score, completed cards, achievements, levels and wallet update as you play.' },
    { title: '6. Unlock certificate', text: 'Complete 10 problem cards with an average score of at least 75.' }
  ]

  return (
    <div style={styles.panel}>
      <div style={stickyHeroActionStyle}>
        <div>
          <p style={styles.eyebrow}>Ready to start</p>
          <h2 style={stickyHeroTitleStyle}>Journey guide</h2>
          <p style={stickyHeroTextStyle}>Read the steps, then start choosing your SDG problem cards.</p>
        </div>

        <ActionButton onClick={onChooseProblems}>Choose Problem Cards</ActionButton>
      </div>

      <SectionHeader eyebrow="Game explanation" title="Use AI cards to solve African problem cards." centered>
        Hi {firstName}, choose real African problem cards, select one to three AI cards, explain your idea in 100 words or less, and get scored on practicality, ethics, creativity, SDG alignment and African context.
      </SectionHeader>


      <div style={{ ...styles.cardGrid, maxWidth: '980px', marginLeft: 'auto', marginRight: 'auto' }}>
        {guideItems.map((item) => (
          <div key={item.title} style={guideCardStyle}>
            <h3 style={styles.smallCardTitle}>{item.title}</h3>
            <p style={styles.smallCardText}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const stickyHeroActionStyle = {
  position: 'sticky',
  top: 104,
  zIndex: 20,
  marginBottom: 24,
  padding: '16px 18px',
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  background: 'linear-gradient(135deg, rgba(255, 248, 235, 0.96), rgba(244, 210, 138, 0.92))',
  border: '1px solid rgba(154, 106, 34, 0.34)',
  boxShadow: '0 18px 44px rgba(80, 52, 20, 0.18)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)'
}

const stickyHeroTitleStyle = {
  margin: 0,
  color: '#4b2b10',
  fontSize: '1.25rem',
  letterSpacing: '-0.04em'
}

const stickyHeroTextStyle = {
  margin: '4px 0 0',
  color: '#6b5540',
  lineHeight: 1.5,
  fontSize: '0.92rem'
}

const guideCardStyle = {
  ...styles.smallCard,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,248,235,0.66))',
  border: '1px solid rgba(154, 106, 34, 0.18)'
}

export default GameGuideScreen
