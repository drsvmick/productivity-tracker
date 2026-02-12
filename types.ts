export interface DailyLog {
  id: string;
  date: string;
  // Mindset
  affirmations: boolean;
  diaryEntry: boolean;
  
  // Study
  questionsSolved: number;
  pagesRead: number;
  pagesWritten: number;
  mockTest: boolean;
  topicsCompleted: number;
  unitsCompleted: number;
  lectureDuration: number;

  // Health & Hobbies
  postDinnerWalk: boolean;
  workout: boolean;
  pianoTime: number; // minutes or units

  // Computed
  totalScore: number;
  aiFeedback?: string;
}

export interface ScoringRule {
  id: keyof Omit<DailyLog, 'id' | 'date' | 'totalScore' | 'aiFeedback'>;
  label: string;
  type: 'boolean' | 'number';
  multiplier: number;
  category: 'Mindset' | 'Study' | 'Health & Hobbies';
  description?: string;
}

export const SCORING_RULES: ScoringRule[] = [
  { id: 'affirmations', label: 'Affirmations', type: 'boolean', multiplier: 10, category: 'Mindset' },
  { id: 'diaryEntry', label: 'Diary Entry', type: 'boolean', multiplier: 10, category: 'Mindset' },
  
  { id: 'lectureDuration', label: 'Lecture Duration (mins)', type: 'number', multiplier: 1, category: 'Study', description: '1 point per minute' },
  { id: 'questionsSolved', label: 'Questions Solved', type: 'number', multiplier: 1, category: 'Study' },
  { id: 'pagesRead', label: 'Pages Read', type: 'number', multiplier: 5, category: 'Study' },
  { id: 'pagesWritten', label: 'Pages Written', type: 'number', multiplier: 10, category: 'Study' },
  { id: 'mockTest', label: 'Mock Test', type: 'boolean', multiplier: 50, category: 'Study' },
  { id: 'topicsCompleted', label: 'Topics Completed', type: 'number', multiplier: 10, category: 'Study' },
  { id: 'unitsCompleted', label: 'Units Completed', type: 'number', multiplier: 100, category: 'Study' },

  { id: 'postDinnerWalk', label: 'Post Dinner Walk', type: 'boolean', multiplier: 10, category: 'Health & Hobbies' },
  { id: 'workout', label: 'Workout', type: 'boolean', multiplier: 30, category: 'Health & Hobbies' },
  { id: 'pianoTime', label: 'Piano Time', type: 'number', multiplier: 2, category: 'Health & Hobbies', description: 'Points = Input * 2' },
];