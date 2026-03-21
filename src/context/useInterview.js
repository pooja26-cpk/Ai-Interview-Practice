import { useContext } from 'react'
import InterviewContext from './interviewContextObject'

export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) {
    throw new Error('useInterview must be used within InterviewProvider')
  }
  return ctx
}
