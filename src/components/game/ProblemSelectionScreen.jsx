import { useState } from 'react'
import { styles } from './gameStyles'
import { ActionButton, MetricCard, Pill, SectionHeader } from './ui'
import card1 from '../../assets/images/card1.jpeg'

function ProblemSelectionScreen({ cards, selectedProblemIds, onToggleProblem, onStartGame }) {
  const [flippedCardIds, setFlippedCardIds] = useState([])
  const selectedCount = selectedProblemIds.length
  const remainingCount = Math.max(0, 10 - selectedCount)
  const canStart = selectedCount >= 10

  function toggleFlip(cardId) {
    setFlippedCardIds((previousIds) =>
      previousIds.includes(cardId)
        ? previousIds.filter((id) => id !== cardId)
        : [...previousIds, cardId]
    )
  }

  function handleSelect(event, cardId) {
    event.stopPropagation()
    onToggleProblem(cardId)
  }

  return (
    <div style={styles.panel}>
      <div style={stickySelectionBarStyle}>
        <div style={selectionSummaryStyle}>
          <div>
            <p style={styles.eyebrow}>Problem stack</p>
            <h2 style={stickyTitleStyle}>{selectedCount}/10 selected</h2>
          </div>

          <div style={miniProgressTrackStyle}>
            <div style={{ ...miniProgressFillStyle, width: `${Math.min(100, (selectedCount / 10) * 100)}%` }}></div>
          </div>

          <p style={stickyHelpStyle}>
            {canStart ? 'Your stack is ready. Start the game whenever you are ready.' : `Choose ${remainingCount} more card${remainingCount === 1 ? '' : 's'} to unlock the game.`}
          </p>
        </div>

        <ActionButton onClick={onStartGame} disabled={!canStart}>
          Start Game
        </ActionButton>
      </div>

      <SectionHeader eyebrow="Problem card selection" title="Build your active problem stack.">
        Choose at least 10 problem cards. The game will randomly present cards from this stack. You can choose more than 10 if you want more variety.
      </SectionHeader>

      <div style={styles.metricGrid}>
        <MetricCard title="Selected" value={selectedCount} helper={canStart ? 'Ready to play' : `${remainingCount} more needed`} />
        <MetricCard title="Required" value="10" helper="Minimum stack size" />
        <MetricCard title="Total Cards" value={cards.length} helper="Available from the system" />
      </div>

      <div style={styles.cardGrid}>
        {cards.map((card, index) => {
          const selected = selectedProblemIds.includes(card.id)
          const flipped = flippedCardIds.includes(card.id)
          const cardCode = `PC${card.id || index + 1}`

          return (
            <article key={card.id} style={cardSceneStyle}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleFlip(card.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleFlip(card.id)
                  }
                }}
                aria-pressed={flipped}
                style={{
                  ...cardFlipInnerStyle,
                  transform: 'none'
                }}
              >
                <div
                  style={{
                    ...cardFaceStyle,
                    ...cardFrontStyle,
                    opacity: flipped ? 0 : 1,
                    visibility: flipped ? 'hidden' : 'visible',
                    pointerEvents: flipped ? 'none' : 'auto',
                    zIndex: flipped ? 1 : 2,
                    border: selected ? '2px solid rgba(154, 106, 34, 0.82)' : '1px solid rgba(139, 92, 40, 0.18)',
                    boxShadow: selected ? '0 22px 48px rgba(80, 52, 20, 0.22)' : '0 12px 28px rgba(80, 52, 20, 0.08)'
                  }}
                >
                  <img src={card1} alt="Problem card cover" style={coverImageStyle} />
                  <div style={coverOverlayStyle}></div>

                  <div style={coverContentStyle}>
                    <div style={styles.rowBetween}>
                      <span style={cardCodeBadgeStyle}>{cardCode}</span>
                      {selected && <span style={selectedBadgeStyle}>✓</span>}
                    </div>

                    <div>
                      <p style={coverEyebrowStyle}></p>
                      <h3 style={coverTitleStyle}></h3>
                    </div>

                    <div style={coverFooterStyle}>
                      <button type="button" onClick={(event) => handleSelect(event, card.id)} style={selected ? selectedButtonStyle : selectButtonStyle}>
                        {selected ? 'Selected' : 'Select Card'}
                      </button>
                      <span style={flipHintStyle}>Tap to flip</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    ...cardFaceStyle,
                    ...cardBackStyle,
                    opacity: flipped ? 1 : 0,
                    visibility: flipped ? 'visible' : 'hidden',
                    pointerEvents: flipped ? 'auto' : 'none',
                    zIndex: flipped ? 2 : 1,
                    border: selected ? '2px solid rgba(154, 106, 34, 0.82)' : '1px solid rgba(139, 92, 40, 0.18)',
                    boxShadow: selected ? '0 22px 48px rgba(80, 52, 20, 0.22)' : '0 12px 28px rgba(80, 52, 20, 0.08)'
                  }}
                >
                  <div style={styles.rowBetween}>
                    <p style={styles.eyebrow}>{selected ? 'Selected' : cardCode}</p>
                    {selected && <span style={selectedBadgeStyle}>✓</span>}
                  </div>

                  <h3 style={styles.smallCardTitle}>{card.title}</h3>
                  <p style={styles.smallCardText}>{card.problem}</p>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Pill>{card.problem_type}</Pill>
                    {card.linked_sdgs && <Pill>{String(card.linked_sdgs).split(',')[0]}</Pill>}
                  </div>

                  <div style={backFooterStyle}>
                    <button type="button" onClick={(event) => handleSelect(event, card.id)} style={selected ? selectedButtonStyle : selectButtonStyle}>
                      {selected ? 'Remove from Stack' : 'Select Card'}
                    </button>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation()
                      toggleFlip(card.id)
                    }} style={flipBackButtonStyle}>
                      Back to cover
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

