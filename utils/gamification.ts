import { DailyLog } from '../types';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (logs: DailyLog[]) => boolean;
}

export const calculateStreak = (logs: DailyLog[], target: number = 500): number => {
  if (logs.length === 0) return 0;

  // Group by date (YYYY-MM-DD)
  const dailyScores: Record<string, number> = {};
  logs.forEach(log => {
    const date = new Date(log.date).toISOString().split('T')[0];
    dailyScores[date] = (dailyScores[date] || 0) + log.totalScore;
  });

  // Get list of dates where target was met
  const winningDates = new Set(
    Object.entries(dailyScores)
      .filter(([_, score]) => score >= target)
      .map(([date]) => date)
  );

  let streak = 0;
  const today = new Date();
  let pointer = new Date(today);
  pointer.setHours(0, 0, 0, 0);

  // Check today
  const todayStr = pointer.toISOString().split('T')[0];
  
  // If today is not a win, check if we should start from yesterday
  // (i.e., streak is kept alive if yesterday was a win, even if today isn't done yet)
  if (!winningDates.has(todayStr)) {
    pointer.setDate(pointer.getDate() - 1);
    const yesterdayStr = pointer.toISOString().split('T')[0];
    if (!winningDates.has(yesterdayStr)) {
      return 0;
    }
  }

  // Count backwards
  while (true) {
    const dateStr = pointer.toISOString().split('T')[0];
    if (winningDates.has(dateStr)) {
      streak++;
      pointer.setDate(pointer.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Log your first entry',
    icon: '🚀',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    condition: (logs) => logs.length > 0
  },
  {
    id: 'high_flyer',
    name: 'High Flyer',
    description: 'Score over 800 points in a single day',
    icon: '🦅',
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    condition: (logs) => logs.some(l => l.totalScore >= 800)
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Score 1000 points in a single day',
    icon: '💯',
    color: 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
    condition: (logs) => logs.some(l => l.totalScore >= 1000)
  },
  {
    id: 'hat_trick',
    name: 'Hat Trick',
    description: 'Achieve a 3-day streak',
    icon: '🔥',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    condition: (logs) => calculateStreak(logs) >= 3
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Achieve a 7-day streak',
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    condition: (logs) => calculateStreak(logs) >= 7
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Achieve a 30-day streak',
    icon: '👑',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    condition: (logs) => calculateStreak(logs) >= 30
  },
  {
    id: 'club_10k',
    name: '10k Club',
    description: 'Earn 10,000 total lifetime points',
    icon: '💎',
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    condition: (logs) => logs.reduce((acc, l) => acc + l.totalScore, 0) >= 10000
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Read over 100 pages total',
    icon: '📚',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.pagesRead || 0), 0) >= 100
  },
  {
    id: 'author',
    name: 'Author',
    description: 'Write over 50 pages total',
    icon: '✍️',
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.pagesWritten || 0), 0) >= 50
  },
  {
    id: 'lecture_fanatic',
    name: 'Lecture Fanatic',
    description: 'Watch over 1000 minutes of lectures',
    icon: '🎧',
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.lectureDuration || 0), 0) >= 1000
  },
  {
    id: 'problem_solver',
    name: 'Problem Solver',
    description: 'Solve over 200 questions total',
    icon: '🧩',
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.questionsSolved || 0), 0) >= 200
  },
  {
    id: 'topic_master',
    name: 'Topic Master',
    description: 'Complete 20 study topics',
    icon: '🎓',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.topicsCompleted || 0), 0) >= 20
  },
  {
    id: 'unit_conqueror',
    name: 'Unit Conqueror',
    description: 'Complete 5 full units',
    icon: '🏰',
    color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.unitsCompleted || 0), 0) >= 5
  },
  {
    id: 'maestro',
    name: 'Maestro',
    description: 'Play piano for over 300 minutes',
    icon: '🎹',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    condition: (logs) => logs.reduce((acc, l) => acc + (l.pianoTime || 0), 0) >= 300
  },
  {
    id: 'exam_ready',
    name: 'Exam Ready',
    description: 'Complete 3 mock tests',
    icon: '📝',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    condition: (logs) => logs.filter(l => l.mockTest).length >= 3
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Complete 10 workouts',
    icon: '💪',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    condition: (logs) => logs.filter(l => l.workout).length >= 10
  },
  {
    id: 'evening_stroller',
    name: 'Evening Stroller',
    description: 'Go for 14 post-dinner walks',
    icon: '🌙',
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    condition: (logs) => logs.filter(l => l.postDinnerWalk).length >= 14
  },
  {
    id: 'mindful_monk',
    name: 'Mindful Monk',
    description: 'Practice affirmations 10 times',
    icon: '🧘',
    color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    condition: (logs) => logs.filter(l => l.affirmations).length >= 10
  },
  {
    id: 'diarist',
    name: 'Diarist',
    description: 'Write 10 diary entries',
    icon: '📔',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    condition: (logs) => logs.filter(l => l.diaryEntry).length >= 10
  }
];

export const getUnlockedBadges = (logs: DailyLog[]): string[] => {
  return BADGES.filter(badge => badge.condition(logs)).map(b => b.id);
};