import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { QUESTION_TYPES } from '../data/questions'

const TOPIC_OPTIONS = [
  'javascript',
  'async',
  'api',
  'architecture',
  'scalability',
  'debugging',
  'problem-solving',
  'testing',
  'quality',
  'microservices',
]

function Setup() {
  const navigate = useNavigate()
  const {
    selectedType,
    setSelectedType,
    startInterview,
    advancedMode,
    setAdvancedMode,
    codingSetup,
    setCodingSetup,
  } = useInterview()
  const [type, setType] = useState(selectedType)
  const [difficulty, setDifficulty] = useState(codingSetup.difficulty)
  const [language, setLanguage] = useState(codingSetup.language)
  const [topics, setTopics] = useState(codingSetup.topics)
  const [mode, setMode] = useState(codingSetup.mode)

  const isCoding = type === QUESTION_TYPES.technical
  const topicSet = useMemo(() => new Set(topics), [topics])

  function toggleTopic(topic) {
    if (topicSet.has(topic)) {
      setTopics((prev) => prev.filter((item) => item !== topic))
      return
    }
    setTopics((prev) => [...prev, topic])
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSelectedType(type)
    if (isCoding) {
      const nextCodingSetup = {
        difficulty,
        language,
        topics,
        mode,
      }
      setCodingSetup(nextCodingSetup)
      startInterview(type, nextCodingSetup)
    } else {
      startInterview(type)
    }
    navigate('/interview')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview setup</h1>
        <p>Select the type of interview you want to practice.</p>
      </div>
      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label">Interview type</label>
          <div className="option-grid">
            <button
              type="button"
              className={
                type === QUESTION_TYPES.hr
                  ? 'option-card option-card-active'
                  : 'option-card'
              }
              onClick={() => setType(QUESTION_TYPES.hr)}
            >
              <span className="option-title">HR</span>
              <span className="option-description">
                Culture, motivation, and career goals.
              </span>
            </button>
            <button
              type="button"
              className={
                type === QUESTION_TYPES.technical
                  ? 'option-card option-card-active'
                  : 'option-card'
              }
              onClick={() => setType(QUESTION_TYPES.technical)}
            >
              <span className="option-title">Technical</span>
              <span className="option-description">
                System design, coding, and technical depth.
              </span>
            </button>
            <button
              type="button"
              className={
                type === QUESTION_TYPES.behavioral
                  ? 'option-card option-card-active'
                  : 'option-card'
              }
              onClick={() => setType(QUESTION_TYPES.behavioral)}
            >
              <span className="option-title">Behavioral</span>
              <span className="option-description">
                STAR-style questions with real scenarios.
              </span>
            </button>
          </div>
        </div>

        {isCoding && (
          <>
            <div className="field-group">
              <label className="field-label" htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                className="answer-input"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option value="any">Any</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="language">Language</label>
              <select
                id="language"
                className="answer-input"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                <option value="any">Any</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Optional topics / tags</label>
              <div className="option-grid">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={topicSet.has(topic) ? 'option-card option-card-active' : 'option-card'}
                    onClick={() => toggleTopic(topic)}
                  >
                    <span className="option-title">{topic}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mode">Mode</label>
              <select
                id="mode"
                className="answer-input"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <option value="timed">Timed</option>
                <option value="untimed">Untimed</option>
              </select>
            </div>
          </>
        )}

        <div className="field-group">
          <label className="field-label">
            <input
              type="checkbox"
              checked={advancedMode}
              onChange={(e) => setAdvancedMode(e.target.checked)}
            />
            Enable advanced scoring
          </label>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Advanced scoring provides more detailed feedback based on structure, metrics, and action verbs.
          </p>
        </div>
        <div className="form-footer">
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate('/')}
          >
            Back to home
          </button>
          <button className="primary-button" type="submit">
            Start interview
          </button>
        </div>
      </form>
    </div>
  )
}

export default Setup
