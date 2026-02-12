import React, { useEffect, useState, useRef } from 'react';

interface ScoreCardProps {
  score: number;
  target?: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, target = 500 }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(score);

  useEffect(() => {
    startValueRef.current = displayScore;
    startTimeRef.current = null;
    
    const animate = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const progress = time - startTimeRef.current;
      const duration = 600; // ms

      if (progress < duration) {
        const t = progress / duration;
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        const val = startValueRef.current + (score - startValueRef.current) * ease;
        setDisplayScore(Math.round(val));
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayScore(score);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [score]);

  // Determine color based on progress
  const percentage = Math.min((score / target) * 100, 100);
  
  let colorClass = "bg-red-500";
  let textClass = "text-red-600 dark:text-red-400";
  let ringClass = "ring-red-100 dark:ring-red-900/30";
  
  if (percentage >= 100) {
    colorClass = "bg-blue-600";
    textClass = "text-blue-600 dark:text-blue-400";
    ringClass = "ring-blue-100 dark:ring-blue-900/30";
  } else if (percentage >= 80) {
    colorClass = "bg-emerald-500";
    textClass = "text-emerald-600 dark:text-emerald-400";
    ringClass = "ring-emerald-100 dark:ring-emerald-900/30";
  } else if (percentage >= 50) {
    colorClass = "bg-yellow-500";
    textClass = "text-yellow-600 dark:text-yellow-400";
    ringClass = "ring-yellow-100 dark:ring-yellow-900/30";
  } else if (percentage >= 25) {
    colorClass = "bg-orange-500";
    textClass = "text-orange-600 dark:text-orange-400";
    ringClass = "ring-orange-100 dark:ring-orange-900/30";
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 text-center transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ring-4 ${ringClass}`}>
      <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide text-xs">Total Points</h3>
      <div className={`text-6xl font-black mb-3 tabular-nums transition-colors duration-500 ${textClass}`}>
        {displayScore}
      </div>
      <div className="relative h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }} 
        />
        {/* Shine effect */}
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      <div className="flex justify-between items-center mt-3 text-xs font-medium text-gray-400 dark:text-gray-500">
        <span>0</span>
        <span>Target: {target}</span>
      </div>
    </div>
  );
};