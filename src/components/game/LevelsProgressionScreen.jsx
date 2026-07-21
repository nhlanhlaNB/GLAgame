import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { styles } from './gameStyles'
import { LoadingPage, Pill, SectionHeader } from './ui'
import {
  calculatePlayerLevelProgress,
  syncPlayerLevelProgress
} from '../../services/player/playerLevelService'

function LevelsProgressionScreen({
  totalGlaCoinEarned = 0,
  completedProblems = 0,
  averageScore = 0
}) {
  const { currentUser } = useAuth()
  const [levelProgress, setLevelProgress] = useState(() =>
    calculatePlayerLevelProgress({
      totalGlaCoinEarned,
      completedProblems,
      averageScore
    })
  )
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadLevels() {
    setLoading(true)
    setError('')

    try {
      if (!currentUser?.uid) {
        const localProgress = calculatePlayerLevelProgress({
          totalGlaCoinEarned,
          completedProblems,
          averageScore
        })

        setLevelProgress(localProgress)
        return
      }

      const syncedProgress = await syncPlayerLevelProgress({
        userId: currentUser.uid,
        totalGlaCoinEarned,
        completedProblems,
        averageScore
      })

      setLevelProgress(syncedProgress)
    } catch (err) {
      setError(err.message || 'Could not sync player level with the system.')

      const localProgress = calculatePlayerLevelProgress({
        totalGlaCoinEarned,
        completedProblems,
        averageScore
      })

      setLevelProgress(localProgress)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLevels()
  }, [currentUser?.uid, totalGlaCoinEarned, completedProblems, averageScore])

  const filteredLevels = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()
    const levels = Array.isArray(levelProgress?.levels) ? levelProgress.levels : []

    return levels.filter((level) => {
      const searchableText = [level.title, level.description, level.levelId]
        .join(' ')
        .toLowerCase()

      const matchesSearch = !cleanSearch || searchableText.includes(cleanSearch)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unlocked' && level.unlocked) ||
        (statusFilter === 'locked' && !level.unlocked)

      return matchesSearch && matchesStatus
    })
  }, [levelProgress?.levels, searchTerm, statusFilter])

  if (loading) {
    return (
      <LoadingPage
        title="Loading levels"
        message="Checking locked and unlocked levels from the system."
      />
    )
  }

  const currentLevel = levelProgress.currentLevel
  const nextLevel = levelProgress.nextLevel

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="Player levels and progression"
        title="Grow from AI Explorer to Impact Leader."
      >
        Levels are calculated from completed problems, average score and total
        GLA coin earned. The current level is saved to the player records document.
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

      <div style={styles.twoColumnGrid}>
        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <div style={styles.rowBetween}>
            <div>
              <p style={styles.eyebrow}>Current Level</p>
              <h3 style={levelTitleStyle}>
                {currentLevel.badge} Level {currentLevel.level}: {currentLevel.title}
              </h3>
            </div>

            <Pill tone="success">Active</Pill>
          </div>

          <p style={{ ...styles.smallCardText, marginTop: 10 }}>
            {currentLevel.description}
          </p>

          <div style={summaryGridStyle}>
            <SmallSummary title="GLA Coin" value={totalGlaCoinEarned} />
            <SmallSummary title="Completed" value={completedProblems} />
            <SmallSummary title="Average" value={`${averageScore}%`} />
          </div>
        </div>

        <div style={{ ...styles.smallCard, marginTop: 18 }}>
          <p style={styles.eyebrow}>Next Level</p>

          {nextLevel ? (
            <>
              <h3 style={styles.smallCardTitle}>
                {nextLevel.badge} Level {nextLevel.level}: {nextLevel.title}
              </h3>

              <p style={styles.smallCardText}>{nextLevel.description}</p>

              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${levelProgress.nextProgress}%`
                  }}
                />
              </div>

              <p style={{ ...styles.smallCardText, marginTop: 8 }}>
                {levelProgress.nextProgress}% progress to next level.
              </p>
            </>
          ) : (
            <>
              <h3 style={styles.smallCardTitle}>Maximum level reached</h3>
              <p style={styles.smallCardText}>
                You have reached the highest current player level.
              </p>
            </>
          )}
        </div>
      </div>

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Unlocked Levels</p>
          <h3 style={styles.smallCardTitle}>
            {levelProgress.unlockedLevelCount} / {levelProgress.maxLevelCount}
          </h3>
          <p style={styles.smallCardText}>Levels unlocked through progress.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Certificate Requirement</p>
          <h3 style={styles.smallCardTitle}>
            {completedProblems >= 10 && averageScore >= 75 ? 'Met' : 'In Progress'}
          </h3>
          <p style={styles.smallCardText}>
            Needs 10 completed problem cards and 75% average.
          </p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>GLA Coin Earned</p>
          <h3 style={styles.smallCardTitle}>{totalGlaCoinEarned}</h3>
          <p style={styles.smallCardText}>Used for level progression.</p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Find player levels</h3>
          </div>

          <Pill>{filteredLevels.length} results</Pill>
        </div>

        <div style={filterGridStyle}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search levels..."
            style={inputStyle}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All levels</option>
            <option value="unlocked">Unlocked only</option>
            <option value="locked">Locked only</option>
          </select>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Level pathway</p>
            <h3 style={styles.smallCardTitle}>Progression roadmap</h3>
          </div>

          <Pill>{filteredLevels.length} levels</Pill>
        </div>

        <div style={levelGridStyle}>
          {filteredLevels.map((level) => (
            <div
              key={level.levelId}
              style={level.unlocked ? unlockedLevelCardStyle : { ...levelCardStyle, opacity: 0.74 }}
            >
              <div style={styles.rowBetween}>
                <div style={levelBadgeStyle}>{level.badge}</div>

                <Pill tone={level.unlocked ? 'success' : 'default'}>
                  {level.unlocked ? 'Unlocked' : 'Locked'}
                </Pill>
              </div>

              <p style={{ ...styles.eyebrow, marginTop: 14 }}>
                Level {level.level}
              </p>

              <h3 style={styles.smallCardTitle}>{level.title}</h3>
              <p style={styles.smallCardText}>{level.description}</p>

              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${level.progressPercent}%`
                  }}
                />
              </div>

              <div style={requirementListStyle}>
                <p>GLA Coin: {level.displayedCoin ?? totalGlaCoinEarned} / {level.requiredCoin}</p>
                <p>
                  Completed: {level.displayedCompleted ?? completedProblems} / {level.requiredCompletedProblems}
                </p>
                <p>Average: {level.displayedAverage ?? averageScore}% / {level.requiredAverageScore}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SmallSummary({ title, value }) {
  return (
    <div style={smallSummaryStyle}>
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  )
}

