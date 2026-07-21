import { useEffect, useRef, useState } from 'react'
import { styles, colors } from './gameStyles'
import { ActionButton, MetricCard } from './ui'


function PlayGameScreen({
  round,
  aiCards,
  selectedAiCards,
  flippedProblem,
  flippedAiCards,
  userExplanation,
  wordCount,
  explanationTooLong,
  hasSubmittedExplanation,
  aiLoading,
  aiError,
  hintMessage,
  showHintConfirm,
  glaCoinBalance,
  certificationProgress, 
  averageScore,
  fullName,
  card1,
  card2,
  isChanging,
  onToggleProblemFlip,
  onToggleAiCard,
  onRemoveSelectedAiCard,
  onToggleAiFlip,
  onDragStart,
  onDrop,
  onExplanationChange,
  onSubmit,
  onShowHintConfirm,
  onCancelHint,
  onConfirmHint,
  onOpenLatestScore,
  onNextRound,
  latestAttempt,
  onGoToSelection,
  appSettings = {}
}) {

  const [draggedAiCard, setDraggedAiCard] = useState(null)
const dragFrameRef = useRef(null)
const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
const [isOverSolutionBoard, setIsOverSolutionBoard] = useState(false)
const [dropPulseCardId, setDropPulseCardId] = useState('')
const [scoringProgress, setScoringProgress] = useState(0)

useEffect(() => {
  if (!aiLoading) {
    setScoringProgress(0)
    return undefined
  }

  setScoringProgress(10)
  const interval = setInterval(() => {
    setScoringProgress((progress) => Math.min(94, progress + Math.max(4, Math.round((96 - progress) * 0.14))))
  }, 420)

  return () => clearInterval(interval)
}, [aiLoading])

useEffect(() => {
  return () => {
    if (dragFrameRef.current) {
      window.cancelAnimationFrame(dragFrameRef.current)
    }
  }
}, [])

const problemCardCode = round?.card?.id ? `PC${round.card.id}` : 'PC'

function handleSubmitClick() {
  if (appSettings?.confirmBeforeSubmit) {
    const confirmed = window.confirm('Submit this answer for scoring now?')
    if (!confirmed) return
  }

  onSubmit()
}


function getAiCardImage(card) {
  const numericId = Number(card?.id)
  if (Number.isFinite(numericId) && numericId >= 1 && numericId <= 30) return `/assets/images/optimized/AI_${numericId}.webp`
  if (card?.frontImageUrl) return card.frontImageUrl
  if (card?.backImageUrl) return card.backImageUrl
  if (card?.fileName) return `/assets/images/${card.fileName}`

  return card1
}

  if (!round.card) {
    return (
      <div style={styles.panel}>
        <p style={styles.eyebrow}>No active game yet</p>
        <h1 style={styles.sectionTitle}>Choose your problem cards first.</h1>
        <div style={styles.centerButtonRow}>
          <ActionButton onClick={onGoToSelection}>Go to Problem Selection</ActionButton>
        </div>
      </div>
    )
  }


function createTransparentDragImage(event) {
  const dragImage = document.createElement('div')
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-9999px'
  dragImage.style.left = '-9999px'
  dragImage.style.width = '1px'
  dragImage.style.height = '1px'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, 0, 0)
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
}

function handleAiDragStart(event, card) {
  if (hasSubmittedExplanation) return

  onDragStart(event, card.id)
  createTransparentDragImage(event)

  event.dataTransfer.effectAllowed = 'copy'
  setDraggedAiCard(card)
  setDragPosition({ x: event.clientX, y: event.clientY })
}

function handleAiDragMove(event) {
  if (!draggedAiCard) return
  if (event.clientX === 0 && event.clientY === 0) return

  const nextPosition = { x: event.clientX, y: event.clientY }
  if (dragFrameRef.current) return

  dragFrameRef.current = window.requestAnimationFrame(() => {
    setDragPosition(nextPosition)
    dragFrameRef.current = null
  })
}

function handleAiDragEnd() {
  if (dragFrameRef.current) {
    window.cancelAnimationFrame(dragFrameRef.current)
    dragFrameRef.current = null
  }
  setDraggedAiCard(null)
  setIsOverSolutionBoard(false)
}

function handleSolutionDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  setIsOverSolutionBoard(true)

  if (draggedAiCard && event.clientX !== 0 && event.clientY !== 0) {
    setDragPosition({ x: event.clientX, y: event.clientY })
  }
}

function handleSolutionDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    setIsOverSolutionBoard(false)
  }
}

function handleSolutionDrop(event) {
  event.preventDefault()

  if (draggedAiCard) {
    setDropPulseCardId(draggedAiCard.id)
    setTimeout(() => setDropPulseCardId(''), 520)
  }

  onDrop(event)
  setDraggedAiCard(null)
  setIsOverSolutionBoard(false)
}

  return (
    <section className="gameSection" style={{ width: '100%', margin: '0 auto' }}>
      <style>{playGameMotionCss}</style>
      <div className="gameShell" style={gameShellStyle}>
        <div
          className="gameLeft"
          style={{
            opacity: isChanging ? 0 : 1,
            transform: isChanging ? 'translateY(14px)' : 'translateY(0)',
            transition: 'all 0.45s ease'
          }}
        >
          <p style={styles.eyebrow}>Welcome back, {fullName}</p>
          <h1 style={styles.sectionTitle}>Build your AI solution.</h1>
          <p style={styles.paragraph}>First choose your AI cards, then explain why those cards can solve the problem.</p>

          <div style={currentPromptStyle}>
            <p style={{ ...styles.eyebrow, color: colors.lightGold }}>Current Problem</p>
            <h3 style={promptTitleStyle}>{round.card.title}</h3>
            <p style={promptTextStyle}>{round.card.problem}</p>
            <p style={promptQuestionStyle}>{round.card.think_about_it}</p>
          </div>

          <div className="gameStats" style={styles.metricGrid}>
            <MetricCard title="GLA Coin" value={glaCoinBalance} />
            <MetricCard title="Completed" value={`${certificationProgress}/10`} />
            <MetricCard title="Average" value={`${averageScore}%`} />
          </div>

          <button onClick={onToggleProblemFlip} style={transparentCardButtonStyle} type="button">
            <div className="problemCardVisual" style={problemCardVisualStyle}>
              <div
                style={{
                  ...problemCardFlipInnerStyle,
                  transform: flippedProblem ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                <div style={problemCardFaceStyle}>
<img src={card1} alt="Problem card cover" style={cardImageStyle} loading="eager" decoding="async" fetchPriority="high" />              <div style={coverOverlayStyle}></div>
                  <div style={coverTopStyle}>
                    <span style={problemCodeBadgeStyle}>{problemCardCode}</span>
                    <span style={coverPillStyle}>Problem Card</span>
                  </div>
                  <div style={coverContentStyle}>
                    <p style={{ ...styles.eyebrow, color: colors.lightGold }}>Current Problem</p>
                    <h3 style={coverTitleStyle}>{round.card.title}</h3>
                    <p style={coverTextStyle}>Click to reveal the full problem card.</p>
                  </div>
                </div>

                <div style={{ ...problemCardFaceStyle, transform: 'rotateY(180deg)' }}>
                  <div style={problemBackStyle}>
                    <div style={coverTopStyle}>
                      <span style={problemCodeBadgeStyle}>{problemCardCode}</span>
                      <span style={coverPillStyle}>{round.card.problem_type}</span>
                    </div>
                    <div style={problemBackContentStyle}>
                      <p style={{ ...styles.eyebrow, color: colors.lightGold }}>Problem Card Revealed</p>
                      <h3 style={largeCardTitleStyle}>{round.card.title}</h3>
                      <p style={largeCardTextStyle}>{round.card.problem}</p>
                      <p style={largeCardQuestionStyle}>{round.card.think_about_it}</p>
                      <p style={flipHelpStyle}>Click again to return to the cover.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div
          className="gameRight"
          style={{
            display: 'grid',
            gap: '18px',
            opacity: isChanging ? 0 : 1,
            transform: isChanging ? 'translateY(14px)' : 'translateY(0)',
            transition: 'all 0.45s ease'
          }}
        >
          <div style={styles.panelInner}>
            <div style={styles.rowBetween}>
              <div>
                <p style={styles.eyebrow}>Step 1</p>
                <h3 style={styles.smallCardTitle}>Choose your AI cards first.</h3>
              </div>
              <strong style={{ color: colors.brown }}>{selectedAiCards.length}/3 selected</strong>
            </div>

            <div style={aiLibraryStyle}>
              {aiCards.map((card) => {
                const selected = selectedAiCards.some((selectedCard) => selectedCard.id === card.id)
                const flipped = flippedAiCards.includes(card.id)
                return (
                  <div key={card.id} style={{ display: 'grid', gap: '8px' }}>
                    <button
                      type="button"
                      data-gla-ai-card="true"
                     draggable={!hasSubmittedExplanation}
onDragStart={(event) => handleAiDragStart(event, card)}
onDrag={(event) => handleAiDragMove(event)}
onDragEnd={handleAiDragEnd}
onClick={() => onToggleAiCard(card)}
className={draggedAiCard?.id === card.id ? 'aiCardDraggingSource' : ''}
                      aria-pressed={selected}
                      style={{
                        ...aiCardSceneButtonStyle,
                        border: selected ? '2px solid rgba(154, 106, 34, 0.78)' : '1px solid rgba(139, 92, 40, 0.18)',
                        boxShadow: selected ? '0 18px 40px rgba(80,52,20,0.22)' : '0 14px 30px rgba(80,52,20,0.1)'
                      }}
                    >
                      <div
                        style={{
                          ...aiCardFlipInnerStyle,
                          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        <div style={aiCardFaceStyle}>
<img
  src={getAiCardImage(card)}
  alt={card.title}
  style={cardImageStyle}
  loading={Number(card.id) <= 6 ? 'eager' : 'lazy'}
  decoding="async"
  fetchPriority={Number(card.id) <= 3 ? 'high' : 'auto'}
/>                          <div style={aiCoverOverlayStyle}></div>
                          <div style={aiCoverContentStyle}>
                            <p style={{ ...styles.eyebrow, color: colors.lightGold }}>AI Card</p>
                            <h3 style={aiCoverCodeStyle}>AC{card.id}</h3>
                            <p style={aiCoverTextStyle}>{selected ? 'Selected for your solution' : 'Click to select this AI card'}</p>
                          </div>
                        </div>

                        <div style={{ ...aiCardFaceStyle, transform: 'rotateY(180deg)' }}>
                          <div style={selected ? selectedAiBackStyle : aiBackStyle}>
                            <p data-gla-no-translate="true" style={{ ...styles.eyebrow, color: selected ? colors.lightGold : colors.gold }}>{card.type}</p>
                            <h3 data-gla-no-translate="true" style={{ margin: '0 0 8px', lineHeight: '1.2' }}>{card.title}</h3>
                            <p data-gla-no-translate="true" style={{ margin: 0, lineHeight: '1.5' }}>{card.canDo}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                    <button type="button" onClick={() => onToggleAiFlip(card.id)} style={miniButtonStyle}>
                      {flipped ? 'Show Cover' : 'Flip Card'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div
  className={isOverSolutionBoard ? 'solutionBoardHover' : ''}
  onDragOver={handleSolutionDragOver}
  onDragEnter={handleSolutionDragOver}
  onDragLeave={handleSolutionDragLeave}
  onDrop={handleSolutionDrop}
  style={{
    ...solutionBoardStyle,
    background: isOverSolutionBoard
      ? 'linear-gradient(135deg, rgba(255, 248, 235, 0.98), rgba(244, 210, 138, 0.72))'
      : selectedAiCards.length > 0
        ? 'linear-gradient(135deg, rgba(255, 248, 235, 0.9), rgba(244, 210, 138, 0.42))'
        : 'rgba(255, 255, 255, 0.7)',
    border: isOverSolutionBoard
      ? '2px solid rgba(154,106,34,0.72)'
      : '2px dashed rgba(154,106,34,0.38)'
  }}
>
            <p style={styles.eyebrow}>Step 2</p>
            <h3 style={styles.smallCardTitle}>Selected AI solution cards.</h3>
            <div style={selectedAiGridStyle}>
              {selectedAiCards.length === 0 && <div style={emptyDropStyle}>Choose or drag up to 3 AI cards here.</div>}
             {selectedAiCards.map((card) => (
  <button
    key={card.id}
    type="button"
    data-gla-ai-card="true"
    onClick={() => onRemoveSelectedAiCard(card.id)}
    className={dropPulseCardId === card.id ? 'selectedAiCardLanded' : ''}
    style={selectedAiCardStyle}
  >
    <div style={selectedAiTopRowStyle}>
      <span style={selectedAiCodeBadgeStyle}>AC{card.id}</span>
      <span data-gla-no-translate="true" style={selectedAiTypePillStyle}>{card.type}</span>
    </div>

    <strong data-gla-no-translate="true" style={selectedAiTitleStyle}>{card.title}</strong>
    <p data-gla-no-translate="true" style={selectedAiTypeStyle}>{card.canDo}</p>
  </button>
))}
            </div>
          </div>

          <div style={styles.panelInner}>
            <div style={styles.rowBetween}>
              <div>
                <p style={styles.eyebrow}>Step 3</p>
                <h3 style={styles.smallCardTitle}>Explain why you chose those AI cards.</h3>
              </div>
              <strong style={{ color: explanationTooLong ? colors.danger : colors.brown }}>{wordCount}/100 words</strong>
            </div>

            <textarea
              value={userExplanation}
              onChange={(event) => onExplanationChange(event.target.value)}
              disabled={hasSubmittedExplanation || aiLoading}
              placeholder="Explain why your selected AI card(s) can solve this problem in a realistic African context..."
              style={{
                ...textAreaStyle,
                border: explanationTooLong ? '2px solid rgba(185, 28, 28, 0.5)' : '1px solid rgba(139, 92, 40, 0.22)'
              }}
            />
            {explanationTooLong && <p style={styles.dangerText}>Your explanation is too long. Please keep it to 100 words or less.</p>}
            {aiError && <p style={styles.dangerText}>{aiError}</p>}

            <div style={styles.centerButtonRow}>
              <ActionButton
                onClick={handleSubmitClick}
                disabled={selectedAiCards.length === 0 || !userExplanation.trim() || explanationTooLong || hasSubmittedExplanation || aiLoading}
              >
                {aiLoading ? 'Scoring with the scoring engine...' : 'Submit Solution'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={onShowHintConfirm} disabled={aiLoading}>Request Hint - 20 GLA</ActionButton>
              {latestAttempt && <ActionButton variant="secondary" onClick={onOpenLatestScore}>View Latest Score</ActionButton>}
              <ActionButton variant="secondary" onClick={onNextRound}>Next Problem</ActionButton>
            </div>

            {showHintConfirm && (
              <div style={hintBoxStyle}>
                <h3 style={styles.smallCardTitle}>Confirm hint purchase</h3>
                <p style={styles.smallCardText}>A hint costs 20 GLA coin. Your current balance is <strong>{glaCoinBalance}</strong> GLA coin.</p>
                <div style={styles.centerButtonRow}>
                  <ActionButton onClick={onConfirmHint}>Yes, use 20 GLA coin</ActionButton>
                  <ActionButton variant="secondary" onClick={onCancelHint}>Cancel</ActionButton>
                </div>
              </div>
            )}

            {hintMessage && (
              <div style={hintBoxStyle}>
                <p style={styles.eyebrow}>Hint</p>
                <p style={styles.smallCardText}>{hintMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <JourneyScoringOverlay active={aiLoading} progress={scoringProgress} />
      {draggedAiCard && (
        <div
          className="dragCardPreview"
          style={{
            left: dragPosition.x,
            top: dragPosition.y
          }}
        >
          <div style={dragPreviewCardStyle}>
<img
  src={getAiCardImage(draggedAiCard)}
  alt={draggedAiCard.title}
  style={cardImageStyle}
  decoding="async"
/>           <div style={dragPreviewContentStyle}>
              <div style={selectedAiTopRowStyle}>
                <span style={selectedAiCodeBadgeStyle}>AC{draggedAiCard.id}</span>
                <span data-gla-no-translate="true" style={dragPreviewPillStyle}>{draggedAiCard.type}</span>
              </div>

              <div>
                <p style={{ ...styles.eyebrow, color: colors.lightGold }}>Dragging AI Card</p>
                <h3 data-gla-no-translate="true" style={dragPreviewTitleStyle}>{draggedAiCard.title}</h3>
                <p data-gla-no-translate="true" style={dragPreviewTextStyle}>{draggedAiCard.canDo}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function JourneyScoringOverlay({ active, progress }) {
  if (!active) return null

  const safeProgress = Math.max(10, Math.min(99, progress || 10))

  return (
    <div className="journeyScoringOverlay" role="status" aria-live="polite">
      <div className="journeyScoringCard">
        <div className="journeyScoringSpinner"></div>
        <p style={{ ...styles.eyebrow, textAlign: 'center' }}>Scoring in progress</p>
        <h3 style={{ ...styles.smallCardTitle, textAlign: 'center' }}>Checking your solution...</h3>
        <p style={{ ...styles.smallCardText, textAlign: 'center' }}>
          Please wait while the system reviews your AI card choices, SDG alignment, practical feasibility, creativity and responsible use.
        </p>
        <div className="journeyProgressTrack">
          <span style={{ width: `${safeProgress}%` }}></span>
        </div>
        <small style={{ color: colors.brown2, textAlign: 'center', fontWeight: 900 }}>{Math.round(safeProgress)}% complete</small>
      </div>
    </div>
  )
}

const gameShellStyle = {
  minHeight: '720px',
  padding: '34px',
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 0.85fr) minmax(320px, 1.15fr)',
  gap: '28px',
  alignItems: 'start',
  borderRadius: '38px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(232, 214, 170, 0.72))',
  border: '1px solid rgba(139, 92, 40, 0.22)',
  boxShadow: '0 30px 80px rgba(80, 52, 20, 0.2)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  overflow: 'hidden'
}

const currentPromptStyle = { marginTop: '18px', padding: '22px', borderRadius: '26px', background: 'linear-gradient(135deg, rgba(92, 53, 18, 0.96), rgba(154, 106, 34, 0.9))', color: colors.cream, boxShadow: '0 18px 42px rgba(92, 53, 18, 0.22)' }
const promptTitleStyle = { margin: '0 0 12px', fontSize: '1.25rem', lineHeight: '1.35' }
const promptTextStyle = { margin: '0 0 12px', lineHeight: '1.6', color: 'rgba(255, 248, 235, 0.9)' }
const promptQuestionStyle = { margin: '0', lineHeight: '1.6', color: colors.lightGold, fontWeight: '750' }
const transparentCardButtonStyle = { width: '100%', border: '0', padding: '0', background: 'transparent', cursor: 'pointer', textAlign: 'left', marginTop: '20px' }

const problemCardVisualStyle = {
  position: 'relative',
  minHeight: '510px',
  perspective: '1200px',
  borderRadius: '30px',
  transform: 'rotate(-1.5deg)'
}

const problemCardFlipInnerStyle = {
  position: 'relative',
  width: '100%',
  minHeight: '510px',
  transformStyle: 'preserve-3d',
  transition: 'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  borderRadius: '30px',
  boxShadow: '0 28px 60px rgba(0,0,0,0.26)'
}

const problemCardFaceStyle = {
  position: 'absolute',
  inset: 0,
  minHeight: '550px',
  borderRadius: '30px',
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden'
}

const cardImageStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
const coverOverlayStyle = { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3, 8, 20, 0.08), rgba(3, 8, 20, 0.78))' }
const coverTopStyle = { position: 'absolute', top: '22px', left: '22px', right: '22px', zIndex: 2, display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }
const problemCodeBadgeStyle = { minWidth: 68, height: 68, borderRadius: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(244, 210, 138, 0.96), rgba(154, 106, 34, 0.94))', color: '#3b2817', fontWeight: 950, fontSize: '1.25rem', boxShadow: '0 18px 34px rgba(0,0,0,0.22)' }
const coverPillStyle = { padding: '9px 13px', borderRadius: 999, background: 'rgba(255, 248, 235, 0.18)', border: '1px solid rgba(255, 248, 235, 0.28)', color: colors.cream, fontSize: '0.78rem', fontWeight: 900, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }
const coverContentStyle = { position: 'absolute', left: '24px', right: '24px', bottom: '28px', zIndex: 2, color: colors.cream }
const coverTitleStyle = { margin: '0 0 12px', fontSize: '1.85rem', lineHeight: '1.08', letterSpacing: '-0.045em' }
const coverTextStyle = { margin: 0, color: 'rgba(255,248,235,0.88)', lineHeight: 1.65, fontWeight: 750 }
const problemBackStyle = { minHeight: '510px', padding: '112px 24px 28px', color: colors.cream, background: 'radial-gradient(circle at top left, rgba(244,210,138,0.22), transparent 34%), linear-gradient(135deg, rgba(3, 8, 20, 0.94), rgba(92, 53, 18, 0.96))' }
const problemBackContentStyle = { display: 'grid', gap: '10px' }
const largeCardTitleStyle = { margin: '0 0 12px', fontSize: '1.75rem', lineHeight: '1.1' }
const largeCardTextStyle = { margin: '0', color: 'rgba(255,248,235,0.88)', lineHeight: '1.65' }
const largeCardQuestionStyle = { margin: '0', color: colors.lightGold, lineHeight: '1.65', fontWeight: 800 }
const flipHelpStyle = { margin: '6px 0 0', color: 'rgba(255,248,235,0.72)', fontSize: '0.88rem', fontWeight: 750 }

const solutionBoardStyle = { padding: '24px', borderRadius: '28px', border: '2px dashed rgba(154,106,34,0.38)', boxShadow: '0 18px 42px rgba(80,52,20,0.12)' }
const selectedAiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '14px',
  marginTop: '16px'
}
const emptyDropStyle = { padding: '18px', borderRadius: '20px', background: 'rgba(255,255,255,0.58)', color: colors.brown2, lineHeight: '1.55' }
const selectedAiCardStyle = {
  minHeight: '180px',
  padding: '16px',
  border: '1px solid rgba(154,106,34,0.3)',
  borderRadius: '22px',
  background: 'linear-gradient(135deg, rgba(154,106,34,0.98), rgba(92,53,18,0.98))',
  color: colors.cream,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'grid',
  alignContent: 'space-between',
  gap: '12px',
  boxShadow: '0 18px 42px rgba(80,52,20,0.2)'
}
const selectedAiTypeStyle = {
  margin: 0,
  lineHeight: '1.5',
  color: 'rgba(255,248,235,0.86)',
  fontSize: '0.9rem'
}
const textAreaStyle = { width: '100%', minHeight: '150px', marginTop: '14px', padding: '16px', borderRadius: '20px', resize: 'vertical', background: 'rgba(255,255,255,0.78)', color: colors.dark, outline: 'none', lineHeight: '1.6' }
const hintBoxStyle = { marginTop: '18px', padding: '18px', borderRadius: '22px', background: 'rgba(244,210,138,0.24)', border: '1px solid rgba(154,106,34,0.22)' }
const aiLibraryStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', maxHeight: '620px', overflowY: 'auto', paddingRight: '6px', marginTop: '16px' }
const selectedAiTopRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px'
}

const selectedAiCodeBadgeStyle = {
  minWidth: 48,
  height: 48,
  borderRadius: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(244, 210, 138, 0.98), rgba(255, 248, 235, 0.9))',
  color: '#3b2817',
  fontWeight: 950,
  boxShadow: '0 12px 26px rgba(0,0,0,0.18)'
}

const selectedAiTypePillStyle = {
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(255,248,235,0.14)',
  border: '1px solid rgba(255,248,235,0.22)',
  color: colors.lightGold,
  fontSize: '0.72rem',
  fontWeight: 900
}

const selectedAiTitleStyle = {
  fontSize: '1.05rem',
  lineHeight: 1.18
}

const aiCardSceneButtonStyle = {
minHeight: '380px',
  padding: 0,
  borderRadius: '22px',
  cursor: 'pointer',
  textAlign: 'left',
  background: 'transparent',
  perspective: '1000px',
  overflow: 'visible'
}

const aiCardFlipInnerStyle = {
  position: 'relative',
  width: '100%',
minHeight: '380px',
  transformStyle: 'preserve-3d',
  transition: 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)'
}

const aiCardFaceStyle = {
  position: 'absolute',
  inset: 0,
minHeight: '380px',
  borderRadius: '20px',
  overflow: 'hidden',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden'
}

const aiCoverOverlayStyle = { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3, 8, 20, 0.04), rgba(3, 8, 20, 0.78))' }
const aiCoverContentStyle = { position: 'absolute', inset: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: colors.cream, zIndex: 2 }
const aiCoverCodeStyle = { margin: 0, fontSize: '2rem', lineHeight: 1, letterSpacing: '-0.05em' }
const aiCoverTextStyle = { margin: 0, color: 'rgba(255,248,235,0.86)', lineHeight: 1.45, fontWeight: 800 }
const aiBackStyle = { minHeight: '210px', padding: '16px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.82)', color: colors.dark, border: '1px solid rgba(139, 92, 40, 0.18)' }
const selectedAiBackStyle = { minHeight: '210px', padding: '16px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(154, 106, 34, 0.92), rgba(92, 53, 18, 0.96))', color: colors.cream, border: '1px solid rgba(244, 210, 138, 0.34)' }
const miniButtonStyle = { border: '1px solid rgba(139,92,40,0.18)', borderRadius: '999px', padding: '8px 12px', cursor: 'pointer', background: 'rgba(255,255,255,0.65)', color: colors.brown, fontWeight: '800', fontSize: '0.82rem' }

const dragPreviewCardStyle = {
  position: 'relative',
  width: 240,
  minHeight: 300,
  borderRadius: 24,
  overflow: 'hidden',
  background: 'linear-gradient(135deg, rgba(154,106,34,1), rgba(92,53,18,1))',
  border: '2px solid rgba(244,210,138,0.72)',
  boxShadow: '0 34px 80px rgba(0,0,0,0.38)'
}

const dragPreviewOverlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(3,8,20,0.08), rgba(3,8,20,0.84))'
}

const dragPreviewContentStyle = {
  position: 'absolute',
  inset: 0,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  color: colors.cream,
  zIndex: 2
}

const dragPreviewPillStyle = {
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(255,248,235,0.18)',
  border: '1px solid rgba(255,248,235,0.26)',
  color: colors.lightGold,
  fontSize: '0.72rem',
  fontWeight: 900
}

const dragPreviewTitleStyle = {
  margin: '0 0 8px',
  fontSize: '1.25rem',
  lineHeight: 1.12,
  letterSpacing: '-0.04em'
}

const dragPreviewTextStyle = {
  margin: 0,
  color: 'rgba(255,248,235,0.84)',
  lineHeight: 1.45,
  fontSize: '0.86rem'
}

const playGameMotionCss = `
  .dragCardPreview {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transform: translate(-50%, -50%) rotate(5deg) scale(1.04);
    animation: dragCardLift 180ms ease-out forwards, dragCardFloat 900ms ease-in-out infinite alternate;
    filter: drop-shadow(0 28px 38px rgba(0, 0, 0, 0.32));
  }

  .aiCardDraggingSource {
    transform: scale(0.985) rotate(-1deg);
    filter: saturate(1.08) brightness(1.02);
  }

  .solutionBoardHover {
    transform: scale(1.012);
    box-shadow: 0 26px 62px rgba(80, 52, 20, 0.22), inset 0 0 0 1px rgba(244, 210, 138, 0.34);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .selectedAiCardLanded {
    animation: cardLand 520ms cubic-bezier(0.2, 1.3, 0.35, 1);
  }

  @keyframes dragCardLift {
    from {
      transform: translate(-50%, -50%) rotate(0deg) scale(0.92);
    }
    to {
      transform: translate(-50%, -50%) rotate(5deg) scale(1.04);
    }
  }

  @keyframes dragCardFloat {
    from {
      margin-top: -2px;
    }
    to {
      margin-top: 8px;
    }
  }

  @keyframes cardLand {
    0% {
      transform: translateY(-34px) scale(1.08) rotate(4deg);
      opacity: 0.55;
    }
    55% {
      transform: translateY(8px) scale(0.98) rotate(-1deg);
      opacity: 1;
    }
    78% {
      transform: translateY(-4px) scale(1.015) rotate(0.5deg);
    }
    100% {
      transform: translateY(0) scale(1) rotate(0deg);
    }
  }

  .journeyScoringOverlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(32, 22, 14, 0.56);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .journeyScoringCard {
    width: min(440px, 100%);
    padding: 26px;
    border-radius: 30px;
    border: 1px solid rgba(244, 210, 138, 0.38);
    background: linear-gradient(135deg, rgba(255, 248, 235, 0.96), rgba(244, 210, 138, 0.92));
    box-shadow: 0 30px 86px rgba(0,0,0,0.34);
    display: grid;
    gap: 14px;
  }

  .journeyScoringSpinner {
    width: 56px;
    height: 56px;
    margin: 0 auto;
    border-radius: 50%;
    border: 5px solid rgba(154, 106, 34, 0.2);
    border-top-color: rgba(92, 53, 18, 0.95);
    animation: journeySpin 0.88s linear infinite;
  }

  .journeyProgressTrack {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(92, 53, 18, 0.16);
  }

  .journeyProgressTrack span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #9a6a22, #5c3512);
    transition: width 0.22s ease;
  }

  @keyframes journeySpin {
    to { transform: rotate(360deg); }
  }
`

export default PlayGameScreen
