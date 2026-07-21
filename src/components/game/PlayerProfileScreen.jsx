import { useEffect, useState } from 'react'
import { styles } from './gameStyles'
import { ActionButton, DataTable, MetricCard, SectionHeader } from './ui'

function formatDate(value) {
  if (!value) return 'Not available'

  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString()
  }

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return 'Not available'
}

function displayValue(value, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function PlayerProfileScreen({
  profile = {},
  fullName,
  email,
  firstName = '',
  lastName = '',
  phone = '',
  selectedProblemStack = [],
  completedProblemRows = [],
  attempts = [],
  glaCoinBalance = 0,
  totalGlaCoinEarned = 0,
  totalGlaCoinSpent = 0,
  completedProblems = 0,
  averageScore = 0,
  certificateUnlocked = false,
  profileSaving = false,
  profileMessage = '',
  onSaveProfile
}) {
  const [formData, setFormData] = useState({
    firstName,
    lastName,
    email,
    phone,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      firstName,
      lastName,
      email,
      phone,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }))
  }, [firstName, lastName, email, phone])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!onSaveProfile) return

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return
    }

    onSaveProfile({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      displayName: `${formData.firstName} ${formData.lastName}`.trim()
    })
  }

  const recentAttempts = attempts.slice(0, 5).map((attempt) => ({
    id: attempt.id || attempt.attemptId,
    problemTitle: attempt.problemCardTitle || attempt.problemTitle || 'Problem',
    totalScore: attempt.totalScore || 0,
    glaCoinEarned: attempt.glaCoinEarned || 0,
    attemptNumber: attempt.attemptNumber || 1
  }))

  return (
    <div style={styles.panel}>
      <SectionHeader eyebrow="Player profile" title={`${fullName || 'Player'}'s profile`}>
        This screen gives a full profile view for the player, including identity,
        selected stack, progress, GLA coin, certificate status and activity.
      </SectionHeader>

      <div style={profileSummaryGridStyle}>
        <MetricCard title="Name" value={displayValue(fullName, 'Player')} />
        <MetricCard title="Selected Stack" value={selectedProblemStack.length} />
        <MetricCard title="Attempts" value={attempts.length} />
        <MetricCard title="Completed" value={completedProblems} />
        <MetricCard title="Average Score" value={averageScore} />
        <MetricCard title="GLA Coin" value={glaCoinBalance} />
        <MetricCard title="Total Spent" value={totalGlaCoinSpent} />
        <MetricCard title="Certificate" value={certificateUnlocked ? 'Unlocked' : 'Locked'} />
        <div style={emailSummaryCardStyle}>
          <p style={styles.eyebrow}>Email Address</p>
          <h3 style={emailSummaryValueStyle}>{displayValue(email, 'No email')}</h3>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          ...styles.smallCard,
          marginTop: '18px',
          display: 'grid',
          gap: '14px'
        }}
      >
        <p style={styles.eyebrow}>Edit profile</p>

        <div style={{ display: 'grid', gap: '10px' }}>
          <label style={labelStyle}>First Name</label>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter first name"
          />
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <label style={labelStyle}>Last Name</label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter last name"
          />
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <label style={labelStyle}>Email Address</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter email address"
          />
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <label style={labelStyle}>Phone</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter phone number"
          />
        </div>

        <div style={passwordGridStyle}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <label style={labelStyle}>Current Password</label>
            <input
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Needed for email/password changes"
            />
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <label style={labelStyle}>New Password</label>
            <input
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Leave empty to keep current password"
            />
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Repeat new password"
            />
          </div>
        </div>

        {formData.newPassword && formData.newPassword !== formData.confirmPassword && (
          <p style={{ margin: 0, fontWeight: 800, color: '#991b1b' }}>
            New password and confirm password must match.
          </p>
        )}

        <div>
          <ActionButton type="submit" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </ActionButton>
        </div>

        {profileMessage && (
          <p style={{ margin: 0, fontWeight: 800, color: '#5c3512' }}>
            {profileMessage}
          </p>
        )}
      </form>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>Completed problem cards</p>
        <DataTable
          columns={[
            { key: 'problemTitle', label: 'Problem' },
            { key: 'bestScore', label: 'Best' },
            { key: 'latestScore', label: 'Latest' },
            { key: 'attempts', label: 'Attempts' }
          ]}
          rows={completedProblemRows}
        />
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>Recent attempts</p>
        <DataTable
          columns={[
            { key: 'problemTitle', label: 'Problem' },
            { key: 'totalScore', label: 'Score' },
            { key: 'glaCoinEarned', label: 'GLA Coin' },
            { key: 'attemptNumber', label: 'Attempt' }
          ]}
          rows={recentAttempts}
        />
      </div>

      <div style={{ ...styles.smallCard, marginTop: '18px' }}>
        <p style={styles.eyebrow}>System information</p>
        <p style={infoTextStyle}>User ID: {displayValue(profile.userId)}</p>
        <p style={infoTextStyle}>Created: {formatDate(profile.createdAt)}</p>
        <p style={infoTextStyle}>Updated: {formatDate(profile.updatedAt)}</p>
        <p style={infoTextStyle}>Last Login: {formatDate(profile.lastLoginAt)}</p>
     
      </div>
    </div>
  )
}

const profileSummaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '14px'
}

const emailSummaryCardStyle = {
  ...styles.smallCard,
  gridColumn: '1 / -1',
  minHeight: 96
}

const emailSummaryValueStyle = {
  margin: '8px 0 0',
  color: '#4b2b10',
  fontSize: 'clamp(1.05rem, 2.4vw, 1.55rem)',
  lineHeight: 1.25,
  letterSpacing: '-0.03em',
  overflowWrap: 'anywhere'
}

const passwordGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '12px'
}

const labelStyle = {
  fontWeight: 800,
  color: '#5c3512'
}

const inputStyle = {
  width: '100%',
  border: '1px solid rgba(139, 92, 40, 0.2)',
  borderRadius: '16px',
  padding: '13px 14px',
  fontSize: '1rem',
  color: '#3b2817',
  background: 'rgba(255, 255, 255, 0.72)',
  outline: 'none'
}

const infoTextStyle = {
  margin: '8px 0',
  color: '#5c3512',
  fontWeight: 700,
  wordBreak: 'break-word'
}

export default PlayerProfileScreen