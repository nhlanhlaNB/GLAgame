import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getDocument, saveDocument } from './adminDataHelpers'

const DOC_ID = 'main'

export async function getLaunchSettings() {
  return getDocument(COLLECTIONS.launchSettings, DOC_ID, {
    launchStatus: 'draft',
    launchTitle: 'GRIT Lab Africa AI for SDGs Card Game',
    launchMessage: 'The platform is preparing for launch.',
    allowRegistrations: true,
    allowPublicAccess: true,
    maintenanceMode: false,
    activeSeason: 'Season 1',
    launchDate: ''
  })
}

export async function saveLaunchSettings(formValues) {
  return saveDocument(COLLECTIONS.launchSettings, DOC_ID, {
    launchStatus: cleanText(formValues.launchStatus) || 'draft',
    launchTitle: cleanText(formValues.launchTitle),
    launchMessage: cleanText(formValues.launchMessage),
    allowRegistrations: Boolean(formValues.allowRegistrations),
    allowPublicAccess: Boolean(formValues.allowPublicAccess),
    maintenanceMode: Boolean(formValues.maintenanceMode),
    activeSeason: cleanText(formValues.activeSeason),
    launchDate: cleanText(formValues.launchDate),
    updatedAt: serverTimestamp()
  }, { actionType: 'save_launch_settings' })
}
