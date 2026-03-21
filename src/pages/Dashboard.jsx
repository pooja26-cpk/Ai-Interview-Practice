import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUESTION_TYPES } from '../data/questions'
import { useInterview } from '../context/InterviewContext'

const WEAK_SCORE_THRESHOLD = 6

function getCategoryAccumulator() {
  return {
    attempts: 0,
    passed: 0,
    totalScore: 0,
  }
}

function toSortedCategoryRows(source) {
  return Object.entries(source)
    .map(([name, values]) => {
      const avgScore = values.totalScore / Math.max(values.attempts, 1)
      const passRate = values.passed / Math.max(values.attempts, 1)
      return {
        name,
        attempts: values.attempts,
        avgScore,
        passRate,
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore)
}

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
        topicPerformance: [],
        difficultyPerformance: [],
        weakAreas: [],
        dailyStreak: 0,
        weeklyStreak: 0,
        failedCodingTasks: 0,
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

    const topicBuckets = {}
    const difficultyBuckets = {}
    let failedCodingTasks = 0

    history.forEach((session) => {
      session.items.forEach((item) => {
        const score = typeof item.score === 'number' ? item.score : 0
        const pass =
          typeof item.pass === 'boolean' ? item.pass : score >= WEAK_SCORE_THRESHOLD
        const tags = Array.isArray(item.topicTags) && item.topicTags.length
          ? item.topicTags
          : [item.category || session.type || 'general']

        tags.forEach((tag) => {
          if (!topicBuckets[tag]) {
            topicBuckets[tag] = getCategoryAccumulator()
          }
          topicBuckets[tag].attempts += 1
          topicBuckets[tag].totalScore += score
          if (pass) topicBuckets[tag].passed += 1
        })

        const difficulty = item.difficulty || 'unknown'
        if (!difficultyBuckets[difficulty]) {
          difficultyBuckets[difficulty] = getCategoryAccumulator()
        }
        difficultyBuckets[difficulty].attempts += 1
        difficultyBuckets[difficulty].totalScore += score
        if (pass) difficultyBuckets[difficulty].passed += 1

        if (item.isCodingTask && !pass) {
          failedCodingTasks += 1
        }
      })
    })

    const topicPerformance = toSortedCategoryRows(topicBuckets)
    const difficultyPerformance = toSortedCategoryRows(difficultyBuckets)

    const weakAreas = topicPerformance
      .filter(
        (item) => item.avgScore < WEAK_SCORE_THRESHOLD || item.passRate < 0.6,
      )
      .sort((a, b) => {
        const aGap = WEAK_SCORE_THRESHOLD - a.avgScore + (0.6 - a.passRate)
        const bGap = WEAK_SCORE_THRESHOLD - b.avgScore + (0.6 - b.passRate)
        return bGap - aGap
      })
      .slice(0, 3)

    const uniqueDays = [...new Set(history.map((item) => item.sessionDayKey))]
      .filter(Boolean)
      .sort()
    const dailyStreak = uniqueDays.reduceRight((streak, key, index, arr) => {
      if (!arr.length) return 0
      if (index === arr.length - 1) return 1
      if (!streak) return 0
      const current = new Date(`${arr[index + 1]}T00:00:00`)
      const previous = new Date(`${key}T00:00:00`)
      const diffDays = (current - previous) / (1000 * 60 * 60 * 24)
      return diffDays === 1 ? streak + 1 : 0
    }, 0)

    const uniqueWeeks = [...new Set(history.map((item) => item.sessionWeekKey))]
      .filter(Boolean)
      .sort()
    const weeklyStreak = uniqueWeeks.reduceRight((streak, key, index, arr) => {
      if (!arr.length) return 0
      if (index === arr.length - 1) return 1
      if (!streak) return 0
      const current = new Date(`${arr[index + 1]}T00:00:00`)
      const previous = new Date(`${key}T00:00:00`)
      const diffWeeks = (current - previous) / (1000 * 60 * 60 * 24 * 7)
      return diffWeeks === 1 ? streak + 1 : 0
    }, 0)

    return {
      total,
      average,
      best,
      latestType,
      countsByType,
      topicPerformance,
      difficultyPerformance,
      weakAreas,
      dailyStreak,
      weeklyStreak,
      failedCodingTasks,
    }
  }, [history])

  const topWeakArea = stats.weakAreas[0]?.name

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

          <div className="card streak-card">
            <h2>Practice streak</h2>
            <div className="streak-grid">
              <div>
                <span className="stat-label">Daily streak</span>
                <div className="stat-value">{stats.dailyStreak} day(s)</div>
              </div>
              <div>
                <span className="stat-label">Weekly streak</span>
                <div className="stat-value">{stats.weeklyStreak} week(s)</div>
              </div>
            </div>
          </div>

          <div className="card analytics-card">
            <h2>Performance by topic</h2>
            <div className="analytics-list">
              {stats.topicPerformance.map((item) => (
                <div key={item.name} className="analytics-row">
                  <span>{item.name}</span>
                  <span>
                    {item.avgScore.toFixed(1)}/10 • {(item.passRate * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card analytics-card">
            <h2>Performance by difficulty</h2>
            <div className="analytics-list">
              {stats.difficultyPerformance.map((item) => (
                <div key={item.name} className="analytics-row">
                  <span>{item.name}</span>
                  <span>
                    {item.avgScore.toFixed(1)}/10 • {(item.passRate * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card quick-actions-card">
            <h2>Quick actions</h2>
            <div className="quick-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate('/setup', { state: { preferredType: stats.latestType || QUESTION_TYPES.technical } })}
              >
                {topWeakArea
                  ? `Practice weak area: ${topWeakArea}`
                  : 'Practice weak area'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate('/setup', { state: { preferredType: QUESTION_TYPES.technical } })}
              >
                Retry failed coding tasks ({stats.failedCodingTasks})
              </button>
            </div>
            {!!stats.weakAreas.length && (
              <div className="weak-list">
                {stats.weakAreas.map((item) => (
                  <div className="badge" key={item.name}>
                    {item.name}: {item.avgScore.toFixed(1)}/10
                  </div>
                ))}
              </div>
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