const stickySelectionBarStyle = {
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

const selectionSummaryStyle = {
  display: 'grid',
  gap: 8,
  flex: '1 1 340px'
}

const stickyTitleStyle = {
  margin: 0,
  color: '#4b2b10',
  fontSize: '1.35rem',
  letterSpacing: '-0.045em'
}

const stickyHelpStyle = {
  margin: 0,
  color: '#6b5540',
  fontWeight: 750,
  lineHeight: 1.45,
  fontSize: '0.9rem'
}

const miniProgressTrackStyle = {
  width: '100%',
  maxWidth: 520,
  height: 10,
  borderRadius: 999,
  background: 'rgba(139, 92, 40, 0.16)',
  overflow: 'hidden'
}

const miniProgressFillStyle = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
  transition: 'width 180ms ease'
}

const cardSceneStyle = {
  minHeight: 340,
  perspective: 1200
}

const cardFlipInnerStyle = {
  position: 'relative',
  width: '100%',
  minHeight: 340,
  transformStyle: 'flat',
  transition: 'opacity 260ms ease, transform 260ms ease',
  cursor: 'pointer'
}

const cardFaceStyle = {
  position: 'absolute',
  inset: 0,
  minHeight: 340,
  borderRadius: 24,
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  transform: 'translateZ(0)',
  transition: 'opacity 220ms ease, visibility 220ms ease'
}

const cardFrontStyle = {
  background: '#3b2817'
}

const cardBackStyle = {
  padding: 18,
  textAlign: 'left',
  color: '#3b2817',
  transform: 'translateZ(0)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255,248,235,0.72))',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const coverImageStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const coverOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(30, 19, 10, 0.24), rgba(30, 19, 10, 0.78))'
}

const coverContentStyle = {
  position: 'relative',
  zIndex: 1,
  minHeight: 340,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const cardCodeBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(255, 248, 235, 0.9)',
  color: '#5c3512',
  fontWeight: 950,
  letterSpacing: '0.08em'
}

const coverEyebrowStyle = {
  margin: '0 0 8px',
  color: '#f4d28a',
  fontSize: '0.72rem',
  fontWeight: 900,
  letterSpacing: '0.16em',
  textTransform: 'uppercase'
}

const coverTitleStyle = {
  margin: 0,
  color: '#fff8eb',
  fontSize: '1.35rem',
  lineHeight: 1.08,
  letterSpacing: '-0.045em',
  textShadow: '0 8px 24px rgba(0,0,0,0.36)'
}

const coverFooterStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap'
}

const backFooterStyle = {
  marginTop: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap'
}

const selectButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: '10px 14px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
  color: '#fff8eb',
  fontWeight: 900
}

const selectedButtonStyle = {
  ...selectButtonStyle,
  background: 'linear-gradient(135deg, #166534, #14532d)'
}

const flipBackButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: 999,
  padding: '10px 14px',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#5c3512',
  fontWeight: 900
}

const flipHintStyle = {
  color: '#fff8eb',
  fontWeight: 850,
  fontSize: '0.86rem',
  textShadow: '0 4px 14px rgba(0,0,0,0.4)'
}

const selectedBadgeStyle = {
  width: 30,
  height: 30,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
  color: '#fff8eb',
  fontWeight: 950
}

export default ProblemSelectionScreen
