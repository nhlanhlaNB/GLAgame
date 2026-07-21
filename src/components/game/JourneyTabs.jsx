function JourneyTabs({ screen, selectedProblemCount, roundActive, latestAttempt, onNavigate }) {
  const tabs = [
    { value: 'intro', label: 'Game Guide', description: 'Read the rules' },
    { value: 'select', label: 'Problem Selection', description: `${selectedProblemCount}/10 selected` },
    { value: 'play', label: 'Play Game', description: roundActive ? 'Continue round' : 'Start round' },
    { value: 'score', label: 'Scoring', description: latestAttempt ? 'View feedback' : 'No score yet', disabled: !latestAttempt }
  ]

  return (
    <div className="glaJourneyTabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          disabled={tab.disabled}
          onClick={() => onNavigate(tab.value)}
          className={`glaJourneyTabButton ${screen === tab.value ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
        >
          <span className="glaJourneyTabLabel">{tab.label}</span>
          <span className="glaJourneyTabDescription">{tab.description}</span>
        </button>
      ))}
    </div>
  )
}

export default JourneyTabs
