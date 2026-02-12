import React, { useState, useEffect, useMemo } from 'react';
import { DailyLog, SCORING_RULES } from './types';
import { InputCard } from './components/InputCard';
import { HistoryView } from './components/HistoryView';
import { AIInsight } from './components/AIInsight';
import { WeeklyReport } from './components/WeeklyReport';
import { ScoreCard } from './components/ScoreCard';
import { calculateTotalScore } from './utils/scoring';
import { initGapiClient, initGisClient, handleAuthClick, findConfigFile, downloadConfigFile, saveToDrive } from './utils/drive';
import { calculateStreak, getUnlockedBadges } from './utils/gamification';
import { 
  BarChart3, 
  BookOpen, 
  Brain, 
  Dumbbell, 
  LayoutDashboard, 
  PlusCircle, 
  Save, 
  Trophy,
  PieChart,
  Sun,
  Moon,
  Calendar,
  Cloud,
  Check,
  RefreshCw,
  AlertCircle,
  Flame
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Initial state for a new log
const INITIAL_LOG_STATE: Partial<DailyLog> = {
  affirmations: false,
  diaryEntry: false,
  questionsSolved: 0,
  pagesRead: 0,
  pagesWritten: 0,
  mockTest: false,
  topicsCompleted: 0,
  unitsCompleted: 0,
  lectureDuration: 0,
  postDinnerWalk: false,
  workout: false,
  pianoTime: 0,
};

// Robust ID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

function App() {
  const [activeTab, setActiveTab] = useState<'track' | 'history' | 'report'>('track');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentLog, setCurrentLog] = useState<Partial<DailyLog>>(INITIAL_LOG_STATE);
  const [currentScore, setCurrentScore] = useState(0);
  
  // Date selection state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Drive Sync State
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [gapiLoaded, setGapiLoaded] = useState(false);

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Initialize Google Scripts
  useEffect(() => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn("GOOGLE_CLIENT_ID not found in environment variables. Drive sync will be disabled.");
      return;
    }

    const script1 = document.createElement('script');
    script1.src = "https://apis.google.com/js/api.js";
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
       initGapiClient().then(() => setGapiLoaded(true)).catch(console.error);
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://accounts.google.com/gsi/client";
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
        // We init GIS but wait for user interaction to auth
        initGisClient((tokenResponse) => {
           if (tokenResponse && tokenResponse.access_token) {
               setIsDriveConnected(true);
               performInitialSync();
           }
        });
    };
    document.body.appendChild(script2);
  }, []);

  const performInitialSync = async () => {
    setSyncStatus('syncing');
    try {
        const file = await findConfigFile();
        if (file) {
            setDriveFileId(file.id);
            // If file exists on drive, we prefer cloud data (Cloud is source of truth for sync)
            const cloudLogs = await downloadConfigFile(file.id);
            // Ensure data integrity
             const validatedLogs = cloudLogs.map((log: any) => ({
                ...log,
                id: log.id || generateId()
            }));
            setLogs(validatedLogs);
            localStorage.setItem('productivity_logs', JSON.stringify(validatedLogs));
            setSyncStatus('synced');
            // Refresh current form if needed
            if (new Date(validatedLogs[0]?.date).toDateString() === new Date(selectedDate).toDateString()) {
               // Logic handled by existing selectedDate useEffect
            }
        } else {
            // If no file on drive, upload local data
            const newFileId = await saveToDrive(logs, null);
            setDriveFileId(newFileId);
            setSyncStatus('synced');
        }
    } catch (error) {
        console.error("Sync failed", error);
        setSyncStatus('error');
    }
  };

  const handleDriveConnect = () => {
    if (!gapiLoaded) return;
    handleAuthClick();
  };

  // Load from local storage on mount (always load local first for speed)
  useEffect(() => {
    const savedLogs = localStorage.getItem('productivity_logs');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        const validatedLogs = parsedLogs.map((log: any) => ({
          ...log,
          id: log.id || generateId()
        }));
        setLogs(validatedLogs);
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
  }, []);

  // Sync currentLog with selectedDate
  useEffect(() => {
    const existingLog = logs.find(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === selectedDate;
    });

    if (existingLog) {
      setCurrentLog({ ...existingLog });
    } else {
      setCurrentLog(INITIAL_LOG_STATE);
    }
  }, [selectedDate, logs]);

  // Recalculate score
  useEffect(() => {
    setCurrentScore(calculateTotalScore(currentLog));
  }, [currentLog]);

  const handleInputChange = (id: string, value: boolean | number) => {
    setCurrentLog((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const existingLogIndex = logs.findIndex(log => 
      new Date(log.date).toISOString().split('T')[0] === selectedDate
    );

    let updatedLogs: DailyLog[];
    let message = '';

    if (existingLogIndex >= 0) {
      const updatedLog: DailyLog = {
        ...logs[existingLogIndex],
        ...currentLog as DailyLog,
        date: dateObj.toISOString(),
        totalScore: currentScore
      };
      updatedLogs = [...logs];
      updatedLogs[existingLogIndex] = updatedLog;
      message = `Log for ${dateObj.toLocaleDateString()} updated!`;
    } else {
      const newEntry: DailyLog = {
        ...currentLog as DailyLog,
        id: generateId(),
        date: dateObj.toISOString(),
        totalScore: currentScore,
      };
      updatedLogs = [newEntry, ...logs];
      message = `New entry for ${dateObj.toLocaleDateString()} saved!`;
    }

    // 1. Update State
    setLogs(updatedLogs);
    
    // 2. Update Local Storage
    localStorage.setItem('productivity_logs', JSON.stringify(updatedLogs));
    
    // 3. Update Drive
    if (isDriveConnected) {
        setSyncStatus('syncing');
        try {
            await saveToDrive(updatedLogs, driveFileId);
            setSyncStatus('synced');
        } catch (e) {
            console.error(e);
            setSyncStatus('error');
            message += " (Warning: Drive Sync Failed)";
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(message);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this record?')) {
      const updatedLogs = logs.filter(l => l.id !== id);
      setLogs(updatedLogs);
      localStorage.setItem('productivity_logs', JSON.stringify(updatedLogs));
      
      if (isDriveConnected) {
          setSyncStatus('syncing');
          try {
              await saveToDrive(updatedLogs, driveFileId);
              setSyncStatus('synced');
          } catch (e) {
              setSyncStatus('error');
          }
      }
    }
  };

  const handleInsightGenerated = (insight: string) => {
    setCurrentLog(prev => ({ ...prev, aiFeedback: insight }));
  };

  const groupedRules = useMemo(() => {
    return {
      Mindset: SCORING_RULES.filter(r => r.category === 'Mindset'),
      Study: SCORING_RULES.filter(r => r.category === 'Study'),
      'Health & Hobbies': SCORING_RULES.filter(r => r.category === 'Health & Hobbies'),
    };
  }, []);

  const chartData = useMemo(() => {
    return logs
      .slice(0, 7)
      .reverse()
      .map(log => ({
        name: new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' }),
        score: log.totalScore
      }));
  }, [logs]);

  // Gamification stats
  const currentStreak = useMemo(() => calculateStreak(logs), [logs]);
  const unlockedBadges = useMemo(() => getUnlockedBadges(logs), [logs]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen pb-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Trophy className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">PointTracker</h1>
            
            {/* Streak Display Mobile */}
            <div className="flex items-center gap-1 sm:hidden ml-2 px-2 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-full border border-orange-100 dark:border-orange-800">
                <Flame size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{currentStreak}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Streak Display Desktop */}
            <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-full border border-orange-100 dark:border-orange-800 shadow-sm">
                <Flame size={16} className="text-orange-500 fill-orange-500" />
                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{currentStreak} Day Streak</span>
            </div>

            {/* Sync Button */}
            {process.env.GOOGLE_CLIENT_ID && (
                <button
                onClick={isDriveConnected ? performInitialSync : handleDriveConnect}
                disabled={!gapiLoaded || syncStatus === 'syncing'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isDriveConnected 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={isDriveConnected ? "Synced with Drive" : "Connect Google Drive"}
                >
                {syncStatus === 'syncing' ? (
                    <RefreshCw size={16} className="animate-spin" />
                ) : syncStatus === 'error' ? (
                    <AlertCircle size={16} className="text-red-500" />
                ) : isDriveConnected ? (
                    <Check size={16} />
                ) : (
                    <Cloud size={16} />
                )}
                <span className="hidden sm:inline">
                    {syncStatus === 'syncing' ? 'Syncing...' : isDriveConnected ? 'Synced' : 'Connect Drive'}
                </span>
                </button>
            )}

            <nav className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto">
              <button
                onClick={() => setActiveTab('track')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'track' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <PlusCircle size={16} />
                <span className="hidden sm:inline">Track</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'history' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'report' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <PieChart size={16} />
                <span className="hidden sm:inline">Report</span>
              </button>
            </nav>
            
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {activeTab === 'track' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Inputs */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Date Selection & Mode Banner */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tracking Date</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Select a date to view or edit entries</p>
                  </div>
                </div>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-auto p-2.5 dark:[color-scheme:dark]"
                />
              </div>

              {!isToday && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
                  <div className="p-1 bg-amber-100 dark:bg-amber-800 rounded-full mt-0.5">
                    <PlusCircle size={16} className="text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <strong>Editing Past Entry:</strong> You are currently editing stats for <strong>{new Date(selectedDate).toLocaleDateString()}</strong>. 
                    Changes saved here will overwrite the existing entry for this date.
                  </div>
                </div>
              )}

              {/* Category: Mindset */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <Brain className="text-purple-500 dark:text-purple-400" />
                  <h2 className="text-lg font-bold">Mindset & Reflection</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {groupedRules.Mindset.map(rule => (
                    <InputCard 
                      key={rule.id} 
                      rule={rule} 
                      value={currentLog[rule.id] as any} 
                      onChange={(val) => handleInputChange(rule.id, val)} 
                    />
                  ))}
                </div>
              </section>

              {/* Category: Study */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <BookOpen className="text-blue-500 dark:text-blue-400" />
                  <h2 className="text-lg font-bold">Study & Knowledge</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {groupedRules.Study.map(rule => (
                    <InputCard 
                      key={rule.id} 
                      rule={rule} 
                      value={currentLog[rule.id] as any} 
                      onChange={(val) => handleInputChange(rule.id, val)} 
                    />
                  ))}
                </div>
              </section>

              {/* Category: Health */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200">
                  <Dumbbell className="text-green-500 dark:text-green-400" />
                  <h2 className="text-lg font-bold">Health & Hobbies</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {groupedRules['Health & Hobbies'].map(rule => (
                    <InputCard 
                      key={rule.id} 
                      rule={rule} 
                      value={currentLog[rule.id] as any} 
                      onChange={(val) => handleInputChange(rule.id, val)} 
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Score & AI */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                
                {/* Total Score Card */}
                <ScoreCard score={currentScore} target={500} />

                {/* AI Insight */}
                <AIInsight 
                  currentLog={{ ...currentLog, totalScore: currentScore }} 
                  onInsightGenerated={handleInsightGenerated} 
                />

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  className="w-full bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {logs.some(l => new Date(l.date).toISOString().split('T')[0] === selectedDate) 
                    ? 'Update Entry' 
                    : 'Save New Entry'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Stats */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <BarChart3 className="text-gray-400" size={20} />
                  Performance Trend (Last 7 Days)
                </h3>
                <div className="h-64 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.score > 500 ? '#3b82f6' : '#93c5fd'} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      Not enough data yet
                    </div>
                  )}
                </div>
              </div>

               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white flex flex-col justify-center">
                  <h3 className="text-blue-100 font-medium mb-1">All Time Average</h3>
                  <div className="text-4xl font-bold mb-4">
                    {logs.length > 0 ? Math.round(logs.reduce((acc, curr) => acc + curr.totalScore, 0) / logs.length) : 0}
                  </div>
                  <div className="text-sm text-blue-200">
                     Based on {logs.length} tracked days.
                  </div>
               </div>
            </div>

            <HistoryView logs={logs} onDelete={handleDelete} />
          </div>
        )}

        {activeTab === 'report' && (
          <WeeklyReport logs={logs} />
        )}
      </main>
    </div>
  );
}

export default App;