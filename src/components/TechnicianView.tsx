import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Navigation, MapPin, Camera, Clock, AlertTriangle } from 'lucide-react';
import { Report, ReportStatus } from '../types';

interface TechnicianViewProps {
  technicianUserId: string;
  reports: Report[];
  onUpdateStatus: (reportId: string, status: ReportStatus, commentText?: string, photoProof?: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export default function TechnicianView({ technicianUserId, reports, onUpdateStatus, onRefresh }: TechnicianViewProps) {
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeDetailReport, setActiveDetailReport] = useState<Report | null>(null);
  const [photoProof, setPhotoProof] = useState<string | undefined>(undefined);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull-to-Refresh States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullOffset, setPullOffset] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
    fetchAssignedQueue();
  }, [reports, technicianUserId]);

  const fetchAssignedQueue = async () => {
    // Filter reports that are assigned to this technician.
    // In our local mock, prof/tech relationship is bridged by assignments.
    try {
      const res = await fetch('/api/technicians');
      const techs = await res.json();
      const tech = techs.find((t: any) => t.user_id === technicianUserId);
      
      if (tech) {
        // Find reports assigned to this tech id
        const reportsRes = await fetch('/api/reports');
        const allReports: Report[] = await reportsRes.json();
        const activeTechReports = allReports.filter(
          r => r.status !== 'resolved' && reports.some(or => or.id === r.id && or.status === r.status)
        );
        
        // Let's filter in memory against our reports prop
        const filtered = reports.filter(r => 
          (r.status === 'assigned' || r.status === 'in_progress')
        );
        setAssignedReports(filtered);
      } else {
        // Fallback for demo/testing: show all assigned/in_progress reports
        const filtered = reports.filter(r => r.status === 'assigned' || r.status === 'in_progress');
        setAssignedReports(filtered);
      }
    } catch (e) {
      const filtered = reports.filter(r => r.status === 'assigned' || r.status === 'in_progress');
      setAssignedReports(filtered);
    }
  };

  const handleUpdate = async (reportId: string, nextStatus: ReportStatus) => {
    if (nextStatus === 'resolved') {
      setSelectedReport(assignedReports.find(r => r.id === reportId) || null);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateStatus(reportId, nextStatus);
      fetchAssignedQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!commentText.trim() || commentText.length < 10) {
      setError('Please provide a final repair description of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdateStatus(selectedReport.id, 'resolved', commentText, photoProof);
      setSelectedReport(null);
      setCommentText('');
      setPhotoProof(undefined);
      fetchAssignedQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to submit resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image is too large. Choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoProof(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
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
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-sans">
          <Wrench className="text-emerald-600" size={20} /> Technician Work Queue
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">ABU Samaru Campus Maintenance Assignments</p>
      </div>

      {/* Task Queue List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest font-mono">
          👷 Assigned Task Feed ({assignedReports.length} Active)
        </h3>

        {assignedReports.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center text-slate-400 text-xs font-semibold">
            🎉 Amazing! Your task queue is completely empty. No current assignments.
          </div>
        ) : (
          <div className="space-y-3">
            {assignedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Priority and category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      report.priority_score >= 4 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      report.priority_score === 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      Priority P{report.priority_score}
                    </span>
                    <span className="text-xs font-bold capitalize text-slate-700">
                      {report.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    report.status === 'in_progress' 
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {report.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  "{report.description}"
                </p>

                {/* Photo summary */}
                {report.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 max-h-36 shadow-xs">
                    <img src={report.photo_url} alt="Issue location" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Location indicator with directions link */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate max-w-[180px] text-[11px] font-semibold">{report.zone_name}</span>
                  </div>
                  
                  {/* Google Maps coordinate link for outdoor route support */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors text-[10px] cursor-pointer"
                  >
                    <Navigation size={10} /> Route
                  </a>
                </div>

                {/* Action trigger states */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveDetailReport(report)}
                    className="w-full text-center text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    📖 Open Full Task Details
                  </button>

                  <div className="flex gap-2">
                    {report.status === 'assigned' && (
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleUpdate(report.id, 'in_progress')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        🚀 Inspection Started
                      </button>
                    )}
                    {report.status === 'in_progress' && (
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleUpdate(report.id, 'resolved')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                      >
                        <CheckCircle size={13} /> Task Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Confirmation Bottom Sheet Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-6 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-sans">Confirm Inspection Finished</h4>
                <p className="text-[9px] text-slate-400 font-bold font-mono">TICKET #{selectedReport.id.substring(0, 8)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setPhotoProof(undefined);
                  setError(null);
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-600 rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              {/* Repair details */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Explain repairs completed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="E.g., 'Replaced broken 40W street LED bulb and taped exposed terminal wires. Checked breaker. Fully resolved!'"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[9px] text-slate-400 font-semibold mt-1 block">Min. 10 characters required.</span>
              </div>

              {/* Photo Proof */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Upload Repair Image Proof <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center w-20 h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer text-xs transition-colors hover:border-slate-300">
                    <Camera size={16} />
                    <span className="text-[9px] mt-0.5 font-bold">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {photoProof ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                      <img src={photoProof} alt="Proof" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoProof(undefined)}
                        className="absolute top-0.5 right-0.5 bg-slate-900/80 hover:bg-slate-900 text-white p-0.5 rounded-full text-[8px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium">Attach a photo showing the resolved issue.</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                {isSubmitting ? 'Submitting resolution...' : 'Confirm Task Completed (Notifies Admin & Reporters)'}
              </button>
            </form>
          </div>
        </div>
      )}

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
                onClick={() => setActiveDetailReport(null)}
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
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
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
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                {activeDetailReport.status === 'assigned' && (
                  <button
                    disabled={isSubmitting}
                    onClick={async () => {
                      await handleUpdate(activeDetailReport.id, 'in_progress');
                      setActiveDetailReport(prev => prev ? { ...prev, status: 'in_progress' } : null);
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center shadow-xs"
                  >
                    🚀 Inspection Started / Start Work
                  </button>
                )}
                {activeDetailReport.status === 'in_progress' && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedReport(activeDetailReport);
                      setActiveDetailReport(null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center shadow-xs"
                  >
                    <CheckCircle size={14} /> Task Completed / Fix Issue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
