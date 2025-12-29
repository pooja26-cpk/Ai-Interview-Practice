export const QUESTION_TYPES = {
  hr: 'hr',
  technical: 'technical',
  behavioral: 'behavioral',
}

export const questionsByType = {
  hr: [
    {
      id: 'hr-1',
      text: 'Tell me about yourself.',
      category: 'introduction',
      keywords: ['background', 'experience', 'strengths', 'role'],
      timeLimit: 90,
    },
    {
      id: 'hr-2',
      text: 'Why are you interested in this role and our company?',
      category: 'motivation',
      keywords: ['company', 'role', 'values', 'mission'],
      timeLimit: 90,
    },
    {
      id: 'hr-3',
      text: 'What are your greatest strengths and weaknesses?',
      category: 'self-awareness',
      keywords: ['strength', 'weakness', 'improve', 'develop'],
      timeLimit: 90,
    },
    {
      id: 'hr-4',
      text: 'Where do you see yourself in three years?',
      category: 'growth',
      keywords: ['growth', 'career', 'development', 'goals'],
      timeLimit: 90,
    },
    {
      id: 'hr-5',
      text: 'What does an ideal work environment look like for you?',
      category: 'culture',
      keywords: ['culture', 'team', 'collaboration', 'environment'],
      timeLimit: 90,
    },
  ],
  technical: [
    {
      id: 'tech-1',
      text: 'Explain the difference between synchronous and asynchronous programming in JavaScript.',
      category: 'javascript',
      keywords: ['synchronous', 'asynchronous', 'event loop', 'callbacks', 'promises'],
      timeLimit: 120,
    },
    {
      id: 'tech-2',
      text: 'How would you design a scalable API for a large application?',
      category: 'architecture',
      keywords: ['scalable', 'api', 'rest', 'design', 'performance'],
      timeLimit: 150,
    },
    {
      id: 'tech-3',
      text: 'Describe a challenging technical problem you solved recently.',
      category: 'problem-solving',
      keywords: ['challenge', 'problem', 'solution', 'impact'],
      timeLimit: 150,
    },
    {
      id: 'tech-4',
      text: 'How do you ensure the quality and reliability of your code?',
      category: 'quality',
      keywords: ['testing', 'review', 'linting', 'monitoring'],
      timeLimit: 120,
    },
    {
      id: 'tech-5',
      text: 'What are some trade-offs between monolithic and microservices architectures?',
      category: 'architecture',
      keywords: ['monolith', 'microservices', 'trade-offs', 'scalability'],
      timeLimit: 150,
    },
  ],
  behavioral: [
    {
      id: 'beh-1',
      text: 'Tell me about a time you had a conflict at work and how you resolved it.',
      category: 'conflict',
      keywords: ['situation', 'task', 'action', 'result'],
      timeLimit: 150,
    },
    {
      id: 'beh-2',
      text: 'Describe a situation where you had to work under pressure with tight deadlines.',
      category: 'pressure',
      keywords: ['deadline', 'prioritization', 'communication', 'results'],
      timeLimit: 150,
    },
    {
      id: 'beh-3',
      text: 'Give an example of a time you showed leadership, even without a formal title.',
      category: 'leadership',
      keywords: ['initiative', 'ownership', 'influence', 'outcome'],
      timeLimit: 150,
    },
    {
      id: 'beh-4',
      text: 'Tell me about a time you made a mistake and what you learned from it.',
      category: 'learning',
      keywords: ['mistake', 'learning', 'improve', 'reflection'],
      timeLimit: 150,
    },
    {
      id: 'beh-5',
      text: 'Describe a time when you had to quickly learn a new skill to complete a project.',
      category: 'adaptability',
      keywords: ['learning', 'adapt', 'skill', 'project'],
      timeLimit: 150,
    },
  ],
}

