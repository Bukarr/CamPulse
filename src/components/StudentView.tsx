import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowUp, Filter, Eye, ChevronRight, User, Globe, WifiOff, Send } from 'lucide-react';
import { Report, ReportCategory, ReportStatus, Comment } from '../types';

interface StudentViewProps {
  userId: string;
  userName: string;
  reports: Report[];
  onUpvote: (reportId: string) => Promise<void>;
  onAddComment: (reportId: string, text: string) => Promise<void>;
  onDeleteReport?: (reportId: string) => Promise<boolean>;
}

const CATEGORY_ICONS: Record<string, string> = {
  broken_lights: '💡',
  plumbing: '🚰',
  wifi_outage: '📶',
  security: '🚨',
  structural: '🧱',
  others: '🔧'
};

const STATUS_CLASSES: Record<ReportStatus, string> = {
  submitted: 'bg-rose-50 text-rose-600 border border-rose-100',
  assigned: 'bg-amber-50 text-amber-600 border border-amber-100',
  in_progress: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  resolved: 'bg-emerald-50 text-emerald-600 border border-emerald-100'
};

export default function StudentView({ userId, userName, reports, onUpvote, onAddComment, onDeleteReport }: StudentViewProps) {
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'gemma_rank'>('newest');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch comments when report is selected
  useEffect(() => {
    if (selectedReport) {
      fetchCommentsForSelected();
    }
  }, [selectedReport]);

  const fetchCommentsForSelected = async () => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  const handleUpvoteClick = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation(); // prevent opening sheet on button press
    onUpvote(reportId);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await onAddComment(selectedReport.id, newComment);
      setNewComment('');
      fetchCommentsForSelected();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const filteredReports = reports
    .filter((r) => {
      const matchesMine = filter === 'all' || r.reporter_id === userId;
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesUrgency = urgencyFilter === 'all' || r.priority_score === urgencyFilter;
      return matchesMine && matchesCategory && matchesUrgency;
    })
    .sort((a, b) => {
      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      if (sortBy === 'gemma_rank') {
        return (b.gemma_rank_score || 0) - (a.gemma_rank_score || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div id="student-workspace" className="space-y-4 overflow-y-auto max-h-full pb-24 pr-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-sans">
            🎓 Campus Student Feed
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">ABU Zaria crowdsourced maintenance operations feed</p>
        </div>
      </div>

      {/* Filter and Tab Selectors */}
      <div className="bg-white border border-slate-200/80 p-3 rounded-xl flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Scope</span>
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/60 gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              All Issues
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'mine'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              My Reports
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none"
            >
              <option value="all">📁 All Categories</option>
              <option value="broken_lights">💡 Broken Lights</option>
              <option value="plumbing">🚰 Plumbing</option>
              <option value="wifi_outage">📶 WiFi Outage</option>
              <option value="security">🚨 Security Concern</option>
              <option value="others">🔧 Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none"
            >
              <option value="all">⚠️ All Urgency</option>
              <option value="5">P5 - Critical</option>
              <option value="4">P4 - High</option>
              <option value="3">P3 - Medium</option>
              <option value="2">P2 - Low</option>
              <option value="1">P1 - Minimal</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">✨ Sort Engine</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none font-semibold"
            >
              <option value="newest">📅 Newest First</option>
              <option value="upvotes">🔺 Most Upvotes</option>
              <option value="gemma_rank">✨ Gemma AI Priority Rank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues feed */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white border border-slate-200/80 p-8 rounded-xl text-center text-slate-400 text-xs font-sans">
            No active reports match selected filters. Drop a marker pin on the map to start reporting!
          </div>
        ) : (
          filteredReports.map((report) => {
            const hasUpvoted = report.upvoted_by?.includes(userId);
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-white border border-slate-200/80 hover:border-emerald-500/50 p-4 rounded-xl flex gap-3.5 cursor-pointer transition-all shadow-xs relative group"
              >
                {/* Left upvote block */}
                <div className="flex flex-col items-center shrink-0 self-center">
                  <button
                    onClick={(e) => handleUpvoteClick(e, report.id)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      hasUpvoted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-600 font-bold scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <ArrowUp size={14} className={hasUpvoted ? 'animate-bounce text-emerald-600' : ''} />
                    <span className="text-xs font-bold font-mono mt-0.5">{report.upvotes}</span>
                  </button>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mt-1">Upvote</span>
                </div>

                {/* Right issue details block */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold capitalize text-slate-800">
                      <span>{CATEGORY_ICONS[report.category] || '🔧'}</span>
                      <span className="truncate">{report.category.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {report.zone_name}
                      </span>
                    </div>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CLASSES[report.status]}`}>
                      {report.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 flex-wrap gap-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <User size={10} /> By {report.reporter_name}
                    </span>
                    <span className="font-mono">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sliding detail Sheet with full comment details */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-6">
          <div className="bg-white border border-slate-200 w-full md:max-w-xl rounded-t-3xl md:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORY_ICONS[selectedReport.category]}</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {selectedReport.category.replace('_', ' ')}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase">Zone: {selectedReport.zone_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(selectedReport.reporter_id === userId && onDeleteReport) && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this maintenance report? This will remove all associated comments.")) {
                        const success = await onDeleteReport(selectedReport.id);
                        if (success) {
                          setSelectedReport(null);
                        }
                      }
                    }}
                    className="text-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    🗑️ Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setNewComment('');
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Description and Image details */}
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  "{selectedReport.description}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-semibold">
                  <span>Reported by: <span className="text-slate-600">{selectedReport.reporter_name}</span></span>
                  <span>{new Date(selectedReport.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedReport.photo_url && (
                <div className="rounded-xl overflow-hidden border border-slate-100 max-h-56">
                  <img src={selectedReport.photo_url} alt="Attached" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Status lifecycle indicator */}
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider font-mono">🛠️ Repair Progress Tracker</span>
                <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-bold font-mono">
                  <div className={`p-1.5 rounded-lg border ${selectedReport.status === 'submitted' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-100/50 border-slate-100 text-slate-400'}`}>
                    1. SUBMIT
                  </div>
                  <div className={`p-1.5 rounded-lg border ${selectedReport.status === 'assigned' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-100/50 border-slate-100 text-slate-400'}`}>
                    2. ASSIGN
                  </div>
                  <div className={`p-1.5 rounded-lg border ${selectedReport.status === 'in_progress' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100/50 border-slate-100 text-slate-400'}`}>
                    3. WORK
                  </div>
                  <div className={`p-1.5 rounded-lg border ${selectedReport.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 animate-pulse' : 'bg-slate-100/50 border-slate-100 text-slate-400'}`}>
                    4. DONE
                  </div>
                </div>
              </div>

              {/* Comments stream */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider font-mono">💬 Activity Notes & Updates</span>
                {comments.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-2 font-medium">No updates or student comments posted yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          comment.user_role === 'admin'
                            ? 'bg-rose-50/50 border-rose-100 text-slate-700'
                            : comment.user_role === 'technician'
                            ? 'bg-indigo-50/50 border-indigo-100 text-slate-700'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                          <span className="flex items-center gap-1">
                            {comment.user_role === 'admin' && <span className="bg-rose-500 text-white text-[7px] px-1 rounded font-bold">ADMIN</span>}
                            {comment.user_role === 'technician' && <span className="bg-indigo-500 text-white text-[7px] px-1 rounded font-bold">TECH</span>}
                            <span className="text-slate-600 font-sans normal-case font-semibold">{comment.user_name}</span>
                          </span>
                          <span>{new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Post comment input box */}
            <form onSubmit={handleCommentSubmit} className="border-t border-slate-100 pt-3 shrink-0 flex gap-2">
              <input
                type="text"
                disabled={isSubmittingComment}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post an update or query regarding this ticket..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
