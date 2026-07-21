import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import {
  getPlayerSidebarData,
  subscribePlayerSidebarData
} from '../../services/player/playerSidebarService'

function toSafeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function GameSidebar({
  userId = '',
  screen,
  onNavigate,
  onClose,
  selectedProblemCount = 0,
  completedProblems = 0,
  certificationProgress = 0,
  averageScore = 0,
  glaCoinBalance = 0,
  certificateUnlocked = false,
  latestAttempt = null
}) {
  const { t } = useLanguage()
  const [databaseSidebarData, setDatabaseSidebarData] = useState(null)
  const [databaseLoading, setDatabaseLoading] = useState(false)
  const [databaseError, setDatabaseError] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!userId) {
      setDatabaseSidebarData(null)
      setDatabaseError('')
      setDatabaseLoading(false)
      return () => {
        isMounted = false
      }
    }

    setDatabaseLoading(true)
    setDatabaseError('')

    getPlayerSidebarData(userId)
      .then((sidebarData) => {
        if (!isMounted) return
        setDatabaseSidebarData(sidebarData)
      })
      .catch((error) => {
        console.error(error)
        if (!isMounted) return
        setDatabaseError(t('sidebarDataError', 'Using saved screen data while the system reconnects.'))
      })
      .finally(() => {
        if (!isMounted) return
        setDatabaseLoading(false)
      })

    const unsubscribe = subscribePlayerSidebarData(
      userId,
      (sidebarData) => {
        if (!isMounted) return
        setDatabaseSidebarData(sidebarData)
        setDatabaseError('')
        setDatabaseLoading(false)
      },
      (error) => {
        console.error(error)
        if (!isMounted) return
        setDatabaseError(t('sidebarDataError', 'Using saved screen data while the system reconnects.'))
        setDatabaseLoading(false)
      }
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [userId, t])

  const sidebarStats = useMemo(() => ({
    selectedProblemCount: toSafeNumber(
      databaseSidebarData?.selectedProblemCount,
      toSafeNumber(selectedProblemCount)
    ),
    completedProblems: toSafeNumber(
      databaseSidebarData?.completedProblems,
      toSafeNumber(completedProblems)
    ),
    certificationProgress: toSafeNumber(
      databaseSidebarData?.certificationProgress,
      toSafeNumber(certificationProgress)
    ),
    averageScore: toSafeNumber(
      databaseSidebarData?.averageScore,
      toSafeNumber(averageScore)
    ),
    glaCoinBalance: toSafeNumber(
      databaseSidebarData?.glaCoinBalance,
      toSafeNumber(glaCoinBalance)
    ),
    certificateUnlocked: databaseSidebarData?.certificateUnlocked ?? certificateUnlocked,
    latestAttempt: databaseSidebarData?.latestAttempt || latestAttempt
  }), [
    databaseSidebarData,
    selectedProblemCount,
    completedProblems,
    certificationProgress,
    averageScore,
    glaCoinBalance,
    certificateUnlocked,
    latestAttempt
  ])

  const navGroups = [
    { title: t('journey','Journey'), items: [
      { id: 'journey', label: t('journey','Journey'), icon: '🧭', detail: `${sidebarStats.selectedProblemCount}/10 ${t('selected','selected')}` },
      { id: 'dashboard', label: t('dashboard','Dashboard'), icon: '📊', detail: `${sidebarStats.completedProblems} ${t('completed','completed')}` },
      { id: 'coins', label: t('coins','GLA Coin'), icon: '🪙', detail: `${sidebarStats.glaCoinBalance} ${t('balance','balance')}` },
      { id: 'certificate', label: t('certificate','Certificate'), icon: '🎓', detail: sidebarStats.certificateUnlocked ? t('unlocked','Unlocked') : `${sidebarStats.certificationProgress}/10` },
      { id: 'profile', label: t('profile','Profile'), icon: '👤', detail: t('playerDetails','Player details') }
    ]},
    { title: t('progress','Progress'), items: [
      { id: 'achievements', label: t('achievements','Achievements'), icon: '🏅', detail: t('badges','Badges') },
      { id: 'levels', label: t('levels','Levels'), icon: '🚀', detail: `${sidebarStats.averageScore}% ${t('average','average')}` },
      { id: 'leaderboard', label: t('leaderboard','Leaderboard'), icon: '🏆', detail: t('rankings','Rankings') },
      { id: 'analytics', label: t('analytics','Analytics'), icon: '📈', detail: sidebarStats.latestAttempt ? t('updated','Updated') : t('noScoreYet','No score yet') }
    ]},
    { title: t('experience','Experience'), items: [
      { id: 'accessibility', label: t('settings','Settings'), icon: '⚙️', detail: t('appSettings','App settings') },
      { id: 'multiplayer', label: t('multiplayer','Multiplayer'), icon: '🎮', detail: t('rooms','Rooms') },
      { id: 'rewards', label: t('rewards','Rewards'), icon: '🎁', detail: t('launchRewards','Launch rewards') }
    ]}
  ]

  return (
    <aside className="glaFixedSidebar">
      <style>{sidebarCss}</style>
      <div className="glaFixedSidebarHeader">
        <div className="glaFixedSidebarLogo">GLA</div>
        <div>
          <h2>{t('appName','GRIT Lab Africa')}</h2>
          <p>{t('gameName','AI for SDGs Card Game')}</p>
        </div>
        <button type="button" onClick={onClose} className="glaFixedSidebarClose" aria-label={t('close','Close')}>×</button>
      </div>

      <div className="glaFixedSidebarStats">
        <div><span data-gla-database-value="true">{sidebarStats.completedProblems}</span><small>{t('completed','Completed')}</small></div>
        <div><span data-gla-database-value="true">{sidebarStats.averageScore}%</span><small>{t('average','Average')}</small></div>
        <div><span data-gla-database-value="true">{sidebarStats.glaCoinBalance}</span><small>{t('coin','Coin')}</small></div>
      </div>

      {(databaseLoading || databaseError) && (
        <p className={`glaFixedSidebarStatus ${databaseError ? 'error' : ''}`}>
          {databaseError || t('loading','Loading...')}
        </p>
      )}

      <nav className="glaFixedSidebarNav">
        {navGroups.map(group => (
          <section key={group.title} className="glaFixedSidebarGroup">
            <p>{group.title}</p>
            {group.items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`glaFixedSidebarItem ${screen === item.id || (item.id === 'journey' && ['intro','select','play','score','retry'].includes(screen)) ? 'active' : ''}`}
              >
                <span className="glaFixedSidebarIcon">{item.icon}</span>
                <span><strong>{item.label}</strong><small data-gla-dynamic-text="true">{item.detail}</small></span>
              </button>
            ))}
          </section>
        ))}
      </nav>
    </aside>
  )
}

