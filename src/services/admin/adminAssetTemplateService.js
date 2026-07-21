import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { COLLECTIONS, db, storage } from '../firebaseService'

const CERTIFICATE_TEMPLATE_DOC_ID = 'certificateTemplate'

function cleanText(value) {
  return String(value || '').trim()
}

function cleanFileName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
}

function getCardCollectionName(cardType) {
  return cardType === 'ai' ? COLLECTIONS.aiCards : COLLECTIONS.problemCards
}

function getCardDocumentPrefix(cardType) {
  return cardType === 'ai' ? 'ai_' : 'problem_'
}

function getCardDocumentId(cardType, card) {
  if (card.firestoreId) {
    return card.firestoreId
  }

  if (String(card.id || '').startsWith(getCardDocumentPrefix(cardType))) {
    return String(card.id)
  }

  return `${getCardDocumentPrefix(cardType)}${card.id}`
}

async function uploadFileToStorage(path, file) {
  if (!file) {
    throw new Error('Please choose a file to upload.')
  }

  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)

  return getDownloadURL(storageRef)
}

export async function getAdminCardImageTargets() {
  const [problemSnapshot, aiSnapshot] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.problemCards)),
    getDocs(collection(db, COLLECTIONS.aiCards))
  ])

  const problemCards = problemSnapshot.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    cardType: 'problem',
    collectionName: COLLECTIONS.problemCards,
    ...documentSnapshot.data()
  }))

  const aiCards = aiSnapshot.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    cardType: 'ai',
    collectionName: COLLECTIONS.aiCards,
    ...documentSnapshot.data()
  }))

  return [...problemCards, ...aiCards].sort((a, b) => {
    if (a.cardType !== b.cardType) {
      return a.cardType.localeCompare(b.cardType)
    }

    return Number(a.id || 0) - Number(b.id || 0)
  })
}

