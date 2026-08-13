import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { QUESTION_TYPES } from '../data/questions'

const PASSING_SCORE = 6

function formatLabel(value) {
  if (!value) return 'General'
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getDateKey(value) {
  const date = new Date(value)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`
}

function getWeekKey(value) {
  const date = new Date(value)
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7)
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function getCurrentStreak(keys, unitDays) {
  if (!keys.length) return 0
  const sorted = [...keys].sort()
  let streak = 1
  for (let index = sorted.length - 1; index > 0; index -= 1) {
    const diff = Math.round((new Date(sorted[index]) - new Date(sorted[index - 1])) / 86400000)
    if (diff !== unitDays) break
    streak += 1
  }
  return streak
}

function getWeeklyStreak(weekKeys) {
  if (!weekKeys.length) return 0
  const sorted = [...weekKeys].sort()
  let streak = 1
  for (let index = sorted.length - 1; index > 0; index -= 1) {
    const [currentYear, currentWeek] = sorted[index].split('-W').map(Number)
    const [previousYear, previousWeek] = sorted[index - 1].split('-W').map(Number)
    const weekGap = currentYear === previousYear ? currentWeek - previousWeek : 53 - previousWeek + currentWeek
    if (weekGap !== 1) break
    streak += 1
  }
  return streak
}

function upsertMetric(map, key, item) {
  if (!key) return
  const current = map.get(key) || { label: key, attempts: 0, totalScore: 0, passed: 0, typeCounts: {} }
  current.attempts += 1
  current.totalScore += item.score || 0
  if ((item.score || 0) >= PASSING_SCORE || item.passed) current.passed += 1
  current.typeCounts[item.type] = (current.typeCounts[item.type] || 0) + 1
  map.set(key, current)
}

function finalizeMetrics(map) {
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      averageScore: entry.totalScore / Math.max(entry.attempts, 1),
      passRate: (entry.passed / Math.max(entry.attempts, 1)) * 100,
      primaryType:
        Object.entries(entry.typeCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ||
        QUESTION_TYPES.technical,
    }))
    .sort((left, right) => right.averageScore - left.averageScore || right.passRate - left.passRate)
}

function Dashboard() {
  const navigate = useNavigate()
  const { history, startInterview } = useInterview()

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
        streaks: { daily: 0, weekly: 0 },
        failedCodingQuestionIds: [],
      }
    }

    const total = history.length
    const average = history.reduce((sum, item) => sum + item.averageScore, 0) / Math.max(total, 1)
    const best = Math.max(...history.map((item) => item.averageScore))
    const latestType = history[history.length - 1].type
    const countsByType = history.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})
    const topicMap = new Map()
    const difficultyMap = new Map()
    const weakAreaMap = new Map()
    const failedCodingQuestionIds = new Set()

    history.forEach((session) => {
      session.items.forEach((item) => {
        const score = item.score || 0
        const normalizedItem = { ...item, score }
        const topicTags = Array.isArray(item.topicTags) && item.topicTags.length
          ? item.topicTags
          : [item.category || item.type || session.type]

        topicTags.forEach((tag) => upsertMetric(topicMap, tag, normalizedItem))
        upsertMetric(difficultyMap, item.difficulty || 'standard', normalizedItem)
        upsertMetric(weakAreaMap, item.category || item.type || session.type, normalizedItem)
        if (item.type === QUESTION_TYPES.coding && score < PASSING_SCORE) failedCodingQuestionIds.add(item.id)
      })
    })

    const weakAreas = finalizeMetrics(weakAreaMap)
      .filter((entry) => entry.averageScore < 6.5 || entry.passRate < 65)
      .slice(0, 4)
    const uniqueDays = [...new Set(history.map((item) => getDateKey(item.createdAt)))]
    const uniqueWeeks = [...new Set(history.map((item) => getWeekKey(item.createdAt)))]

    return {
      total,
      average,
      best,
      latestType,
      countsByType,
      topicPerformance: finalizeMetrics(topicMap).slice(0, 6),
      difficultyPerformance: finalizeMetrics(difficultyMap),
      weakAreas,
      streaks: { daily: getCurrentStreak(uniqueDays, 1), weekly: getWeeklyStreak(uniqueWeeks) },
      failedCodingQuestionIds: [...failedCodingQuestionIds],
    }
  }, [history])

  function handlePracticeWeakArea() {
    const target = stats.weakAreas[0]
    if (!target) {
      navigate('/setup')
      return
    }
    startInterview(target.primaryType, { categories: [target.label], label: `Weak area: ${formatLabel(target.label)}` })
    navigate('/interview')
  }

  function handleRetryFailedCoding() {
    if (!stats.failedCodingQuestionIds.length) {
      navigate('/setup')
      return
    }
    startInterview(QUESTION_TYPES.coding, {
      questionIds: stats.failedCodingQuestionIds,
      label: 'Retry failed coding tasks',
    })
    navigate('/interview')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Track your interview practice over time and see how your answers improve.</p>
      </div>
      {!history.length ? (
        <div className="card centered">
          <p>No interview sessions yet. Start practicing to see your progress.</p>
          <button className="primary-button" type="button" onClick={() => navigate('/setup')}>
            Start your first interview
          </button>
        </div>
      ) : (
        <>
          <div className="card-grid dashboard-grid">
            <div className="card stat-card"><span className="stat-label">Total sessions</span><span className="stat-value">{stats.total}</span></div>
            <div className="card stat-card"><span className="stat-label">Average score</span><span className="stat-value">{stats.average.toFixed(1)}</span></div>
            <div className="card stat-card"><span className="stat-label">Best score</span><span className="stat-value">{stats.best.toFixed(1)}</span></div>
            <div className="card stat-card"><span className="stat-label">Daily streak</span><span className="stat-value">{stats.streaks.daily} day{stats.streaks.daily === 1 ? '' : 's'}</span></div>
          </div>

          <div className="dashboard-panels">
            <div className="card analytics-card">
              <div className="history-header"><h2>Quick actions</h2><span className="badge badge-soft">Stay focused</span></div>
              <div className="quick-actions">
                <button className="primary-button" type="button" onClick={handlePracticeWeakArea}>Practice weak area</button>
                <button className="secondary-button" type="button" onClick={handleRetryFailedCoding} disabled={!stats.failedCodingQuestionIds.length}>Retry failed coding tasks</button>
              </div>
              <div className="quick-actions-meta">
                <span>Weekly streak: <strong>{stats.streaks.weekly}</strong> active week{stats.streaks.weekly === 1 ? '' : 's'}</span>
                <span>Latest focus: <strong>{stats.latestType ? stats.latestType.toUpperCase() : '–'}</strong></span>
              </div>
            </div>

            <div className="card analytics-card">
              <div className="history-header"><h2>Performance by topic</h2><span className="badge badge-soft">Top patterns</span></div>
              <div className="metric-list">
                {stats.topicPerformance.map((entry) => (
                  <div key={entry.label} className="metric-row">
                    <div><div className="metric-title">{formatLabel(entry.label)}</div><div className="metric-subtitle">{entry.attempts} attempts • {entry.passRate.toFixed(0)}% pass rate</div></div>
                    <div className="metric-value">{entry.averageScore.toFixed(1)}/10</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card analytics-card">
              <div className="history-header"><h2>Performance by difficulty</h2><span className="badge badge-soft">Balanced practice</span></div>
              <div className="metric-list">
                {stats.difficultyPerformance.map((entry) => (
                  <div key={entry.label} className="metric-row">
                    <div><div className="metric-title">{formatLabel(entry.label)}</div><div className="metric-subtitle">{entry.attempts} prompts • {entry.passRate.toFixed(0)}% pass rate</div></div>
                    <div className="metric-value">{entry.averageScore.toFixed(1)}/10</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-panels dashboard-panels-secondary">
            <div className="card analytics-card">
              <div className="history-header"><h2>Weak areas</h2><span className="badge badge-soft">Needs attention</span></div>
              <div className="metric-list">
                {stats.weakAreas.length ? stats.weakAreas.map((entry) => (
                  <div key={entry.label} className="metric-row metric-row-warning">
                    <div><div className="metric-title">{formatLabel(entry.label)}</div><div className="metric-subtitle">Avg {entry.averageScore.toFixed(1)} • Pass rate {entry.passRate.toFixed(0)}%</div></div>
                    <div className="metric-value">{entry.attempts} tries</div>
                  </div>
                )) : <p className="empty-note">No weak areas detected yet. Keep the momentum going.</p>}
              </div>
            </div>

            <div className="card history-card">
              <div className="history-header"><h2>Interview history</h2><button className="secondary-button" type="button" onClick={() => navigate('/setup')}>Start new session</button></div>
              <div className="history-summary-row">
                {Object.entries(stats.countsByType).map(([type, count]) => <span key={type} className="badge badge-soft">{type.toUpperCase()}: {count}</span>)}
              </div>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-row">
                    <div className="history-main history-main-stacked">
                      <div className="badge badge-soft">{item.type.toUpperCase()}</div>
                      <div><span className="history-score">{item.averageScore.toFixed(1)}/10</span><div className="history-topics">{(item.analytics?.topicTags || []).slice(0, 3).map((tag) => <span key={`${item.id}-${tag}`} className="history-topic-pill">{formatLabel(tag)}</span>)}</div></div>
                    </div>
                    <div className="history-meta">
                      <span>{new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{item.items.length} question{item.items.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
