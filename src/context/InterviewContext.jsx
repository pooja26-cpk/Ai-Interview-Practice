import { useEffect, useState } from 'react'
import { questionsByType, QUESTION_TYPES } from '../data/questions'
import {
  DEFAULT_CODING_SETUP,
  prepareQuestionsForSession,
} from './interviewUtils'
import InterviewContext from './interviewContextObject'

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
    // Ignore storage write failures.
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

    const actionVerbs = ['led', 'developed', 'implemented', 'improved', 'increased', 'reduced', 'managed', 'created', 'designed', 'built']
    actionVerbs.forEach((verb) => {
      if (text.includes(verb)) advancedScore += 0.5
    })
    advancedScore = Math.min(2, advancedScore)

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

export function InterviewProvider({ children }) {
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.technical)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [history, setHistory] = useState(() => loadHistory())
  const [lastResult, setLastResult] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [codingSetup, setCodingSetup] = useState(DEFAULT_CODING_SETUP)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  function startInterview(type, options = {}) {
    const nextType = type || QUESTION_TYPES.technical
    const nextCodingSetup = {
      ...codingSetup,
      ...options,
      topicTags: options.topicTags ?? codingSetup.topicTags,
    }

    const list = prepareQuestionsForSession(
      nextType,
      questionsByType[nextType] || [],
      nextCodingSetup,
    )

    if (!list.length) {
      return false
    }

    if (nextType === QUESTION_TYPES.coding) {
      setCodingSetup(nextCodingSetup)
    }

    setSelectedType(nextType)
    setQuestions(list)
    setCurrentIndex(0)
    setAnswers(Array(list.length).fill(''))
    setLastResult(null)
    return true
  }

  function updateAnswer(text) {
    setAnswers((prev) => {
      const copy = [...prev]
      copy[currentIndex] = text
      return copy
    })
  }

  function computeResult() {
    if (!questions.length) {
      return null
    }
    const items = questions.map((question, index) => {
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
    history,
    lastResult,
    advancedMode,
    setAdvancedMode,
    codingSetup,
    setCodingSetup,
    startInterview,
    updateAnswer,
    goToNext,
    finishInterview,
    resetInterview,
  }

  return (
    <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
  )
}

