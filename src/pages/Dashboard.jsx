import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/useInterview'

function Dashboard() {
  const navigate = useNavigate()
  const { history } = useInterview()

  const stats = useMemo(() => {
    if (!history.length) {
      return {
        total: 0,
        average: 0,
        best: 0,
        latestType: null,
        countsByType: {},
      }
    }
    const total = history.length
    const average =
      history.reduce((sum, item) => sum + item.averageScore, 0) /
      Math.max(total, 1)
    const best = Math.max(...history.map((item) => item.averageScore))
    const latestType = history[history.length - 1].type
    const countsByType = history.reduce((acc, item) => {
      const key = item.type
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return {
      total,
      average,
      best,
      latestType,
      countsByType,
    }
  }, [history])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          Track your interview practice over time and see how your answers
          improve.
        </p>
      </div>
      {!history.length ? (
        <div className="card centered">
          <p>No interview sessions yet. Start practicing to see your progress.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate('/setup')}
          >
            Start your first interview
          </button>
        </div>
      ) : (
        <>
          <div className="card-grid">
            <div className="card stat-card">
              <span className="stat-label">Total sessions</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Average score</span>
              <span className="stat-value">{stats.average.toFixed(1)}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Best score</span>
              <span className="stat-value">{stats.best.toFixed(1)}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Latest focus</span>
              <span className="stat-value">
                {stats.latestType ? stats.latestType.toUpperCase() : '–'}
              </span>
            </div>
          </div>
          <div className="card history-card">
            <div className="history-header">
              <h2>Interview history</h2>
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate('/setup')}
              >
                Start new session
              </button>
            </div>
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-row">
                  <div className="history-main">
                    <div className="badge badge-soft">{item.type.toUpperCase()}</div>
                    <span className="history-score">
                      {item.averageScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="history-meta">
                    <span>
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>
                      {item.items.length} question
                      {item.items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard

