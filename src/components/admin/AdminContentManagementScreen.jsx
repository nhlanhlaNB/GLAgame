import { styles } from '../game/gameStyles'
import { ActionButton, DataTable, Pill, SectionHeader } from '../game/ui'

function AdminContentManagementScreen({ title, eyebrow, rows, columns, helper, itemName }) {
  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow={eyebrow} title={title}>{helper}</SectionHeader>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Content controls</p>
            <h3 style={styles.smallCardTitle}>Add, edit or remove {itemName}</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionButton>Add New</ActionButton>
            <ActionButton variant="secondary">Import CSV</ActionButton>
            <ActionButton variant="secondary">Save Draft</ActionButton>
          </div>
        </div>
        <p style={{ ...styles.smallCardText, marginTop: 12 }}>
          UI-only form placeholder. Connect this to your database/API later.
        </p>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={{ marginBottom: 12 }}><Pill>UI only</Pill></div>
        <DataTable rows={rows} columns={columns} />
      </div>
    </div>
  )
}

export default AdminContentManagementScreen
