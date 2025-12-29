import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'

function Home() {
  const navigate = useNavigate()
  const { history } = useInterview()
  const latest = history[history.length - 1]

  function handleStart() {
    navigate('/setup')
  }

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-title">AI Interview Practice Platform</h1>
          <p className="hero-subtitle">
            Simulate HR, technical, and behavioral interviews with timed questions and
            instant feedback.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={handleStart}>
              Start Practice
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              View Progress
            </button>
          </div>
          {latest && (
            <div className="hero-summary">
              <div className="summary-label">Last session</div>
              <div className="summary-value">
                {latest.type.toUpperCase()} · {latest.averageScore.toFixed(1)}/10
              </div>
            </div>
          )}
        </div>
        <div className="hero-panel">
          <div className="hero-card">
            <div className="badge">Adaptive scoring</div>
            <h2>Practice answers that sound like you</h2>
            <p>
              Answer realistic questions, track your progress over time, and
              build confidence for your next interview.
            </p>
            <div className="hero-metrics">
              <div className="metric">
                <span className="metric-label">Sessions</span>
                <span className="metric-value">{history.length}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Best score</span>
                <span className="metric-value">
                  {history.length
                    ? Math.max(...history.map((item) => item.averageScore)).toFixed(1)
                    : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

