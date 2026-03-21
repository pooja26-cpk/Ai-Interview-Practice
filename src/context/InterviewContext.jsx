import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { questionsByType, QUESTION_TYPES } from '../data/questions'

const InterviewContext = createContext(null)

const STORAGE_KEY = 'ai-interview-history'
const PASS_SCORE_THRESHOLD = 6

function getDefaultDifficulty(type) {
  if (type === QUESTION_TYPES.technical) return 'hard'
  if (type === QUESTION_TYPES.behavioral) return 'medium'
  return 'easy'
}

function deriveTopicTags(question, type) {
  if (Array.isArray(question?.topicTags) && question.topicTags.length) {
    return question.topicTags
  }
  const tags = []
  if (question?.category) {
    tags.push(question.category)
  }
  if (type) {
    tags.push(type)
  }
  return [...new Set(tags)]
}

function deriveDifficulty(question, type) {
  if (question?.difficulty) return question.difficulty
  return getDefaultDifficulty(type)
}

function deriveAnalyticsItem(item, sessionType) {
  const score = typeof item?.score === 'number' ? item.score : 0
  const topicTags =
    Array.isArray(item?.topicTags) && item.topicTags.length
      ? item.topicTags
      : deriveTopicTags(item, sessionType)
  const difficulty = item?.difficulty || deriveDifficulty(item, sessionType)
  const type = item?.type || sessionType || QUESTION_TYPES.technical
  const isCodingTask =
    typeof item?.isCodingTask === 'boolean'
      ? item.isCodingTask
      : type === QUESTION_TYPES.technical

  return {
    ...item,
    type,
    topicTags,
    difficulty,
    isCodingTask,
    pass: typeof item?.pass === 'boolean' ? item.pass : score >= PASS_SCORE_THRESHOLD,
  }
}

function normalizeHistoryEntry(session) {
  const type = session?.type || QUESTION_TYPES.technical
  const createdAt = session?.createdAt || new Date().toISOString()
  const createdDate = new Date(createdAt)
  const validDate = Number.isNaN(createdDate.getTime()) ? new Date() : createdDate
  const dayKey = validDate.toISOString().slice(0, 10)
  const weekStart = new Date(validDate)
  const day = weekStart.getDay()
  const offset = day === 0 ? -6 : 1 - day
  weekStart.setDate(weekStart.getDate() + offset)

  const items = Array.isArray(session?.items)
    ? session.items.map((item) => deriveAnalyticsItem(item, type))
    : []
  const averageScore =
    typeof session?.averageScore === 'number'
      ? session.averageScore
      : items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1)

  return {
    ...session,
    id: session?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    createdAt,
    averageScore: Math.round(averageScore * 10) / 10,
    sessionDayKey: session?.sessionDayKey || dayKey,
    sessionWeekKey: session?.sessionWeekKey || weekStart.toISOString().slice(0, 10),
    items,
  }
}

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((entry) => normalizeHistoryEntry(entry))
  } catch {
    return []
  }
}

function saveHistory(history) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Ignore storage write failures (private mode, quota limits).
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

export function InterviewProvider({ children }) {
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.technical)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
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
    setLastResult(null)
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
      const topicTags = deriveTopicTags(question, selectedType)
      const difficulty = deriveDifficulty(question, selectedType)
      return {
        id: question.id,
        question: question.text,
        answer,
        score: scored.score,
        feedback: scored.feedback,
        category: question.category || null,
        type: selectedType,
        topicTags,
        difficulty,
        isCodingTask: selectedType === QUESTION_TYPES.technical,
        pass: scored.score >= PASS_SCORE_THRESHOLD,
      }
    })
    const average =
      items.reduce((sum, item) => sum + item.score, 0) /
      Math.max(items.length, 1)
    const rounded = Math.round(average * 10) / 10
    const now = new Date()
    const dayKey = now.toISOString().slice(0, 10)
    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const offset = day === 0 ? -6 : 1 - day
    weekStart.setDate(weekStart.getDate() + offset)
    const result = {
      id: `${Date.now()}`,
      type: selectedType,
      createdAt: now.toISOString(),
      sessionDayKey: dayKey,
      sessionWeekKey: weekStart.toISOString().slice(0, 10),
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
    ],
  )

  return (
    <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) {
    throw new Error('useInterview must be used within InterviewProvider')
  }
  return ctx
}
