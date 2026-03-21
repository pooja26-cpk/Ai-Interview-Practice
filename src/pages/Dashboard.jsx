import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'

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
        recentSessions: [],
        movingAverage: null,
        latestDelta: null,
        typeAverages: [],
        bestType: null,
        needsImprovementType: null,
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

    const recentSessions = history.slice(-5)
    const movingAverage = recentSessions.length
      ? recentSessions.reduce((sum, item) => sum + item.averageScore, 0) /
        recentSessions.length
      : null

    const latestDelta =
      history.length >= 2
        ? history[history.length - 1].averageScore - history[history.length - 2].averageScore
        : null

    const typeSummary = history.reduce((acc, item) => {
      const key = item.type
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 }
      }
      acc[key].total += item.averageScore
      acc[key].count += 1
      return acc
    }, {})

    const typeAverages = Object.entries(typeSummary)
      .map(([type, value]) => ({
        type,
        average: value.total / value.count,
        count: value.count,
      }))
      .sort((a, b) => b.average - a.average)

    const bestType = typeAverages.length ? typeAverages[0] : null
    const needsImprovementType = typeAverages.length
      ? typeAverages[typeAverages.length - 1]
      : null

    return {
      total,
      average,
      best,
      latestType,
      countsByType,
      recentSessions,
      movingAverage,
      latestDelta,
      typeAverages,
      bestType,
      needsImprovementType,
    }
  }, [history])

  const recentSessionsWithDelta = useMemo(
    () =>
      stats.recentSessions
        .map((item, index, list) => {
          const previous = index > 0 ? list[index - 1] : null
          const delta = previous ? item.averageScore - previous.averageScore : null
          return { ...item, delta }
        })
        .reverse(),
    [stats.recentSessions]
  )

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

          <div className="card trend-card">
            <div className="history-header">
              <h2>Score trend</h2>
              {stats.movingAverage !== null ? (
                <span className="trend-label">
                  Moving avg (recent {stats.recentSessions.length}):{' '}
                  {stats.movingAverage.toFixed(1)}
                </span>
              ) : (
                <span className="trend-label">Not enough data for trend</span>
              )}
            </div>
            {stats.recentSessions.length ? (
              <div className="trend-bars" aria-label="Recent score trend chart">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="trend-item">
                    <div
                      className="trend-bar"
                      style={{ height: `${Math.max(session.averageScore * 10, 8)}%` }}
                      title={`${session.averageScore.toFixed(1)}/10`}
                    />
                    <span className="trend-value">{session.averageScore.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-inline">No sessions yet to visualize.</p>
            )}
            <div className="trend-delta">
              <span>Last vs previous:</span>
              {stats.latestDelta === null ? (
                <span className="delta-neutral">Need at least 2 sessions</span>
              ) : (
                <span
                  className={`delta-indicator ${
                    stats.latestDelta > 0
                      ? 'delta-positive'
                      : stats.latestDelta < 0
                        ? 'delta-negative'
                        : 'delta-neutral'
                  }`}
                >
                  {stats.latestDelta > 0 ? '+' : ''}
                  {stats.latestDelta.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="card-grid type-insights-grid">
            <div className="card stat-card">
              <span className="stat-label">Best type</span>
              {stats.bestType ? (
                <>
                  <span className="stat-value">{stats.bestType.type.toUpperCase()}</span>
                  <span className="trend-label">
                    {stats.bestType.average.toFixed(1)} avg · {stats.bestType.count} session
                    {stats.bestType.count === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="empty-inline">No type data yet.</span>
              )}
            </div>
            <div className="card stat-card">
              <span className="stat-label">Needs improvement</span>
              {stats.needsImprovementType ? (
                <>
                  <span className="stat-value">
                    {stats.needsImprovementType.type.toUpperCase()}
                  </span>
                  <span className="trend-label">
                    {stats.needsImprovementType.average.toFixed(1)} avg ·{' '}
                    {stats.needsImprovementType.count} session
                    {stats.needsImprovementType.count === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="empty-inline">No type data yet.</span>
              )}
            </div>
          </div>

          <div className="card recent-card">
            <div className="history-header">
              <h2>Recent 5 sessions</h2>
            </div>
            {recentSessionsWithDelta.length ? (
              <div className="history-list">
                {recentSessionsWithDelta.map((item) => (
                  <div key={item.id} className="history-row">
                    <div className="history-main">
                      <div className="badge badge-soft">{item.type.toUpperCase()}</div>
                      <span className="history-score">{item.averageScore.toFixed(1)}/10</span>
                      {item.delta !== null && (
                        <span
                          className={`delta-indicator ${
                            item.delta > 0
                              ? 'delta-positive'
                              : item.delta < 0
                                ? 'delta-negative'
                                : 'delta-neutral'
                          }`}
                        >
                          {item.delta > 0 ? '+' : ''}
                          {item.delta.toFixed(1)}
                        </span>
                      )}
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
            ) : (
              <p className="empty-inline">No recent sessions to display.</p>
            )}
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
