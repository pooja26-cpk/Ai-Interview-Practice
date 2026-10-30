import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { QUESTION_TYPES } from '../data/questions'

function Setup() {
  const navigate = useNavigate()
  const { selectedType, setSelectedType, startInterview, advancedMode, setAdvancedMode } = useInterview()
  const [type, setType] = useState(selectedType)

  function handleSubmit(event) {
    event.preventDefault()
    setSelectedType(type)
    startInterview(type)
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

