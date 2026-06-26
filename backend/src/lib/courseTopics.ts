export const COURSE_TOPIC_IDS: Record<string, string[]> = {
  math: [
    'sum', 'sub', 'mul', 'div', 'order',
    'simplify', 'frac-sum', 'frac-mul',
    'vars', 'isolate', 'linear',
  ],
  physics: [
    'speed', 'distance', 'time',
    'mass', 'force', 'accel',
    'kinetic', 'potential',
  ],
  code: [
    'tags', 'titles', 'paragraphs', 'images', 'links',
    'colors', 'margins', 'flex',
    'js-vars', 'conds', 'funcs',
  ],
  english: [
    'hello', 'bye', 'howareyou',
    'i-am', 'you-are', 'he-is',
    'en-colors', 'numbers', 'objects',
  ],
};

export const MATH_ALGEBRA_TOPICS = ['vars', 'isolate', 'linear'];

export const ENGLISH_FIRST_THREE_MODULES = [
  'hello', 'bye', 'howareyou',
  'i-am', 'you-are', 'he-is',
  'en-colors', 'numbers', 'objects',
];

export function getCourseProgressPct(
  courseId: string,
  topics: Record<string, { completed?: boolean }>,
): number {
  const ids = COURSE_TOPIC_IDS[courseId];
  if (!ids?.length) return 0;
  const done = ids.filter((id) => topics[id]?.completed).length;
  return Math.round((done / ids.length) * 100);
}

export function countCompletedTopics(topics: Record<string, { completed?: boolean }>): number {
  return Object.values(topics).filter((topic) => topic.completed).length;
}
