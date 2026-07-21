import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import { deleteUiTranslation, getLanguages, getUiTranslations, saveLanguageVersion, saveUiTranslation, seedStarterTranslations } from '../../services/admin/adminLocalizationService'
import { Field, MessageCard, SearchBox, SimpleTable, StatusPill, dangerButtonStyle, inputStyle, primaryButtonStyle, secondaryButtonStyle } from './shared/AdminFeatureUi'

function AdminLocalizationManagementScreen() {
  const [languages, setLanguages] = useState([])
  const [translations, setTranslations] = useState([])
  const [languageForm, setLanguageForm] = useState({ languageCode: '', languageName: '', deckStatus: 'Draft', reviewer: '', order: '' })
  const [translationForm, setTranslationForm] = useState({ languageCode: 'fr', key: '', sourceText: '', translatedText: '', section: 'player' })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function loadData(){ setLoading(true); setError(''); try{ const [a,b]=await Promise.all([getLanguages(),getUiTranslations()]); setLanguages(a); setTranslations(b)}catch(err){setError(err.message)}finally{setLoading(false)}}
  useEffect(()=>{loadData()},[])
  const filtered = useMemo(()=>translations.filter((row)=>[row.languageCode,row.key,row.sourceText,row.translatedText,row.section].join(' ').toLowerCase().includes(search.toLowerCase())),[translations,search])
  async function saveLang(e){e.preventDefault(); try{await saveLanguageVersion(languageForm); setLanguageForm({ languageCode:'', languageName:'', deckStatus:'Draft', reviewer:'', order:''}); setMessage('Language saved.'); await loadData()}catch(err){setError(err.message)}}
  async function saveTranslation(e){e.preventDefault(); try{await saveUiTranslation(translationForm); setTranslationForm({...translationForm,key:'',sourceText:'',translatedText:''}); setMessage('Translation saved.'); await loadData()}catch(err){setError(err.message)}}
  async function seed(){ try{const count=await seedStarterTranslations(); setMessage(`${count} starter languages saved.`); await loadData()}catch(err){setError(err.message)}}
  async function remove(row){ if(!window.confirm('Delete this translation?')) return; await deleteUiTranslation(row); setMessage('Translation deleted.'); await loadData() }
  return <div style={styles.panel}>
    <SectionHeader eyebrow="Language and UI translation editor" title="Manage system languages and interface translations.">Player-side language changes use languageVersions and uiTranslations. The provider also uses these records to translate the system interface.</SectionHeader>
    <MessageCard message={error} tone="error"/><MessageCard message={message}/>
    <div style={{...styles.centerButtonRow, marginTop:16}}><button style={secondaryButtonStyle} onClick={seed}>Create starter languages</button></div>
    <div style={styles.twoColumnGrid}>
      <div style={{...styles.smallCard, marginTop:18}}><p style={styles.eyebrow}>Language version</p><form onSubmit={saveLang} style={formGrid}><Field label="Code"><input style={inputStyle} value={languageForm.languageCode} onChange={(e)=>setLanguageForm({...languageForm,languageCode:e.target.value})}/></Field><Field label="Name"><input style={inputStyle} value={languageForm.languageName} onChange={(e)=>setLanguageForm({...languageForm,languageName:e.target.value})}/></Field><Field label="Deck status"><select style={inputStyle} value={languageForm.deckStatus} onChange={(e)=>setLanguageForm({...languageForm,deckStatus:e.target.value})}><option>Draft</option><option>Review</option><option>Published</option></select></Field><Field label="Reviewer"><input style={inputStyle} value={languageForm.reviewer} onChange={(e)=>setLanguageForm({...languageForm,reviewer:e.target.value})}/></Field><button style={primaryButtonStyle}>Save language</button></form></div>
      <div style={{...styles.smallCard, marginTop:18}}><p style={styles.eyebrow}>UI translation</p><form onSubmit={saveTranslation} style={formGrid}><Field label="Language"><select style={inputStyle} value={translationForm.languageCode} onChange={(e)=>setTranslationForm({...translationForm,languageCode:e.target.value})}>{languages.map((language)=><option key={language.languageCode || language.firestoreId} value={language.languageCode || language.firestoreId}>{language.languageName || language.languageCode}</option>)}</select></Field><Field label="Key"><input style={inputStyle} value={translationForm.key} onChange={(e)=>setTranslationForm({...translationForm,key:e.target.value})}/></Field><Field label="English/source text"><input style={inputStyle} value={translationForm.sourceText} onChange={(e)=>setTranslationForm({...translationForm,sourceText:e.target.value})}/></Field><Field label="Translated text"><textarea style={inputStyle} value={translationForm.translatedText} onChange={(e)=>setTranslationForm({...translationForm,translatedText:e.target.value})}/></Field><button style={primaryButtonStyle}>Save translation</button></form></div>
    </div>
    <div style={{...styles.smallCard, marginTop:18}}><div style={styles.rowBetween}><h3 style={styles.smallCardTitle}>Languages</h3><Pill>{languages.length}</Pill></div><SimpleTable loading={loading} rows={languages} columns={[{key:'languageName',label:'Language'}, {key:'languageCode',label:'Code'}, {key:'deckStatus',label:'Status'}, {key:'isActive',label:'Active', render:(r)=><StatusPill value={r.isActive?'active':'inactive'}/>}]} /></div>
    <div style={{...styles.smallCard, marginTop:18}}><SearchBox value={search} onChange={setSearch} placeholder="Search translations..."/><SimpleTable loading={loading} rows={filtered} columns={[{key:'languageCode',label:'Lang'}, {key:'key',label:'Key'}, {key:'sourceText',label:'Source'}, {key:'translatedText',label:'Translation'}, {key:'actions',label:'Actions',render:(r)=><button style={dangerButtonStyle} onClick={()=>remove(r)}>Delete</button>}]} /></div>
  </div>
}
const formGrid={display:'grid',gap:12}
export default AdminLocalizationManagementScreen
