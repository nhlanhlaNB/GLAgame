import { useLanguage } from '../../context/LanguageContext'
import { styles } from './gameStyles'
import { Pill, SectionHeader } from './ui'

function MultilingualScreen() {
  const { languageCode, languageOptions, setLanguage, t } = useLanguage()
  return <div style={styles.panel}>
    <SectionHeader eyebrow={t('language','Language')} title="Multilingual experience">
      Choose a language from the system languageVersions. The app uses uiTranslations to translate the player interface.
    </SectionHeader>
    <div style={styles.metricGrid}>
      {languageOptions.map((language) => <button key={language.languageCode} type="button" onClick={() => setLanguage(language.languageCode)} style={{...languageCard, borderColor: languageCode === language.languageCode ? 'rgba(22,101,52,.42)' : 'rgba(139,92,40,.16)'}}>
        <span style={{fontSize:'2rem'}}>🌐</span>
        <strong>{language.languageName}</strong>
        <small>{language.languageCode}</small>
        {languageCode === language.languageCode && <Pill tone="success">Selected</Pill>}
      </button>)}
    </div>
  </div>
}
const languageCard={padding:20,borderRadius:24,background:'rgba(255,255,255,.66)',border:'1px solid rgba(139,92,40,.16)',display:'grid',gap:8,textAlign:'left',cursor:'pointer',color:'#3b2817'}
export default MultilingualScreen
