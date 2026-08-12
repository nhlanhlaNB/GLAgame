import { useEffect, useState } from 'react'
import AdminLoginScreen from './AdminLoginScreen'
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard'
import {
  getSavedAdminSession,
  logoutAdmin,
  onAdminAuthStateChanged
} from '../../services/admin/adminAuthService'

function AdminApp() {
  const [adminUser, setAdminUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    setAdminUser(getSavedAdminSession())

    const unsubscribe = onAdminAuthStateChanged((sessionUser) => {
      setAdminUser(sessionUser)
      setAuthLoading(false)
    })

    return unsubscribe
  }, [])

  if (authLoading) {
    return (
      <main className="adminLoginPage">
        <style>{loginPageCss}</style>
        <p>Checking admin session...</p>
      </main>
    )
  }

  if (!adminUser) {
    return <AdminLoginScreen onLogin={setAdminUser} />
  }

  return (
    <AdminAnalyticsDashboard
      adminUser={adminUser}
      onLogout={() => {
        logoutAdmin()
        setAdminUser(null)
      }}
    />
  )
}

export default AdminApp

const loginPageCss = `
  .adminLoginPage {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: #5c3512;
    font-weight: 850;
    background:
      radial-gradient(circle at top left, rgba(244, 210, 138, 0.24), transparent 28rem),
      linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(232, 214, 170, 0.74));
  }
`
