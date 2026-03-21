import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/useInterview'
import { questionsByType, QUESTION_TYPES } from '../data/questions'
import { matchesCodingOptions } from '../context/interviewUtils'

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
]

const MODE_OPTIONS = [
  { value: 'timed', label: 'Timed' },
  { value: 'untimed', label: 'Untimed' },
]

function Setup() {
  const navigate = useNavigate()
  const {
    selectedType,
    startInterview,
    advancedMode,
    setAdvancedMode,
    codingSetup,
    setCodingSetup,
  } = useInterview()
  const [type, setType] = useState(selectedType)
  const [error, setError] = useState('')

  const availableCodingTags = useMemo(() => {
    const tags = questionsByType.coding.flatMap((question) => question.topicTags || [])
    return [...new Set(tags)].sort()
  }, [])

  const matchingCodingCount = useMemo(() => {
    return questionsByType.coding.filter((question) => matchesCodingOptions(question, codingSetup)).length
  }, [codingSetup])

  function handleSubmit(event) {
    event.preventDefault()
    const started = startInterview(type, type === QUESTION_TYPES.coding ? codingSetup : undefined)
    if (!started) {
      setError('No coding challenges match the selected filters. Adjust your setup and try again.')
      return
    }
    setError('')
    navigate('/interview')
  }

  function handleTypeChange(nextType) {
    setType(nextType)
    setError('')
  }

  function handleCodingSetupChange(key, value) {
    setCodingSetup((prev) => ({
      ...prev,
      [key]: value,
    }))
    setError('')
  }

  function handleTopicToggle(tag) {
    const nextTags = codingSetup.topicTags.includes(tag)
      ? codingSetup.topicTags.filter((item) => item !== tag)
      : [...codingSetup.topicTags, tag]

    handleCodingSetupChange('topicTags', nextTags)
  }

  const isCoding = type === QUESTION_TYPES.coding

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview setup</h1>
        <p>Select the type of interview you want to practice.</p>
      </div>
      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label">Interview type</label>
          <div className="option-grid option-grid-wide">
            <button
              type="button"
              className={
                type === QUESTION_TYPES.hr
                  ? 'option-card option-card-active'
                  : 'option-card'
              }
              onClick={() => handleTypeChange(QUESTION_TYPES.hr)}
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
              onClick={() => handleTypeChange(QUESTION_TYPES.technical)}
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
              onClick={() => handleTypeChange(QUESTION_TYPES.behavioral)}
            >
              <span className="option-title">Behavioral</span>
              <span className="option-description">
                STAR-style questions with real scenarios.
              </span>
            </button>
            <button
              type="button"
              className={
                type === QUESTION_TYPES.coding
                  ? 'option-card option-card-active'
                  : 'option-card'
              }
              onClick={() => handleTypeChange(QUESTION_TYPES.coding)}
            >
              <span className="option-title">Coding</span>
              <span className="option-description">
                Practice algorithmic challenges in your preferred language.
              </span>
            </button>
          </div>
        </div>

        {isCoding ? (
          <div className="coding-setup-panel">
            <div className="field-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="coding-difficulty">
                  Difficulty
                </label>
                <select
                  id="coding-difficulty"
                  className="select-input"
                  value={codingSetup.difficulty}
                  onChange={(event) =>
                    handleCodingSetupChange('difficulty', event.target.value)
                  }
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="coding-language">
                  Language
                </label>
                <select
                  id="coding-language"
                  className="select-input"
                  value={codingSetup.language}
                  onChange={(event) =>
                    handleCodingSetupChange('language', event.target.value)
                  }
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Topic tags (optional)</label>
              <div className="chip-grid">
                {availableCodingTags.map((tag) => {
                  const isSelected = codingSetup.topicTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={isSelected ? 'tag-chip tag-chip-active' : 'tag-chip'}
                      onClick={() => handleTopicToggle(tag)}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
              <p className="field-hint">
                Filter challenges by one or more focus areas. Leave blank to include all topics.
              </p>
            </div>

            <div className="field-group">
              <label className="field-label">Mode</label>
              <div className="inline-options">
                {MODE_OPTIONS.map((option) => {
                  const isSelected = codingSetup.mode === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={isSelected ? 'pill-toggle pill-toggle-active' : 'pill-toggle'}
                      onClick={() => handleCodingSetupChange('mode', option.value)}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <p className="field-hint">
                {codingSetup.mode === 'timed'
                  ? 'Timed coding sessions apply difficulty-based countdowns.'
                  : 'Untimed mode removes the countdown so you can focus on problem solving.'}
              </p>
            </div>

            <div className="setup-summary">
              <span className="badge badge-soft">{matchingCodingCount} matches</span>
              <span className="setup-summary-text">
                Challenges will use {codingSetup.language === 'javascript' ? 'JavaScript' : 'Python'} starter code.
              </span>
            </div>
          </div>
        ) : null}

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

        {error ? <p className="form-error">{error}</p> : null}

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
