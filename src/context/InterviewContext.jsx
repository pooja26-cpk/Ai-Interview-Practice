/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { questionsByType, QUESTION_TYPES } from '../data/questions'

const InterviewContext = createContext(null)

const STORAGE_KEY = 'ai-interview-history'
const PASSING_SCORE = 6

function normalizeTopicTags(question, fallbackType) {
  if (Array.isArray(question?.topicTags) && question.topicTags.length) {
    return question.topicTags
  }
  if (question?.category) {
    return [question.category]
  }
  if (fallbackType) {
    return [fallbackType]
  }
  return []
}

function normalizeDifficulty(question, fallbackType) {
  if (typeof question?.difficulty === 'string' && question.difficulty.trim()) {
    return question.difficulty
  }
  return fallbackType === QUESTION_TYPES.coding ? 'unknown' : 'standard'
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const type = entry.type || QUESTION_TYPES.technical
  const rawItems = Array.isArray(entry.items) ? entry.items : []
  const items = rawItems.map((item, index) => {
    const score = Number.isFinite(item?.score) ? item.score : 0
    const category = item?.category || item?.type || type
    const topicTags = normalizeTopicTags(item, type)
    const difficulty = normalizeDifficulty(item, type)
    return {
      id: item?.id || `${entry.id || entry.createdAt || 'session'}-${index}`,
      question: item?.question || 'Untitled question',
      answer: item?.answer || '',
      score,
      feedback: item?.feedback || '',
      type: item?.type || type,
      category,
      topicTags,
      difficulty,
      passed: typeof item?.passed === 'boolean' ? item.passed : score >= PASSING_SCORE,
    }
  })

  const averageScore = Number.isFinite(entry.averageScore)
    ? entry.averageScore
    : Math.round(
        (items.reduce((sum, item) => sum + item.score, 0) /
          Math.max(items.length, 1)) * 10,
      ) / 10

  const analytics = {
    categories: [...new Set(items.map((item) => item.category).filter(Boolean))],
    topicTags: [...new Set(items.flatMap((item) => item.topicTags || []).filter(Boolean))],
    difficulties: [...new Set(items.map((item) => item.difficulty).filter(Boolean))],
    ...(entry.analytics || {}),
  }

  return {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    createdAt: entry.createdAt || new Date().toISOString(),
    averageScore,
    items,
    analytics,
  }
}

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((entry) => normalizeHistoryEntry(entry)).filter(Boolean)
  } catch {
    return []
  }
}

function saveHistory(history) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Ignore storage write failures (private mode, quota, etc.)
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

function filterQuestions(list, filters = {}) {
  const { categories, topicTags, difficulty, questionIds } = filters
  const normalizedIds = Array.isArray(questionIds) ? new Set(questionIds) : null
  const normalizedCategories = Array.isArray(categories)
    ? new Set(categories.map((value) => value.toLowerCase()))
    : null
  const normalizedTags = Array.isArray(topicTags)
    ? new Set(topicTags.map((value) => value.toLowerCase()))
    : null
  const normalizedDifficulty = typeof difficulty === 'string' ? difficulty.toLowerCase() : null

  return list.filter((question) => {
    if (normalizedIds && normalizedIds.size && !normalizedIds.has(question.id)) {
      return false
    }
    if (
      normalizedCategories &&
      normalizedCategories.size &&
      !normalizedCategories.has((question.category || '').toLowerCase())
    ) {
      return false
    }
    if (normalizedTags && normalizedTags.size) {
      const tags = normalizeTopicTags(question).map((tag) => tag.toLowerCase())
      const hasTag = tags.some((tag) => normalizedTags.has(tag))
      if (!hasTag) return false
    }
    if (
      normalizedDifficulty &&
      normalizeDifficulty(question).toLowerCase() !== normalizedDifficulty
    ) {
      return false
    }
    return true
  })
}

export function InterviewProvider({ children }) {
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.technical)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [history, setHistory] = useState(() => loadHistory())
  const [lastResult, setLastResult] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [activePracticeConfig, setActivePracticeConfig] = useState(null)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  const startInterview = useCallback((type, config = {}) => {
    const nextType = type || QUESTION_TYPES.technical
    const sourceList = questionsByType[nextType] || []
    const filtered = filterQuestions(sourceList, config)
    const list = filtered.length ? filtered : sourceList
    setSelectedType(nextType)
    setQuestions(list)
    setCurrentIndex(0)
    setAnswers(Array(list.length).fill(''))
    setLastResult(null)
    setActivePracticeConfig(
      Object.keys(config).length
        ? {
            ...config,
            type: nextType,
            questionIds: list.map((question) => question.id),
          }
        : null,
    )
  }, [])

  const updateAnswer = useCallback(
    (text) => {
      setAnswers((prev) => {
        const copy = [...prev]
        copy[currentIndex] = text
        return copy
      })
    },
    [currentIndex],
  )

  const computeResult = useCallback(() => {
    if (!questions.length) {
      return null
    }
    const items = questions.map((question, index) => {
      const answer = answers[index] || ''
      const scored = scoreAnswer(answer, question, advancedMode)
      const topicTags = normalizeTopicTags(question, selectedType)
      const difficulty = normalizeDifficulty(question, selectedType)
      return {
        id: question.id,
        question: question.text,
        answer,
        score: scored.score,
        feedback: scored.feedback,
        type: selectedType,
        category: question.category || selectedType,
        topicTags,
        difficulty,
        passed: scored.score >= PASSING_SCORE,
      }
    })
    const average =
      items.reduce((sum, item) => sum + item.score, 0) /
      Math.max(items.length, 1)
    const rounded = Math.round(average * 10) / 10
    return {
      id: `${Date.now()}`,
      type: selectedType,
      createdAt: new Date().toISOString(),
      averageScore: rounded,
      items,
      analytics: {
        categories: [...new Set(items.map((item) => item.category).filter(Boolean))],
        topicTags: [...new Set(items.flatMap((item) => item.topicTags || []).filter(Boolean))],
        difficulties: [...new Set(items.map((item) => item.difficulty).filter(Boolean))],
        practiceMode: activePracticeConfig?.label || 'full-session',
      },
    }
  }, [activePracticeConfig, advancedMode, answers, questions, selectedType])

  const finishInterview = useCallback(() => {
    const result = computeResult()
    if (!result) return
    setLastResult(result)
    setHistory((prev) => [...prev, result])
    setActivePracticeConfig(null)
  }, [computeResult])

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1)
    } else {
      finishInterview()
    }
  }, [currentIndex, finishInterview, questions.length])

  const resetInterview = useCallback(() => {
    setQuestions([])
    setAnswers([])
    setCurrentIndex(0)
    setLastResult(null)
    setActivePracticeConfig(null)
  }, [])

  const value = useMemo(
    () => ({
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
      activePracticeConfig,
      startInterview,
      updateAnswer,
      goToNext,
      finishInterview,
      resetInterview,
    }),
    [
      selectedType,
      questions,
      currentIndex,
      answers,
      history,
      lastResult,
      advancedMode,
      activePracticeConfig,
      startInterview,
      updateAnswer,
      goToNext,
      finishInterview,
      resetInterview,
    ],
  )

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
