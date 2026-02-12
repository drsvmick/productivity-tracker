import React from 'react';
import { DailyLog, SCORING_RULES } from '../types';
import { formatDate, generateCSV } from '../utils/scoring';
import { Download, FileSpreadsheet, Trash2, MessageSquare, Sparkles, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface HistoryViewProps {
  logs: DailyLog[];
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs, onDelete }) => {
  const handleExport = () => {
    const csvContent = generateCSV(logs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productivity_tracker_backup_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCertificate = () => {
    // 1. Calculate Current Week Range (Mon-Sun)
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday
    
    // Create new date objects to avoid mutating 'now' in unexpected ways if reused
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // 2. Filter logs for this week
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= monday && logDate <= sunday;
    });

    const totalPoints = weekLogs.reduce((acc, log) => acc + log.totalScore, 0);
    const startDateStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDateStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // 3. Generate PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // --- Background & Border ---
    // Light background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 297, 210, 'F');

    // Ornamental Border
    doc.setDrawColor(20, 83, 45); // Dark Green
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    
    doc.setDrawColor(20, 83, 45); 
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);

    // Corner Ornaments (Simple lines)
    doc.setLineWidth(1);
    doc.line(10, 10, 30, 30);
    doc.line(287, 10, 267, 30);
    doc.line(10, 200, 30, 180);
    doc.line(287, 200, 267, 180);

    // --- Content ---
    const centerX = 148.5;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.setTextColor(20, 83, 45); // Dark Green
    doc.text("Certificate of Achievement", centerX, 50, { align: "center" });

    // Presented to
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(80, 80, 80); // Gray
    doc.text("This certificate is proudly presented to", centerX, 75, { align: "center" });

    // Name
    doc.setFont("times", "bolditalic");
    doc.setFontSize(40);
    doc.setTextColor(0, 0, 0); // Black
    doc.text("Shivang Verma", centerX, 95, { align: "center" });

    // Underline Name
    doc.setLineWidth(0.5);
    doc.setDrawColor(150, 150, 150);
    doc.line(centerX - 60, 100, centerX + 60, 100);

    // Achievement text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    doc.text("For outstanding productivity and dedication, achieving a total of", centerX, 120, { align: "center" });

    // Points
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(217, 119, 6); // Amber/Gold-ish
    doc.text(`${totalPoints} Points`, centerX, 135, { align: "center" });

    // Duration
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`during the week of`, centerX, 150, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20, 83, 45);
    doc.text(`${startDateStr} - ${endDateStr}`, centerX, 160, { align: "center" });

    // Footer / Motto
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(120, 120, 120);
    doc.text("Consistency is the key to success.", centerX, 185, { align: "center" });

    // Date Generated
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 270, 200, { align: "right" });

    // Save
    doc.save(`Certificate_${startDateStr.replace(/ /g, '_')}.pdf`);
  };

  const getSentimentConfig = (text?: string) => {
    if (!text) return { color: 'text-gray-300', bg: 'bg-gray-50 dark:bg-gray-700', icon: <MessageSquare size={16} />, label: 'No feedback' };
    
    const lower = text.toLowerCase();
    
    // Constructive/Mixed signals (Yellow/Amber)
    if (lower.includes('missed') || lower.includes('focus') || lower.includes('gap') || lower.includes('attention') || lower.includes('try') || lower.includes('however')) {
      return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', icon: <AlertCircle size={16} />, label: 'Constructive' };
    }
    
    // High praise (Purple)
    if (lower.includes('excellent') || lower.includes('outstanding') || lower.includes('amazing') || lower.includes('crushed') || lower.includes('perfect') || lower.includes('superb')) {
      return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', icon: <Sparkles size={16} />, label: 'Excellent' };
    }

    // General positive (Green)
    return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', icon: <CheckCircle2 size={16} />, label: 'Good' };
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
        <p>No records found yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Export Backup Section */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                    <FileSpreadsheet size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Data Backup</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Export CSV file</p>
                </div>
            </div>
            <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
            >
            <Download size={16} />
            Export
            </button>
        </div>

        {/* Certificate Section */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600 dark:text-emerald-300">
                    <Award size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Weekly Certificate</h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Mon-Sun Summary</p>
                </div>
            </div>
            <button
            onClick={handleDownloadCertificate}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
            >
            <Download size={16} />
            Download
            </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 font-bold">Date</th>
              <th className="px-6 py-3 font-bold text-blue-600 dark:text-blue-400">Total Score</th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Insight</th>
              {SCORING_RULES.map(rule => (
                <th key={rule.id} className="px-6 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 font-medium">
                  {rule.label}
                </th>
              ))}
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => {
              const sentiment = getSentimentConfig(log.aiFeedback);
              return (
                <tr key={log.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {formatDate(log.date)}
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {log.totalScore}
                  </td>
                  <td className="px-6 py-4">
                    <div className="group relative flex items-center">
                      <div className={`p-2 rounded-full ${sentiment.bg} ${sentiment.color} transition-colors cursor-help`}>
                        {sentiment.icon}
                      </div>
                      {log.aiFeedback && (
                        <div className="absolute left-full ml-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl pointer-events-none">
                          <p className="font-semibold mb-1 text-gray-300 uppercase text-[10px]">{sentiment.label}</p>
                          {log.aiFeedback}
                          {/* Arrow */}
                          <div className="absolute top-1/2 right-full -mt-1 -mr-1 border-4 border-transparent border-r-gray-900" />
                        </div>
                      )}
                    </div>
                  </td>
                  {SCORING_RULES.map(rule => (
                    <td key={rule.id} className="px-6 py-4">
                      {rule.type === 'boolean' ? (
                        log[rule.id] ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        <span className="font-mono text-gray-700 dark:text-gray-300">{log[rule.id]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(log.id);
                      }}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};