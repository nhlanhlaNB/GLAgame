import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { styles } from './gameStyles'
import { LoadingPage, Pill, SectionHeader } from './ui'
import {
  equipPlayerCardSkin,
  getPlayerCardDesigns,
  unlockPlayerCardSkin
} from '../../services/player/playerCardDesignService'
import { usePlayerLanguage } from '../../hooks/usePlayerLanguage'

function CardDesignShowcaseScreen({ problemCardBack, aiCardBack }) {
  const { currentUser } = useAuth()
  const { t } = usePlayerLanguage()
  const [problemCards, setProblemCards] = useState([])
  const [aiCards, setAiCards] = useState([])
  const [cardSkins, setCardSkins] = useState([])
  const [userCardSkins, setUserCardSkins] = useState([])
  const [cardTypeFilter, setCardTypeFilter] = useState('all')
  const [imageFilter, setImageFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  async function loadDesigns() {
    setLoading(true)
    setError('')

    try {
      const data = await getPlayerCardDesigns(currentUser?.uid || '')
      setProblemCards(data.problemCards)
      setAiCards(data.aiCards)
      setCardSkins(data.cardSkins)
      setUserCardSkins(data.userCardSkins)
    } catch (err) {
      setError(err.message || 'Could not load card design data from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDesigns()
  }, [currentUser?.uid])

  async function handleUnlockSkin(skin) {
    setError('')
    setStatusMessage('')
    try {
      await unlockPlayerCardSkin({ userId: currentUser?.uid, skin })
      setStatusMessage('Card skin unlocked and saved to userCardSkins.')
      await loadDesigns()
    } catch (err) {
      setError(err.message || 'Could not unlock this card skin.')
    }
  }

  async function handleEquipSkin(skin) {
    setError('')
    setStatusMessage('')
    try {
      await equipPlayerCardSkin({ userId: currentUser?.uid, skinId: skin.skinId })
      setStatusMessage('Card skin equipped and saved to the system.')
      await loadDesigns()
    } catch (err) {
      setError(err.message || 'Could not equip this card skin.')
    }
  }

  const allCards = useMemo(() => [...problemCards, ...aiCards], [problemCards, aiCards])

  const filteredCards = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()

    return allCards.filter((card) => {
      const matchesType = cardTypeFilter === 'all' || card.cardType === cardTypeFilter
      const hasAnyImage = Boolean(card.frontImageUrl || card.backImageUrl)
      const matchesImage = imageFilter === 'all' || (imageFilter === 'with-images' && hasAnyImage) || (imageFilter === 'missing-images' && !hasAnyImage)
      const text = [card.title, card.subtitle, card.description, card.cardType, card.cardTheme].join(' ').toLowerCase()
      const matchesSearch = !cleanSearch || text.includes(cleanSearch)
      return matchesType && matchesImage && matchesSearch
    })
  }, [allCards, cardTypeFilter, imageFilter, searchTerm])

  if (loading) {
    return (
      <LoadingPage
        title="Loading card designs"
        message="Fetching available card skins and unlocked player designs from the system."
      />
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow={t('cardDesigns')} title={t('cardDesignTitle')}>
        {t('cardDesignHelp')}
      </SectionHeader>

      {error && <MessageCard message={error} tone="error" />}
      {statusMessage && <MessageCard message={statusMessage} tone="success" />}

      <div style={styles.metricGrid}>
        <Metric title={t('problemCards')} value={problemCards.length} note="problemCards" />
        <Metric title={t('aiCards')} value={aiCards.length} note="aiCards" />
        <Metric title="Card Skins" value={cardSkins.length} note="cardSkins" />
        <Metric title="Your Skins" value={userCardSkins.length} note="userCardSkins" />
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Unlockable card skins</p>
            <h3 style={styles.smallCardTitle}>the system cardSkins and userCardSkins</h3>
          </div>
          <Pill>{cardSkins.length} skins</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 14 }}>Loading card skins from the system...</p>
        ) : cardSkins.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 14 }}>No card skins found yet. Admin can add them in card design management.</p>
        ) : (
          <div style={skinGridStyle}>
            {cardSkins.map((skin) => (
              <article key={skin.skinId} style={skin.equipped ? equippedSkinCardStyle : skinCardStyle}>
                <div style={styles.rowBetween}>
                  <div>
                    <p style={styles.eyebrow}>{skin.cardType}</p>
                    <h3 style={styles.smallCardTitle}>{skin.title}</h3>
                  </div>
                  <Pill tone={skin.owned ? 'success' : 'default'}>{skin.equipped ? 'Equipped' : skin.owned ? 'Unlocked' : 'Locked'}</Pill>
                </div>
                {skin.imageUrl && <img src={skin.imageUrl} alt={skin.title} style={skinImageStyle} />}
                <p style={styles.smallCardText}>{skin.description}</p>
                <p style={styles.smallCardText}>Needs level {skin.requiredLevel || 0} • {skin.requiredCompletedProblems || 0} completed • {skin.requiredAverageScore || 0}% average</p>
                {skin.owned ? (
                  <button type="button" onClick={() => handleEquipSkin(skin)} disabled={skin.equipped} style={skin.equipped ? disabledButtonStyle : primaryButtonStyle}>{skin.equipped ? 'Equipped' : 'Equip skin'}</button>
                ) : (
                  <button type="button" onClick={() => handleUnlockSkin(skin)} style={secondaryButtonStyle}>Unlock manually</button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Find card designs</h3>
          </div>
          <Pill>{filteredCards.length} cards</Pill>
        </div>
        <div style={filterGridStyle}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search cards, themes or descriptions..." style={inputStyle} />
          <select value={cardTypeFilter} onChange={(event) => setCardTypeFilter(event.target.value)} style={inputStyle}>
            <option value="all">All card types</option>
            <option value="problem">Problem cards</option>
            <option value="ai">AI cards</option>
          </select>
          <select value={imageFilter} onChange={(event) => setImageFilter(event.target.value)} style={inputStyle}>
            <option value="all">All image states</option>
            <option value="with-images">With images</option>
            <option value="missing-images">Missing images</option>
          </select>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>the system card image fields</p>
            <h3 style={styles.smallCardTitle}>Card image gallery</h3>
          </div>
          <Pill>{loading ? 'Loading' : `${filteredCards.length} visible`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 14 }}>Loading card designs from the system...</p>
        ) : filteredCards.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 14 }}>No card designs match your filters.</p>
        ) : (
          <div style={galleryGridStyle}>
            {filteredCards.map((card) => {
              const fallbackBack = card.cardType === 'ai' ? aiCardBack : problemCardBack
              const frontImage = card.frontImageUrl || card.backImageUrl || fallbackBack
              const backImage = card.backImageUrl || fallbackBack

              return (
                <article key={`${card.cardType}_${card.firestoreId}`} style={cardBoxStyle}>
                  <div style={imagePairStyle}>
                    <ImagePreview src={frontImage} label="Front" />
                    <ImagePreview src={backImage} label="Back" />
                  </div>
                  <p style={styles.eyebrow}>{card.cardType === 'ai' ? t('aiCards') : t('problemCards')}</p>
                  <h3 style={styles.smallCardTitle}>{card.title}</h3>
                  <p style={styles.smallCardText}>{card.subtitle}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <Pill>{card.cardTheme}</Pill>
                    <Pill tone={card.frontImageUrl || card.backImageUrl ? 'success' : 'default'}>{card.frontImageUrl || card.backImageUrl ? 'the system image' : 'Fallback image'}</Pill>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ title, value, note }) {
  return <div style={styles.smallCard}><p style={styles.eyebrow}>{title}</p><h3 style={styles.smallCardTitle}>{value}</h3><p style={styles.smallCardText}>{note}</p></div>
}

function MessageCard({ message, tone }) {
  const isError = tone === 'error'
  return <div style={{ ...styles.smallCard, marginTop: 18, borderColor: isError ? 'rgba(153, 27, 27, 0.28)' : 'rgba(22, 101, 52, 0.28)' }}><p style={{ ...styles.smallCardText, color: isError ? '#991b1b' : '#166534' }}>{message}</p></div>
}

function ImagePreview({ src, label }) {
  return (
    <div style={imagePreviewStyle}>
      {src ? <img src={src} alt={`${label} card`} style={imageStyle} /> : <span>No image</span>}
      <strong>{label}</strong>
    </div>
  )
}

const filterGridStyle = { marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 190px 190px', gap: 12 }
const inputStyle = { width: '100%', padding: '13px 15px', borderRadius: 16, border: '1px solid rgba(139, 92, 40, 0.24)', background: 'rgba(255, 255, 255, 0.76)', color: '#3b2817', outline: 'none' }
const galleryGridStyle = { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }
const skinGridStyle = { marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }
const cardBoxStyle = { padding: 18, borderRadius: 24, background: 'rgba(255,255,255,0.66)', border: '1px solid rgba(139, 92, 40, 0.16)', boxShadow: '0 16px 36px rgba(80, 52, 20, 0.08)' }
const skinCardStyle = { ...cardBoxStyle, display: 'grid', gap: 12 }
const equippedSkinCardStyle = { ...skinCardStyle, background: 'linear-gradient(135deg, rgba(244,210,138,0.92), rgba(154,106,34,0.2))', border: '1px solid rgba(154,106,34,0.44)' }
const imagePairStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }
const imagePreviewStyle = { position: 'relative', minHeight: 160, borderRadius: 20, overflow: 'hidden', background: 'rgba(244,210,138,0.18)', border: '1px solid rgba(139,92,40,0.16)', display: 'grid', placeItems: 'center', color: '#5c3512', fontWeight: 850 }
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
const skinImageStyle = { width: '100%', height: 150, objectFit: 'cover', borderRadius: 18, border: '1px solid rgba(139,92,40,0.16)' }
const primaryButtonStyle = { border: 0, borderRadius: 999, padding: '12px 16px', cursor: 'pointer', background: 'linear-gradient(135deg, #9a6a22, #5c3512)', color: '#fff8eb', fontWeight: 850 }
const secondaryButtonStyle = { border: '1px solid rgba(139, 92, 40, 0.22)', borderRadius: 999, padding: '12px 16px', cursor: 'pointer', background: 'rgba(255,255,255,0.72)', color: '#5c3512', fontWeight: 850 }
const disabledButtonStyle = { ...secondaryButtonStyle, opacity: 0.55, cursor: 'not-allowed' }

export default CardDesignShowcaseScreen