const sidebarCss = `.glaFixedSidebar{height:100dvh;width:100%;overflow-y:auto;padding:16px;color:#fff8eb;background:radial-gradient(circle at top left,rgba(244,210,138,.26),transparent 24rem),linear-gradient(145deg,rgba(105,64,26,.99),rgba(47,29,13,.98));border-right:1px solid rgba(244,210,138,.28);box-shadow:18px 0 60px rgba(38,22,8,.24)}.glaFixedSidebarHeader{display:grid;grid-template-columns:50px 1fr 38px;gap:12px;align-items:center;padding:12px;border-radius:24px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14)}.glaFixedSidebarLogo{width:50px;height:50px;border-radius:18px;display:grid;place-items:center;color:#3b2817;background:linear-gradient(135deg,#f4d28a,#b8860b);font-weight:950}.glaFixedSidebarHeader h2{margin:0;font-size:1.05rem;line-height:1.05;letter-spacing:-.04em}.glaFixedSidebarHeader p{margin:4px 0 0;color:rgba(255,248,235,.68);font-size:.74rem;font-weight:700}.glaFixedSidebarClose{border:0;border-radius:14px;background:rgba(255,255,255,.12);color:#fff8eb;font-size:1.35rem;cursor:pointer;width:38px;height:38px}.glaFixedSidebarStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.glaFixedSidebarStats div{padding:12px 8px;border-radius:18px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);text-align:center}.glaFixedSidebarStats span{display:block;color:#f4d28a;font-weight:950;font-size:1rem}.glaFixedSidebarStats small{color:rgba(255,248,235,.64);font-size:.68rem;font-weight:750}.glaFixedSidebarStatus{margin:0 0 12px;padding:10px 12px;border-radius:16px;background:rgba(244,210,138,.12);border:1px solid rgba(244,210,138,.18);color:rgba(255,248,235,.74);font-size:.72rem;font-weight:800}.glaFixedSidebarStatus.error{background:rgba(251,146,60,.12);border-color:rgba(251,146,60,.22)}.glaFixedSidebarNav{display:grid;gap:13px}.glaFixedSidebarGroup p{margin:0 0 7px 4px;color:#f4d28a;font-size:.72rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.glaFixedSidebarItem{width:100%;margin-bottom:7px;border:1px solid transparent;border-radius:18px;padding:10px 11px;display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;text-align:left;cursor:pointer;background:rgba(255,255,255,.06);color:rgba(255,248,235,.82);transition:.2s}.glaFixedSidebarItem:hover{transform:translateX(3px);background:rgba(255,255,255,.1);border-color:rgba(244,210,138,.2)}.glaFixedSidebarItem.active{background:rgba(244,210,138,.18);color:#fff8eb;border-color:rgba(244,210,138,.38)}.glaFixedSidebarIcon{width:38px;height:38px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.1)}.glaFixedSidebarItem.active .glaFixedSidebarIcon{background:linear-gradient(135deg,#f4d28a,#9a6a22);color:#3b2817}.glaFixedSidebarItem strong{display:block;font-size:.9rem;line-height:1.12}.glaFixedSidebarItem small{display:block;margin-top:4px;font-size:.7rem;color:rgba(255,248,235,.56);font-weight:700}`

export default GameSidebar
