import { useEffect, useMemo, useState } from 'react'
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
    currentCodeSubmission,
    updateAnswer,
    updateCodeSubmission,
    goToNext,
    finishInterview,
  } = useInterview()
  const [timeLeft, setTimeLeft] = useState(
    currentQuestion ? currentQuestion.timeLimit || 90 : 0,
  )
  const [sampleTestResult, setSampleTestResult] = useState('')

  const isCodingQuestion = currentQuestion?.taskType === 'coding'

  const defaultCodingTemplate = useMemo(() => {
    if (!isCodingQuestion) return ''
    return (
      currentQuestion?.starterCode ||
      '// Write your solution here\nfunction solve(input) {\n  return input\n}'
    )
  }, [currentQuestion, isCodingQuestion])

  useEffect(() => {
    if (isCodingQuestion && !currentCodeSubmission?.trim() && defaultCodingTemplate) {
      updateCodeSubmission(defaultCodingTemplate)
    }
  }, [
    isCodingQuestion,
    currentCodeSubmission,
    defaultCodingTemplate,
    updateCodeSubmission,
  ])

  useEffect(() => {
    if (!currentQuestion || !questions.length) {
      return
    }
    const id = setTimeout(() => {
      if (timeLeft <= 1) {
        if (currentIndex < questions.length - 1) {
          const nextQuestion = questions[currentIndex + 1]
          goToNext()
          setTimeLeft(nextQuestion?.timeLimit || 90)
          setSampleTestResult('')
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
  ])

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
    setTimeLeft(nextQuestion?.timeLimit || 90)
    setSampleTestResult('')
    goToNext()
  }

  function runSampleTests() {
    const tests = currentQuestion.sampleTests || []
    if (!tests.length) {
      setSampleTestResult('No sample tests configured for this coding task yet.')
      return
    }

    const code = (currentCodeSubmission || '').toLowerCase()
    const failed = tests.filter((test) => {
      const snippets = test.requiredSnippets || []
      return !snippets.every((snippet) => code.includes(String(snippet).toLowerCase()))
    })

    if (!failed.length) {
      setSampleTestResult(`All ${tests.length} sample tests passed (scaffold check).`)
    } else {
      setSampleTestResult(
        `${tests.length - failed.length}/${tests.length} tests passed. Failing: ${failed
          .map((test) => test.name || 'Unnamed case')
          .join(', ')}`,
      )
    }
  }

  function submitSolution() {
    setSampleTestResult('Solution captured. Use Next question or Finish interview to continue.')
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

        {isCodingQuestion ? (
          <>
            <h2 className="question-text">{currentQuestion.text}</h2>
            <section className="coding-section">
              <h3>Problem statement</h3>
              <p>{currentQuestion.problemStatement || currentQuestion.text}</p>
            </section>

            {Array.isArray(currentQuestion.constraints) &&
            currentQuestion.constraints.length ? (
              <section className="coding-section">
                <h3>Constraints</h3>
                <ul>
                  {currentQuestion.constraints.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {Array.isArray(currentQuestion.examples) && currentQuestion.examples.length ? (
              <section className="coding-section">
                <h3>Examples</h3>
                <ul>
                  {currentQuestion.examples.map((example) => (
                    <li key={`${example.input}-${example.output}`}>
                      <strong>Input:</strong> {example.input} · <strong>Output:</strong>{' '}
                      {example.output}
                      {example.explanation ? ` · ${example.explanation}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <label className="field-label" htmlFor="code-answer">
              Your solution
            </label>
            <textarea
              id="code-answer"
              className="answer-input code-editor-input"
              rows={12}
              value={currentCodeSubmission}
              onChange={(event) => updateCodeSubmission(event.target.value)}
              spellCheck={false}
            />

            <div className="coding-actions">
              <button className="secondary-button" type="button" onClick={runSampleTests}>
                Run sample tests
              </button>
              <button className="primary-button" type="button" onClick={submitSolution}>
                Submit solution
              </button>
            </div>

            {sampleTestResult ? <p className="sample-test-result">{sampleTestResult}</p> : null}
          </>
        ) : (
          <>
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
          </>
        )}

        <div className="form-footer">
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate('/setup')}
          >
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
