import { QUESTION_TYPES } from '../data/questions'

export const DEFAULT_CODING_SETUP = {
  difficulty: 'all',
  language: 'javascript',
  topicTags: [],
  mode: 'timed',
}

const CODING_TIME_LIMITS = {
  easy: 15 * 60,
  medium: 25 * 60,
  hard: 35 * 60,
}

export function matchesCodingOptions(question, options) {
  const matchesDifficulty =
    options.difficulty === 'all' || question.difficulty === options.difficulty
  const matchesLanguage = Boolean(question.starterCode?.[options.language])
  const matchesTags =
    !options.topicTags.length ||
    options.topicTags.some((tag) => question.topicTags?.includes(tag))

  return matchesDifficulty && matchesLanguage && matchesTags
}

export function prepareQuestionsForSession(type, list, options) {
  if (type !== QUESTION_TYPES.coding) {
    return list
  }

  return list
    .filter((question) => matchesCodingOptions(question, options))
    .map((question) => ({
      ...question,
      selectedLanguage: options.language,
      timeLimit:
        options.mode === 'timed'
          ? question.timeLimit || CODING_TIME_LIMITS[question.difficulty] || 20 * 60
          : null,
    }))
}
