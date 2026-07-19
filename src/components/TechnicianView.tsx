import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Navigation, MapPin, Camera, Clock, AlertTriangle, Loader2, Mic, Trash2, Image, Square } from 'lucide-react';
import { Report, ReportStatus } from '../types';

interface TechnicianViewProps {
  technicianUserId: string;
  reports: Report[];
  onUpdateStatus: (reportId: string, status: ReportStatus, commentText?: string, photoProof?: string, voiceProof?: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isInitialLoading?: boolean;
}

export default function TechnicianView({ technicianUserId, reports, onUpdateStatus, onRefresh, isInitialLoading }: TechnicianViewProps) {
  const [techProfile, setTechProfile] = useState<any>(null);
  const [activeDetailReportId, setActiveDetailReportId] = useState<string | null>(null);
  const activeDetailReport = reports.find(r => r.id === activeDetailReportId) || null;
  const [updatingReportIds, setUpdatingReportIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Resolution Dialogue modal states
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>(null);
  const [resolutionVoice, setResolutionVoice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [timerInterval, setTimerInterval] = useState<any | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setResolutionVoice(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setResolutionPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const executeResolution = async () => {
    if (!resolvingReportId) return;
    setUpdatingReportIds(prev => ({ ...prev, [resolvingReportId]: true }));
    setError(null);

    try {
      await onUpdateStatus(
        resolvingReportId, 
        'resolved', 
        resolutionComment || 'Task completed successfully and verified resolved by the assigned technician.',
        resolutionPhoto || undefined,
        resolutionVoice || undefined
      );
      setResolvingReportId(null);
      setResolutionComment('');
      setResolutionPhoto(null);
      setResolutionVoice(null);
      setActiveDetailReportId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update ticket status.');
    } finally {
      setUpdatingReportIds(prev => ({ ...prev, [resolvingReportId]: false }));
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // Pull-to-Refresh States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullOffset, setPullOffset] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active Tab: 'active' (assigned or in_progress) vs 'completed' (resolved)
  const [techTab, setTechTab] = useState<'active' | 'completed'>('active');

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollTop === 0 && onRefresh) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStart;
    if (deltaY > 0) {
      setPullOffset(Math.min(deltaY * 0.4, 70));
    }
  };

  const handleTouchEnd = async () => {
    if (touchStart === null) return;
    setTouchStart(null);
    if (pullOffset >= 45 && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (err) {
        console.warn('Failed to manual-refresh via pull-down:', err);
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullOffset(0);
  };

  useEffect(() => {
    const loadTechProfile = async () => {
      try {
        const res = await fetch('/api/technicians');
        const techs = await res.json();
        const tech = techs.find((t: any) => t.user_id === technicianUserId);
        if (tech) {
          setTechProfile(tech);
        }
      } catch (err) {
        console.warn('Failed to load technician profile:', err);
      }
    };
    loadTechProfile();
  }, [technicianUserId]);

  // Filtering States
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');

  // Derive technician's assigned reports
  const myReports = reports.filter(r => {
    if (techProfile) {
      return r.assigned_technician_id === techProfile.id || r.assigned_technician_name === techProfile.name;
    }
    // Fallback: show assigned or in-progress or resolved while profile is loading
    return true;
  });

  // Split into active and completed assignments
  const activeAssignments = myReports.filter(r => r.status === 'assigned' || r.status === 'in_progress');
  const completedAssignments = myReports.filter(r => r.status === 'resolved');

  // Select list based on selected tab
  const currentTabReports = techTab === 'active' ? activeAssignments : completedAssignments;

  // Filter based on category
  const filteredReports = currentTabReports.filter(r => {
    return categoryFilter === 'all' || r.category === categoryFilter;
  });

  const handleUpdate = async (reportId: string, nextStatus: ReportStatus) => {
    if (nextStatus === 'resolved') {
      setResolvingReportId(reportId);
      return;
    }

    setUpdatingReportIds(prev => ({ ...prev, [reportId]: true }));
    setError(null);

    try {
      await onUpdateStatus(reportId, nextStatus);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update ticket status.');
    } finally {
      setUpdatingReportIds(prev => ({ ...prev, [reportId]: false }));
    }
  };

  return (
    <div 
      id="technician-queue-view" 
      className="space-y-5 overflow-y-auto max-h-full pb-20 pr-1 select-none relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull down refreshing indicator bar */}
      {pullOffset > 0 && (
        <div 
          style={{ height: `${pullOffset}px`, opacity: Math.min(pullOffset / 45, 1) }}
          className="overflow-hidden flex items-center justify-center transition-all duration-100 bg-emerald-50/40 border border-emerald-100/60 rounded-xl text-[10px] font-sans font-bold text-emerald-700 gap-1.5 shrink-0"
        >
          <div className={`w-3.5 h-3.5 border border-emerald-600 border-t-transparent rounded-full ${pullOffset >= 45 ? 'animate-spin' : ''}`} style={{ borderWidth: '1.5px', borderRightColor: 'transparent' }} />
          <span>{pullOffset >= 45 ? 'Release to sync queue...' : 'Pull down to refresh'}</span>
        </div>
      )}

      {isRefreshing && (
        <div className="h-10 flex items-center justify-center bg-emerald-50 border border-emerald-100 text-[10px] font-sans font-bold text-emerald-800 gap-1.5 rounded-xl animate-pulse shrink-0">
          <div className="w-3.5 h-3.5 border border-emerald-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '1.5px', borderRightColor: 'transparent' }} />
          <span>Refreshing and synchronizing with database...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-sans">
            <Wrench className="text-emerald-600 animate-pulse" size={20} /> Technician Dashboard
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">ABU Samaru Campus Maintenance Assignments</p>
        </div>
        {techProfile && (
          <div className="bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Specialist: {techProfile.name}
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs border">
        <button
          onClick={() => setTechTab('active')}
          className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            techTab === 'active'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          👷 Active Assignments
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${techTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {activeAssignments.length}
          </span>
        </button>
        <button
          onClick={() => setTechTab('completed')}
          className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            techTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          ✅ Completed Tasks
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${techTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {completedAssignments.length}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Filter by Category:</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex-1 sm:flex-initial min-w-[150px]">
            <select
              id="tech-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="broken_lights">Broken Lights</option>
              <option value="plumbing">Plumbing / Leaks</option>
              <option value="wifi_outage">WiFi Outage</option>
              <option value="security">Security Concern</option>
              <option value="structural">Structural Damage</option>
              <option value="others">Other</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-xs text-rose-600 rounded-xl font-medium animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {/* Task Queue List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest font-mono">
          📋 {techTab === 'active' ? 'My Active Work Queue' : 'My Completed Tasks Archive'} ({filteredReports.length} Shown)
        </h3>

        {isInitialLoading && filteredReports.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-100 rounded-md" />
                  <div className="h-3 w-16 bg-slate-100 rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-100 rounded-md" />
                  <div className="h-3.5 w-5/6 bg-slate-100 rounded-md" />
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-50">
                  <div className="h-8 w-1/2 bg-slate-100 rounded-xl" />
                  <div className="h-8 w-1/2 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 rounded-2xl text-center text-slate-400 text-xs font-semibold shadow-2xs">
            {currentTabReports.length === 0 
              ? (techTab === 'active' 
                  ? "🎉 Amazing! Your active task queue is completely empty. No current assignments." 
                  : "⌛ You haven't resolved any tasks yet. Complete a task to see it logged here!")
              : "🔍 No tasks match your selected category filter."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className={`bg-white border p-4 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs transition-all duration-300 relative ${
                  report.status === 'resolved' 
                    ? 'border-emerald-100 bg-emerald-50/10' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Priority and category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      report.priority_score >= 4 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      report.priority_score === 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      P{report.priority_score}
                    </span>
                    <span className="text-xs font-bold capitalize text-slate-700">
                      {report.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    report.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : report.status === 'in_progress'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed font-semibold line-clamp-3">
                  "{report.description}"
                </p>

                {/* Photo summary */}
                {report.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 max-h-32 shadow-2xs">
                    <img src={report.photo_url} alt="Issue location" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Location indicator with directions link */}
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
                    <MapPin size={13} className="text-rose-500 shrink-0" />
                    <span className="truncate text-[10px] font-semibold">{report.zone_name}</span>
                  </div>
                  
                  {/* Google Maps coordinate route support */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors text-[9px] cursor-pointer"
                  >
                    <Navigation size={9} /> Route
                  </a>
                </div>

                {/* Action trigger states */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveDetailReportId(report.id)}
                    className="w-full text-center text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 text-slate-600 font-bold py-1.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    📖 View Full Ticket Details
                  </button>

                  {report.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {report.status === 'assigned' && (
                        <button
                          disabled={updatingReportIds[report.id]}
                          onClick={() => handleUpdate(report.id, 'in_progress')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-2xs active:scale-98"
                        >
                          {updatingReportIds[report.id] ? (
                            <>
                              <Loader2 size={12} className="animate-spin text-white/50" />
                              <span>Starting...</span>
                            </>
                          ) : (
                            <>
                              <span>🚀 Start Work</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      {report.status === 'in_progress' && (
                        <button
                          disabled={updatingReportIds[report.id]}
                          onClick={() => handleUpdate(report.id, 'resolved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-center shadow-2xs active:scale-98"
                        >
                          {updatingReportIds[report.id] ? (
                            <>
                              <Loader2 size={12} className="animate-spin text-white/50" />
                              <span>Resolving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} /> completed task?
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {report.status === 'resolved' && (
                    <div className="text-center text-[10px] text-emerald-600 font-bold bg-emerald-50/50 py-1.5 px-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                      <CheckCircle size={11} /> Task Completed & Resolved Successfully
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {activeDetailReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                  activeDetailReport.priority_score >= 4 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  activeDetailReport.priority_score === 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  Priority P{activeDetailReport.priority_score}
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-1 font-sans capitalize">
                  {activeDetailReport.category.replace('_', ' ')} Details
                </h4>
                <p className="text-[9px] text-slate-400 font-bold font-mono">TICKET #{activeDetailReport.id}</p>
              </div>
              <button
                onClick={() => setActiveDetailReportId(null)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {/* Reporter Info */}
              <div className="text-[11px] text-slate-500">
                <span className="font-bold">Filed By:</span> {activeDetailReport.reporter_name || 'Anonymous Student'} 
                {activeDetailReport.is_anonymous && <span className="ml-1 bg-slate-100 text-slate-600 px-1 rounded text-[9px] font-medium">Anonymous</span>}
                <span className="mx-2">•</span>
                <span className="font-bold">Date:</span> {new Date(activeDetailReport.created_at).toLocaleString()}
              </div>

              {/* Text Description */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Report Description</h5>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  "{activeDetailReport.description || 'No text description provided.'}"
                </p>
              </div>

              {/* Image Attachment */}
              {activeDetailReport.photo_url && (
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Attached Image Proof</h5>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-60 shadow-xs">
                    <img src={activeDetailReport.photo_url} alt="Task proof" className="w-full h-full object-contain bg-slate-50" />
                  </div>
                </div>
              )}

              {/* Voice Note Attachment */}
              {activeDetailReport.voice_url && (
                <div className="bg-emerald-50/30 border border-emerald-100 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold font-sans">
                    <span className="text-lg">🎙️</span> Voice Recording Proof
                  </div>
                  <audio controls src={activeDetailReport.voice_url} className="w-full h-9" />
                  {activeDetailReport.voice_interpretation && (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200/50 text-[11px] text-emerald-900 font-medium italic leading-relaxed">
                      "{activeDetailReport.voice_interpretation}"
                    </div>
                  )}
                </div>
              )}

              {/* Location info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <MapPin size={14} className="text-rose-500 shrink-0" />
                  <span>{activeDetailReport.zone_name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Coordinates: Lat {activeDetailReport.lat.toFixed(5)}, Lng {activeDetailReport.lng.toFixed(5)}
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeDetailReport.lat},${activeDetailReport.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors text-[10px]"
                  >
                    <Navigation size={11} /> Open GPS Navigation Route
                  </a>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              {activeDetailReport.status !== 'resolved' && (
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  {activeDetailReport.status === 'assigned' && (
                    <button
                      disabled={updatingReportIds[activeDetailReport.id]}
                      onClick={async () => {
                        await handleUpdate(activeDetailReport.id, 'in_progress');
                        setActiveDetailReportId(null);
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      {updatingReportIds[activeDetailReport.id] ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-white/50" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <span>🚀 Start Work</span>
                        </>
                      )}
                    </button>
                  )}
                  {activeDetailReport.status === 'in_progress' && (
                    <button
                      disabled={updatingReportIds[activeDetailReport.id]}
                      onClick={async () => {
                        await handleUpdate(activeDetailReport.id, 'resolved');
                        setActiveDetailReportId(null);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer text-center shadow-xs active:scale-98"
                    >
                      {updatingReportIds[activeDetailReport.id] ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-white/50" />
                          <span>Resolving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={13} /> completed task?
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Dialogue Box (Modal) */}
      {resolvingReportId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-sans">
                  Complete & Resolve Task
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">TICKET #{resolvingReportId}</p>
              </div>
              <button
                onClick={() => {
                  setResolvingReportId(null);
                  setResolutionComment('');
                  setResolutionPhoto(null);
                  setResolutionVoice(null);
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-left">
              {/* Comment / Resolution details */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Resolution Details (Required)
                </label>
                <textarea
                  required
                  placeholder="Provide details about the resolution (e.g. replaced the lightbulb, patched the copper plumbing leak, verified electrical circuit)..."
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                  className="w-full h-24 p-3 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Photo Proof uploading */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Upload Resolution Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all">
                    <Camera size={14} className="text-slate-500" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {resolutionPhoto && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Attached
                      <button
                        type="button"
                        onClick={() => setResolutionPhoto(null)}
                        className="text-rose-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </div>
                {resolutionPhoto && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-32 bg-slate-50">
                    <img src={resolutionPhoto} alt="Resolution proof preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Voice Proof recording */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Record Voice Explainer (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-rose-50 border-rose-200 text-rose-700 text-xs font-bold animate-pulse cursor-pointer"
                    >
                      <Square size={12} className="text-rose-600 animate-spin" />
                      <span>Stop ({formatDuration(recordingDuration)})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        resolutionVoice
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Mic size={14} className={resolutionVoice ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>{resolutionVoice ? 'Re-record Audio' : 'Record Audio'}</span>
                    </button>
                  )}

                  {resolutionVoice && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Audio Recorded
                      <button
                        type="button"
                        onClick={() => setResolutionVoice(null)}
                        className="text-rose-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </div>
                {resolutionVoice && (
                  <div className="mt-2 bg-emerald-50/20 border border-emerald-100 p-2.5 rounded-xl">
                    <audio controls src={resolutionVoice} className="w-full h-8" />
                  </div>
                )}
              </div>

              {/* Final Submit button */}
              <button
                disabled={!resolutionComment.trim() || updatingReportIds[resolvingReportId]}
                onClick={executeResolution}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
              >
                {updatingReportIds[resolvingReportId] ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-white/50" />
                    <span>Saving Completion...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>Submit & Resolve Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