const levelTitleStyle = {
  margin: 0,
  color: '#4b2b10',
  fontSize: '1.45rem',
  lineHeight: 1.1,
  letterSpacing: '-0.04em'
}

const summaryGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 10
}

const smallSummaryStyle = {
  padding: 14,
  borderRadius: 18,
  background: 'rgba(244, 210, 138, 0.22)',
  border: '1px solid rgba(139, 92, 40, 0.14)'
}

const filterGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 1fr) 190px',
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

const levelGridStyle = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16
}

const levelCardStyle = {
  padding: 18,
  borderRadius: 24,
  background: 'rgba(255, 255, 255, 0.66)',
  border: '1px solid rgba(139, 92, 40, 0.16)',
  boxShadow: '0 16px 36px rgba(80, 52, 20, 0.08)'
}

const unlockedLevelCardStyle = {
  ...levelCardStyle,
  background: 'linear-gradient(135deg, rgba(244, 210, 138, 0.96), rgba(154, 106, 34, 0.24))',
  border: '1px solid rgba(154, 106, 34, 0.42)',
  boxShadow: '0 18px 38px rgba(154, 106, 34, 0.18)'
}

const levelBadgeStyle = {
  width: 54,
  height: 54,
  borderRadius: 18,
  display: 'grid',
  placeItems: 'center',
  background:
    'linear-gradient(135deg, rgba(244,210,138,0.9), rgba(154,106,34,0.75))',
  color: '#3b2817',
  fontSize: '1.7rem',
  boxShadow: '0 12px 28px rgba(80, 52, 20, 0.16)'
}

const progressTrackStyle = {
  height: 10,
  borderRadius: 999,
  overflow: 'hidden',
  background: 'rgba(139, 92, 40, 0.14)',
  marginTop: 14
}

const progressFillStyle = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(135deg, #d4af37, #5c3512)'
}

const requirementListStyle = {
  marginTop: 10,
  color: '#5c4632',
  fontSize: '0.86rem',
  lineHeight: 1.5
}

export default LevelsProgressionScreen