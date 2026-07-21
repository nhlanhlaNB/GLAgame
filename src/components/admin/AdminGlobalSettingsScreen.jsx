import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { SectionHeader } from '../game/ui'
import { getGlobalAppSettings, saveGlobalAppSettings } from '../../services/admin/adminSettingsService'
import { Field, MessageCard, inputStyle, primaryButtonStyle } from './shared/AdminFeatureUi'

const systemLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'fr', name: 'French' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'sw', name: 'Kiswahili' }
]

function AdminGlobalSettingsScreen() {
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { getGlobalAppSettings().then(setForm).catch((err) => setError(err.message)) }, [])
  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); try { await saveGlobalAppSettings(form); setMessage('Global app settings saved.') } catch (err) { setError(err.message) } }
  return <div style={styles.panel}>
    <SectionHeader eyebrow="Global app settings management" title="Manage app rules and defaults.">These settings control certificate requirements, card behavior, language defaults and game limits.</SectionHeader>
    <MessageCard message={error} tone="error" /><MessageCard message={message} />
    <div style={{ ...styles.smallCard, marginTop: 18 }}><form onSubmit={submit} style={formGrid}>
      <Field label="Certificate required cards"><input style={inputStyle} type="number" value={form.certificateRequiredCards || ''} onChange={(e)=>setForm({...form,certificateRequiredCards:e.target.value})} /></Field>
      <Field label="Certificate average score"><input style={inputStyle} type="number" value={form.certificateAverageScore || ''} onChange={(e)=>setForm({...form,certificateAverageScore:e.target.value})} /></Field>
      <Field label="Max AI cards"><input style={inputStyle} type="number" value={form.maxAiCardsPerSolution || ''} onChange={(e)=>setForm({...form,maxAiCardsPerSolution:e.target.value})} /></Field>
      <Field label="Explanation word limit"><input style={inputStyle} type="number" value={form.explanationWordLimit || ''} onChange={(e)=>setForm({...form,explanationWordLimit:e.target.value})} /></Field>
      <Field label="Default language"><select style={inputStyle} value={form.defaultLanguage || 'en'} onChange={(e)=>setForm({...form,defaultLanguage:e.target.value})}>{systemLanguages.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}</select></Field>
      <Field label="App theme"><input style={inputStyle} value={form.appTheme || ''} onChange={(e)=>setForm({...form,appTheme:e.target.value})} /></Field>
      <label><input type="checkbox" checked={form.cardFlipEnabledByDefault !== false} onChange={(e)=>setForm({...form,cardFlipEnabledByDefault:e.target.checked})} /> Card flip enabled by default</label>
      <label><input type="checkbox" checked={!!form.soundEnabledByDefault} onChange={(e)=>setForm({...form,soundEnabledByDefault:e.target.checked})} /> Sound enabled by default</label>
      <label><input type="checkbox" checked={form.showCardImagesByDefault !== false} onChange={(e)=>setForm({...form,showCardImagesByDefault:e.target.checked})} /> Show card images by default</label>
      <label><input type="checkbox" checked={!!form.highContrastByDefault} onChange={(e)=>setForm({...form,highContrastByDefault:e.target.checked})} /> High contrast by default</label>
      <label><input type="checkbox" checked={!!form.largeTextByDefault} onChange={(e)=>setForm({...form,largeTextByDefault:e.target.checked})} /> Large text by default</label>
      <label><input type="checkbox" checked={!!form.reduceMotionByDefault} onChange={(e)=>setForm({...form,reduceMotionByDefault:e.target.checked})} /> Reduce motion by default</label>
      <label><input type="checkbox" checked={!!form.hintsEnabled} onChange={(e)=>setForm({...form,hintsEnabled:e.target.checked})} /> Hints enabled</label>
      <button style={primaryButtonStyle}>Save global settings</button>
    </form></div>
  </div>
}
const formGrid = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }
export default AdminGlobalSettingsScreen
