import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
  } catch (error) {
    return []
  }
}

function saveHistory(history) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
  }
}

function mapFocusArea(answer, feedback, keywordCoverage) {
  const trimmed = (answer || '').trim()
  const text = `${feedback || ''} ${trimmed}`.toLowerCase()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0

  if (
    text.includes('metric') ||
    text.includes('quantifiable') ||
    text.includes('data') ||
    (!/\d+/.test(trimmed) && wordCount >= 40)
  ) {
    return 'metrics'
  }

  if (
    text.includes('structure') ||
    text.includes('star') ||
    wordCount < 35 ||
    !trimmed.includes('.')
  ) {
    return 'structure'
  }

  if (
    text.includes('key points') ||
    text.includes('relevant') ||
    keywordCoverage < 0.4
  ) {
    return 'relevance'
  }

  return 'clarity'
}

function buildPracticeTask(item) {
  const prompts = {
    structure:
      'Rewrite your answer using a clear STAR flow (Situation, Task, Action, Result) with one concise paragraph per step.',
    clarity:
      'Rewrite your answer in 4-6 short sentences with direct language and one specific example that is easy to follow.',
    metrics:
      'Rewrite your answer and add at least two measurable outcomes (%, $, time saved, users impacted) tied to your actions.',
    relevance:
      'Rewrite your answer so each paragraph maps directly to the question, reusing at least three key terms from the prompt.',
  }
  return `Question: ${item.question}\n${prompts[item.focusArea]}`
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

  return {
    score: Math.round(total * 10) / 10,
    feedback,
    keywordMatches,
    keywordTotal: keywords.length,
  }
}

export function InterviewProvider({ children }) {
  const [selectedType, setSelectedType] = useState(QUESTION_TYPES.technical)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [history, setHistory] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(false)

  useEffect(() => {
    const initialHistory = loadHistory()
    setHistory(initialHistory)
  }, [])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  function startInterview(type, options = {}) {
    const nextType = type || QUESTION_TYPES.technical
    const list = questionsByType[nextType] || []
    const targetedList = options.questionId
      ? list.filter((question) => question.id === options.questionId)
      : list
    const nextList = targetedList.length ? targetedList : list
    setSelectedType(nextType)
    setQuestions(nextList)
    setCurrentIndex(0)
    setAnswers(Array(nextList.length).fill(''))
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
      return {
        id: question.id,
        question: question.text,
        answer,
        score: scored.score,
        feedback: scored.feedback,
        keywordMatches: scored.keywordMatches,
        keywordTotal: scored.keywordTotal,
        type: selectedType,
      }
    })
    const coachingPlan = items
      .filter((item) => item.score < 6.5)
      .map((item) => {
        const keywordCoverage = item.keywordTotal
          ? item.keywordMatches / item.keywordTotal
          : 0
        const focusArea = mapFocusArea(item.answer, item.feedback, keywordCoverage)
        return {
          questionId: item.id,
          question: item.question,
          focusArea,
          practiceTask: buildPracticeTask({ ...item, focusArea }),
          targetScore: Math.min(10, Math.round((item.score + 1.5) * 10) / 10),
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
      coachingPlan,
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

export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) {
    throw new Error('useInterview must be used within InterviewProvider')
  }
  return ctx
}
