import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { DailyLog, SCORING_RULES } from '../types';
import { Sparkles, Loader2, Bot } from 'lucide-react';

interface AIInsightProps {
  currentLog: Partial<DailyLog>;
  onInsightGenerated: (insight: string) => void;
}

export const AIInsight: React.FC<AIInsightProps> = ({ currentLog, onInsightGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);

  const generateInsight = async () => {
    if (!process.env.API_KEY) {
      setError("API Key not configured.");
      return;
    }

    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Construct a detailed prompt
      const rulesDescription = SCORING_RULES.map(r => `${r.label}: ${r.multiplier} pts (${r.type})`).join(', ');
      const userPerformance = SCORING_RULES.map(r => `${r.label}: ${currentLog[r.id]}`).join(', ');
      const totalScore = currentLog.totalScore;

      const prompt = `
        You are an elite productivity coach. Analyze the user's daily performance based on these scoring rules: 
        [${rulesDescription}].
        
        The user's performance today:
        ${userPerformance}
        
        Total Score: ${totalScore}.

        Provide a short, punchy, and motivating analysis (max 3 sentences). 
        1. Acknowledge the strongest area.
        2. Gently point out a missed opportunity if any.
        3. End with a high-energy encouragement.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text || "Keep pushing! You're doing great.";
      setInsight(text);
      onInsightGenerated(text);
    } catch (err) {
      console.error(err);
      setError("Failed to generate insight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Bot size={24} className="text-white" />
          </div>
          <h3 className="font-bold text-lg">AI Performance Coach</h3>
        </div>

        {insight ? (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
            <p className="leading-relaxed text-indigo-50 italic">"{insight}"</p>
          </div>
        ) : (
          <p className="text-indigo-100 mb-4 text-sm opacity-90">
            Get personalized feedback on your daily stats powered by Gemini.
          </p>
        )}

        {!insight && (
          <button
            onClick={generateInsight}
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-indigo-600 py-2.5 px-4 rounded-lg font-semibold hover:bg-indigo-50 transition-all disabled:opacity-70 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze My Day
              </>
            )}
          </button>
        )}
        
        {error && <p className="text-red-200 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};