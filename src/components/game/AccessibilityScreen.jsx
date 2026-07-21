import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getPlayerSettings, savePlayerSettings, DEFAULT_PLAYER_SETTINGS, applyPlayerSettingsToDocument } from '../../services/player/playerSettingsService'
import { styles } from './gameStyles'
import { Pill, SectionHeader } from './ui'

function AccessibilityScreen({ settings: parentSettings, onChange, onSaved, onSettingsChange }) {
  const { currentUser } = useAuth()
  const { languageCode, languageOptions, setLanguage, setAutoTranslate, t } = useLanguage()
  const [settings, setSettings] = useState({ ...DEFAULT_PLAYER_SETTINGS, ...parentSettings, preferredLanguage: languageCode, autoTranslate: true })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const lastAppliedLanguageRef = useRef(languageCode)

  const selectedLanguage = useMemo(() => {
    return languageOptions.find((language) => language.languageCode === settings.preferredLanguage) || languageOptions[0]
  }, [languageOptions, settings.preferredLanguage])

  useEffect(() => {
    async function load() {
      try {
        const savedSettings = await getPlayerSettings(currentUser?.uid)
        const next = {
          ...DEFAULT_PLAYER_SETTINGS,
          ...parentSettings,
          ...savedSettings,
          preferredLanguage: savedSettings.preferredLanguage || parentSettings?.preferredLanguage || languageCode,
          autoTranslate: true
        }
        setSettings(next)
        applyPlayerSettingsToDocument(next)
        onChange?.(next)
        onSettingsChange?.(next)
      } catch (err) {
        setError(err.message || 'Could not load settings from the system.')
      }
    }

    load()
  }, [currentUser?.uid])

  function updateSetting(key, value) {
    setMessage('')
    setError('')

    const next = { ...settings, [key]: value }
    setSettings(next)

    if (key !== 'preferredLanguage') {
      applyPlayerSettingsToDocument(next)
      onChange?.(next)
      onSettingsChange?.(next)
    }

    if (key === 'preferredLanguage') {
      setMessage('Language selected. Press Save settings to apply it across the system.')
    }
  }

  async function save() {
    setError('')
    setMessage('')
    setSaving(true)

    const previousLanguage = lastAppliedLanguageRef.current || languageCode || 'en'

    try {
      const saved = await savePlayerSettings(currentUser?.uid, { ...settings, autoTranslate: true })
      const nextLanguage = saved.preferredLanguage || 'en'
      const shouldRefresh = nextLanguage !== previousLanguage

      setAutoTranslate(true)
      await setLanguage(nextLanguage)
      applyPlayerSettingsToDocument(saved)
      onChange?.(saved)
      onSettingsChange?.(saved)
      onSaved?.(saved)
      lastAppliedLanguageRef.current = nextLanguage

      if (shouldRefresh) {
        setMessage('Language saved. Refreshing the system so the new language applies everywhere...')
        window.setTimeout(() => window.location.reload(), 650)
        return
      }

      setMessage('Settings saved to the system and applied across the player system.')
    } catch (err) {
      setError(err.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.panel}>
      <div style={settingsHeroStyle}>
        <div>
          <p style={{ ...styles.eyebrow, color: '#f4d28a' }}>{t('settings', 'Settings')}</p>
          <h1 style={settingsHeroTitleStyle}>{t('accessibilitySettings', 'Professional player settings')}</h1>
          <p style={settingsHeroTextStyle}>Manage language, accessibility and game display preferences. These settings only change interface words and behaviour, not your saved game data.</p>
        </div>

        <div style={languageBadgeStyle}>
          <span style={languageCodeStyle}>{String(settings.preferredLanguage || 'en').toUpperCase()}</span>
          <span style={languageNameStyle}>{selectedLanguage?.languageName || 'English'}</span>
        </div>
      </div>

      <div style={stickySaveBarStyle}>
        <div>
          <strong style={{ color: '#4b2b10' }}>{t('playerSettings', 'Player experience controls')}</strong>
          <p style={saveHelpStyle}>Change settings below, then save them permanently. You can switch between languages again any time.</p>
        </div>
        <button type="button" style={buttonStyle} onClick={save} disabled={saving}>{saving ? t('saving', 'Saving...') : t('saveSettings', 'Save settings')}</button>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {message && <Notice tone="success">{message}</Notice>}

      <SectionHeader eyebrow={t('language', 'Language')} title={t('chooseLanguage', 'Choose language')}>
        Choose one language for the full system. English, isiZulu, French, Arabic, Portuguese and Kiswahili are always available. Only interface text changes; saved player data, scores, card records and database values stay the same.
      </SectionHeader>

      <div style={languageGridStyle}>
        <label style={largeFieldStyle}>
          <span>{t('chooseLanguage', 'Preferred language')}</span>
          <select style={inputStyle} value={settings.preferredLanguage} onChange={(event) => updateSetting('preferredLanguage', event.target.value)}>
            {languageOptions.map((language) => (
              <option key={language.languageCode} value={language.languageCode}>{language.languageName}</option>
            ))}
          </select>
        </label>
      </div>

      <SectionHeader eyebrow="Accessibility" title="Make AfriQuest easier to read and use." />
      <div style={settingsGridStyle}>
        <Toggle title={t('highContrast', 'High contrast')} description="Strengthen contrast for text and cards." checked={settings.highContrast} onChange={(value) => updateSetting('highContrast', value)} />
        <Toggle title={t('largeText', 'Large text')} description="Increase text size across the player and admin app." checked={settings.largeText} onChange={(value) => updateSetting('largeText', value)} />
        <Toggle title={t('reduceMotion', 'Reduce motion')} description="Reduce transitions and movement effects." checked={settings.reduceMotion} onChange={(value) => updateSetting('reduceMotion', value)} />
        <Toggle title={t('lowBandwidth', 'Low bandwidth mode')} description="Reduce heavy visual behaviour for slower connections." checked={settings.lowBandwidth || settings.saveDataMode} onChange={(value) => updateSetting('lowBandwidth', value)} />
        <Toggle title={t('keyboardMode', 'Keyboard friendly mode')} description="Keep controls clearer for keyboard navigation." checked={settings.keyboardMode} onChange={(value) => updateSetting('keyboardMode', value)} />
        <Toggle title={t('screenReaderLabels', 'Screen reader labels')} description="Keep helpful labels enabled for assistive technology." checked={settings.screenReaderLabels} onChange={(value) => updateSetting('screenReaderLabels', value)} />
        <Toggle title={t('compactMode', 'Compact mode')} description="Make cards and panels tighter on smaller screens." checked={settings.compactMode} onChange={(value) => updateSetting('compactMode', value)} />
      </div>

      <SectionHeader eyebrow="Game display" title="Control how game cards behave." />
      <div style={settingsGridStyle}>
        <Toggle title={t('cardFlip', 'Card flip animation')} description="Allow cards to flip when opened." checked={settings.cardFlipEnabled} onChange={(value) => updateSetting('cardFlipEnabled', value)} />
        <Toggle title={t('soundEffects', 'Sound effects')} description="Prepare the app for sound feedback when enabled." checked={settings.soundEnabled} onChange={(value) => updateSetting('soundEnabled', value)} />
        <Toggle title={t('showCardImages', 'Show card images')} description="Display card artwork and image previews." checked={settings.showCardImages} onChange={(value) => updateSetting('showCardImages', value)} />
        <Toggle title={t('confirmBeforeSubmit', 'Confirm before submitting answers')} description="Ask for confirmation before a scoring submission is sent." checked={settings.confirmBeforeSubmit} onChange={(value) => updateSetting('confirmBeforeSubmit', value)} />
      </div>
    </div>
  )
}

function Notice({ tone, children }) {
  const success = tone === 'success'
  return (
    <div style={{ ...noticeStyle, borderColor: success ? 'rgba(22,101,52,.28)' : 'rgba(153,27,27,.28)' }}>
      <p style={{ ...styles.smallCardText, color: success ? '#166534' : '#991b1b', fontWeight: 800 }}>{children}</p>
    </div>
  )
}

function Toggle({ title, description, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={checked ? activeToggleCardStyle : toggleCardStyle}>
      <div>
        <p style={styles.eyebrow}>{checked ? 'Enabled' : 'Disabled'}</p>
        <h3 style={styles.smallCardTitle}>{title}</h3>
        <p style={styles.smallCardText}>{description}</p>
      </div>
      <span style={checked ? activeSwitchStyle : switchStyle}><span style={checked ? activeKnobStyle : knobStyle}></span></span>
    </button>
  )
}

const settingsHeroStyle = { padding: 28, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(92,53,18,.96), rgba(154,106,34,.9))', boxShadow: '0 24px 60px rgba(80,52,20,.22)', marginBottom: 18 }
const settingsHeroTitleStyle = { margin: 0, color: '#fff8eb', fontSize: 'clamp(2rem,4vw,3.4rem)', lineHeight: 1, letterSpacing: '-.06em' }
const settingsHeroTextStyle = { margin: '12px 0 0', color: 'rgba(255,248,235,.88)', lineHeight: 1.65, maxWidth: 760 }
const languageBadgeStyle = { minWidth: 150, padding: 18, borderRadius: 26, textAlign: 'center', background: 'rgba(255,248,235,.16)', border: '1px solid rgba(255,248,235,.24)' }
const languageCodeStyle = { display: 'block', color: '#f4d28a', fontSize: '2.2rem', fontWeight: 950, lineHeight: 1 }
const languageNameStyle = { display: 'block', marginTop: 8, color: '#fff8eb', fontWeight: 850 }
const stickySaveBarStyle = { position: 'sticky', top: 104, zIndex: 50, marginBottom: 22, padding: '14px 16px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: 'linear-gradient(135deg,rgba(255,248,235,.97),rgba(244,210,138,.9))', border: '1px solid rgba(154,106,34,.28)', boxShadow: '0 18px 42px rgba(80,52,20,.16)', backdropFilter: 'blur(16px)' }
const saveHelpStyle = { margin: '4px 0 0', color: '#6b5540', fontSize: '.88rem', fontWeight: 700 }
const noticeStyle = { ...styles.smallCard, marginBottom: 16 }
const languageGridStyle = { display: 'grid', gridTemplateColumns: 'minmax(260px, 1.4fr) minmax(240px, 1fr)', gap: 14, margin: '18px 0 28px' }
const settingsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, margin: '18px 0 30px' }
const largeFieldStyle = { padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.72)', border: '1px solid rgba(139,92,40,.16)', display: 'grid', gap: 10, color: '#5c3512', fontWeight: 900 }
const inputStyle = { width: '100%', padding: '14px 15px', borderRadius: 16, border: '1px solid rgba(139,92,40,.24)', background: 'rgba(255,255,255,.86)', color: '#3b2817', fontWeight: 800 }
const buttonStyle = { border: 0, borderRadius: 999, padding: '13px 20px', cursor: 'pointer', background: 'linear-gradient(135deg,#9a6a22,#5c3512)', color: '#fff8eb', fontWeight: 900, boxShadow: '0 14px 30px rgba(92,53,18,.22)' }
const toggleCardStyle = { padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.68)', border: '1px solid rgba(139,92,40,.16)', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer', color: '#3b2817', boxShadow: '0 12px 30px rgba(80,52,20,.08)' }
const activeToggleCardStyle = { ...toggleCardStyle, background: 'linear-gradient(135deg,rgba(255,248,235,.98),rgba(244,210,138,.46))', border: '1px solid rgba(154,106,34,.42)', boxShadow: '0 18px 42px rgba(80,52,20,.16)' }
const switchStyle = { flex: '0 0 auto', width: 54, height: 30, borderRadius: 999, background: 'rgba(139,92,40,.2)', padding: 3, display: 'flex', alignItems: 'center' }
const activeSwitchStyle = { ...switchStyle, background: 'linear-gradient(135deg,#9a6a22,#5c3512)', justifyContent: 'flex-end' }
const knobStyle = { width: 24, height: 24, borderRadius: 999, background: '#fff8eb', boxShadow: '0 6px 12px rgba(80,52,20,.18)' }
const activeKnobStyle = { ...knobStyle }

export default AccessibilityScreen
