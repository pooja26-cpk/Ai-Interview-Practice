import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { questionsByType, QUESTION_TYPES } from '../data/questions'

const InterviewContext = createContext(null)

const STORAGE_KEY = 'ai-interview-history'
const DEFAULT_CODING_SETUP = {
  difficulty: 'any',
  language: 'any',
  topics: [],
  mode: 'timed',
}

const CODING_TASK_METADATA = {
  'tech-1': { difficulty: 'easy', language: 'javascript', topics: ['javascript', 'async'] },
  'tech-2': { difficulty: 'hard', language: 'any', topics: ['api', 'architecture', 'scalability'] },
  'tech-3': { difficulty: 'medium', language: 'any', topics: ['debugging', 'problem-solving'] },
  'tech-4': { difficulty: 'medium', language: 'any', topics: ['testing', 'quality'] },
  'tech-5': { difficulty: 'hard', language: 'any', topics: ['architecture', 'microservices'] },
}

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
  const [history, setHistory] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [codingSetup, setCodingSetup] = useState(DEFAULT_CODING_SETUP)

  useEffect(() => {
    const initialHistory = loadHistory()
    setHistory(initialHistory)
  }, [])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  function startInterview(type, setupOptions) {
    const nextType = type || QUESTION_TYPES.technical
    const list = questionsByType[nextType] || []
    const resolvedCodingSetup = {
      ...codingSetup,
      ...(setupOptions || {}),
    }

    let selectedQuestions = list
    if (nextType === QUESTION_TYPES.technical) {
      setCodingSetup(resolvedCodingSetup)
      selectedQuestions = list
        .map((question) => ({
          ...question,
          codingMeta: CODING_TASK_METADATA[question.id] || {
            difficulty: 'medium',
            language: 'any',
            topics: [question.category],
          },
        }))
        .filter((question) => {
          const { difficulty, language, topics } = resolvedCodingSetup
          if (difficulty !== 'any' && question.codingMeta.difficulty !== difficulty) {
            return false
          }
          if (
            language !== 'any' &&
            question.codingMeta.language !== 'any' &&
            question.codingMeta.language !== language
          ) {
            return false
          }
          if (topics?.length) {
            return topics.some((topic) => question.codingMeta.topics.includes(topic))
          }
          return true
        })
        .map((question) => {
          if (resolvedCodingSetup.mode === 'untimed') {
            return {
              ...question,
              timeLimit: null,
            }
          }
          return question
        })

      if (!selectedQuestions.length) {
        selectedQuestions = list
      }
    }

    setSelectedType(nextType)
    setQuestions(selectedQuestions)
    setCurrentIndex(0)
    setAnswers(Array(selectedQuestions.length).fill(''))
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
      codingSetup,
      setCodingSetup,
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
      codingSetup,
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
