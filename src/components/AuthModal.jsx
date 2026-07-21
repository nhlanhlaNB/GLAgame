import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'

function AuthModal({ onClose, initialMode = 'login' }) {
  const { login, register } = useAuth()

  const [isRegistering, setIsRegistering] = useState(initialMode === 'register')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function getAuthErrorMessage(errorCode) {
    if (
      errorCode === 'auth/invalid-credential' ||
      errorCode === 'auth/user-not-found' ||
      errorCode === 'auth/wrong-password' ||
      errorCode === 'auth/invalid-email'
    ) {
      return 'Incorrect email or password. Please check your details and try again.'
    }

    if (errorCode === 'auth/email-already-in-use') {
      return 'This email is already registered. Please log in or use Forgot Password.'
    }

    if (errorCode === 'auth/weak-password') {
      return 'Password should be at least 6 characters.'
    }

    if (errorCode === 'auth/network-request-failed') {
      return 'Network error. Please check your internet connection and try again.'
    }

    return 'Authentication failed. Please check your details and try again.'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isRegistering) {
        await register(firstName, lastName, phone, email, password)
      } else {
        await login(email, password)
      }

      onClose()
    } catch (err) {
      setError(getAuthErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Please enter your email address first.')
      return
    }

    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage('Password reset email sent. Please check your inbox or spam folder.')
      setIsResettingPassword(false)
      setIsRegistering(false)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account was found with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Could not send password reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const title = isResettingPassword
    ? 'Reset password'
    : isRegistering
      ? 'Create account'
      : 'Welcome back'

  const description = isResettingPassword
    ? 'Enter your email address and we will send you a secure password reset link.'
    : isRegistering
      ? 'Register to start playing the AfriQuest challenge.'
      : 'Log in to continue your AfriQuest challenge journey.'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div
        style={{
          width: 'min(460px, 100%)',
          padding: '32px',
          borderRadius: '28px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(139, 92, 40, 0.22)',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.25)'
        }}
      >
        <button
          onClick={onClose}
          style={{
            float: 'right',
            border: '0',
            background: 'transparent',
            color: '#5c3512',
            fontSize: '1.4rem',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <p
          style={{
            margin: '0 0 10px',
            color: '#9a6a22',
            fontSize: '0.75rem',
            fontWeight: '850',
            letterSpacing: '0.14em',
            textTransform: 'uppercase'
          }}
        >
          AfriQuest Access
        </p>

        <h2
          style={{
            margin: '0 0 10px',
            color: '#5c3512',
            fontSize: '2.2rem',
            lineHeight: '1',
            letterSpacing: '-0.05em'
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '0 0 24px',
            color: '#5c4632',
            lineHeight: '1.6'
          }}
        >
          {description}
        </p>

        {isResettingPassword ? (
          <form onSubmit={handlePasswordReset}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={inputStyle}
            />

            {error && <AlertMessage message={error} tone="error" />}
            {message && <AlertMessage message={message} tone="success" />}

            <button
              type="submit"
              disabled={loading}
              style={submitButtonStyle(loading)}
            >
              {loading ? 'Sending...' : 'Send reset email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  style={inputStyle}
                />

                <input
                  type="text"
                  placeholder="Surname"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  style={inputStyle}
                />

                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  style={inputStyle}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={inputStyle}
            />

            {error && <AlertMessage message={error} tone="error" />}
            {message && <AlertMessage message={message} tone="success" />}

            <button
              type="submit"
              disabled={loading}
              style={submitButtonStyle(loading)}
            >
              {loading
                ? 'Please wait...'
                : isRegistering
                  ? 'Create Account'
                  : 'Login'}
            </button>
          </form>
        )}

        {!isRegistering && !isResettingPassword && (
          <button
            onClick={() => {
              setError('')
              setMessage('')
              setIsResettingPassword(true)
            }}
            style={linkButtonStyle}
          >
            Forgot password?
          </button>
        )}

        <button
          onClick={() => {
            setError('')
            setMessage('')
            setIsResettingPassword(false)
            setIsRegistering(!isRegistering)
          }}
          style={linkButtonStyle}
        >
          {isRegistering
            ? 'Already have an account? Login'
            : isResettingPassword
              ? 'Back to login'
              : 'No account yet? Register'}
        </button>
      </div>
    </div>
  )
}

function AlertMessage({ message, tone }) {
  const isError = tone === 'error'

  return (
    <p
      style={{
        margin: '0 0 14px',
        color: isError ? '#9f1d1d' : '#166534',
        fontSize: '0.9rem',
        lineHeight: '1.5',
        fontWeight: 750
      }}
    >
      {message}
    </p>
  )
}

const inputStyle = {
  width: '100%',
  marginBottom: '12px',
  padding: '15px 16px',
  borderRadius: '16px',
  border: '1px solid rgba(139, 92, 40, 0.2)',
  background: 'rgba(255, 255, 255, 0.75)',
  color: '#3b2817',
  outline: 'none'
}

function submitButtonStyle(loading) {
  return {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '999px',
    border: '0',
    cursor: loading ? 'not-allowed' : 'pointer',
    background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
    color: '#fff8eb',
    fontWeight: '850',
    opacity: loading ? 0.7 : 1
  }
}

const linkButtonStyle = {
  width: '100%',
  marginTop: '16px',
  border: '0',
  background: 'transparent',
  color: '#5c3512',
  fontWeight: '750',
  cursor: 'pointer'
}

export default AuthModal