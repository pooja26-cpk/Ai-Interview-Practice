import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'

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
  } = useInterview()
  const [timeLeft, setTimeLeft] = useState(currentQuestion ? currentQuestion.timeLimit || 90 : 0)

  useEffect(() => {
    if (!currentQuestion || !questions.length) {
      return undefined
    }

    const id = setTimeout(() => {
      if (timeLeft <= 1) {
        if (currentIndex < questions.length - 1) {
          const nextQuestion = questions[currentIndex + 1]
          setTimeLeft(nextQuestion?.timeLimit || 90)
          goToNext()
        } else {
          finishInterview()
          navigate('/result')
        }
      } else {
        setTimeLeft((seconds) => seconds - 1)
      }
    }, 1000)

    return () => clearTimeout(id)
  }, [timeLeft, currentQuestion, questions, questions.length, currentIndex, goToNext, finishInterview, navigate])

  useEffect(() => {
    if (!questions.length) {
      navigate('/setup')
    }
  }, [questions.length, navigate])

  if (!currentQuestion) {
    return (
      <div className="page centered">
        <div className="card">
          <h1>No active interview</h1>
          <p>Set up an interview to start practicing.</p>
          <button className="primary-button" type="button" onClick={() => navigate('/setup')}>
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
    setTimeLeft(nextQuestion?.timeLimit || 90)
    goToNext()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview in progress</h1>
        <p>Answer each question before the timer runs out. Focus on structure and clarity.</p>
      </div>
      <div className="card interview-card">
        <div className="interview-header">
          <div className="badge">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="timer" data-status={timeLeft <= 10 ? 'danger' : 'default'}>
            <span className="timer-label">Time left</span>
            <span className="timer-value">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <h2 className="question-text">{currentQuestion.text}</h2>
        {currentQuestion.prompt && <p className="question-prompt">{currentQuestion.prompt}</p>}
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
          <button className="secondary-button" type="button" onClick={() => navigate('/setup')}>
            End session
          </button>
          <button className="primary-button" type="button" onClick={handleNext}>
            {isLast ? 'Finish interview' : 'Next question'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Interview