export async function uploadCardImage({ cardType, card, imageRole, file }) {
  if (!card) {
    throw new Error('Please select a card first.')
  }

  if (!['front', 'back'].includes(imageRole)) {
    throw new Error('Image role must be front or back.')
  }

  const collectionName = getCardCollectionName(cardType)
  const documentId = getCardDocumentId(cardType, card)
  const safeName = cleanFileName(file.name)
  const storagePath = `card-assets/${cardType}/${documentId}/${imageRole}-${Date.now()}-${safeName}`

  const downloadUrl = await uploadFileToStorage(storagePath, file)

  const updateData = {
    imageUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  if (imageRole === 'front') {
    updateData.frontImageUrl = downloadUrl
    updateData.frontImagePath = storagePath
    updateData.frontImageName = file.name
  } else {
    updateData.backImageUrl = downloadUrl
    updateData.backImagePath = storagePath
    updateData.backImageName = file.name
  }

  await setDoc(doc(db, collectionName, documentId), updateData, {
    merge: true
  })

  return {
    cardType,
    documentId,
    imageRole,
    downloadUrl,
    storagePath,
    fileName: file.name
  }
}

export async function getCertificateTemplate() {
  const templateRef = doc(
    db,
    COLLECTIONS.appSettings,
    CERTIFICATE_TEMPLATE_DOC_ID
  )

  const templateSnapshot = await getDoc(templateRef)

  if (!templateSnapshot.exists()) {
    return {
      templateId: CERTIFICATE_TEMPLATE_DOC_ID,
      certificateTitle:
        'Artificial Intelligence and Practical Applications',
      certificateSubtitle:
        'Gaming SDG Problems and Ideating Solutions for Africa',
      bodyText:
        'This certifies that the learner has completed the GRIT Lab Africa AI for SDGs Card Game certificate requirements.',
      signerName: 'GRIT Lab Africa',
      signerTitle: 'Innovation and AI Literacy Programme',
      verificationText: 'Certificate verification ID',
      logoUrl: '',
      backgroundUrl: '',
      signatureUrl: ''
    }
  }

  return {
    templateId: templateSnapshot.id,
    ...templateSnapshot.data()
  }
}

export async function saveCertificateTemplate(formValues) {
  const certificateTitle = cleanText(formValues.certificateTitle)
  const certificateSubtitle = cleanText(formValues.certificateSubtitle)
  const bodyText = cleanText(formValues.bodyText)
  const signerName = cleanText(formValues.signerName)
  const signerTitle = cleanText(formValues.signerTitle)
  const verificationText = cleanText(formValues.verificationText)

  if (!certificateTitle) {
    throw new Error('Certificate title is required.')
  }

  if (!bodyText) {
    throw new Error('Certificate body text is required.')
  }

  if (!signerName) {
    throw new Error('Signer name is required.')
  }

  const templateData = {
    templateId: CERTIFICATE_TEMPLATE_DOC_ID,
    certificateTitle,
    certificateSubtitle,
    bodyText,
    signerName,
    signerTitle,
    verificationText,
    updatedAt: serverTimestamp()
  }

  await setDoc(
    doc(db, COLLECTIONS.appSettings, CERTIFICATE_TEMPLATE_DOC_ID),
    templateData,
    { merge: true }
  )

  return templateData
}

export async function uploadCertificateTemplateAsset({ assetType, file }) {
  if (!['logo', 'background', 'signature'].includes(assetType)) {
    throw new Error('Certificate asset type is invalid.')
  }

  const safeName = cleanFileName(file.name)
  const storagePath = `certificate-assets/${assetType}-${Date.now()}-${safeName}`
  const downloadUrl = await uploadFileToStorage(storagePath, file)

  const updateData = {
    updatedAt: serverTimestamp()
  }

  if (assetType === 'logo') {
    updateData.logoUrl = downloadUrl
    updateData.logoPath = storagePath
    updateData.logoFileName = file.name
  }

  if (assetType === 'background') {
    updateData.backgroundUrl = downloadUrl
    updateData.backgroundPath = storagePath
    updateData.backgroundFileName = file.name
  }

  if (assetType === 'signature') {
    updateData.signatureUrl = downloadUrl
    updateData.signaturePath = storagePath
    updateData.signatureFileName = file.name
  }

  await setDoc(
    doc(db, COLLECTIONS.appSettings, CERTIFICATE_TEMPLATE_DOC_ID),
    updateData,
    { merge: true }
  )

  return {
    assetType,
    downloadUrl,
    storagePath,
    fileName: file.name
  }
}

export async function getCardSkins() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.cardSkins))
  return snapshot.docs
    .map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
    .filter((skin) => !String(skin.firestoreId || '').toLowerCase().includes('__schema'))
    .sort((a, b) => Number(a.order || 99) - Number(b.order || 99))
}

export async function saveCardSkin(formValues) {
  const title = cleanText(formValues.title)
  if (!title) throw new Error('Card skin title is required.')

  const skinId = cleanText(formValues.skinId || formValues.firestoreId) || cleanFileName(title).replace(/-/g, '_')
  const data = {
    skinId,
    title,
    description: cleanText(formValues.description),
    cardType: cleanText(formValues.cardType || 'all'),
    imageUrl: cleanText(formValues.imageUrl),
    requiredLevel: Number(formValues.requiredLevel || 0),
    requiredAchievementId: cleanText(formValues.requiredAchievementId),
    requiredCompletedProblems: Number(formValues.requiredCompletedProblems || 0),
    requiredAverageScore: Number(formValues.requiredAverageScore || 0),
    isActive: formValues.isActive !== false,
    order: Number(formValues.order || 99),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTIONS.cardSkins, skinId), data, { merge: true })
  return { firestoreId: skinId, ...data }
}

export async function getUserCardSkins() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.userCardSkins))
  return snapshot.docs
    .map((documentSnapshot) => ({ firestoreId: documentSnapshot.id, ...documentSnapshot.data() }))
    .filter((skin) => !String(skin.firestoreId || '').toLowerCase().includes('__schema'))
}
