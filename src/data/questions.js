export const QUESTION_TYPES = {
  hr: 'hr',
  technical: 'technical',
  behavioral: 'behavioral',
  coding: 'coding',
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
  coding: [
    {
      id: 'coding-1',
      text: 'Two Sum',
      difficulty: 'easy',
      topicTags: ['array', 'hashmap'],
      prompt:
        'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume each input has exactly one valid solution, and you may not use the same element twice. You may return the answer in any order.',
      examples: [
        {
          input: 'nums = [2, 7, 11, 15], target = 9',
          output: '[0, 1]',
          explanation: 'nums[0] + nums[1] = 9, so the function returns [0, 1].',
        },
        {
          input: 'nums = [3, 2, 4], target = 6',
          output: '[1, 2]',
          explanation: 'The pair 2 and 4 adds up to 6.',
        },
      ],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Exactly one valid answer exists for each input.',
      ],
      starterCode: {
        javascript: `function twoSum(nums, target) {
  // Return the indices of the two values that sum to target
}`,
        python: `def two_sum(nums, target):
    # Return the indices of the two values that sum to target
    pass`,
      },
      testCases: {
        public: [
          {
            name: 'basic pair',
            input: { nums: [2, 7, 11, 15], target: 9 },
            expectedOutput: [0, 1],
          },
          {
            name: 'duplicate values',
            input: { nums: [3, 3], target: 6 },
            expectedOutput: [0, 1],
          },
        ],
        hidden: {
          count: 4,
          focus: ['negative numbers', 'late-match indices', 'large arrays'],
          notes: 'Hidden cases verify linear-time style solutions and ensure the same index is not reused.',
        },
      },
    },
    {
      id: 'coding-2',
      text: 'Longest Substring Without Repeating Characters',
      difficulty: 'medium',
      topicTags: ['string', 'sliding-window', 'hashmap'],
      prompt:
        'Given a string s, return the length of the longest substring that contains no repeated characters. A substring is a contiguous sequence of characters within the string.',
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The longest substring without repeats is "abc".',
        },
        {
          input: 's = "pwwkew"',
          output: '3',
          explanation: 'One valid answer is "wke", which has length 3.',
        },
      ],
      constraints: [
        '0 <= s.length <= 5 * 10^4',
        's consists of English letters, digits, symbols, and spaces.',
      ],
      starterCode: {
        javascript: `function lengthOfLongestSubstring(s) {
  // Return the maximum length of a substring with unique characters
}`,
        python: `def length_of_longest_substring(s: str) -> int:
    # Return the maximum length of a substring with unique characters
    pass`,
      },
      testCases: {
        public: [
          {
            name: 'repeating pattern',
            input: { s: 'abcabcbb' },
            expectedOutput: 3,
          },
          {
            name: 'single repeated character',
            input: { s: 'bbbbb' },
            expectedOutput: 1,
          },
        ],
        hidden: {
          count: 5,
          focus: ['empty input', 'spaces', 'unicode-safe handling', 'performance'],
          notes: 'Hidden cases are designed to expose quadratic solutions on long strings.',
        },
      },
    },
    {
      id: 'coding-3',
      text: 'Merge Intervals',
      difficulty: 'medium',
      topicTags: ['array', 'sorting'],
      prompt:
        'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals and return an array of the non-overlapping intervals that cover the same ranges.',
      examples: [
        {
          input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
          output: '[[1,6],[8,10],[15,18]]',
          explanation: 'Intervals [1,3] and [2,6] overlap, so they are merged into [1,6].',
        },
        {
          input: 'intervals = [[1,4],[4,5]]',
          output: '[[1,5]]',
          explanation: 'Touching intervals are considered overlapping here.',
        },
      ],
      constraints: [
        '1 <= intervals.length <= 10^4',
        'intervals[i].length == 2',
        '0 <= starti <= endi <= 10^4',
      ],
      starterCode: {
        javascript: `function merge(intervals) {
  // Return the merged intervals
}`,
        python: `def merge(intervals):
    # Return the merged intervals
    pass`,
      },
      testCases: {
        public: [
          {
            name: 'overlapping intervals',
            input: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
            expectedOutput: [[1, 6], [8, 10], [15, 18]],
          },
        ],
        hidden: {
          count: 4,
          focus: ['already sorted input', 'unsorted input', 'contained intervals'],
          notes: 'Hidden cases validate sort-then-scan behavior and edge handling for touching boundaries.',
        },
      },
    },
    {
      id: 'coding-4',
      text: 'Merge k Sorted Lists',
      difficulty: 'hard',
      topicTags: ['linked-list', 'heap', 'divide-and-conquer'],
      prompt:
        'You are given an array of k linked lists, each sorted in ascending order. Merge all the lists into one sorted linked list and return its head.',
      examples: [
        {
          input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
          output: '[1,1,2,3,4,4,5,6]',
          explanation: 'Merging the three sorted lists yields one sorted sequence.',
        },
        {
          input: 'lists = []',
          output: '[]',
          explanation: 'An empty collection of lists returns an empty result.',
        },
      ],
      constraints: [
        'k == lists.length',
        '0 <= k <= 10^4',
        '0 <= lists[i].length <= 500',
        '-10^4 <= lists[i][j] <= 10^4',
        'The total number of nodes across all lists will not exceed 10^4.',
      ],
      starterCode: {
        javascript: `function mergeKLists(lists) {
  // Return the head of the merged sorted linked list
}`,
        python: `def merge_k_lists(lists):
    # Return the head of the merged sorted linked list
    pass`,
      },
      testCases: {
        public: [
          {
            name: 'three non-empty lists',
            input: { lists: [[1, 4, 5], [1, 3, 4], [2, 6]] },
            expectedOutput: [1, 1, 2, 3, 4, 4, 5, 6],
          },
          {
            name: 'empty collection',
            input: { lists: [] },
            expectedOutput: [],
          },
        ],
        hidden: {
          count: 6,
          focus: ['many single-node lists', 'empty inner lists', 'heap efficiency'],
          notes: 'Hidden cases are structured to reward O(N log k) approaches over repeated full scans.',
        },
      },
    },
  ],
}
