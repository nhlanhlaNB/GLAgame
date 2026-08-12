import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { useAuth } from './context/AuthContext'


import logo from './assets/images/logo.png'
import city1 from './assets/images/city1.png'
import city2 from './assets/images/city2.png'
import mountain from './assets/images/mountain.png'
import farm1 from './assets/images/farm1.png'
import farm2 from './assets/images/farm2.png'
import LoadingScreen from './components/LoadingScreen'

const backgroundMedia = [
  {
    src: mountain
  },
  {
    src: farm1
  },
  {
    src: mountain
  },
  {
    src: city1
  },
  {
    src: city2
  },
  {
    src: farm1
  },
  {
    src: farm2
  }
]
const GameHome = lazy(() => import('./components/GameHome'))
const AdminApp = lazy(() => import('./components/admin/AdminApp'))
const AuthModal = lazy(() => import('./components/AuthModal'))


function App() {
  const isAdminRoute = window.location.pathname.toLowerCase().startsWith('/admin')

  if (isAdminRoute) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminApp />
      </Suspense>
    )
  }

  return <PlayerApp />
}

function PlayerApp() {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showAuthModal, setShowAuthModal] = useState(false)

  const currentMedia = backgroundMedia[currentMediaIndex]
  const { currentUser, logout } = useAuth()

  async function handleAuthClick() {
    if (currentUser) {
      await logout()
    } else {
      setAuthMode('login')
      setShowAuthModal(true)
    }
  }

  function handleStartQuest() {
    if (!currentUser) {
      setAuthMode('register')
      setShowAuthModal(true)
      return
    }

    alert('Game dashboard coming next.')
  }

  useEffect(() => {
    let timeout

    const interval = setInterval(() => {
      setIsFading(true)

      timeout = setTimeout(() => {
        setCurrentMediaIndex((previousIndex) =>
          previousIndex === backgroundMedia.length - 1 ? 0 : previousIndex + 1
        )

        setIsFading(false)
      }, 700)
    }, 7000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <main className="app">
      <nav className="navbar">
        <a href="/" className="brand">
          <img src={logo} alt="GRIT Lab Africa logo" />
          <span>GRIT Lab Africa</span>
        </a>

        <div className="navLinks">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="navActions">
          {!currentUser && (
            <a href="/admin" style={adminNavButtonStyle}>
              Admin Login
            </a>
          )}

          <button onClick={handleAuthClick} className="loginButton">
            {currentUser ? 'Logout' : 'Login'}
          </button>

 {!currentUser && (
            <button onClick={handleStartQuest} className="startButton">
              Start Quest
            </button>
          )}
        </div>
      </nav>

     {currentUser ? (
  <Suspense fallback={<LoadingScreen />}>
    <GameHome currentUser={currentUser} />
  </Suspense>
) : (
        <>
          <section className="heroArea" id="home">
            <div className="heroMediaCard">
              <img
  key={currentMedia.src}
  className={`heroMedia ${isFading ? 'mediaFadeOut' : 'mediaFadeIn'}`}
  src={currentMedia.src}
  alt="African innovation background"
  loading="eager"
  decoding="async"
  fetchPriority="high"
/>

              <div className="heroOverlay"></div>

              <div className="heroContentCard">
                <p className="heroTag">GRIT Lab Africa AI Project</p>

                <h2
                  style={{
                    color: '#b8860b',
                    fontSize: '3.2rem',
                    lineHeight: '1.05',
                    letterSpacing: '-0.04em',
                    margin: '0 0 20px',
                    fontWeight: '800'
                  }}
                >
                  Solving African challenges through smart technology.
                </h2>

                <p>
                  GRIT Lab Africa presents a gamified AI-powered platform
                  inspired by digital skills development, youth innovation and
                  practical technology solutions. The application presents real
                  African challenges and allows users to match each problem with
                  possible AI and digital solutions.
                </p>

                <div className="heroButtons">
                  <button onClick={handleStartQuest} className="startButton">
                    Start Quest
                  </button>

                  <button type="button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="glassButton">Explore Project</button>
                </div>

              </div>
            </div>
          </section>

          <AboutProjectSection onStartQuest={handleStartQuest} />

          <section
            id="contact"
            style={{
              width: 'min(1250px, calc(100vw - 48px))',
              margin: '60px auto 90px'
            }}
          >
            <div
              style={{
                width: '100%',
                padding: '52px',
                borderRadius: '34px',
                background: 'rgba(255, 255, 255, 0.72)',
                border: '1px solid rgba(139, 92, 40, 0.22)',
                boxShadow: '0 28px 70px rgba(80, 52, 20, 0.18)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)'
              }}
            >
              <div
                style={{
                  marginBottom: '34px'
                }}
              >
                <h3
                  style={{
                    margin: '0 0 16px',
                    color: '#5c3512',
                    fontSize: '3rem',
                    lineHeight: '0.95',
                    letterSpacing: '-0.065em',
                    fontWeight: '650'
                  }}
                >
                  Contact us
                </h3>

                <h3
                  style={{
                    margin: '0',
                    maxWidth: '760px',
                    color: '#4b3a2a',
                    fontSize: '1.18rem',
                    lineHeight: '1.7',
                    fontWeight: '500'
                  }}
                >
                  This application is connected to GRIT Lab Africa’s innovation
                  environment, exploring how AI, digital skills and gamified
                  learning can support real African problem-solving.
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '18px'
                }}
              >
                <div
                  style={{
                    minHeight: '190px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '26px',
                    background: 'rgba(255, 255, 255, 0.62)',
                    border: '1px solid rgba(139, 92, 40, 0.16)',
                    boxShadow: '0 16px 36px rgba(80, 52, 20, 0.1)'
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        color: '#9a6a22',
                        fontSize: '0.74rem',
                        fontWeight: '850',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Email
                    </p>

                    <h4
                      style={{
                        margin: '0',
                        color: '#3b2817',
                        fontSize: '1.45rem',
                        lineHeight: '1.1',
                        letterSpacing: '-0.04em'
                      }}
                    >
                      General Enquiries
                    </h4>
                  </div>

                  <a
                    href="mailto:info@gritlabafrica.org"
                    style={{
                      color: '#5c3512',
                      fontWeight: '800',
                      fontSize: '1rem'
                    }}
                  >
                    info@gritlabafrica.org
                  </a>
                </div>

                <a
                  href="https://gritlabafrica.org/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    minHeight: '190px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '26px',
                    background:
                      'linear-gradient(135deg, rgba(92, 53, 18, 0.95), rgba(154, 106, 34, 0.9))',
                    color: '#fff8eb',
                    textDecoration: 'none',
                    boxShadow: '0 18px 42px rgba(92, 53, 18, 0.22)'
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        color: '#f4d28a',
                        fontSize: '0.74rem',
                        fontWeight: '850',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Official Website
                    </p>

                    <h4
                      style={{
                        margin: '0',
                        color: '#fff8eb',
                        fontSize: '1.45rem',
                        lineHeight: '1.1',
                        letterSpacing: '-0.04em'
                      }}
                    >
                      Visit GRIT Lab Africa
                    </h4>
                  </div>

                  <p
                    style={{
                      margin: '18px 0 0',
                      color: 'rgba(255, 248, 235, 0.82)',
                      lineHeight: '1.55',
                      fontSize: '0.95rem'
                    }}
                  >
                    View GRIT Lab Africa’s programmes, mission, leadership and
                    innovation work.
                  </p>
                </a>

                <a
                  href="https://showroom.gritlabafrica.org/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    minHeight: '190px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '26px',
                    background: 'rgba(255, 255, 255, 0.62)',
                    border: '1px solid rgba(139, 92, 40, 0.16)',
                    color: '#3b2817',
                    textDecoration: 'none',
                    boxShadow: '0 16px 36px rgba(80, 52, 20, 0.1)'
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        color: '#9a6a22',
                        fontSize: '0.74rem',
                        fontWeight: '850',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Project Showroom
                    </p>

                    <h4
                      style={{
                        margin: '0',
                        color: '#3b2817',
                        fontSize: '1.45rem',
                        lineHeight: '1.1',
                        letterSpacing: '-0.04em'
                      }}
                    >
                      Explore the Showroom
                    </h4>
                  </div>

                  <p
                    style={{
                      margin: '18px 0 0',
                      color: '#5c4632',
                      lineHeight: '1.55',
                      fontSize: '0.95rem'
                    }}
                  >
                    Browse GRIT Lab Africa’s project showcase and real-world
                    technology solutions.
                  </p>
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="footer">
        <p>
          <strong>GRIT Lab Africa</strong> © 2026
        </p>

        <p>Powered by GRIT Lab Africa</p>
      </footer>

      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal
            initialMode={authMode}
            onClose={() => setShowAuthModal(false)}
          />
        </Suspense>
      )}
    </main>
  )
}



function AboutProjectSection({ onStartQuest }) {
  const featureCards = [
    {
      title: 'Problem cards',
      text: 'Players work with real African challenges such as unemployment, healthcare access, illegal dumping, food insecurity, transport and public safety.',
      icon: '🧩'
    },
    {
      title: 'Solution cards',
      text: 'Players choose smart technology capabilities and explain how those tools can reduce or solve the selected problem.',
      icon: '💡'
    },
    {
      title: 'Learning rewards',
      text: 'Scores become GLA coin, hints support learning, and certificate progress rewards consistent improvement.',
      icon: '🏅'
    }
  ]

  const learningPoints = [
    'Build AI literacy without making the game too technical.',
    'Connect the Sustainable Development Goals to local African realities.',
    'Encourage ethical, practical and inclusive problem-solving.',
    'Support learners, students, entrepreneurs, teachers and community innovators.'
  ]

  return (
    <section id="about" style={aboutSectionStyle}>
      <div style={aboutShellStyle}>
        <div style={aboutHeaderGridStyle}>
          <div>
            <p style={aboutEyebrowStyle}>About the project</p>
            <h2 style={aboutTitleStyle}>Gaming SDG problems and ideating solutions for Africa.</h2>
            <p style={aboutLeadStyle}>
              AfriQuest is a GRIT Lab Africa learning game where players use solution cards to respond to African problem cards linked to the Sustainable Development Goals. The goal is to help players think like innovators: understand the problem, choose relevant technology tools, explain a realistic solution and learn from guided feedback.
            </p>
          </div>

          <div style={aboutHighlightStyle}>
            <span style={aboutHighlightNumberStyle}>10+</span>
            <strong>problem cards completed</strong>
            <p>
              A player works toward certificate readiness by completing at least ten problem cards and keeping a strong average score.
            </p>
          </div>
        </div>

        <div style={aboutFeatureGridStyle}>
          {featureCards.map((item) => (
            <article key={item.title} style={aboutFeatureCardStyle}>
              <span style={aboutIconStyle}>{item.icon}</span>
              <h3 style={aboutCardTitleStyle}>{item.title}</h3>
              <p style={aboutCardTextStyle}>{item.text}</p>
            </article>
          ))}
        </div>

        <div style={aboutLowerGridStyle}>
          <div style={aboutDarkCardStyle}>
            <p style={aboutDarkEyebrowStyle}>How the game works</p>
            <ol style={aboutStepsStyle}>
              <li>Select problem cards that match your interests or community concerns.</li>
              <li>Use up to three solution cards to build a focused response.</li>
              <li>Write a clear explanation in one hundred words or less.</li>
              <li>Submit your answer, review your score and improve through feedback.</li>
            </ol>
          </div>

          <div style={aboutLightCardStyle}>
            <p style={aboutEyebrowStyle}>Educational purpose</p>
            <ul style={aboutListStyle}>
              {learningPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
            <button type="button" onClick={onStartQuest} style={aboutCtaStyle}>Start learning</button>
          </div>
        </div>
      </div>
    </section>
  )
}


const aboutSectionStyle = {
  width: 'min(1250px, calc(100vw - 48px))',
  margin: '60px auto 0'
}

const aboutShellStyle = {
  padding: 'clamp(26px, 5vw, 56px)',
  borderRadius: '36px',
  background: 'linear-gradient(135deg, rgba(255, 248, 235, 0.92), rgba(244, 210, 138, 0.36))',
  border: '1px solid rgba(139, 92, 40, 0.2)',
  boxShadow: '0 28px 70px rgba(80, 52, 20, 0.16)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)'
}

const aboutHeaderGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
  gap: '24px',
  alignItems: 'stretch'
}

const aboutEyebrowStyle = {
  margin: '0 0 12px',
  color: '#9a6a22',
  fontSize: '0.74rem',
  fontWeight: '900',
  letterSpacing: '0.14em',
  textTransform: 'uppercase'
}

const aboutTitleStyle = {
  margin: '0',
  color: '#4b2b10',
  fontSize: 'clamp(2.4rem, 5vw, 4.6rem)',
  lineHeight: '0.95',
  letterSpacing: '-0.07em',
  maxWidth: '900px'
}

const aboutLeadStyle = {
  margin: '22px 0 0',
  color: '#5c4632',
  fontSize: '1.08rem',
  lineHeight: '1.75',
  maxWidth: '900px'
}

const aboutHighlightStyle = {
  padding: '26px',
  borderRadius: '28px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(92, 53, 18, 0.96), rgba(154, 106, 34, 0.92))',
  color: '#fff8eb',
  boxShadow: '0 20px 46px rgba(92, 53, 18, 0.22)'
}

const aboutHighlightNumberStyle = {
  color: '#f4d28a',
  fontSize: '4rem',
  fontWeight: '950',
  lineHeight: '0.9',
  letterSpacing: '-0.08em'
}

const aboutFeatureGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: '18px',
  marginTop: '28px'
}

