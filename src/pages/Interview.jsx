import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/useInterview'
import { QUESTION_TYPES } from '../data/questions'

function formatTime(seconds) {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const remaining = clamped % 60
  const padded = remaining.toString().padStart(2, '0')
  return `${minutes}:${padded}`
}

function Interview() {
  const navigate = useNavigate()
  const {
    questions,
    currentIndex,
    currentQuestion,
    currentAnswer,
    updateAnswer,
    goToNext,
    finishInterview,
    selectedType,
    codingSetup,
  } = useInterview()
  const isTimed = Boolean(currentQuestion?.timeLimit)
  const initialTime = currentQuestion ? currentQuestion.timeLimit || 0 : 0
  const [timeLeft, setTimeLeft] = useState(initialTime)

  useEffect(() => {
    if (!currentQuestion || !questions.length || !isTimed) {
      return
    }
    const id = setTimeout(() => {
      if (timeLeft <= 1) {
        if (currentIndex < questions.length - 1) {
          const nextQuestion = questions[currentIndex + 1]
          setTimeLeft(nextQuestion?.timeLimit || 0)
          goToNext()
        } else {
          finishInterview()
          navigate('/result')
        }
      } else {
        setTimeLeft(timeLeft - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [
    timeLeft,
    currentQuestion,
    questions,
    questions.length,
    currentIndex,
    goToNext,
    finishInterview,
    navigate,
    isTimed,
  ])

  useEffect(() => {
    if (!questions.length) {
      navigate('/setup')
    }
  }, [questions.length, navigate])

  const codingSummary = useMemo(() => {
    if (selectedType !== QUESTION_TYPES.coding) {
      return null
    }

    return `${codingSetup.language} • ${codingSetup.difficulty} • ${codingSetup.mode}`
  }, [codingSetup, selectedType])

  if (!currentQuestion) {
    return (
      <div className="page centered">
        <div className="card">
          <h1>No active interview</h1>
          <p>Set up an interview to start practicing.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => navigate('/setup')}
          >
            Go to setup
          </button>
        </div>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLast = currentIndex === questions.length - 1

  function handleNext() {
    if (isLast) {
      finishInterview()
      navigate('/result')
      return
    }
    const nextQuestion = questions[currentIndex + 1]
    setTimeLeft(nextQuestion?.timeLimit || 0)
    goToNext()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview in progress</h1>
        <p>
          Answer each question before the timer runs out. Focus on structure and
          clarity.
        </p>
      </div>
      <div className="card interview-card">
        <div className="interview-header">
          <div>
            <div className="badge">
              Question {currentIndex + 1} of {questions.length}
            </div>
            {codingSummary ? (
              <p className="interview-meta">Coding setup: {codingSummary}</p>
            ) : null}
          </div>
          {isTimed ? (
            <div className="timer" data-status={timeLeft <= 10 ? 'danger' : 'default'}>
              <span className="timer-label">Time left</span>
              <span className="timer-value">{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <div className="timer" data-status="default">
              <span className="timer-label">Mode</span>
              <span className="timer-value">Untimed</span>
            </div>
          )}
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <h2 className="question-text">{currentQuestion.text}</h2>
        <label className="field-label" htmlFor="answer">
          Your answer
        </label>
        <textarea
          id="answer"
          className="answer-input"
          rows={8}
          value={currentAnswer}
          onChange={(event) => updateAnswer(event.target.value)}
          placeholder="Use clear structure, examples, and outcomes."
        />
        <div className="form-footer">
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate('/setup')}
          >
            End session
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={handleNext}
          >
            {isLast ? 'Finish interview' : 'Next question'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Interview
