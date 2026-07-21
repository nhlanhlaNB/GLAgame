import { useEffect, useState } from 'react'
import { styles } from '../game/gameStyles'
import { SectionHeader } from '../game/ui'
import { getLaunchSettings, saveLaunchSettings } from '../../services/admin/adminLaunchSettingsService'
import { Field, MessageCard, inputStyle, primaryButtonStyle } from './shared/AdminFeatureUi'

function AdminLaunchSettingsScreen() {
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { getLaunchSettings().then(setForm).catch((err) => setError(err.message)) }, [])
  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); try { await saveLaunchSettings(form); setMessage('Launch settings saved.') } catch (err) { setError(err.message) } }
  return <div style={styles.panel}>
    <SectionHeader eyebrow="Launch settings management" title="Control public launch and availability.">Use this to manage launch status, maintenance mode, public access, registrations and launch announcement.</SectionHeader>
    <MessageCard message={error} tone="error" /><MessageCard message={message} />
    <div style={{ ...styles.smallCard, marginTop: 18 }}><form onSubmit={submit} style={formGrid}>
      <Field label="Launch title"><input style={inputStyle} value={form.launchTitle || ''} onChange={(e)=>setForm({...form,launchTitle:e.target.value})} /></Field>
      <Field label="Launch status"><select style={inputStyle} value={form.launchStatus || 'draft'} onChange={(e)=>setForm({...form,launchStatus:e.target.value})}><option>draft</option><option>live</option><option>paused</option><option>maintenance</option></select></Field>
      <Field label="Active season"><input style={inputStyle} value={form.activeSeason || ''} onChange={(e)=>setForm({...form,activeSeason:e.target.value})} /></Field>
      <Field label="Launch date"><input style={inputStyle} type="date" value={form.launchDate || ''} onChange={(e)=>setForm({...form,launchDate:e.target.value})} /></Field>
      <Field label="Launch message"><textarea style={inputStyle} value={form.launchMessage || ''} onChange={(e)=>setForm({...form,launchMessage:e.target.value})} /></Field>
      <label><input type="checkbox" checked={!!form.allowRegistrations} onChange={(e)=>setForm({...form,allowRegistrations:e.target.checked})} /> Allow registrations</label>
      <label><input type="checkbox" checked={!!form.allowPublicAccess} onChange={(e)=>setForm({...form,allowPublicAccess:e.target.checked})} /> Allow public access</label>
      <label><input type="checkbox" checked={!!form.maintenanceMode} onChange={(e)=>setForm({...form,maintenanceMode:e.target.checked})} /> Maintenance mode</label>
      <button style={primaryButtonStyle}>Save launch settings</button>
    </form></div>
  </div>
}
const formGrid = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }
export default AdminLaunchSettingsScreen
