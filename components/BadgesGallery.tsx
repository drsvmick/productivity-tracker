import React from 'react';
import { BADGES } from '../utils/gamification';
import { Lock } from 'lucide-react';

interface BadgesGalleryProps {
  unlockedBadgeIds: string[];
}

export const BadgesGallery: React.FC<BadgesGalleryProps> = ({ unlockedBadgeIds }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
          <span>🏆</span> Achievements
        </h3>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {unlockedBadgeIds.length} / {BADGES.length} Unlocked
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {BADGES.map((badge) => {
          const isUnlocked = unlockedBadgeIds.includes(badge.id);
          
          return (
            <div 
              key={badge.id}
              className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 ${
                isUnlocked 
                  ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md hover:scale-105' 
                  : 'border-transparent bg-gray-50/50 dark:bg-gray-900/50 opacity-60 grayscale'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 ${isUnlocked ? badge.color : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                {isUnlocked ? badge.icon : <Lock size={16} />}
              </div>
              
              <h4 className={`font-semibold text-sm mb-1 ${isUnlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'}`}>
                {badge.name}
              </h4>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {badge.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};