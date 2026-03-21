/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { questionsByType, QUESTION_TYPES } from '../data/questions'

const InterviewContext = createContext(null)

const STORAGE_KEY = 'ai-interview-history'

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveHistory(history) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Ignore storage write errors.
  }
}

function scoreAnswer(answer, question, advancedMode = false) {
  const trimmed = (answer || '').trim()
  if (!trimmed) {
    return {
      score: 0,
      feedback: 'Try to provide a structured answer that covers key points.',
    }
  }
  const words = trimmed.split(/\s+/).length
  const baseScore = Math.min(6, Math.floor(words / 35) + 2)
  const text = trimmed.toLowerCase()
  const keywords = question.keywords || []
  let keywordMatches = 0
  keywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      keywordMatches += 1
    }
  })
  const keywordScore = Math.min(4, keywordMatches)

  let total = Math.min(10, baseScore + keywordScore)
  let feedback
  if (total >= 8) {
    feedback = 'Strong answer with clear structure and relevant examples.'
  } else if (total >= 5) {
    feedback = 'Good answer, you can add more concrete examples and metrics.'
  } else {
    feedback = 'Work on structuring your answer and covering key points.'
  }

  if (advancedMode) {
    let advancedScore = 0
    if (/\d+/.test(trimmed)) advancedScore += 1
    const actionVerbs = [
      'led',
      'developed',
      'implemented',
      'improved',
      'increased',
      'reduced',
      'managed',
      'created',
      'designed',
      'built',
    ]
    actionVerbs.forEach((verb) => {
      if (text.includes(verb)) advancedScore += 0.5
    })
    advancedScore = Math.min(2, advancedScore)
    const paragraphs = trimmed.split('\n\n').length
    if (paragraphs >= 2) advancedScore += 1

    total = Math.min(10, total + advancedScore)
    if (total >= 8) {
      feedback =
        'Excellent answer with strong structure, relevant examples, and quantifiable achievements.'
    } else if (total >= 6) {
      feedback =
        'Good answer. Consider adding specific metrics and action-oriented language.'
    } else if (total >= 4) {
      feedback =
        'Decent start. Focus on structure, include examples, and use data where possible.'
    } else {
      feedback =
        'Work on structuring your answer, covering key points, and incorporating concrete examples.'
    }
  }

  return { score: Math.round(total * 10) / 10, feedback }
}

function getSupportedLanguages(question) {
  return Object.keys(question?.starterCode || {})
}

function getDefaultLanguage(question) {
  const supported = getSupportedLanguages(question)
  if (supported.includes('javascript')) return 'javascript'
  return supported[0] || 'javascript'
}

function getInitialCode(question) {
  const language = getDefaultLanguage(question)
  return question?.starterCode?.[language] || ''
}

