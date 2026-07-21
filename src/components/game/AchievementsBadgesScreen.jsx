import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { styles } from './gameStyles'
import { LoadingPage, Pill, SectionHeader } from './ui'
import { syncPlayerAchievements } from '../../services/player/playerAchievementService'

function AchievementsBadgesScreen({
  attempts = [],
  completedProblems = 0,
  totalGlaCoinEarned = 0
}) {
  const { currentUser } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [achievementStats, setAchievementStats] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAchievements() {
    setLoading(true)
    setError('')

    try {
      if (!currentUser?.uid) {
        setAchievements([])
        setAchievementStats(null)
        return
      }

      const result = await syncPlayerAchievements({
        userId: currentUser.uid,
        attempts,
        completedProblems,
        totalGlaCoinEarned
      })

      setAchievements(result.achievements)
      setAchievementStats(result.stats)
    } catch (err) {
      setError(err.message || 'Could not load achievements from the system.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAchievements()
  }, [currentUser?.uid, attempts, completedProblems, totalGlaCoinEarned])

  const categories = useMemo(() => {
    return Array.from(
      new Set(achievements.map((achievement) => achievement.category).filter(Boolean))
    )
  }, [achievements])

  const filteredAchievements = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()

    return achievements.filter((achievement) => {
      const searchableText = [
        achievement.title,
        achievement.description,
        achievement.category
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = !cleanSearch || searchableText.includes(cleanSearch)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unlocked' && achievement.unlocked) ||
        (statusFilter === 'locked' && !achievement.unlocked)

      const matchesCategory =
        categoryFilter === 'all' || achievement.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [achievements, searchTerm, statusFilter, categoryFilter])

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length
  const lockedCount = achievements.length - unlockedCount

  if (loading) {
    return (
      <LoadingPage
        title="Loading achievements"
        message="Syncing player badges and achievement progress from the system."
      />
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Player achievements and badges"
        title="Track your AI for SDGs badges."
      >
        Achievements are connected to the system using the achievements and
        playerAchievements collections.
      </SectionHeader>

      {error && (
        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(153, 27, 27, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Unlocked Badges</p>
          <h3 style={styles.smallCardTitle}>{unlockedCount}</h3>
          <p style={styles.smallCardText}>Badges already achieved.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Locked Badges</p>
          <h3 style={styles.smallCardTitle}>{lockedCount}</h3>
          <p style={styles.smallCardText}>Badges still in progress.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Total Attempts</p>
          <h3 style={styles.smallCardTitle}>{achievementStats?.totalAttempts || 0}</h3>
          <p style={styles.smallCardText}>Attempts counted from this player session.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Best Score</p>
          <h3 style={styles.smallCardTitle}>{achievementStats?.bestScore || 0}%</h3>
          <p style={styles.smallCardText}>Highest score used for score badges.</p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Find achievement badges</h3>
          </div>

          <Pill>{filteredAchievements.length} results</Pill>
        </div>

        <div style={filterGridStyle}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search achievements, badge names or categories..."
            style={inputStyle}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All badges</option>
            <option value="unlocked">Unlocked only</option>
            <option value="locked">Locked only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>the system playerAchievements collection</p>
            <h3 style={styles.smallCardTitle}>Achievement progress</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${filteredAchievements.length} badges`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading achievements from the system...
          </p>
        ) : filteredAchievements.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No achievements match your search.
          </p>
        ) : (
          <div style={achievementGridStyle}>
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.achievementId}
                style={getAchievementCardStyle(achievement.unlocked)}
              >
                <div style={styles.rowBetween}>
                  <div style={getBadgeIconStyle(achievement.unlocked)}>{achievement.icon || '🏅'}</div>

                  <Pill tone={achievement.unlocked ? 'success' : 'default'}>
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </Pill>
                </div>

                <p style={{ ...styles.eyebrow, marginTop: 14 }}>
                  {achievement.category || 'Progress'}
                </p>

                <h3 style={styles.smallCardTitle}>{achievement.title}</h3>

                <p style={styles.smallCardText}>{achievement.description}</p>

                <div style={progressTrackStyle}>
                  <div
                    style={{
                      ...getProgressFillStyle(achievement.unlocked),
                      width: `${achievement.unlocked ? 100 : achievement.progressPercent || 0}%`
                    }}
                  />
                </div>

                <p style={{ ...styles.smallCardText, marginTop: 8 }}>
                  Progress: {achievement.unlocked ? achievement.targetValue : achievement.currentValue} / {achievement.targetValue}
                </p>

                <p style={{ ...styles.smallCardText, marginTop: 4 }}>
                  Reward: {achievement.rewardCoin || 0} GLA coin
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const filterGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 1fr) 180px 220px',
  gap: 12
}

const inputStyle = {
  width: '100%',
  padding: '13px 15px',
  borderRadius: 16,
  border: '1px solid rgba(139, 92, 40, 0.24)',
  background: 'rgba(255, 255, 255, 0.76)',
  color: '#3b2817',
  outline: 'none'
}

const achievementGridStyle = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
}

function getAchievementCardStyle(unlocked) {
  return {
    padding: 18,
    borderRadius: 24,
    background: unlocked
      ? 'linear-gradient(135deg, rgba(244,210,138,0.92), rgba(154,106,34,0.28))'
      : 'rgba(255, 255, 255, 0.66)',
    border: unlocked
      ? '1px solid rgba(154, 106, 34, 0.48)'
      : '1px solid rgba(139, 92, 40, 0.16)',
    boxShadow: unlocked
      ? '0 18px 42px rgba(154, 106, 34, 0.2)'
      : '0 16px 36px rgba(80, 52, 20, 0.08)',
    opacity: unlocked ? 1 : 0.76
  }
}

function getBadgeIconStyle(unlocked) {
  return {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: 'grid',
    placeItems: 'center',
    background: unlocked
      ? 'linear-gradient(135deg, #f4d28a, #9a6a22)'
      : 'linear-gradient(135deg, rgba(244,210,138,0.9), rgba(154,106,34,0.75))',
    color: '#3b2817',
    fontSize: '1.7rem',
    boxShadow: unlocked
      ? '0 14px 32px rgba(154, 106, 34, 0.28)'
      : '0 12px 28px rgba(80, 52, 20, 0.16)'
  }
}

const progressTrackStyle = {
  height: 10,
  borderRadius: 999,
  overflow: 'hidden',
  background: 'rgba(139, 92, 40, 0.14)',
  marginTop: 14
}

function getProgressFillStyle(unlocked) {
  return {
    height: '100%',
    borderRadius: 999,
    background: unlocked
      ? 'linear-gradient(135deg, #f4d28a, #9a6a22)'
      : 'linear-gradient(135deg, #d4af37, #5c3512)'
  }
}

export default AchievementsBadgesScreen