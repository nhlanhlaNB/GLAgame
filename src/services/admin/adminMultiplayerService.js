import { serverTimestamp } from 'firebase/firestore'
import { COLLECTIONS } from '../firebaseService'
import { cleanText, getRows, makeSafeId, removeDocument, saveDocument, toNumber } from './adminDataHelpers'

export async function getMultiplayerRooms() {
  const rooms = await getRows(COLLECTIONS.multiplayerRooms)
  const players = await getRows(COLLECTIONS.roomPlayers)
  return rooms.map((room) => ({
    ...room,
    playerCount: players.filter((player) => String(player.roomId) === String(room.roomId || room.firestoreId)).length
  }))
}

export async function updateRoomStatus(room, status) {
  const roomId = room.firestoreId || room.roomId
  return saveDocument(COLLECTIONS.multiplayerRooms, roomId, {
    ...room,
    roomStatus: cleanText(status),
    moderatedAt: serverTimestamp()
  }, { actionType: `room_${status}` })
}

export async function deleteRoom(room) {
  return removeDocument(COLLECTIONS.multiplayerRooms, room.firestoreId || room.roomId, { actionType: 'delete_multiplayer_room' })
}

export async function createAdminRoom(formValues) {
  const title = cleanText(formValues.title) || 'Admin Room'
  const roomId = cleanText(formValues.roomId || formValues.firestoreId) || makeSafeId(`${title}_${Date.now()}`, 'room')
  return saveDocument(COLLECTIONS.multiplayerRooms, roomId, {
    roomId,
    title,
    roomType: cleanText(formValues.roomType) || 'challenge',
    roomStatus: cleanText(formValues.roomStatus) || 'open',
    maxPlayers: toNumber(formValues.maxPlayers, 4),
    createdBy: 'admin',
    createdAt: formValues.createdAt || serverTimestamp()
  }, { actionType: 'create_multiplayer_room' })
}
