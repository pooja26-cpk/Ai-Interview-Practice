import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'

function formatDate(value) {
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Result() {
  const navigate = useNavigate()
  const { lastResult, history } = useInterview()
  const result = lastResult || history[history.length - 1]

  if (!result) {
    return (
      <div className="page centered">
        <div className="card">
          <h1>No results yet</h1>
          <p>Complete an interview session to see feedback and scores.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate('/setup')}
          >
            Start an interview
          </button>
        </div>
      </div>
    )
  }

  const best = history.length
    ? Math.max(...history.map((item) => item.averageScore))
    : result.averageScore

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview results</h1>
        <p>
          Review your performance by question and use the feedback to refine your
          answers.
        </p>
      </div>
      <div className="result-layout">
        <div className="card result-summary">
          <div className="summary-header">
            <div className="badge">{result.type.toUpperCase()}</div>
            <span className="summary-date">{formatDate(result.createdAt)}</span>
          </div>
          <div className="score-block">
            <div className="score-value">{result.averageScore.toFixed(1)}</div>
            <div className="score-label">Average score</div>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Questions</span>
              <span className="summary-number">{result.items.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Best score</span>
              <span className="summary-number">{best.toFixed(1)}</span>
            </div>
          </div>
          <div className="summary-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate('/setup')}
            >
              Practice again
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              View dashboard
            </button>
          </div>
        </div>
        <div className="card result-details">
          <h2>Question breakdown</h2>
          <ul className="question-list">
            {result.items.map((item) => (
              <li key={item.id} className="question-item">
                <div className="question-item-header">
                  <h3>{item.question}</h3>
                  <span className="question-score">{item.score.toFixed(1)}/10</span>
                </div>
                <p className="question-feedback">{item.feedback}</p>
                <p className="question-answer">{item.answer || 'No answer recorded.'}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Result

