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
    // Ignore storage write failures (private mode/quota).
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
    // Advanced checks
    let advancedScore = 0
    // Check for metrics/numbers
    if (/\d+/.test(trimmed)) advancedScore += 1
    // Check for action verbs
    const actionVerbs = ['led', 'developed', 'implemented', 'improved', 'increased', 'reduced', 'managed', 'created', 'designed', 'built']
    actionVerbs.forEach(verb => {
      if (text.includes(verb)) advancedScore += 0.5
    })
    advancedScore = Math.min(2, advancedScore)
    // Check for structure (paragraphs)
    const paragraphs = trimmed.split('\n\n').length
    if (paragraphs >= 2) advancedScore += 1

    total = Math.min(10, total + advancedScore)
    if (total >= 8) {
      feedback = 'Excellent answer with strong structure, relevant examples, and quantifiable achievements.'
    } else if (total >= 6) {
      feedback = 'Good answer. Consider adding specific metrics and action-oriented language.'
    } else if (total >= 4) {
      feedback = 'Decent start. Focus on structure, include examples, and use data where possible.'
    } else {
      feedback = 'Work on structuring your answer, covering key points, and incorporating concrete examples.'
    }
  }

  return { score: Math.round(total * 10) / 10, feedback }
}

function isCodingTask(question) {
  return question?.taskType === 'coding'
}

function evaluateCodingSubmission(code, question) {
  const normalizedCode = (code || '').trim()
  const tests = question.sampleTests || []

  if (!normalizedCode) {
    return {
      score: 0,
      feedback: 'No solution submitted yet. Add your implementation and run tests.',
      passRate: 0,
      failedCasesSummary: 'No code submitted.',
    }
  }

  if (!tests.length) {
    const score = Math.min(10, Math.max(4, Math.round((normalizedCode.length / 80) * 10) / 10))
    return {
      score,
      feedback: 'Solution captured. Add sample tests metadata for automated checks.',
      passRate: 0,
      failedCasesSummary: 'No sample tests configured for this task.',
    }
  }

  const lowerCode = normalizedCode.toLowerCase()
  const failedCases = tests.filter((test) => {
    const snippets = test.requiredSnippets || []
    return !snippets.every((snippet) => lowerCode.includes(String(snippet).toLowerCase()))
  })

  const passedCount = tests.length - failedCases.length
  const passRate = Math.round((passedCount / tests.length) * 100)
  const score = Math.round((Math.min(10, 3 + (passRate / 100) * 7)) * 10) / 10
  const feedback =
    passRate === 100
      ? 'Great work! Your solution scaffold passed all configured sample checks.'
      : 'Good progress. Iterate on your solution and address the failing sample cases.'

  return {
    score,
    feedback,
    passRate,
    failedCasesSummary: failedCases.length
      ? failedCases.map((test) => test.name || 'Unnamed case').join(', ')
      : 'All sample cases passed.',
  }
}

export function InterviewProvider({ children }) {
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.technical)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [codeSubmissions, setCodeSubmissions] = useState({})
  const [history, setHistory] = useState(() => loadHistory())
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
    setCodeSubmissions({})
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
    const questionId = questions[currentIndex]?.id
    if (!questionId) return
    setCodeSubmissions((prev) => ({
      ...prev,
      [questionId]: code,
    }))
  }

  function computeResult() {
    if (!questions.length) {
      return null
    }
    const items = questions.map((question, index) => {
      const answer = answers[index] || ''
      const code = codeSubmissions[question.id] || ''
      const scored = isCodingTask(question)
        ? evaluateCodingSubmission(code, question)
        : scoreAnswer(answer, question, advancedMode)
      return {
        id: question.id,
        question: question.text,
        answer,
        code,
        score: scored.score,
        feedback: scored.feedback,
        passRate: scored.passRate ?? null,
        failedCasesSummary: scored.failedCasesSummary ?? null,
        type: selectedType,
        taskType: question.taskType || 'non-coding',
      }
    })
    const average =
      items.reduce((sum, item) => sum + item.score, 0) /
      Math.max(items.length, 1)
    const rounded = Math.round(average * 10) / 10
    const result = {
      id: `${Date.now()}`,
      type: selectedType,
      createdAt: new Date().toISOString(),
      averageScore: rounded,
      items,
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
    currentCodeSubmission: codeSubmissions[questions[currentIndex]?.id] || '',
    history,
    lastResult,
    advancedMode,
    setAdvancedMode,
    startInterview,
    updateAnswer,
    updateCodeSubmission,
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
