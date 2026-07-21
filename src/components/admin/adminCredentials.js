export const ADMIN_CREDENTIALS = {
  email: 'admin@gritlabafrica.org',
  password: 'GLA-admin-2026',
  accessCode: 'GLA-ADMIN'
}

export function isValidAdminLogin({ email, password, accessCode }) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanPassword = String(password || '').trim()
  const cleanAccessCode = String(accessCode || '').trim().toUpperCase()

  return (
    cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
    cleanPassword === ADMIN_CREDENTIALS.password &&
    cleanAccessCode === ADMIN_CREDENTIALS.accessCode
  )
}
