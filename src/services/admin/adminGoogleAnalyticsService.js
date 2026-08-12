import { collection, getDocs } from 'firebase/firestore'
import { COLLECTIONS, db } from '../firebaseService'

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function timestampToMillis(value) {
  if (!value) return 0

  if (typeof value.toMillis === 'function') {
    return value.toMillis()
  }

  if (value.seconds) {
    return value.seconds * 1000
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getEventUserId(event) {
  return event.userId || event.user_id || event.firestoreId
}

function getEventName(event) {
  return (
    event.eventName ||
    event.event_name ||
    event.name ||
    event.type ||
    'unknown_event'
  )
}

function getEventType(event) {
  return event.eventType || event.event_type || 'other'
}

function isSchemaDocument(row) {
  const id = String(row?.firestoreId || row?.id || row?.eventId || '').toLowerCase()
  return id === '__schema' || id.includes('__schema') || id === 'schema'
}

function isToday(millis) {
  if (!millis) return false
  const now = new Date()
  const date = new Date(millis)
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function countByKey(rows, keyGetter) {
  const map = {}

  rows.forEach((row) => {
    const key = keyGetter(row)
    if (!key) return

    if (!map[key]) map[key] = 0
    map[key] += 1
  })

  return Object.entries(map)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
}

async function getAnalyticsEventRows() {
  const snapshot = await getDocs(collection(db, COLLECTIONS.analyticsEvents))

  return snapshot.docs
    .map((documentSnapshot) => ({
      firestoreId: documentSnapshot.id,
      ...documentSnapshot.data()
    }))
    .filter((row) => !isSchemaDocument(row))
}

export async function getGoogleAnalyticsData() {
  const [events, users] = await Promise.all([
    getAnalyticsEventRows(),
    getDocs(collection(db, COLLECTIONS.users))
  ])

  const userRows = users.docs.map((documentSnapshot) => ({
    firestoreId: documentSnapshot.id,
    ...documentSnapshot.data()
  }))

  const userNameById = {}

  userRows.forEach((user) => {
    const id = user.userId || user.uid || user.firestoreId
    if (!id) return

    const firstName = String(user.firstName || '').trim()
    const lastName = String(user.lastName || '').trim()
    const displayName = String(user.displayName || '').trim()

    userNameById[String(id)] =
      `${firstName} ${lastName}`.trim() || displayName || user.email || `Player ${id.slice(0, 6)}`
  })

  const todayEvents = events.filter((event) =>
    isToday(timestampToMillis(event.createdAt))
  )

  const uniqueUsers = new Set(events.map((event) => String(getEventUserId(event) || '')).filter(Boolean))

  const recentEvents = [...events]
    .sort(
      (a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)
    )
    .slice(0, 25)
    .map((event) => ({
      id: event.firestoreId,
      userId: getEventUserId(event),
      userName: userNameById[String(getEventUserId(event))] || 'Unknown Player',
      eventName: getEventName(event),
      eventType: getEventType(event),
      screenName: event.screenName || '',
      createdAt: timestampToMillis(event.createdAt),
      metadata: event.metadata || {}
    }))

  return {
    totalEvents: events.length,
    uniqueUsers: uniqueUsers.size,
    todayEvents: todayEvents.length,
    eventsByType: countByKey(events, getEventType),
    eventsByName: countByKey(events, getEventName),
    topUsers: countByKey(events, (event) => {
      const id = getEventUserId(event)
      return id ? userNameById[String(id)] || String(id) : ''
    }).slice(0, 10),
    recentEvents
  }
}

export async function getGoogleAnalyticsEventLog() {
  const events = await getAnalyticsEventRows()

  return [...events]
    .sort(
      (a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)
    )
    .map((event) => ({
      firestoreId: event.firestoreId,
      userId: getEventUserId(event),
      eventName: getEventName(event),
      eventType: getEventType(event),
      screenName: event.screenName || '',
      createdAt: timestampToMillis(event.createdAt),
      metadata: event.metadata || {},
      coinEarned: toNumber(event.metadata?.glaCoinEarned || event.metadata?.totalScore || event.metadata?.total_score)
    }))
}