const aboutFeatureCardStyle = {
  padding: '24px',
  borderRadius: '28px',
  background: 'rgba(255, 255, 255, 0.66)',
  border: '1px solid rgba(139, 92, 40, 0.16)',
  boxShadow: '0 18px 38px rgba(80, 52, 20, 0.1)'
}

const aboutIconStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '16px',
  display: 'grid',
  placeItems: 'center',
  marginBottom: '18px',
  background: 'rgba(244, 210, 138, 0.5)',
  fontSize: '1.5rem'
}

const aboutCardTitleStyle = {
  margin: '0 0 10px',
  color: '#4b2b10',
  fontSize: '1.45rem',
  lineHeight: '1.05',
  letterSpacing: '-0.04em'
}

const aboutCardTextStyle = {
  margin: 0,
  color: '#5c4632',
  lineHeight: '1.65'
}

const aboutLowerGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '18px',
  marginTop: '18px'
}

const aboutDarkCardStyle = {
  padding: '26px',
  borderRadius: '30px',
  background: 'rgba(43, 27, 15, 0.94)',
  color: '#fff8eb',
  boxShadow: '0 18px 42px rgba(43, 27, 15, 0.18)'
}

const aboutLightCardStyle = {
  padding: '26px',
  borderRadius: '30px',
  background: 'rgba(255, 255, 255, 0.72)',
  border: '1px solid rgba(139, 92, 40, 0.16)'
}

const aboutDarkEyebrowStyle = {
  ...aboutEyebrowStyle,
  color: '#f4d28a'
}

const aboutStepsStyle = {
  margin: 0,
  paddingLeft: '22px',
  display: 'grid',
  gap: '12px',
  color: 'rgba(255, 248, 235, 0.86)',
  lineHeight: '1.6'
}

const aboutListStyle = {
  margin: 0,
  paddingLeft: '20px',
  display: 'grid',
  gap: '10px',
  color: '#5c4632',
  lineHeight: '1.62'
}

const aboutCtaStyle = {
  marginTop: '22px',
  border: 0,
  borderRadius: '999px',
  padding: '13px 22px',
  cursor: 'pointer',
  fontWeight: '900',
  background: 'linear-gradient(135deg, #9a6a22, #5c3512)',
  color: '#fff8eb',
  boxShadow: '0 16px 34px rgba(92, 53, 18, 0.22)'
}

const adminNavButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: '999px',
  padding: '10px 18px',
  background: 'rgba(255, 255, 255, 0.68)',
  color: '#5c3512',
  textDecoration: 'none',
  fontWeight: '850',
  boxShadow: '0 12px 26px rgba(80, 52, 20, 0.1)'
}

export default App