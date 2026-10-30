import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeEditor from '../components/CodeEditor'
import { useInterview } from '../context/InterviewContext'

function formatTime(seconds) {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const remaining = clamped % 60
  const padded = remaining.toString().padStart(2, '0')
  return `${minutes}:${padded}`
}

function formatLanguage(language) {
  if (language === 'javascript') return 'JavaScript'
  if (language === 'python') return 'Python'
  return language
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
    updateCodeLanguage,
    runCurrentSampleTests,
    submitCurrentSolution,
    goToNext,
    finishInterview,
  } = useInterview()
  const [timeLeft, setTimeLeft] = useState(
    currentQuestion ? currentQuestion.timeLimit || 90 : 0,
  )

  const isCodingQuestion = Boolean(currentQuestion?.starterCode)
  const supportedLanguages = useMemo(
    () => Object.keys(currentQuestion?.starterCode || {}),
    [currentQuestion],
  )
  const currentLanguage =
    currentCodeSubmission?.language || supportedLanguages[0] || 'javascript'
  const currentCode =
    currentCodeSubmission?.code || currentQuestion?.starterCode?.[currentLanguage] || ''

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
  }, [questions, navigate])


  const sampleTestResult = currentCodeSubmission?.lastRun || null

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
    goToNext()
  }

  function handleRunSampleTests() {
    runCurrentSampleTests()
  }

  function handleSubmitSolution() {
    submitCurrentSolution()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Interview in progress</h1>
        <p>
          {isCodingQuestion
            ? 'Read the prompt carefully, code your approach, and validate it against the sample cases.'
            : 'Answer each question before the timer runs out. Focus on structure and clarity.'}
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
            <div className="coding-question-header">
              <div>
                <h2 className="question-text">{currentQuestion.text}</h2>
                <p className="coding-prompt">{currentQuestion.prompt}</p>
              </div>
              <div className="coding-meta-row">
                <span className="badge badge-soft">
                  {currentQuestion.difficulty || 'coding'}
                </span>
                {currentQuestion.topicTags?.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="coding-layout">
              <section className="coding-panel">
                <h3>Constraints</h3>
                <ul className="coding-bullet-list">
                  {currentQuestion.constraints?.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </section>
              <section className="coding-panel">
                <h3>Examples</h3>
                <div className="example-list">
                  {currentQuestion.examples?.map((example, index) => (
                    <article key={`${example.input}-${index}`} className="example-card">
                      <div className="example-title">Example {index + 1}</div>
                      <pre className="example-block">Input: {example.input}</pre>
                      <pre className="example-block">Output: {example.output}</pre>
                      {example.explanation ? (
                        <p className="example-explanation">{example.explanation}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="coding-editor-section">
              <div className="coding-editor-header">
                <div>
                  <label className="field-label" htmlFor="code-answer">
                    Your solution
                  </label>
                  <p className="editor-help-text">
                    Use the starter template below. Client-side sample execution is currently available for JavaScript.
                  </p>
                </div>
                <div className="sample-test-meta">
                  <span className="summary-label">Public cases</span>
                  <span className="summary-value">
                    {currentQuestion.testCases?.public?.length || 0} visible ·{' '}
                    {currentQuestion.testCases?.hidden?.count || 0} hidden
                  </span>
                </div>
              </div>
              <CodeEditor
                id="code-answer"
                value={currentCode}
                language={currentLanguage}
                languages={supportedLanguages}
                onChange={updateCodeSubmission}
                onLanguageChange={updateCodeLanguage}
                placeholder={`Write your ${formatLanguage(currentLanguage)} solution here.`}
              />
            </div>

            <div className="coding-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={handleRunSampleTests}
              >
                Run sample tests
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleSubmitSolution}
              >
                Submit solution
              </button>
            </div>

            {sampleTestResult ? (
              <section className="coding-panel sample-results-panel">
                <div className="sample-results-header">
                  <h3>Sample test results</h3>
                  <span className="badge">
                    {sampleTestResult.passed}/{sampleTestResult.total} passed
                  </span>
                </div>
                <p className="coding-run-summary">
                  Pass rate: {sampleTestResult.passRate}% · {sampleTestResult.failedCasesSummary}
                </p>
                <ul className="sample-case-list">
                  {sampleTestResult.cases?.map((testCase) => (
                    <li key={testCase.name} className="sample-case-item">
                      <div className="sample-case-header">
                        <strong>{testCase.name}</strong>
                        <span className={`badge ${testCase.passed ? 'badge-success' : 'badge-danger'}`}>
                          {testCase.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <pre className="example-block">
                        Input: {JSON.stringify(testCase.input)}
                        {'\n'}Expected: {JSON.stringify(testCase.expectedOutput)}
                        {'\n'}
                        {testCase.actualOutput !== undefined
                          ? `Actual: ${JSON.stringify(testCase.actualOutput)}`
                          : 'Actual: n/a'}
                      </pre>
                      <p className="example-explanation">{testCase.message}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
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