function createInitialCodeSubmissions(list) {
  return list.reduce((accumulator, question) => {
    if (question?.starterCode) {
      const language = getDefaultLanguage(question)
      accumulator[question.id] = {
        code: question.starterCode?.[language] || '',
        language,
        lastRun: null,
        submittedAt: null,
      }
    }
    return accumulator
  }, {})
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function getJavaScriptFunctionName(question) {
  const starter = question?.starterCode?.javascript || ''
  const match = starter.match(/function\s+([A-Za-z0-9_]+)\s*\(/)
  return match?.[1] || null
}

function runJavaScriptTests(question, code) {
  const functionName = getJavaScriptFunctionName(question)
  const publicTests = question?.testCases?.public || []

  if (!functionName) {
    return {
      status: 'error',
      passed: 0,
      total: publicTests.length,
      passRate: 0,
      failedCasesSummary: 'Unable to detect the JavaScript function name from the starter template.',
      cases: publicTests.map((testCase, index) => ({
        name: `Sample ${index + 1}`,
        passed: false,
        message: 'Function name detection failed.',
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
      })),
    }
  }

  try {
    const candidate = new Function(
      `${code}\n; return typeof ${functionName} === 'function' ? ${functionName} : null;`,
    )()

    if (typeof candidate !== 'function') {
      throw new Error(`Expected a function named ${functionName}.`)
    }

    const cases = publicTests.map((testCase, index) => {
      try {
        const actual = candidate(...Object.values(testCase.input || {}))
        const passed = deepEqual(actual, testCase.expectedOutput)
        return {
          name: `Sample ${index + 1}`,
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actual,
          message: passed
            ? 'Passed.'
            : `Expected ${JSON.stringify(testCase.expectedOutput)} but received ${JSON.stringify(actual)}.`,
        }
      } catch (error) {
        return {
          name: `Sample ${index + 1}`,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: null,
          message: error instanceof Error ? error.message : 'Execution failed.',
        }
      }
    })

    const passed = cases.filter((item) => item.passed).length
    const total = cases.length
    const failedSummaries = cases
      .filter((item) => !item.passed)
      .map((item) => `${item.name}: ${item.message}`)

    return {
      status: failedSummaries.length ? 'completed' : 'passed',
      passed,
      total,
      passRate: total ? Math.round((passed / total) * 100) : 0,
      failedCasesSummary: failedSummaries.length
        ? failedSummaries.join(' ')
        : 'All public sample tests passed.',
      cases,
    }
  } catch (error) {
    return {
      status: 'error',
      passed: 0,
      total: publicTests.length,
      passRate: 0,
      failedCasesSummary:
        error instanceof Error
          ? error.message
          : 'Unable to execute the JavaScript solution.',
      cases: publicTests.map((testCase, index) => ({
        name: `Sample ${index + 1}`,
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        message: error instanceof Error ? error.message : 'Execution failed.',
      })),
    }
  }
}

function runSampleTestsForSubmission(question, submission) {
  const code = submission?.code || ''
  const trimmed = code.trim()
  const publicTests = question?.testCases?.public || []

  if (!trimmed) {
    return {
      status: 'idle',
      passed: 0,
      total: publicTests.length,
      passRate: 0,
      failedCasesSummary: 'Add a solution before running sample tests.',
      cases: publicTests.map((testCase, index) => ({
        name: `Sample ${index + 1}`,
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        message: 'No code provided.',
      })),
    }
  }

  if (submission?.language !== 'javascript') {
    return {
      status: 'unsupported',
      passed: 0,
      total: publicTests.length,
      passRate: 0,
      failedCasesSummary:
        'Client-side sample test execution is currently scaffolded for JavaScript only. Switch languages or submit for manual review.',
      cases: publicTests.map((testCase, index) => ({
        name: `Sample ${index + 1}`,
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        message: 'Python sample runner is not available in this browser scaffold.',
      })),
    }
  }

  return runJavaScriptTests(question, code)
}

function scoreCodingSubmission(question, submission) {
  const code = submission?.code || ''
  const trimmed = code.trim()

  if (!trimmed) {
    return {
      score: 0,
      feedback:
        'No solution submitted yet. Write code, run the public cases, and submit when ready.',
      passRate: 0,
      failedCasesSummary: 'No coding submission recorded.',
      passedPublicTests: 0,
      totalPublicTests: question?.testCases?.public?.length || 0,
    }
  }

  const run = submission?.lastRun || runSampleTestsForSubmission(question, submission)
  const total = run.total || 0
  const passRatio = total ? run.passed / total : 0
  let score = Math.round((2 + passRatio * 8) * 10) / 10
  let feedback = 'Good start. Keep iterating on the remaining failing cases.'

  if (run.status === 'unsupported') {
    score = 4
    feedback =
      'Solution captured, but the in-browser runner only validates JavaScript right now. Submit it for review or switch to JavaScript to execute samples.'
  } else if (run.status === 'error') {
    score = 2
    feedback =
      'Your solution did not execute successfully. Fix the runtime or syntax issues and rerun the public cases.'
  } else if (run.passRate === 100) {
    score = 10
    feedback =
      'Excellent work. Your solution passed all available public sample tests in the client-side runner.'
  } else if (run.passRate >= 50) {
    feedback =
      'Promising solution. Some public cases still fail, so review edge cases and tighten the implementation.'
  } else if (run.passRate > 0) {
    score = Math.max(score, 3.5)
    feedback =
      'The approach is partially working, but several public cases still fail. Revisit correctness and edge cases.'
  } else {
    score = Math.max(score, 2)
    feedback =
      'The current implementation does not pass the public cases yet. Compare your outputs against the examples and iterate.'
  }

  return {
    score,
    feedback,
    passRate: run.passRate,
    failedCasesSummary: run.failedCasesSummary,
    passedPublicTests: run.passed,
    totalPublicTests: total,
  }
}

export function InterviewProvider({ children }) {
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.technical)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [codeSubmissions, setCodeSubmissions] = useState({})
  const [history, setHistory] = useState(loadHistory)
  const [lastResult, setLastResult] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(false)


  useEffect(() => {
    saveHistory(history)
  }, [history])

  function startInterview(type) {
    const nextType = type || QUESTION_TYPES.technical
    const list = questionsByType[nextType] || []
    setSelectedType(nextType)
    setQuestions(list)
    setCurrentIndex(0)
    setAnswers(Array(list.length).fill(''))
    setCodeSubmissions(createInitialCodeSubmissions(list))
    setLastResult(null)
  }

  function updateAnswer(text) {
    setAnswers((prev) => {
      const copy = [...prev]
      copy[currentIndex] = text
      return copy
    })
  }

  function updateCodeSubmission(code) {
    const question = questions[currentIndex]
    if (!question) return

    setCodeSubmissions((prev) => ({
      ...prev,
      [question.id]: {
        ...(prev[question.id] || {
          code: getInitialCode(question),
          language: getDefaultLanguage(question),
          lastRun: null,
          submittedAt: null,
        }),
        code,
      },
    }))
  }

  function updateCodeLanguage(language) {
    const question = questions[currentIndex]
    if (!question) return

    setCodeSubmissions((prev) => {
      const existing = prev[question.id]
      return {
        ...prev,
        [question.id]: {
          code: question?.starterCode?.[language] || existing?.code || '',
          language,
          lastRun: existing?.lastRun || null,
          submittedAt: existing?.submittedAt || null,
        },
      }
    })
  }

  function runCurrentSampleTests() {
    const question = questions[currentIndex]
    if (!question) return null

    const submission =
      codeSubmissions[question.id] || {
        code: getInitialCode(question),
        language: getDefaultLanguage(question),
        lastRun: null,
        submittedAt: null,
      }
    const run = runSampleTestsForSubmission(question, submission)

    setCodeSubmissions((prev) => ({
      ...prev,
      [question.id]: {
        ...submission,
        lastRun: {
          ...run,
          runAt: new Date().toISOString(),
        },
      },
    }))

    return run
  }

  function submitCurrentSolution() {
    const question = questions[currentIndex]
    if (!question) return null

    const run = runCurrentSampleTests()
    setCodeSubmissions((prev) => ({
      ...prev,
      [question.id]: {
        ...(prev[question.id] || {
          code: getInitialCode(question),
          language: getDefaultLanguage(question),
          lastRun: null,
          submittedAt: null,
        }),
        submittedAt: new Date().toISOString(),
      },
    }))

    return run
  }

  function computeResult() {
    if (!questions.length) {
      return null
    }
    const items = questions.map((question, index) => {
      if (question?.starterCode) {
        const submission = codeSubmissions[question.id] || {
          code: getInitialCode(question),
          language: getDefaultLanguage(question),
          lastRun: null,
          submittedAt: null,
        }
        const scored = scoreCodingSubmission(question, submission)
        return {
          id: question.id,
          question: question.text,
          answer: submission.code,
          code: submission.code,
          language: submission.language,
          score: scored.score,
          feedback: scored.feedback,
          type: selectedType,
          passRate: scored.passRate,
          failedCasesSummary: scored.failedCasesSummary,
          passedPublicTests: scored.passedPublicTests,
          totalPublicTests: scored.totalPublicTests,
          submittedAt: submission.submittedAt,
          lastRun: submission.lastRun,
        }
      }

      const answer = answers[index] || ''
      const scored = scoreAnswer(answer, question, advancedMode)
      return {
        id: question.id,
        question: question.text,
        answer,
        score: scored.score,
        feedback: scored.feedback,
        type: selectedType,
      }
    })
    const average =
      items.reduce((sum, item) => sum + item.score, 0) /
      Math.max(items.length, 1)
    const rounded = Math.round(average * 10) / 10
    const codingItems = items.filter((item) => typeof item.passRate === 'number')
    const totalPublicTests = codingItems.reduce(
      (sum, item) => sum + (item.totalPublicTests || 0),
      0,
    )
    const totalPassedPublicTests = codingItems.reduce(
      (sum, item) => sum + (item.passedPublicTests || 0),
      0,
    )
    const result = {
      id: `${Date.now()}`,
      type: selectedType,
      createdAt: new Date().toISOString(),
      averageScore: rounded,
      items,
    }

    if (codingItems.length) {
      result.codingSummary = {
        averagePassRate: codingItems.length
          ? Math.round(
              codingItems.reduce((sum, item) => sum + item.passRate, 0) /
                codingItems.length,
            )
          : 0,
        totalPassedPublicTests,
        totalPublicTests,
        failedCasesSummary: codingItems
          .filter(
            (item) =>
              item.failedCasesSummary &&
              item.failedCasesSummary !== 'All public sample tests passed.',
          )
          .map((item) => `${item.question}: ${item.failedCasesSummary}`)
          .join(' '),
      }
    }

    return result
  }

  function goToNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1)
    } else {
      finishInterview()
    }
  }

  function finishInterview() {
    const result = computeResult()
    if (!result) return
    setLastResult(result)
    setHistory((prev) => [...prev, result])
  }

  function resetInterview() {
    setQuestions([])
    setAnswers([])
    setCodeSubmissions({})
    setCurrentIndex(0)
    setLastResult(null)
  }

  const value = {
    selectedType,
    setSelectedType,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] || null,
    answers,
    currentAnswer: answers[currentIndex] || '',
    currentCodeSubmission: questions[currentIndex]
      ? codeSubmissions[questions[currentIndex].id] || null
      : null,
    codeSubmissions,
    history,
    lastResult,
    advancedMode,
    setAdvancedMode,
    startInterview,
    updateAnswer,
    updateCodeSubmission,
    updateCodeLanguage,
    runCurrentSampleTests,
    submitCurrentSolution,
    goToNext,
    finishInterview,
    resetInterview,
  }

  return (
    <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
  )
}

export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) {
    throw new Error('useInterview must be used within InterviewProvider')
  }
  return ctx
}
