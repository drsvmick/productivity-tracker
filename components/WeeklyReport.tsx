import React, { useMemo, useRef } from 'react';
import { DailyLog, SCORING_RULES } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Calendar, TrendingUp, Award, Zap, Target, BookOpen, PenTool, HelpCircle, Hash, Layers, Music, Video, Download } from 'lucide-react';
import { BadgesGallery } from './BadgesGallery';
import { getUnlockedBadges } from '../utils/gamification';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface WeeklyReportProps {
  logs: DailyLog[];
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ logs }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(monday);
    endOfWeek.setDate(monday.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filter logs for this week
    const thisWeekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= monday && logDate <= endOfWeek;
    });

    // Daily Breakdown (Mon-Sun)
    // Aggregate multiple entries for the same day if any (though app now enforces one per day)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyScores = days.map((day, index) => {
      // Find logs for this specific day of the week
      const targetDayIndex = index === 6 ? 0 : index + 1;
      
      const dayLogs = thisWeekLogs.filter(l => new Date(l.date).getDay() === targetDayIndex);
      const dayTotalScore = dayLogs.reduce((acc, curr) => acc + curr.totalScore, 0);

      return {
        name: day,
        score: dayTotalScore,
        fullDate: dayLogs.length > 0 ? dayLogs[0].date : null
      };
    });

    // Detailed Stats Aggregation
    const detailedStats = {
      pagesRead: 0,
      pagesWritten: 0,
      questionsSolved: 0,
      topicsCompleted: 0,
      unitsCompleted: 0,
      pianoTime: 0,
      lectureDuration: 0
    };

    // Category Breakdown
    const categoryScores = { Mindset: 0, Study: 0, 'Health & Hobbies': 0 };
    
    thisWeekLogs.forEach(log => {
      // Detailed Stats
      detailedStats.pagesRead += log.pagesRead || 0;
      detailedStats.pagesWritten += log.pagesWritten || 0;
      detailedStats.questionsSolved += log.questionsSolved || 0;
      detailedStats.topicsCompleted += log.topicsCompleted || 0;
      detailedStats.unitsCompleted += log.unitsCompleted || 0;
      detailedStats.pianoTime += log.pianoTime || 0;
      detailedStats.lectureDuration += log.lectureDuration || 0;

      // Category Scores
      SCORING_RULES.forEach(rule => {
        const val = log[rule.id];
        let points = 0;
        if (typeof val === 'boolean' && val) points = rule.multiplier;
        if (typeof val === 'number') points = val * rule.multiplier;
        
        if (categoryScores[rule.category as keyof typeof categoryScores] !== undefined) {
          categoryScores[rule.category as keyof typeof categoryScores] += points;
        }
      });
    });

    const categoryData = Object.entries(categoryScores).map(([name, value]) => ({ name, value }));
    const totalScore = thisWeekLogs.reduce((acc, curr) => acc + curr.totalScore, 0);
    
    // Count unique days tracked
    const uniqueDays = new Set(thisWeekLogs.map(l => new Date(l.date).toDateString()));
    const daysTracked = uniqueDays.size;
    
    const avgScore = daysTracked > 0 ? Math.round(totalScore / daysTracked) : 0;

    return {
      dailyScores,
      categoryData,
      totalScore,
      avgScore,
      daysTracked,
      detailedStats,
      startDate: monday,
      endDate: endOfWeek
    };
  }, [logs]);

  const unlockedBadges = useMemo(() => getUnlockedBadges(logs), [logs]);
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981'];

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      // Temporarily hide the download button for screenshot (optional but cleaner)
      const element = reportRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Productivity_Report_${weeklyData.startDate.toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Could not generate PDF. Please try again.");
    }
  };

  if (weeklyData.daysTracked === 0 && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full mb-4">
          <Calendar className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Data Available</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center mt-2">
          Start tracking your daily activities to see your performance insights here.
        </p>
      </div>
    );
  }

  return (
    <div ref={reportRef} className="space-y-8 animate-in fade-in duration-500 p-4 bg-white dark:bg-gray-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-blue-600 dark:text-blue-400" />
            Weekly Report
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {weeklyData.startDate.toLocaleDateString()} - {weeklyData.endDate.toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Points</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyData.totalScore}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Daily Average</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyData.avgScore}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Days Tracked</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{weeklyData.daysTracked}<span className="text-lg text-gray-400 dark:text-gray-500 font-normal">/7</span></h3>
          </div>
        </div>
      </div>

      {/* Badges Gallery */}
      <BadgesGallery unlockedBadgeIds={unlockedBadges} />

      {/* Detailed Activity Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Layers size={20} className="text-indigo-500" />
            Activity Breakdown
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <BookOpen size={14} /> Pages Read
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.pagesRead}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <PenTool size={14} /> Pages Written
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.pagesWritten}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <HelpCircle size={14} /> Qs Solved
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.questionsSolved}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <Hash size={14} /> Topics
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.topicsCompleted}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <Target size={14} /> Units
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.unitsCompleted}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <Video size={14} /> Lecture Mins
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.lectureDuration}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <Music size={14} /> Piano Mins
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyData.detailedStats.pianoTime}</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Breakdown Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6">Daily Score Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData.dailyScores}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {weeklyData.dailyScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 500 ? '#3b82f6' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6">Points by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weeklyData.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {weeklyData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Target Status */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 text-white flex items-center justify-between shadow-lg">
        <div>
           <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
             <Target className="text-red-400" />
             Weekly Goal Status
           </h3>
           <p className="text-gray-300 text-sm">Target: 3500 points (500/day)</p>
        </div>
        <div className="text-right">
            <span className="text-3xl font-bold">{Math.round((weeklyData.totalScore / 3500) * 100)}%</span>
            <span className="text-sm text-gray-400 block">completed</span>
        </div>
      </div>
    </div>
  );
};