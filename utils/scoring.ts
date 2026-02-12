import { DailyLog, SCORING_RULES } from '../types';

export const calculateTotalScore = (log: Partial<DailyLog>): number => {
  let score = 0;
  SCORING_RULES.forEach((rule) => {
    const value = log[rule.id];
    if (rule.type === 'boolean') {
      if (value === true) {
        score += rule.multiplier;
      }
    } else if (rule.type === 'number') {
      if (typeof value === 'number') {
        score += value * rule.multiplier;
      }
    }
  });
  return score;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const generateCSV = (logs: DailyLog[]): string => {
  if (logs.length === 0) return '';

  const headers = [
    'Date',
    'Total Score',
    ...SCORING_RULES.map(r => `${r.label} (${r.multiplier} pts)`),
    'AI Feedback'
  ];

  const rows = logs.map(log => {
    return [
      log.date,
      log.totalScore,
      ...SCORING_RULES.map(rule => {
        const val = log[rule.id];
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val;
      }),
      `"${(log.aiFeedback || '').replace(/"/g, '""')}"` // Escape quotes
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};