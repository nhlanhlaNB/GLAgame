import { useEffect, useMemo, useState } from 'react'
import { styles } from '../game/gameStyles'
import { Pill, SectionHeader } from '../game/ui'
import { deleteAdminReward, getAdminRewards, getRewardClaims, saveAdminReward, updateRewardClaimStatus } from '../../services/admin/adminRewardsService'
import { Field, MessageCard, SearchBox, SimpleTable, StatusPill, dangerButtonStyle, inputStyle, primaryButtonStyle, secondaryButtonStyle } from './shared/AdminFeatureUi'

const emptyReward = { title: '', description: '', rewardType: 'digital', sponsorName: 'GRIT Lab Africa', requiredCoin: '', availableQuantity: '', isActive: true }

function AdminRewardsManagementScreen() {
  const [rewards, setRewards] = useState([])
  const [claims, setClaims] = useState([])
  const [form, setForm] = useState(emptyReward)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true); setError('')
    try { const [rewardRows, claimRows] = await Promise.all([getAdminRewards(), getRewardClaims()]); setRewards(rewardRows); setClaims(claimRows) }
    catch (err) { setError(err.message || 'Could not load rewards.') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [])

  const filteredRewards = useMemo(() => rewards.filter((row) => [row.title, row.description, row.rewardType, row.sponsorName].join(' ').toLowerCase().includes(search.toLowerCase())), [rewards, search])
  const filteredClaims = useMemo(() => claims.filter((row) => [row.rewardTitle, row.userName, row.userEmail, row.claimStatus].join(' ').toLowerCase().includes(search.toLowerCase())), [claims, search])

  async function submit(event) { event.preventDefault(); setError(''); setMessage(''); try { await saveAdminReward(form); setForm(emptyReward); setMessage('Reward saved.'); await loadData() } catch (err) { setError(err.message) } }
  async function remove(row) { if (!window.confirm(`Delete ${row.title}?`)) return; await deleteAdminReward(row); setMessage('Reward deleted.'); await loadData() }
  async function setClaim(row, status) { await updateRewardClaimStatus(row, status); setMessage(`Claim ${status}.`); await loadData() }

  return <div style={styles.panel}>
    <SectionHeader eyebrow="Rewards management" title="Manage sponsor rewards and reward claims.">Admins can create rewards, set GLA coin requirements, and approve or reject player claims.</SectionHeader>
    <MessageCard message={error} tone="error" /><MessageCard message={message} />
    <div style={{ ...styles.smallCard, marginTop: 18 }}><SearchBox value={search} onChange={setSearch} placeholder="Search rewards, claims, users or statuses..." /></div>
    <div style={{ ...styles.smallCard, marginTop: 18 }}>
      <p style={styles.eyebrow}>Create reward</p>
      <form onSubmit={submit} style={formGrid}>
        <Field label="Reward title"><input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Reward type"><select style={inputStyle} value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value })}><option>digital</option><option>voucher</option><option>certificate</option><option>event</option></select></Field>
        <Field label="Sponsor"><input style={inputStyle} value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} /></Field>
        <Field label="Required GLA coin"><input style={inputStyle} type="number" value={form.requiredCoin} onChange={(e) => setForm({ ...form, requiredCoin: e.target.value })} /></Field>
        <Field label="Quantity"><input style={inputStyle} type="number" value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })} /></Field>
        <Field label="Description"><textarea style={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <button style={primaryButtonStyle}>Save reward</button>
      </form>
    </div>
    <div style={{ ...styles.smallCard, marginTop: 18 }}><div style={styles.rowBetween}><h3 style={styles.smallCardTitle}>Rewards</h3><Pill>{filteredRewards.length}</Pill></div><SimpleTable loading={loading} rows={filteredRewards} columns={[{key:'title',label:'Reward'}, {key:'rewardType',label:'Type'}, {key:'requiredCoin',label:'Coin'}, {key:'availableQuantity',label:'Qty'}, {key:'isActive',label:'Status', render:(r)=><StatusPill value={r.isActive?'active':'inactive'} />}, {key:'actions',label:'Actions', render:(r)=><button style={dangerButtonStyle} onClick={()=>remove(r)}>Delete</button>}]} /></div>
    <div style={{ ...styles.smallCard, marginTop: 18 }}><div style={styles.rowBetween}><h3 style={styles.smallCardTitle}>Reward claims</h3><Pill>{filteredClaims.length}</Pill></div><SimpleTable loading={loading} rows={filteredClaims} columns={[{key:'rewardTitle',label:'Reward'}, {key:'userEmail',label:'Player'}, {key:'claimStatus',label:'Status', render:(r)=><StatusPill value={r.claimStatus} />}, {key:'actions',label:'Actions', render:(r)=><div style={{display:'flex',gap:8}}><button style={secondaryButtonStyle} onClick={()=>setClaim(r,'approved')}>Approve</button><button style={dangerButtonStyle} onClick={()=>setClaim(r,'rejected')}>Reject</button></div>}]} /></div>
  </div>
}
const formGrid = { marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }
export default AdminRewardsManagementScreen
