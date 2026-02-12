import React from 'react';
import { ScoringRule } from '../types';
import { CheckCircle2, Circle, Minus, Plus } from 'lucide-react';

interface InputCardProps {
  rule: ScoringRule;
  value: boolean | number;
  onChange: (value: boolean | number) => void;
}

export const InputCard: React.FC<InputCardProps> = ({ rule, value, onChange }) => {
  const handleIncrement = () => {
    if (typeof value === 'number') {
      onChange(value + 1);
    } else {
      onChange(1); // Should not happen for boolean, but safe fallback
    }
  };

  const handleDecrement = () => {
    if (typeof value === 'number') {
      onChange(Math.max(0, value - 1));
    } else {
      onChange(0);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col">
        <span className="font-medium text-gray-800 dark:text-gray-200">{rule.label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {rule.type === 'boolean' 
            ? `Award: ${rule.multiplier} pts` 
            : `Multiplier: x${rule.multiplier}`}
        </span>
      </div>

      <div className="flex items-center">
        {rule.type === 'boolean' ? (
          <button
            onClick={() => onChange(!value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              value 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {value ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            <span className="font-medium">{value ? 'Yes' : 'No'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all active:scale-95"
              type="button"
              aria-label="Decrease"
            >
              <Minus size={18} />
            </button>
            
            <input
              type="number"
              min="0"
              value={value as number}
              onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="py-2 w-20 text-center bg-slate-800 dark:bg-slate-950 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none border border-transparent dark:border-gray-700"
              placeholder="0"
            />
            
            <button
              onClick={handleIncrement}
              className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all active:scale-95"
              type="button"
              aria-label="Increase"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};