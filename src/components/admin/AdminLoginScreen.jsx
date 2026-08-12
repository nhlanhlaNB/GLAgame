import { useState } from 'react'
import { loginAdmin } from '../../services/admin/adminAuthService'

const ADMIN_ACCESS_CODE = 'Catchthefish'

function AdminLoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email.trim() || !password) {
      setError('Enter your admin email and password.')
      return
    }

    if (String(accessCode).trim() !== ADMIN_ACCESS_CODE) {
      setError('Incorrect admin access code.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const adminUser = await loginAdmin({ email, password })
      onLogin(adminUser)
    } catch (err) {
      setError(
        err.message ||
          'Could not sign in. Check your email and password and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="adminLoginPage">
      <style>{loginCss}</style>

      <section className="adminLoginCard">
        <div className="adminLoginBrand">
          <div className="adminLogo">GLA</div>
          <div>
            <p className="adminEyebrow">Admin login</p>
            <h1>GRIT Lab Africa Admin Portal</h1>
            <p>
              Sign in with your administrator account to manage cards, rubrics,
              certificate templates, language versions, analytics and reports.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="adminLoginForm">
          <label>
            Admin email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@gritlabafrica.org"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Enter admin password"
              autoComplete="current-password"
            />
          </label>

          <label>
            Access code
            <input
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Enter access code"
              autoComplete="off"
            />
          </label>

          {error && <p className="adminLoginError">{error}</p>}

          <div className="adminLoginActions">
            <button
              type="submit"
              className="adminPrimaryButton"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Login as Admin'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

const loginCss = `
  .adminLoginPage {
    min-height: 100vh;
    padding: 32px;
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at top left, rgba(244, 210, 138, 0.24), transparent 28rem),
      linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(232, 214, 170, 0.74));
  }

  .adminLoginCard {
    width: min(980px, 100%);
    padding: 34px;
    border-radius: 34px;
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(139, 92, 40, 0.22);
    box-shadow: 0 30px 80px rgba(80, 52, 20, 0.2);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .adminLoginBrand {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 18px;
    align-items: start;
    margin-bottom: 24px;
  }

  .adminLogo {
    width: 72px;
    height: 72px;
    border-radius: 24px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #9a6a22, #5c3512);
    color: #fff8eb;
    font-weight: 950;
    box-shadow: 0 16px 34px rgba(92, 53, 18, 0.24);
  }

  .adminEyebrow {
    margin: 0 0 10px;
    color: #9a6a22;
    font-size: 0.74rem;
    font-weight: 850;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .adminLoginBrand h1 {
    margin: 0 0 12px;
    color: #4b2b10;
    font-size: clamp(2.2rem, 4vw, 4rem);
    line-height: 0.95;
    letter-spacing: -0.065em;
  }

  .adminLoginBrand p:last-child {
    margin: 0;
    color: #5c4632;
    line-height: 1.7;
  }

  .adminLoginForm {
    display: grid;
    gap: 14px;
  }

  .adminLoginForm label {
    display: grid;
    gap: 8px;
    color: #5c3512;
    font-weight: 850;
  }

  .adminLoginForm input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(139, 92, 40, 0.22);
    background: rgba(255, 255, 255, 0.78);
    color: #3b2817;
    outline: none;
  }

  .adminLoginError {
    margin: 0;
    color: #991b1b;
    font-weight: 750;
  }

  .adminLoginActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .adminPrimaryButton {
    border-radius: 999px;
    padding: 13px 22px;
    cursor: pointer;
    font-weight: 850;
  }

  .adminPrimaryButton {
    border: 0;
    background: linear-gradient(135deg, #9a6a22, #5c3512);
    color: #fff8eb;
    box-shadow: 0 14px 30px rgba(92, 53, 18, 0.22);
  }

  .adminPrimaryButton:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  @media (max-width: 620px) {
    .adminLoginPage { padding: 16px; }
    .adminLoginCard { padding: 22px; }
    .adminLoginBrand { grid-template-columns: 1fr; }
  }
`

export default AdminLoginScreen
